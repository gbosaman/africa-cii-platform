import { COUNTRIES } from "@/lib/data/countries";
import { normalise } from "@/lib/scoring/normalize";
import type { MetricSnapshot } from "@/lib/scoring/market";

// ---------------------------------------------------------------------------
// Trend / momentum detection from REAL World Bank growth series. No invented
// movement: momentum blends verified GDP growth and population growth. An
// "emerging" market is one with strong momentum from a below-median income
// base — high runway, not yet high spend. Pure & testable.
// ---------------------------------------------------------------------------

export interface Momentum {
  iso3: string;
  name: string;
  momentum: number | null; // 0..100
  emerging: boolean;
  gdpGrowth: number | null;
  popGrowth: number | null;
}

export function computeMomentum(snapshot: MetricSnapshot): Momentum[] {
  const growthPop = COUNTRIES.map((c) => snapshot.gdp_growth?.[c.iso3]?.value ?? null);
  const popPop = COUNTRIES.map((c) => snapshot.population_growth?.[c.iso3]?.value ?? null);
  const gdpcapPop = COUNTRIES.map((c) => snapshot.gdp_per_capita?.[c.iso3]?.value ?? null);

  const gdpcapValues = gdpcapPop.filter((v): v is number => v !== null).sort((a, b) => a - b);
  const median = gdpcapValues.length
    ? gdpcapValues[Math.floor(gdpcapValues.length / 2)]!
    : Infinity;

  const rows = COUNTRIES.map((c) => {
    const g = snapshot.gdp_growth?.[c.iso3]?.value ?? null;
    const p = snapshot.population_growth?.[c.iso3]?.value ?? null;
    const gN = normalise(g, growthPop, "minmax");
    const pN = normalise(p, popPop, "minmax");
    let momentum: number | null = null;
    if (gN !== null || pN !== null) {
      // Weighted blend over available components (0.6 GDP, 0.4 population).
      const parts = [
        { v: gN, w: 0.6 },
        { v: pN, w: 0.4 },
      ].filter((x) => x.v !== null) as { v: number; w: number }[];
      const wsum = parts.reduce((s, x) => s + x.w, 0);
      momentum = Math.round((parts.reduce((s, x) => s + x.v * x.w, 0) / wsum) * 10) / 10;
    }
    const gdpcap = snapshot.gdp_per_capita?.[c.iso3]?.value ?? null;
    const emerging = momentum !== null && momentum >= 55 && gdpcap !== null && gdpcap < median;
    return { iso3: c.iso3, name: c.name, momentum, emerging, gdpGrowth: g, popGrowth: p };
  });

  return rows.sort((a, b) => (b.momentum ?? -1) - (a.momentum ?? -1));
}
