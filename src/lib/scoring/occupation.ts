import { COUNTRIES } from "@/lib/data/countries";
import type { MetricSnapshot } from "@/lib/scoring/market";

// ---------------------------------------------------------------------------
// Occupation breakdown of the working-age population.
//
// THE TRAP THIS AVOIDS: the three obvious World Bank indicators are measured
// against three DIFFERENT denominators, and stacking them naively produces a
// chart that looks fine and means nothing.
//
//   employment-to-population ratio → % of the 15+ POPULATION
//   unemployment rate              → % of the LABOUR FORCE
//   self-employed                  → % of TOTAL EMPLOYMENT
//
// Everything below is therefore re-expressed as a share of the 15+ population,
// which is the only base on which the buckets can legitimately be compared or
// summed. The identity used is:
//
//   labour force participation (L) = employed (E) + unemployed, all as % of pop
//   ⇒ unemployed as % of population = L − E
//   ⇒ not in labour force           = 100 − L
//
// So the four buckets sum to 100% of the 15+ population by construction.
// ---------------------------------------------------------------------------

export interface OccupationSplit {
  /** Wage or salaried employment, % of 15+ population. */
  wageEmployed: number | null;
  /** Self-employment, % of 15+ population (not % of employment). */
  selfEmployed: number | null;
  /** Unemployed and seeking work, % of 15+ population. */
  unemployed: number | null;
  /** Outside the labour force — students, homemakers, retired, discouraged. */
  notInLabourForce: number | null;
  /** Youth neither working nor studying, % of 15–24s. Different base — shown separately. */
  youthNeet: number | null;
  /** Fraction of the four buckets that could be computed, 0..1. */
  coverage: number;
}

function splitForCountry(m: MetricSnapshot, iso3: string): OccupationSplit {
  const v = (id: string) => m[id]?.[iso3]?.value ?? null;

  const employed = v("employment_ratio"); // % of 15+ population
  const participation = v("labour_participation"); // % of 15+ population
  const selfShare = v("self_employed_share"); // % of employment
  const youthNeet = v("youth_neet");

  const selfEmployed =
    employed !== null && selfShare !== null ? (employed * selfShare) / 100 : null;
  const wageEmployed =
    employed !== null && selfEmployed !== null ? Math.max(0, employed - selfEmployed) : null;
  const unemployed =
    participation !== null && employed !== null ? Math.max(0, participation - employed) : null;
  const notInLabourForce = participation !== null ? Math.max(0, 100 - participation) : null;

  const buckets = [wageEmployed, selfEmployed, unemployed, notInLabourForce];
  const present = buckets.filter((b) => b !== null).length;

  return {
    wageEmployed,
    selfEmployed,
    unemployed,
    notInLabourForce,
    youthNeet,
    coverage: present / 4,
  };
}

/**
 * Continental split, weighted by each country's population so a large country
 * counts for more than a small one. Countries missing an input are skipped for
 * that bucket rather than treated as zero.
 */
export function continentalOccupation(m: MetricSnapshot): OccupationSplit {
  const keys = ["wageEmployed", "selfEmployed", "unemployed", "notInLabourForce", "youthNeet"] as const;
  const num: Record<string, number> = {};
  const den: Record<string, number> = {};
  for (const k of keys) {
    num[k] = 0;
    den[k] = 0;
  }

  let covered = 0;
  for (const c of COUNTRIES) {
    const pop = m.population?.[c.iso3]?.value;
    if (typeof pop !== "number") continue;
    const s = splitForCountry(m, c.iso3);
    if (s.coverage > 0) covered++;
    for (const k of keys) {
      const val = s[k];
      if (typeof val === "number") {
        num[k]! += val * pop;
        den[k]! += pop;
      }
    }
  }

  const out = (k: (typeof keys)[number]) => (den[k]! > 0 ? num[k]! / den[k]! : null);

  const buckets = [out("wageEmployed"), out("selfEmployed"), out("unemployed"), out("notInLabourForce")];
  return {
    wageEmployed: out("wageEmployed"),
    selfEmployed: out("selfEmployed"),
    unemployed: out("unemployed"),
    notInLabourForce: out("notInLabourForce"),
    youthNeet: out("youthNeet"),
    coverage: buckets.filter((b) => b !== null).length / 4,
  };
}

export { splitForCountry };
