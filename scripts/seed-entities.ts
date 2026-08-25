/**
 * Seed the Supabase entity tables (studios, games, animation studios) from the
 * verified, source-cited seed. Idempotent — safe to re-run. No-ops gracefully
 * when Supabase env is absent.
 *
 * Run: node --env-file=.env.local --import tsx scripts/seed-entities.ts
 */
import { createClient } from "@supabase/supabase-js";
import { STUDIOS, GAMES, ANIMATION_STUDIOS } from "../src/lib/data/studios";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("→ Supabase not configured. Dry run — would seed",
      `${STUDIOS.length} studios, ${GAMES.length} games, ${ANIMATION_STUDIOS.length} animation studios.`);
    return;
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  console.log("→ Seeding studios…");
  await db.from("studios").upsert(
    STUDIOS.map((s) => ({
      id: s.id, name: s.name, country_iso3: s.countryIso3, city: s.city ?? null,
      founded_year: s.foundedYear ?? null, website: s.website ?? null,
      team_size: s.teamSize ?? null, status: s.status, verified: s.verified, notes: s.notes ?? null,
    })),
  );
  // Aliases + sources (child tables)
  for (const s of STUDIOS) {
    if (s.aliases?.length) {
      await db.from("studio_aliases").upsert(s.aliases.map((alias) => ({ studio_id: s.id, alias })));
    }
    if (s.sources?.length) {
      await db.from("studio_sources").upsert(s.sources.map((src) => ({ studio_id: s.id, url: src.url, label: src.label })));
    }
  }

  console.log("→ Seeding games…");
  await db.from("games").upsert(
    GAMES.map((g) => ({
      id: g.id, title: g.title, studio_id: g.studioId ?? null, country_iso3: g.countryIso3,
      release_year: g.releaseYear ?? null, engine: g.engine ?? null, ip_type: g.ipType ?? null,
      status: g.status, verified: g.verified,
    })),
  );
  for (const g of GAMES) {
    if (g.platforms?.length) {
      await db.from("game_platforms").upsert(
        g.platforms.map((p) => ({
          game_id: g.id, platform: p,
          store_url: p === "PC" && g.storeLinks?.steam ? g.storeLinks.steam : null,
        })),
      );
    }
  }

  console.log("→ Seeding animation studios…");
  await db.from("animation_studios").upsert(
    ANIMATION_STUDIOS.map((a) => ({
      id: a.id, name: a.name, country_iso3: a.countryIso3, city: a.city ?? null,
      website: a.website ?? null, verified: a.verified,
    })),
  );

  console.log(`✓ Entity seed complete — ${STUDIOS.length} studios, ${GAMES.length} games, ${ANIMATION_STUDIOS.length} animation studios.`);
}

main().catch((err) => {
  console.error("✗ Entity seed failed:", err);
  process.exit(1);
});
