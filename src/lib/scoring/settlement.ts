import { COUNTRIES } from "@/lib/data/countries";
import type { MetricSnapshot } from "@/lib/scoring/market";

// ---------------------------------------------------------------------------
// Urban / rural split, and the infrastructure gap between them.
//
// The population split is the easy half. The half that actually matters for
// this platform is ELECTRIFICATION: a rural population with 1% grid access
// cannot play games regardless of how young, connected or numerous it is.
// Power is the gate before device, before data, before content.
//
// WEIGHTING NOTE: urban electrification must be weighted by URBAN population
// and rural electrification by RURAL population. Weighting both by total
// population would let a heavily-urban country drag the rural average toward a
// figure no rural person experiences.
// ---------------------------------------------------------------------------

export interface SettlementSplit {
  urbanPct: number | null;
  ruralPct: number | null;
  urbanPopulation: number | null;
  ruralPopulation: number | null;
  urbanGrowth: number | null;
  electricityUrban: number | null;
  electricityRural: number | null;
  /** Percentage-point gap between urban and rural electrification. */
  electricityGap: number | null;
  coverage: number;
}

export function settlementForCountry(m: MetricSnapshot, iso3: string): SettlementSplit {
  const v = (id: string) => m[id]?.[iso3]?.value ?? null;

  const pop = v("population");
  const urbanPct = v("urban_pct");
  const ruralPct = v("rural_pct");
  const urbanPopulation = v("urban_population");
  const eUrban = v("electricity_urban");
  const eRural = v("electricity_rural");

  const ruralPopulation =
    pop !== null && urbanPopulation !== null ? Math.max(0, pop - urbanPopulation) : null;

  const fields = [urbanPct, ruralPct, eUrban, eRural];
  return {
    urbanPct,
    ruralPct,
    urbanPopulation,
    ruralPopulation,
    urbanGrowth: v("urban_growth"),
    electricityUrban: eUrban,
    electricityRural: eRural,
    electricityGap: eUrban !== null && eRural !== null ? eUrban - eRural : null,
    coverage: fields.filter((f) => f !== null).length / fields.length,
  };
}

/**
 * Continental picture. Population shares are weighted by total population;
 * electrification rates are weighted by the population they actually describe.
 */
export function continentalSettlement(m: MetricSnapshot): SettlementSplit {
  let totalPop = 0;
  let urbanPop = 0;
  let ruralPop = 0;

  // Weighted accumulators, each against its correct base.
  let eUrbanNum = 0;
  let eUrbanDen = 0;
  let eRuralNum = 0;
  let eRuralDen = 0;
  let growthNum = 0;
  let growthDen = 0;

  for (const c of COUNTRIES) {
    const s = settlementForCountry(m, c.iso3);
    const pop = m.population?.[c.iso3]?.value;
    if (typeof pop !== "number") continue;
    totalPop += pop;
    if (s.urbanPopulation !== null) urbanPop += s.urbanPopulation;
    if (s.ruralPopulation !== null) ruralPop += s.ruralPopulation;

    if (s.electricityUrban !== null && s.urbanPopulation !== null) {
      eUrbanNum += s.electricityUrban * s.urbanPopulation;
      eUrbanDen += s.urbanPopulation;
    }
    if (s.electricityRural !== null && s.ruralPopulation !== null) {
      eRuralNum += s.electricityRural * s.ruralPopulation;
      eRuralDen += s.ruralPopulation;
    }
    if (s.urbanGrowth !== null && s.urbanPopulation !== null) {
      growthNum += s.urbanGrowth * s.urbanPopulation;
      growthDen += s.urbanPopulation;
    }
  }

  const eUrban = eUrbanDen > 0 ? eUrbanNum / eUrbanDen : null;
  const eRural = eRuralDen > 0 ? eRuralNum / eRuralDen : null;

  return {
    urbanPct: totalPop > 0 ? (urbanPop / totalPop) * 100 : null,
    ruralPct: totalPop > 0 ? (ruralPop / totalPop) * 100 : null,
    urbanPopulation: urbanPop || null,
    ruralPopulation: ruralPop || null,
    urbanGrowth: growthDen > 0 ? growthNum / growthDen : null,
    electricityUrban: eUrban,
    electricityRural: eRural,
    electricityGap: eUrban !== null && eRural !== null ? eUrban - eRural : null,
    coverage: [eUrban, eRural].filter((x) => x !== null).length / 2,
  };
}

/** Countries with the widest urban–rural electrification gap. */
export function widestElectricityGaps(m: MetricSnapshot, limit = 6) {
  return COUNTRIES.map((c) => ({ iso3: c.iso3, iso2: c.iso2, name: c.name, ...settlementForCountry(m, c.iso3) }))
    .filter((s) => s.electricityGap !== null)
    .sort((a, b) => (b.electricityGap ?? 0) - (a.electricityGap ?? 0))
    .slice(0, limit);
}
