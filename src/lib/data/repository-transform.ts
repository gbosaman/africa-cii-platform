import { WORLD_BANK_METRICS } from "@/lib/data/metrics";
import { COUNTRIES } from "@/lib/data/countries";
import type { MetricSnapshot } from "@/lib/scoring/market";
import type { Confidence, MetricValue } from "@/lib/types";

// Pure DB-row transforms — no "server-only", so they are unit-testable and
// usable from both the repository and tests.

export interface DbMetricRow {
  metric_id: string;
  country_iso3: string;
  value: number | null;
  unit: string;
  year: number | null;
  confidence: string;
  source_id: string | null;
  retrieved_at: string | null;
}

export function nullValue(metricId: string, iso3: string, unit: string): MetricValue {
  return {
    metricId,
    countryIso3: iso3,
    value: null,
    unit,
    year: 0,
    kind: "verified",
    confidence: "UNVERIFIED",
    sourceId: "worldbank",
  };
}

/**
 * Reduce raw DB rows to a latest-per-(metric,country) snapshot. Missing cells
 * become null values (N/A) — never omitted, never zero. Later years win.
 */
export function rowsToSnapshot(rows: DbMetricRow[]): MetricSnapshot {
  const latest = new Map<string, DbMetricRow>();
  for (const row of rows) {
    const key = `${row.metric_id}:${row.country_iso3}`;
    const prev = latest.get(key);
    if (!prev || (row.year ?? 0) > (prev.year ?? 0)) latest.set(key, row);
  }

  const metricIds = WORLD_BANK_METRICS.map((m) => m.id);
  const snapshot: MetricSnapshot = Object.fromEntries(metricIds.map((id) => [id, {}]));
  for (const c of COUNTRIES) {
    for (const m of WORLD_BANK_METRICS) {
      const row = latest.get(`${m.id}:${c.iso3}`);
      snapshot[m.id]![c.iso3] = row
        ? {
            metricId: m.id,
            countryIso3: c.iso3,
            value: row.value,
            unit: row.unit ?? m.unit,
            year: row.year ?? 0,
            kind: "verified",
            confidence: (row.confidence as Confidence) ?? "MEDIUM",
            sourceId: row.source_id ?? "worldbank",
            retrievedAt: row.retrieved_at ?? undefined,
            datasetName: "World Development Indicators",
          }
        : nullValue(m.id, c.iso3, m.unit);
    }
  }
  return snapshot;
}
