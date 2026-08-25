/**
 * Steam ingestion.
 *
 * Fetches live Steam data for every verified appid in the catalogue and writes
 * a SNAPSHOT row per title. Snapshots accumulate rather than overwrite: review
 * scores drift, and keeping the history is what allows "is this title gaining
 * or losing goodwill" to be answered later.
 *
 * Dry-runs safely without Supabase credentials.
 * Run: node --env-file=.env.local --import tsx scripts/ingest-steam.ts
 */
import { createClient } from "@supabase/supabase-js";
import { GAMES } from "../src/lib/data/games";
import { fetchSteamData } from "../src/lib/data-sources/steam";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const linked = GAMES.filter((g) => g.steamAppId);
  console.log(`→ Fetching Steam data for ${linked.length} verified titles…`);

  const rows: Record<string, unknown>[] = [];
  let unreachable = 0;

  for (const g of linked) {
    const s = await fetchSteamData(g.steamAppId!);
    if (!s.available) {
      unreachable++;
      console.warn(`  ⚠ ${g.title} (${g.steamAppId}) unreachable — not recorded`);
    } else {
      rows.push({
        game_id: g.id,
        app_id: s.appId,
        name: s.name,
        release_date: s.releaseDate,
        developers: s.developers,
        publishers: s.publishers,
        genres: s.genres,
        platforms: s.platforms,
        is_free: s.isFree,
        price: s.price,
        review_desc: s.reviewDesc,
        review_score: s.reviewScore,
        total_positive: s.totalPositive,
        total_negative: s.totalNegative,
        total_reviews: s.totalReviews,
        positive_pct: s.positivePct,
        observed_at: s.fetchedAt,
      });
      console.log(
        `  ${String(s.positivePct ?? "—").padStart(5)}%  ${String(s.totalReviews ?? 0).padStart(7)} reviews  ${g.title}`,
      );
    }
    await sleep(300); // be gentle with Valve's public endpoints
  }

  console.log(`\n✓ ${rows.length} fetched, ${unreachable} unreachable.`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("→ Supabase not configured. Dry run complete — nothing written.");
    return;
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.from("steam_snapshots").insert(rows);
  if (error) throw error;
  console.log(`✓ Wrote ${rows.length} Steam snapshots.`);
}

main().catch((e) => {
  console.error("✗ Steam ingestion failed:", e);
  process.exit(1);
});
