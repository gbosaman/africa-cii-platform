import { COUNTRIES } from "@/lib/data/countries";
import { WORLD_BANK_METRICS, type WorldBankMetric } from "@/lib/data/metrics";
import type { Confidence, Freshness, MetricValue } from "@/lib/types";

// ---------------------------------------------------------------------------
// World Bank WDI adapter.
//   - keyless, free, CC BY-4.0
//   - fetches the most-recent non-empty value per country per indicator
//   - never invents data: a missing series yields value=null (N/A), not 0
//   - resilient: on failure the caller keeps the last good value
// ---------------------------------------------------------------------------

const BASE = "https://api.worldbank.org/v2";
const AFRICAN_ISO3 = new Set(COUNTRIES.map((c) => c.iso3));

// World Bank uses a handful of ISO3 aliases that differ from UN ISO 3166.
const WB_ALIAS: Record<string, string> = {
  COD: "COD", // Congo DR — same
  COG: "COG",
  // (kept explicit for documentation; WB matches ISO3 for our set)
};

interface WbRow {
  countryiso3code: string;
  date: string;
  value: number | null;
  indicator: { id: string; value: string };
}

interface WbMeta {
  pages?: number;
  total?: number;
}

async function fetchPage(url: string, indicator: string): Promise<{ meta: WbMeta; rows: WbRow[] }> {
  const res = await fetch(url, {
    // Revalidate daily; World Bank publishes at most annually.
    next: { revalidate: 60 * 60 * 24 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`World Bank ${indicator} → HTTP ${res.status}`);
  }
  const json = (await res.json()) as [WbMeta | null, WbRow[] | null];
  if (!Array.isArray(json)) return { meta: {}, rows: [] };
  return { meta: json[0] ?? {}, rows: json[1] ?? [] };
}

/**
 * Raw fetch of one indicator, most-recent-non-empty per country.
 *
 * A handful of indicators SILENTLY IGNORE `mrnev=1` and return the entire time
 * series instead of one row per country. `per_page=500` then truncates at page
 * one, which never reaches most African ISO3 codes — so the indicator resolves
 * to N/A for all 54 countries even though the data exists. That is the worst
 * possible failure here: it looks exactly like "no data published" and is
 * indistinguishable from a genuine gap unless you check the row count.
 *
 * A multi-page response is the tell. When we see one, re-request the whole
 * series in a single page and reduce it ourselves.
 */
async function fetchIndicator(
  indicator: string,
): Promise<Map<string, { value: number; year: number }>> {
  const base = `${BASE}/country/all/indicator/${indicator}?format=json`;
  let { meta, rows } = await fetchPage(`${base}&mrnev=1&per_page=500`, indicator);

  if ((meta.pages ?? 1) > 1) {
    ({ rows } = await fetchPage(`${base}&per_page=25000`, indicator));
  }

  // Reduce to the most-recent non-empty observation per country. This is a
  // no-op on the mrnev path (one row per country) and does the real work on
  // the fallback path.
  const out = new Map<string, { value: number; year: number }>();
  for (const row of rows) {
    const iso3 = WB_ALIAS[row.countryiso3code] ?? row.countryiso3code;
    if (!AFRICAN_ISO3.has(iso3)) continue;
    if (row.value === null || row.value === undefined) continue;
    const year = Number(row.date);
    if (!Number.isFinite(year)) continue;
    const prev = out.get(iso3);
    if (!prev || year > prev.year) out.set(iso3, { value: row.value, year });
  }
  return out;
}

function freshnessFromYear(year: number): Freshness {
  const age = new Date().getUTCFullYear() - year;
  if (age <= 1) return "fresh";
  if (age <= 3) return "aging";
  if (age <= 6) return "stale";
  return "historical";
}

function confidenceFromFreshness(f: Freshness): Confidence {
  if (f === "fresh") return "HIGH";
  if (f === "aging") return "HIGH";
  if (f === "stale") return "MEDIUM";
  return "LOW";
}

export interface WorldBankSnapshot {
  /** metricId -> (iso3 -> MetricValue) */
  values: Record<string, Record<string, MetricValue>>;
  fetchedAt: string;
  /** metric ids that failed to fetch (caller can surface "temporarily unavailable"). */
  failed: string[];
}

/**
 * Fetch every World Bank metric for all African countries.
 * Returns a fully-provenanced snapshot. Individual indicator failures are
 * isolated so one bad series never blanks the whole dashboard.
 */
export async function fetchWorldBankSnapshot(): Promise<WorldBankSnapshot> {
  const values: Record<string, Record<string, MetricValue>> = {};
  const failed: string[] = [];
  const retrievedAt = new Date().toISOString();

  await Promise.all(
    WORLD_BANK_METRICS.map(async (metric: WorldBankMetric) => {
      const bucket: Record<string, MetricValue> = {};
      values[metric.id] = bucket;
      try {
        const perCountry = await fetchIndicator(metric.wbIndicator);
        for (const c of COUNTRIES) {
          const hit = perCountry.get(c.iso3);
          if (!hit) {
            bucket[c.iso3] = {
              metricId: metric.id,
              countryIso3: c.iso3,
              value: null,
              unit: metric.unit,
              year: 0,
              kind: "verified",
              confidence: "UNVERIFIED",
              sourceId: "worldbank",
              sourceUrl: wbSourceUrl(metric.wbIndicator, c.iso3),
              datasetName: "World Development Indicators",
              retrievedAt,
            };
            continue;
          }
          const fresh = freshnessFromYear(hit.year);
          bucket[c.iso3] = {
            metricId: metric.id,
            countryIso3: c.iso3,
            value: hit.value,
            unit: metric.unit,
            year: hit.year,
            kind: "verified",
            confidence: confidenceFromFreshness(fresh),
            sourceId: "worldbank",
            sourceUrl: wbSourceUrl(metric.wbIndicator, c.iso3),
            datasetName: "World Development Indicators",
            retrievedAt,
            publicationDate: `${hit.year}`,
            methodology: `Most recent non-empty annual observation from World Bank WDI series ${metric.wbIndicator}.`,
          };
        }
      } catch (err) {
        failed.push(metric.id);
        // Leave metric.id present but empty; caller/UI shows temporarily unavailable.
      }
    }),
  );

  return { values, fetchedAt: retrievedAt, failed };
}

export function wbSourceUrl(indicator: string, iso3: string): string {
  return `https://data.worldbank.org/indicator/${indicator}?locations=${iso3}`;
}

export { freshnessFromYear };
