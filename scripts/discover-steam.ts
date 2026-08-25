/**
 * Steam discovery & verification harness.
 *
 * Takes candidate African studio/game names, resolves them to Steam appids via
 * the keyless storesearch endpoint, then VERIFIES each against appdetails —
 * keeping a result only when Steam itself reports a developer/publisher that
 * matches the expected African studio. Candidates that don't verify are
 * reported as rejected, never silently included.
 *
 * This is a research tool: its output is reviewed by a human before anything
 * enters the seed. Run: npx tsx scripts/discover-steam.ts
 */

const SEARCH = "https://store.steampowered.com/api/storesearch/";
const DETAILS = "https://store.steampowered.com/api/appdetails";

// Candidate African studios and titles to check. Expected developer strings are
// matched case-insensitively against Steam's own `developers`/`publishers`.
const CANDIDATES: { studio: string; iso3: string; titles: string[] }[] = [
  { studio: "Free Lives", iso3: "ZAF", titles: ["Broforce", "GORN", "Terra Nil", "Anger Foot", "Genital Jousting", "Broforce Forever", "Stick It to the Stickman"] },
  { studio: "Nyamakop", iso3: "ZAF", titles: ["Semblance", "Relooted"] },
  { studio: "QCF Design", iso3: "ZAF", titles: ["Desktop Dungeons", "Desktop Dungeons Rewind"] },
  { studio: "Kiro'o Games", iso3: "CMR", titles: ["Aurion Legacy of the Kori-Odan"] },
  { studio: "Celestial Games", iso3: "ZAF", titles: ["Toxic Bunny HD"] },
  { studio: "Thoopid", iso3: "ZAF", titles: ["Snailboy", "Rushdown Revolt"] },
  { studio: "24 Bit Games", iso3: "ZAF", titles: ["Hell Warders"] },
  { studio: "Instinct Games", iso3: "EGY", titles: ["Freaking Meatbags", "Fear the Wolves"] },
  { studio: "Digital Mania", iso3: "TUN", titles: ["Wall of Insanity", "Roadout"] },
  { studio: "Rainmaker", iso3: "ZAF", titles: [] },
  { studio: "Sea Monster", iso3: "ZAF", titles: [] },
  { studio: "Kalabo", iso3: "ZMB", titles: [] },
  { studio: "Lunar Ray Games", iso3: "ZAF", titles: ["Timespinner"] },
  { studio: "Nommo", iso3: "NGA", titles: [] },
  { studio: "Usiku Games", iso3: "KEN", titles: [] },
  { studio: "Leti Arts", iso3: "GHA", titles: ["Africa's Legends"] },
  { studio: "Maliyo Games", iso3: "NGA", titles: [] },
  { studio: "Qene Games", iso3: "ETH", titles: ["Kukulu", "Gebeta"] },
];

interface SearchItem { id: number; name: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(term: string): Promise<SearchItem[]> {
  const res = await fetch(`${SEARCH}?term=${encodeURIComponent(term)}&l=english&cc=US`);
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: SearchItem[] };
  return json.items ?? [];
}

async function details(appId: number) {
  const res = await fetch(`${DETAILS}?appids=${appId}&l=english`);
  if (!res.ok) return null;
  const json = (await res.json()) as Record<string, { success: boolean; data?: any }>;
  const entry = json[String(appId)];
  return entry?.success ? entry.data : null;
}

async function reviews(appId: number) {
  const res = await fetch(`${DETAILS.replace("/api/appdetails", "")}/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0`);
  if (!res.ok) return null;
  const json = (await res.json()) as { query_summary?: any };
  return json.query_summary ?? null;
}

function matches(expected: string, list: string[] | undefined): boolean {
  if (!list) return false;
  const e = expected.toLowerCase().replace(/[^a-z0-9]/g, "");
  return list.some((d) => d.toLowerCase().replace(/[^a-z0-9]/g, "").includes(e) || e.includes(d.toLowerCase().replace(/[^a-z0-9]/g, "")));
}

async function main() {
  const verified: any[] = [];
  const rejected: any[] = [];

  for (const cand of CANDIDATES) {
    for (const title of cand.titles) {
      await sleep(350); // be polite to the free endpoints
      const hits = await search(title);
      if (hits.length === 0) {
        rejected.push({ studio: cand.studio, title, reason: "no search hit" });
        continue;
      }
      // Check the top few hits for a developer match.
      let confirmed = null;
      for (const hit of hits.slice(0, 3)) {
        await sleep(350);
        const d = await details(hit.id);
        if (!d) continue;
        if (matches(cand.studio, d.developers) || matches(cand.studio, d.publishers)) {
          confirmed = { hit, d };
          break;
        }
      }
      if (!confirmed) {
        rejected.push({ studio: cand.studio, title, reason: "developer mismatch", topHit: hits[0]?.name });
        continue;
      }
      await sleep(350);
      const rv = await reviews(confirmed.hit.id);
      verified.push({
        studio: cand.studio,
        iso3: cand.iso3,
        appId: confirmed.hit.id,
        name: confirmed.d.name,
        released: confirmed.d.release_date?.date ?? null,
        developers: confirmed.d.developers ?? null,
        publishers: confirmed.d.publishers ?? null,
        genres: (confirmed.d.genres ?? []).map((g: any) => g.description),
        platforms: Object.entries(confirmed.d.platforms ?? {}).filter(([, v]) => v).map(([k]) => k),
        isFree: confirmed.d.is_free ?? null,
        reviewDesc: rv?.review_score_desc ?? null,
        totalReviews: rv?.total_reviews ?? null,
        positivePct: rv?.total_reviews ? Math.round((rv.total_positive / rv.total_reviews) * 1000) / 10 : null,
      });
    }
  }

  console.log("\n=== VERIFIED (Steam confirms the African developer) ===");
  for (const v of verified) {
    console.log(
      `${v.appId}\t${v.name}\t| dev: ${(v.developers ?? []).join(", ")}\t| ${v.released}\t| ${v.platforms.join("/")}\t| ${v.reviewDesc ?? "no reviews"} ${v.positivePct ?? "-"}% (${v.totalReviews ?? 0})`,
    );
  }
  console.log(`\n=== REJECTED (${rejected.length}) — not added to the dataset ===`);
  for (const r of rejected) console.log(`${r.studio} / ${r.title} → ${r.reason}${r.topHit ? ` (top hit: ${r.topHit})` : ""}`);
  console.log(`\nverified=${verified.length} rejected=${rejected.length}`);
  console.log("\n--- JSON ---");
  console.log(JSON.stringify(verified, null, 1));
}

main().catch((e) => { console.error(e); process.exit(1); });
