/**
 * Generates src/lib/data/gamedevmap.ts from a harvest run.
 *
 * Usage:
 *   npx tsx scripts/harvest-gamedevmap.ts > gdm.json
 *   npx tsx scripts/generate-gamedevmap-module.ts gdm.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { GdmRecord } from "./harvest-gamedevmap";

const inPath = process.argv[2];
if (!inPath) {
  console.error("usage: generate-gamedevmap-module.ts <harvest.json>");
  process.exit(1);
}

const parsed = JSON.parse(readFileSync(inPath, "utf8")) as {
  perCountry: { iso3: string; name: string; n: number }[];
  records: GdmRecord[];
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

// Collapse multi-location listings (e.g. a publisher with 4 African offices)
// into one entity, keeping the extra locations as recorded offices.
const byKey = new Map<string, { rec: GdmRecord; others: GdmRecord[] }>();
for (const r of parsed.records) {
  const key = slug(r.name);
  const hit = byKey.get(key);
  if (hit) hit.others.push(r);
  else byKey.set(key, { rec: r, others: [] });
}

const entries = [...byKey.entries()]
  .map(([key, { rec, others }]) => ({ key, rec, others }))
  .sort((a, b) => a.rec.country.localeCompare(b.rec.country) || a.rec.name.localeCompare(b.rec.name));

const esc = (s: string | null) => (s === null ? "null" : JSON.stringify(s));

const body = entries
  .map(({ key, rec, others }) => {
    const offices =
      others.length > 0
        ? `[${[rec, ...others].map((o) => JSON.stringify(`${o.city ?? "—"}, ${o.country}`)).join(", ")}]`
        : "null";
    return `  {
    id: ${JSON.stringify(`gdm-${key}`)},
    name: ${esc(rec.name)},
    countryIso3: ${esc(rec.countryIso3)},
    city: ${esc(rec.city)},
    region: ${esc(rec.region)},
    website: ${esc(rec.url)},
    gdmType: ${esc(rec.type)},
    otherOffices: ${offices},
  },`;
  })
  .join("\n");

const totalOrgs = parsed.records.length;
const countries = parsed.perCountry.length;

const out = `// ---------------------------------------------------------------------------
// GENERATED FILE — do not hand-edit.
//   npx tsx scripts/harvest-gamedevmap.ts > gdm.json
//   npx tsx scripts/generate-gamedevmap-module.ts gdm.json
//
// SOURCE & ATTRIBUTION
//   GameDevMap — https://www.gamedevmap.com/
//   A long-running, community-maintained directory of game-development
//   organisations worldwide. Data below is reproduced as FACTS ONLY
//   (organisation name, type, city, region, country, own website); no
//   editorial text from the source is copied.
//
//   Harvested ${new Date().toISOString().slice(0, 10)} via the site's public query interface
//   (index.php?country=…), which robots.txt permits. The underlying CSV under
//   /cmsdata/ is Disallowed and was NOT accessed.
//
//   Provenance tier: COMMUNITY. These records are third-party directory
//   entries, not verified against each organisation's own site, and are
//   labelled as such throughout the UI. Records we have independently
//   verified live in studios.ts at the VERIFIED tier.
//
//   ${totalOrgs} organisations across ${countries} African countries;
//   ${entries.length} unique entities after collapsing multi-office listings.
// ---------------------------------------------------------------------------

export interface GameDevMapEntry {
  id: string;
  name: string;
  countryIso3: string;
  city: string | null;
  region: string | null;
  website: string | null;
  /** GameDevMap's own category label, preserved verbatim for traceability. */
  gdmType: string;
  /** Populated when the same organisation is listed in several locations. */
  otherOffices: string[] | null;
}

export const GAMEDEVMAP_SOURCE = {
  id: "gamedevmap",
  name: "GameDevMap",
  url: "https://www.gamedevmap.com/",
  license: "Community-maintained directory; facts reproduced with attribution.",
  retrievedAt: ${JSON.stringify(new Date().toISOString().slice(0, 10))},
  tier: "community" as const,
};

export const GAMEDEVMAP_ENTRIES: GameDevMapEntry[] = [
${body}
];

/** Counts by GameDevMap category — useful for ecosystem composition charts. */
export function gdmTypeBreakdown(): Record<string, number> {
  return GAMEDEVMAP_ENTRIES.reduce<Record<string, number>>((acc, e) => {
    acc[e.gdmType] = (acc[e.gdmType] ?? 0) + 1;
    return acc;
  }, {});
}

export function gdmCountByCountry(): Record<string, number> {
  return GAMEDEVMAP_ENTRIES.reduce<Record<string, number>>((acc, e) => {
    acc[e.countryIso3] = (acc[e.countryIso3] ?? 0) + 1;
    return acc;
  }, {});
}
`;

writeFileSync("src/lib/data/gamedevmap.ts", out);
console.log(`wrote src/lib/data/gamedevmap.ts — ${entries.length} unique entities from ${totalOrgs} listings`);
