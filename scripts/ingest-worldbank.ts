/**
 * World Bank ingestion job.
 *
 * Fetches the live WDI snapshot and upserts countries, sources, metrics and
 * metric_values into Supabase. History is preserved (unique key includes year
 * + source), so re-runs never destroy prior observations.
 *
 * Run:  node --env-file=.env.local --import tsx scripts/ingest-worldbank.ts
 * CI:   GitHub Actions provides env (see .github/workflows/ingest-worldbank.yml)
 *
 * No-ops gracefully (logs and exits 0) when Supabase env is absent, so the
 * repo stays runnable without a database.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { COUNTRIES } from "../src/lib/data/countries";
import { WORLD_BANK_METRICS } from "../src/lib/data/metrics";
import { DATA_SOURCES } from "../src/lib/data-sources/registry";
import { fetchWorldBankSnapshot } from "../src/lib/data-sources/worldbank";
import { computeScores } from "../src/lib/scoring/market";
import { ALL_MODES } from "../src/lib/scoring/weights";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("→ Fetching World Bank snapshot…");
  const snap = await fetchWorldBankSnapshot();
  const metricCount = Object.keys(snap.values).length;
  const rows = Object.values(snap.values).reduce((n, m) => n + Object.keys(m).length, 0);
  console.log(`  fetched ${metricCount} metrics × ${COUNTRIES.length} countries = ${rows} values`);
  if (snap.failed.length) console.warn(`  ⚠ failed metrics: ${snap.failed.join(", ")}`);

  if (!url || !key) {
    console.log("→ Supabase not configured (no URL / service-role key). Dry run complete.");
    console.log("  Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to persist.");
    return;
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  console.log("→ Upserting reference data…");
  await db.from("countries").upsert(
    COUNTRIES.map((c) => ({ iso3: c.iso3, iso2: c.iso2, name: c.name, region: c.region, capital: c.capital })),
  );
  await db.from("data_sources").upsert(
    DATA_SOURCES.map((s) => ({
      id: s.id, source_name: s.sourceName, organization: s.organization,
      source_type: s.sourceType, api_url: s.apiUrl, website_url: s.websiteUrl,
      documentation_url: s.documentationUrl, license: s.license,
      update_frequency: s.updateFrequency, reliability_score: s.reliabilityScore,
      verification_status: s.verificationStatus, notes: s.notes,
    })),
  );
  await db.from("metrics").upsert(
    WORLD_BANK_METRICS.map((m) => ({
      id: m.id, label: m.label, unit: m.unit, category: m.category,
      higher_is_better: m.higherIsBetter, description: m.description,
      primary_source_id: m.primarySourceId,
    })),
  );

  console.log("→ Upserting metric values (history preserved)…");
  const batch: Record<string, unknown>[] = [];
  for (const [metricId, perCountry] of Object.entries(snap.values)) {
    for (const [iso3, mv] of Object.entries(perCountry)) {
      if (mv.value === null) continue; // never store NULL rows as observations
      batch.push({
        metric_id: metricId, country_iso3: iso3, value: mv.value, unit: mv.unit,
        year: mv.year, kind: mv.kind, confidence: mv.confidence, source_id: mv.sourceId,
        effective_date: mv.year ? `${mv.year}-01-01` : null, retrieved_at: mv.retrievedAt,
      });
    }
  }
  const { error } = await db
    .from("metric_values")
    .upsert(batch, { onConflict: "metric_id,country_iso3,year,source_id" });
  if (error) throw error;

  await db.from("data_sources").update({ last_successful_fetch: new Date().toISOString() }).eq("id", "worldbank");
  console.log(`✓ Ingestion complete — ${batch.length} observations upserted.`);

  // Persist computed scores (history preserved via computed_at). Non-fatal.
  try {
    await persistScores(db, snap.values);
  } catch (err) {
    console.warn("  ⚠ score persistence skipped:", (err as Error).message);
  }
}

async function persistScores(db: SupabaseClient, metrics: Parameters<typeof computeScores>[0]) {
  console.log("→ Computing & persisting scores…");
  const computedAt = new Date().toISOString();
  const scoreRows: Record<string, unknown>[] = [];
  const componentsByKey = new Map<string, { dimension: string; score: number | null; weight: number; coverage: number }[]>();

  for (const mode of ALL_MODES) {
    for (const s of computeScores(metrics, mode)) {
      const key = `${s.entityId}:${mode}`;
      scoreRows.push({
        entity_type: "country", entity_id: s.entityId, mode,
        total: s.total, coverage: s.coverage, confidence: s.confidence, computed_at: computedAt,
      });
      componentsByKey.set(key, s.components.map((c) => ({
        dimension: c.dimension, score: c.score, weight: c.weight, coverage: c.coverage,
      })));
    }
  }

  const { data: inserted, error } = await db.from("scores").insert(scoreRows).select("id,entity_id,mode");
  if (error) throw error;

  const componentRows: Record<string, unknown>[] = [];
  for (const row of inserted ?? []) {
    const comps = componentsByKey.get(`${row.entity_id}:${row.mode}`) ?? [];
    for (const c of comps) {
      componentRows.push({ score_id: row.id, dimension: c.dimension, score: c.score, weight: c.weight, coverage: c.coverage });
    }
  }
  if (componentRows.length) {
    const { error: cErr } = await db.from("score_components").insert(componentRows);
    if (cErr) throw cErr;
  }
  console.log(`✓ Persisted ${scoreRows.length} scores + ${componentRows.length} components.`);
}

main().catch((err) => {
  console.error("✗ Ingestion failed:", err);
  process.exit(1);
});
