import { COUNTRIES } from "@/lib/data/countries";
import type { MetricSnapshot } from "@/lib/scoring/market";

// ---------------------------------------------------------------------------
// Educational attainment.
//
// TWO TRAPS, both of which produce a chart that looks fine and means nothing.
//
// 1. THE LADDER IS CUMULATIVE. Every World Bank attainment series reads "at
//    least completed X", so the rungs are nested, not exclusive:
//
//      primary+ ⊇ lower secondary+ ⊇ upper secondary+ ⊇ bachelor+
//
//    Charting them side by side double-counts every graduate at every rung
//    below their own. They must be DIFFERENCED into exclusive buckets first.
//
// 2. THE DENOMINATOR IS THE 25+ POPULATION, not everyone. Africa's 25+ share
//    ranges from 33% (Niger) to 63% (Tunisia), so weighting a continental
//    average by TOTAL population systematically over-weights the youngest —
//    and lowest-attainment — countries. Measured on live data that shifts
//    "at least primary" by 1.4pp. We therefore derive the 25+ headcount and
//    weight by that.
//
// Rungs can come from different survey years, so the ladder is not guaranteed
// locally monotone; each difference is clamped at zero rather than allowed to
// go negative.
// ---------------------------------------------------------------------------

export interface EducationSplit {
  /** Did not complete primary, % of 25+ population. */
  lessThanPrimary: number | null;
  /** Completed primary but not lower secondary. */
  primaryOnly: number | null;
  /** Completed lower secondary but not upper secondary. */
  lowerSecondaryOnly: number | null;
  /**
   * Completed upper secondary but holds no degree. Includes post-secondary
   * non-tertiary and short-cycle tertiary — diplomas and technical
   * certificates, which is where most vocational training lands.
   */
  upperSecondaryOnly: number | null;
  /** Bachelor degree or higher. */
  bachelorPlus: number | null;
  /** Literacy among 15-24s — the pipeline, not the stock. */
  youthLiteracy: number | null;
  /** Literacy among all 15+ — shown alongside so the trend is visible. */
  adultLiteracy: number | null;
  /** Public education spending, % of GDP. */
  eduSpendGdp: number | null;
  /** Population aged 25+, the denominator attainment is measured against. */
  population25Plus: number | null;
  /** Fraction of the five attainment buckets that could be computed, 0..1. */
  coverage: number;
}

/** The five mutually exclusive attainment buckets, which must sum to 100. */
const BUCKET_KEYS = [
  "lessThanPrimary",
  "primaryOnly",
  "lowerSecondaryOnly",
  "upperSecondaryOnly",
  "bachelorPlus",
] as const;

/** Standalone rates, not part of the attainment sum. */
const LITERACY_KEYS = ["youthLiteracy", "adultLiteracy"] as const;

/** Share of total population aged 15-24, combining the sex-specific bands. */
function share15to24(m: MetricSnapshot, iso3: string): number | null {
  const v = (id: string) => m[id]?.[iso3]?.value ?? null;
  const m19 = v("pop_15_19_male");
  const f19 = v("pop_15_19_female");
  const m24 = v("pop_20_24_male");
  const f24 = v("pop_20_24_female");
  const femalePct = v("female_pct");
  if ([m19, f19, m24, f24, femalePct].some((x) => x === null)) return null;
  const malePct = 100 - femalePct!;
  return ((m19! + m24!) * malePct + (f19! + f24!) * femalePct!) / 100;
}

/** Headcount aged 25+, derived as total minus under-15s minus 15-24s. */
export function population25Plus(m: MetricSnapshot, iso3: string): number | null {
  const pop = m.population?.[iso3]?.value ?? null;
  const under15 = m.youth_pct?.[iso3]?.value ?? null;
  const s1524 = share15to24(m, iso3);
  if (pop === null || under15 === null || s1524 === null) return null;
  const pct25 = 100 - under15 - s1524;
  if (pct25 <= 0) return null;
  return pop * (pct25 / 100);
}

export function educationForCountry(m: MetricSnapshot, iso3: string): EducationSplit {
  const v = (id: string) => m[id]?.[iso3]?.value ?? null;

  const primaryPlus = v("edu_primary_plus");
  const lowerPlus = v("edu_lower_sec_plus");
  const upperPlus = v("edu_upper_sec_plus");
  const bachelorPlus = v("edu_bachelor_plus");

  // Difference the nested ladder into exclusive buckets.
  const diff = (higher: number | null, lower: number | null) =>
    higher !== null && lower !== null ? Math.max(0, higher - lower) : null;

  const lessThanPrimary = primaryPlus !== null ? Math.max(0, 100 - primaryPlus) : null;
  const primaryOnly = diff(primaryPlus, lowerPlus);
  const lowerSecondaryOnly = diff(lowerPlus, upperPlus);
  const upperSecondaryOnly = diff(upperPlus, bachelorPlus);

  const buckets = [
    lessThanPrimary,
    primaryOnly,
    lowerSecondaryOnly,
    upperSecondaryOnly,
    bachelorPlus,
  ];

  return {
    lessThanPrimary,
    primaryOnly,
    lowerSecondaryOnly,
    upperSecondaryOnly,
    bachelorPlus,
    youthLiteracy: v("youth_literacy"),
    adultLiteracy: v("literacy_pct"),
    eduSpendGdp: v("edu_spend_gdp"),
    population25Plus: population25Plus(m, iso3),
    coverage: buckets.filter((b) => b !== null).length / buckets.length,
  };
}

