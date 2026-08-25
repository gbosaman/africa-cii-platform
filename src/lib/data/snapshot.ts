import "server-only";
import { cache } from "react";
import { fetchWorldBankSnapshot, type WorldBankSnapshot } from "@/lib/data-sources/worldbank";
import { readMetricSnapshotFromDb, supabaseConfigured } from "@/lib/data/repository";
import type { MetricSnapshot } from "@/lib/scoring/market";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";

// ---------------------------------------------------------------------------
// Central server-side data provider. Read priority:
//   1. Supabase persisted metric_values (if configured & populated)
//   2. Live World Bank adapter
//   3. Empty snapshot (UI shows N/A + banner) — never crashes
//
// `cache()` dedupes within a request; the live fetch layer revalidates daily.
// ---------------------------------------------------------------------------

export type SnapshotSource = "db" | "live" | "empty";

export interface PlatformSnapshot {
  metrics: MetricSnapshot;
  fetchedAt: string;
  failed: string[];
  source: SnapshotSource;
  /** Back-compat: true when we served real (non-empty) data. */
  live: boolean;
}

const EMPTY: MetricSnapshot = Object.fromEntries(
  WORLD_BANK_METRICS.map((m) => [m.id, {}]),
);

export const getSnapshot = cache(async (): Promise<PlatformSnapshot> => {
  // 1. Persisted database (preferred when available)
  if (supabaseConfigured()) {
    try {
      const db = await readMetricSnapshotFromDb();
      if (db) {
        return { metrics: db, fetchedAt: new Date().toISOString(), failed: [], source: "db", live: true };
      }
    } catch {
      // fall through to live
    }
  }

  // 2. Live World Bank
  try {
    const wb: WorldBankSnapshot = await fetchWorldBankSnapshot();
    return { metrics: wb.values, fetchedAt: wb.fetchedAt, failed: wb.failed, source: "live", live: true };
  } catch {
    // 3. Degrade to empty — pages render N/A, nothing crashes
    return {
      metrics: EMPTY,
      fetchedAt: new Date().toISOString(),
      failed: WORLD_BANK_METRICS.map((m) => m.id),
      source: "empty",
      live: false,
    };
  }
});
