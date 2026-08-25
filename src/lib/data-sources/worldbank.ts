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

/** Raw fetch of one indicator, most-recent-non-empty per country. */
async function fetchIndicator(
  indicator: string,
): Promise<Map<string, { value: number; year: number }>> {
  const url = `${BASE}/country/all/indicator/${indicator}?format=json&mrnev=1&per_page=500`;
  const res = await fetch(url, {
    // Revalidate daily; World Bank publishes at most annually.
    next: { revalidate: 60 * 60 * 24 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`World Bank ${indicator} → HTTP ${res.status}`);
  }
  const json = (await res.json()) as [unknown, WbRow[] | null];
  const rows = Array.isArray(json) ? json[1] : null;
  const out = new Map<string, { value: number; year: number }>();
  if (!rows) return out;
  for (const row of rows) {
    const iso3 = WB_ALIAS[row.countryiso3code] ?? row.countryiso3code;
    if (!AFRICAN_ISO3.has(iso3)) continue;
    if (row.value === null || row.value === undefined) continue;
    out.set(iso3, { value: row.value, year: Number(row.date) });
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