/**
 * Continental split. Attainment buckets and literacy are weighted by the 25+
 * population — the population the indicators describe — falling back to total
 * population only where the age bands are missing, which `weightedBy25Plus`
 * reports so the approximation is never silent.
 */
export function continentalEducation(
  m: MetricSnapshot,
): EducationSplit & {
  weightedBy25Plus: number;
  bucketSum: number | null;
  /** Countries contributing to the attainment buckets (complete cases only). */
  countriesInBuckets: number;
} {
  const keys = [...BUCKET_KEYS, ...LITERACY_KEYS];

  const num: Record<string, number> = {};
  const den: Record<string, number> = {};
  for (const k of keys) {
    num[k] = 0;
    den[k] = 0;
  }

  let total25 = 0;
  let weightedBy25Plus = 0;
  let countriesInBuckets = 0;
  let gdpNum = 0;
  let gdpDen = 0;

  for (const c of COUNTRIES) {
    const s = educationForCountry(m, c.iso3);
    const pop = m.population?.[c.iso3]?.value ?? null;
    // Prefer the 25+ headcount; fall back to total population so a country with
    // attainment data but no age bands still counts.
    const weight = s.population25Plus ?? pop;
    if (typeof weight !== "number" || weight <= 0) continue;
    if (s.population25Plus !== null) {
      weightedBy25Plus++;
      total25 += s.population25Plus;
    }

    // COMPLETE CASES ONLY for the five attainment buckets. Averaging each
    // bucket over whichever countries happen to report it gives five averages
    // over five different denominators, which then do not sum to 100 — on live
    // data that lands at 100.5. Requiring all five present keeps the split
    // internally consistent at the cost of a handful of countries, and
    // `countriesInBuckets` says how many were used.
    if (s.coverage === 1) {
      countriesInBuckets++;
      for (const k of BUCKET_KEYS) {
        const val = s[k];
        if (typeof val === "number") {
          num[k]! += val * weight;
          den[k]! += weight;
        }
      }
    }

    // Literacy is a standalone rate, not part of the sum, so it uses every
    // country that reports it.
    for (const k of LITERACY_KEYS) {
      const val = s[k];
      if (typeof val === "number") {
        num[k]! += val * weight;
        den[k]! += weight;
      }
    }

    // Education spending is a share of GDP, so it is weighted by GDP.
    const gdp = m.gdp?.[c.iso3]?.value ?? null;
    if (s.eduSpendGdp !== null && typeof gdp === "number") {
      gdpNum += s.eduSpendGdp * gdp;
      gdpDen += gdp;
    }
  }

  const out = (k: (typeof keys)[number]) => (den[k]! > 0 ? num[k]! / den[k]! : null);

  const buckets = [
    out("lessThanPrimary"),
    out("primaryOnly"),
    out("lowerSecondaryOnly"),
    out("upperSecondaryOnly"),
    out("bachelorPlus"),
  ];
  const present = buckets.filter((b): b is number => b !== null);

  return {
    lessThanPrimary: buckets[0]!,
    primaryOnly: buckets[1]!,
    lowerSecondaryOnly: buckets[2]!,
    upperSecondaryOnly: buckets[3]!,
    bachelorPlus: buckets[4]!,
    youthLiteracy: out("youthLiteracy"),
    adultLiteracy: out("adultLiteracy"),
    eduSpendGdp: gdpDen > 0 ? gdpNum / gdpDen : null,
    population25Plus: total25 || null,
    coverage: present.length / 5,
    weightedBy25Plus,
    countriesInBuckets,
    bucketSum: present.length === 5 ? present.reduce((a, b) => a + b, 0) : null,
  };
}

/** Countries ranked by degree-holding share of the 25+ population. */
export function topByDegree(m: MetricSnapshot, limit = 5) {
  return COUNTRIES.map((c) => ({
    iso3: c.iso3,
    iso2: c.iso2,
    name: c.name,
    ...educationForCountry(m, c.iso3),
  }))
    .filter((s) => s.bachelorPlus !== null)
    .sort((a, b) => (b.bachelorPlus ?? 0) - (a.bachelorPlus ?? 0))
    .slice(0, limit);
}
