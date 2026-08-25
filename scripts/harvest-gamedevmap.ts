/**
 * GameDevMap harvester.
 *
 * Source: https://www.gamedevmap.com/ — a long-running community-maintained
 * directory of game-development organisations worldwide.
 *
 * Politeness / compliance:
 *   • Uses the PUBLIC query interface (index.php?country=…), which robots.txt
 *     permits. It does NOT touch /cmsdata/ (the underlying CSV) — that path is
 *     Disallowed, even though it would be far more convenient.
 *   • Descriptive User-Agent, one request per country, throttled.
 *   • Extracts FACTS only (organisation name, type, city, region, country,
 *     own URL). No editorial text is copied.
 *
 * Output is reviewed before entering the seed, and every record carries
 * attribution back to GameDevMap.
 *
 * Run: npx tsx scripts/harvest-gamedevmap.ts
 */
import { COUNTRIES } from "../src/lib/data/countries";

const BASE = "https://www.gamedevmap.com/index.php";
const UA = "AfricaCII/0.1 (Africa Creative Industries Intelligence; research; contact via repository)";

export interface GdmRecord {
  name: string;
  url: string | null;
  type: string;
  city: string | null;
  region: string | null;
  country: string;
  countryIso3: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();

/** GameDevMap country labels that differ from our ISO 3166 names. */
const NAME_OVERRIDES: Record<string, string> = {
  "Congo (DR)": "Democratic Republic of the Congo",
  "Congo (Republic)": "Republic of the Congo",
  "Côte d'Ivoire": "Ivory Coast",
  "Cabo Verde": "Cape Verde",
  "Eswatini": "Swaziland",
  "Tanzania": "Tanzania",
};

export async function harvestCountry(iso3: string, name: string): Promise<GdmRecord[]> {
  const label = NAME_OVERRIDES[name] ?? name;
  const url = `${BASE}?country=${encodeURIComponent(label)}&count=200`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const html = await res.text();

  const out: GdmRecord[] = [];
  // Result rows carry class row1/row2 and six cells.
  const rowRe = /<tr class="row[12]">([\s\S]*?)<\/tr>/gi;
  for (const m of html.matchAll(rowRe)) {
    const row = m[1]!;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]!);
    if (cells.length < 6) continue;
    const linkMatch = cells[0]!.match(/href="([^"]+)"/i);
    const nameText = decode(cells[0]!.replace(/<[^>]+>/g, ""));
    if (!nameText) continue;
    out.push({
      name: nameText,
      url: linkMatch ? decode(linkMatch[1]!) : null,
      type: decode(cells[2]!.replace(/<[^>]+>/g, "")),
      city: decode(cells[3]!.replace(/<[^>]+>/g, "")) || null,
      region: decode(cells[4]!.replace(/<[^>]+>/g, "")) || null,
      country: decode(cells[5]!.replace(/<[^>]+>/g, "")),
      countryIso3: iso3,
    });
  }
  return out;
}

async function main() {
  const all: GdmRecord[] = [];
  const perCountry: { iso3: string; name: string; n: number }[] = [];

  for (const c of COUNTRIES) {
    await sleep(800); // deliberately gentle on a small community site
    try {
      const rows = await harvestCountry(c.iso3, c.name);
      if (rows.length) {
        all.push(...rows);
        perCountry.push({ iso3: c.iso3, name: c.name, n: rows.length });
        console.error(`${c.name}: ${rows.length}`);
      }
    } catch (e) {
      console.error(`${c.name}: FAILED ${(e as Error).message}`);
    }
  }

  console.error(`\nTOTAL ${all.length} organisations across ${perCountry.length} countries`);
  const byType = all.reduce<Record<string, number>>((a, r) => {
    a[r.type] = (a[r.type] ?? 0) + 1;
    return a;
  }, {});
  console.error("By type:", JSON.stringify(byType, null, 1));
  // JSON to stdout so it can be redirected to a file.
  console.log(JSON.stringify({ perCountry, records: all }, null, 1));
}

if (process.argv[1]?.includes("harvest-gamedevmap")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
