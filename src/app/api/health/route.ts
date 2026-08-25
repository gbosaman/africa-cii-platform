import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/data/snapshot";
import { supabaseConfigured, getStudios, getGames } from "@/lib/data/repository";
import { COUNTRIES } from "@/lib/data/countries";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";

// GET /api/health — reports which data source is live and coverage counts.
// Lets you confirm persistence is working end-to-end after configuring Supabase.
export async function GET() {
  const snap = await getSnapshot();
  const [studios, games] = await Promise.all([getStudios(), getGames()]);

  const withData = WORLD_BANK_METRICS.reduce((n, m) => {
    const present = COUNTRIES.filter((c) => snap.metrics[m.id]?.[c.iso3]?.value != null).length;
    return n + present;
  }, 0);
  const total = WORLD_BANK_METRICS.length * COUNTRIES.length;

  return NextResponse.json({
    ok: snap.source !== "empty",
    dataSource: snap.source, // "db" | "live" | "empty"
    supabaseConfigured: supabaseConfigured(),
    fetchedAt: snap.fetchedAt,
    counts: {
      countries: COUNTRIES.length,
      metrics: WORLD_BANK_METRICS.length,
      metricObservations: withData,
      metricCoveragePct: Math.round((withData / total) * 1000) / 10,
      studios: studios.length,
      games: games.length,
      failedMetrics: snap.failed.length,
    },
  });
}
