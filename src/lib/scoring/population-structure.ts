import { COUNTRIES } from "@/lib/data/countries";
import type { MetricSnapshot } from "@/lib/scoring/market";
import { share15to24 } from "@/lib/scoring/education";

// ---------------------------------------------------------------------------
// Age and sex structure of the population.
//
// WHY THIS EXISTS: the Age and Gender cards had no numeric data at all. No free
// source publishes an age-bracket split or a male/female split for African
// GAMERS — only the qualitative statements "mostly 16-35" and "largely male".
// Neither can be charted without inventing the numbers.
//
// What CAN be charted is the population those gamers are drawn from, which is
// official, complete and free. It is a different quantity and the cards say so
// in as many words. Showing the real denominator beats both fabricating a
// gamer split and leaving the card blank.
//
// The 25-64 band is the residual, so it absorbs any rounding drift and the four
// bands always partition the population exactly — which is the precondition for
// drawing them as a pie at all.
// ---------------------------------------------------------------------------

export interface AgeStructure {
  under15: number | null;
  age15to24: number | null;
  age25to64: number | null;
  age65plus: number | null;
  coverage: number;
}

export interface SexStructure {
  female: number | null;
  male: number | null;
}

export function ageStructureForCountry(m: MetricSnapshot, iso3: string): AgeStructure {
  const under15 = m.youth_pct?.[iso3]?.value ?? null;
  const a1524 = share15to24(m, iso3);
  const a65 = m.pop_65_plus?.[iso3]?.value ?? null;

  const a2564 =
    under15 !== null && a1524 !== null && a65 !== null
      ? Math.max(0, 100 - under15 - a1524 - a65)
      : null;

  const bands = [under15, a1524, a2564, a65];
  return {
    under15,
    age15to24: a1524,
    age25to64: a2564,
    age65plus: a65,
    coverage: bands.filter((b) => b !== null).length / bands.length,
  };
}

/** Continental age structure, weighted by population. */
export function continentalAgeStructure(m: MetricSnapshot): AgeStructure {
  const keys = ["under15", "age15to24", "age25to64", "age65plus"] as const;
  const num: Record<string, number> = {};
  const den: Record<string, number> = {};
  for (const k of keys) {
    num[k] = 0;
    den[k] = 0;
  }

  for (const c of COUNTRIES) {
    const pop = m.population?.[c.iso3]?.value ?? null;
    if (typeof pop !== "number" || pop <= 0) continue;
    const a = ageStructureForCountry(m, c.iso3);
    // Complete cases only, so the four bands keep partitioning to 100.
    if (a.coverage !== 1) continue;
    for (const k of keys) {
      num[k]! += a[k]! * pop;
      den[k]! += pop;
    }
  }

  const out = (k: (typeof keys)[number]) => (den[k]! > 0 ? num[k]! / den[k]! : null);
  const bands = [out("under15"), out("age15to24"), out("age25to64"), out("age65plus")];

  return {
    under15: bands[0]!,
    age15to24: bands[1]!,
    age25to64: bands[2]!,
    age65plus: bands[3]!,
    coverage: bands.filter((b) => b !== null).length / 4,
  };
}

/** Continental sex split, weighted by population. */
export function continentalSexStructure(m: MetricSnapshot): SexStructure {
  let num = 0;
  let den = 0;
  for (const c of COUNTRIES) {
    const pop = m.population?.[c.iso3]?.value ?? null;
    const fem = m.female_pct?.[c.iso3]?.value ?? null;
    if (typeof pop !== "number" || pop <= 0 || fem === null) continue;
    num += fem * pop;
    den += pop;
  }
  if (den <= 0) return { female: null, male: null };
  const female = num / den;
  return { female, male: 100 - female };
}
