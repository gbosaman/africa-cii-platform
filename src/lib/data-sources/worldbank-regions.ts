import "server-only";
import { cache } from "react";

// ---------------------------------------------------------------------------
// World Bank REGIONAL AGGREGATES — for an honest global comparison.
//
// The reference dashboard compares regions on gamers and gaming revenue. Those
// figures come from paid market research and this platform does not reproduce
// them as fact. What the World Bank does publish, free and per-region, is
// population, GDP and internet penetration — so the comparison here is built
// from those instead. It answers a narrower question than "who plays games",
// but every number in it is verifiable.
// ---------------------------------------------------------------------------

export const WB_REGIONS = [
  { code: "SSF", label: "Sub-Saharan Africa", highlight: true },
  { code: "MEA", label: "Middle East & North Africa", highlight: true },
  { code: "EAS", label: "East Asia & Pacific" },
  { code: "ECS", label: "Europe & Central Asia" },
  { code: "LCN", label: "Latin America & Caribbean" },
  { code: "NAC", label: "North America" },
  { code: "WLD", label: "World" },
] as const;

export interface RegionRow {
  code: string;
  label: string;
  highlight: boolean;
  population: number | null;
  gdp: number | null;
  gdpPerCapita: number | null;
  internetPct: number | null;
  populationGrowth: number | null;
  year: number | null;
}

const INDICATORS = {
  population: "SP.POP.TOTL",
  gdp: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  internetPct: "IT.NET.USER.ZS",
  populationGrowth: "SP.POP.GROW",
} as const;

async function fetchIndicator(indicator: string): Promise<Map<string, { value: number; year: number }>> {
  const codes = WB_REGIONS.map((r) => r.code).join(";");
  const url = `https://api.worldbank.org/v2/country/${codes}/indicator/${indicator}?format=json&mrnev=1&per_page=100`;
  const out = new Map<string, { value: number; year: number }>();
  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!res.ok) return out;
    const json = (await res.json()) as [unknown, Array<{ countryiso3code: string; date: string; value: number | null }> | null];
    for (const row of json[1] ?? []) {
      if (row.value === null) continue;
      out.set(row.countryiso3code, { value: row.value, year: Number(row.date) });
    }
  } catch {
    /* degrade to empty — callers render N/A */
  }
  return out;
}

/** Regional comparison rows. Any missing value stays null, never zero. */
export const getRegionComparison = cache(async (): Promise<RegionRow[]> => {
  const entries = Object.entries(INDICATORS);
  const results = await Promise.all(entries.map(([, ind]) => fetchIndicator(ind)));
  const byKey = Object.fromEntries(entries.map(([key], i) => [key, results[i]!])) as Record<
    keyof typeof INDICATORS,
    Map<string, { value: number; year: number }>
  >;

  return WB_REGIONS.map((r) => ({
    code: r.code,
    label: r.label,
    highlight: "highlight" in r ? Boolean(r.highlight) : false,
    population: byKey.population.get(r.code)?.value ?? null,
    gdp: byKey.gdp.get(r.code)?.value ?? null,
    gdpPerCapita: byKey.gdpPerCapita.get(r.code)?.value ?? null,
    internetPct: byKey.internetPct.get(r.code)?.value ?? null,
    populationGrowth: byKey.populationGrowth.get(r.code)?.value ?? null,
    year: byKey.population.get(r.code)?.year ?? null,
  }));
});
