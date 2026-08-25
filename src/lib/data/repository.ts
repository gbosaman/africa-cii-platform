import "server-only";
import { createAnonServerClient, createServiceClient } from "@/lib/supabase/server";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";
import type { MetricSnapshot } from "@/lib/scoring/market";
import type { Studio, Game } from "@/lib/types";
import { STUDIOS as SEED_STUDIOS, GAMES as SEED_GAMES } from "@/lib/data/studios";
import { rowsToSnapshot, type DbMetricRow } from "@/lib/data/repository-transform";

// ---------------------------------------------------------------------------
// Persistence repository. The whole point: when Supabase is configured AND has
// data, the platform reads from it; otherwise it transparently falls back to
// the live adapters / built-in seed. Nothing downstream (scoring, pages) knows
// or cares which source served the data — the shapes are identical.
// ---------------------------------------------------------------------------

/** A read client: anon respects public-read RLS; service role is the fallback. */
function readClient() {
  return createAnonServerClient() ?? createServiceClient();
}

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Read the latest metric value per (metric, country) from Supabase.
 * Returns null when Supabase is unconfigured, errors, or holds no rows — the
 * caller then falls back to the live adapter. Never throws.
 */
export async function readMetricSnapshotFromDb(): Promise<MetricSnapshot | null> {
  const db = readClient();
  if (!db) return null;

  const metricIds = WORLD_BANK_METRICS.map((m) => m.id);
  const { data, error } = await db
    .from("metric_values")
    .select("metric_id,country_iso3,value,unit,year,confidence,source_id,retrieved_at")
    .in("metric_id", metricIds);

  if (error || !data || data.length === 0) return null;
  return rowsToSnapshot(data as DbMetricRow[]);
}

/** Full time series for one metric+country from DB, or null to fall back. */
export async function readMetricSeriesFromDb(
  metricId: string,
  iso3: string,
): Promise<{ year: number; value: number }[] | null> {
  const db = readClient();
  if (!db) return null;
  const { data, error } = await db
    .from("metric_values")
    .select("year,value")
    .eq("metric_id", metricId)
    .eq("country_iso3", iso3)
    .not("value", "is", null)
    .order("year", { ascending: true });
  if (error || !data || data.length < 2) return null;
  return (data as { year: number; value: number }[]).map((r) => ({ year: r.year, value: r.value }));
}

/** Studios from DB (with sources/aliases) or the built-in seed. */
export async function getStudios(): Promise<Studio[]> {
  const db = readClient();
  if (!db) return SEED_STUDIOS;
  const { data, error } = await db
    .from("studios")
    .select("id,name,country_iso3,city,founded_year,website,team_size,status,verified,notes");
  if (error || !data || data.length === 0) return SEED_STUDIOS;
  return (data as any[]).map((s) => ({
    id: s.id,
    name: s.name,
    countryIso3: s.country_iso3,
    city: s.city ?? undefined,
    foundedYear: s.founded_year ?? null,
    website: s.website ?? undefined,
    categories: [],
    teamSize: s.team_size ?? null,
    status: s.status ?? "unknown",
    verified: Boolean(s.verified),
    notes: s.notes ?? undefined,
    sources: [],
  }));
}

export async function getGames(): Promise<Game[]> {
  const db = readClient();
  if (!db) return SEED_GAMES;
  const { data, error } = await db
    .from("games")
    .select("id,title,studio_id,country_iso3,release_year,engine,ip_type,status,verified");
  if (error || !data || data.length === 0) return SEED_GAMES;
  return (data as any[]).map((g) => ({
    id: g.id,
    title: g.title,
    studioId: g.studio_id ?? undefined,
    countryIso3: g.country_iso3,
    releaseYear: g.release_year ?? null,
    engine: g.engine ?? null,
    ipType: g.ip_type ?? undefined,
    status: g.status ?? "unknown",
    verified: Boolean(g.verified),
    sources: [],
  }));
}
