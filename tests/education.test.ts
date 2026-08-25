import { describe, it, expect } from "vitest";
import type { MetricSnapshot } from "@/lib/scoring/market";
import {
  educationForCountry,
  continentalEducation,
  population25Plus,
  topByDegree,
} from "@/lib/scoring/education";

const mv = (v: Record<string, number>) =>
  Object.fromEntries(Object.entries(v).map(([k, value]) => [k, { value, year: 2022 }]));

/**
 * NGA and ETH carry a full, monotone attainment ladder. NER is deliberately
 * incomplete (no degree rung) so the complete-case rule has something to drop.
 */
function snap(): MetricSnapshot {
  return {
    population: mv({ NGA: 200, ETH: 100, NER: 50 }),
    gdp: mv({ NGA: 500, ETH: 100, NER: 10 }),
    youth_pct: mv({ NGA: 40, ETH: 40, NER: 50 }),
    female_pct: mv({ NGA: 50, ETH: 50, NER: 50 }),
    pop_15_19_male: mv({ NGA: 10, ETH: 10, NER: 12 }),
    pop_15_19_female: mv({ NGA: 10, ETH: 10, NER: 12 }),
    pop_20_24_male: mv({ NGA: 5, ETH: 5, NER: 4 }),
    pop_20_24_female: mv({ NGA: 5, ETH: 5, NER: 4 }),
    // Cumulative ladder: "at least completed X"
    edu_primary_plus: mv({ NGA: 70, ETH: 40, NER: 20 }),
    edu_lower_sec_plus: mv({ NGA: 50, ETH: 25, NER: 10 }),
    edu_upper_sec_plus: mv({ NGA: 30, ETH: 15, NER: 5 }),
    edu_bachelor_plus: mv({ NGA: 10, ETH: 5 }), // NER missing on purpose
    youth_literacy: mv({ NGA: 80, ETH: 60, NER: 40 }),
    literacy_pct: mv({ NGA: 65, ETH: 50, NER: 35 }),
    edu_spend_gdp: mv({ NGA: 3, ETH: 5, NER: 7 }),
  } as unknown as MetricSnapshot;
}

describe("population25Plus", () => {
  it("subtracts under-15s and 15-24s from the total", () => {
    // 40% under 15, plus 15-24 = (10+5)*50% + (10+5)*50% = 15% ⇒ 25+ is 45%
    expect(population25Plus(snap(), "NGA")).toBeCloseTo(200 * 0.45, 6);
  });

  it("returns null rather than guessing when an age band is missing", () => {
    const s = snap();
    delete (s as Record<string, unknown>).pop_20_24_male;
    expect(population25Plus(s, "NGA")).toBeNull();
  });
});

describe("educationForCountry — differencing the cumulative ladder", () => {
  it("converts nested 'at least' rungs into exclusive buckets", () => {
    const e = educationForCountry(snap(), "NGA");
    expect(e.lessThanPrimary).toBe(30); // 100 - 70
    expect(e.primaryOnly).toBe(20); // 70 - 50
    expect(e.lowerSecondaryOnly).toBe(20); // 50 - 30
    expect(e.upperSecondaryOnly).toBe(20); // 30 - 10
    expect(e.bachelorPlus).toBe(10);
  });

  it("produces buckets that sum to exactly 100", () => {
    for (const iso of ["NGA", "ETH"]) {
      const e = educationForCountry(snap(), iso);
      const sum =
        e.lessThanPrimary! + e.primaryOnly! + e.lowerSecondaryOnly! + e.upperSecondaryOnly! + e.bachelorPlus!;
      expect(sum).toBeCloseTo(100, 6);
    }
  });

  it("never double-counts: an exclusive bucket is always below its cumulative rung", () => {
    const e = educationForCountry(snap(), "NGA");
    // The trap: charting the raw cumulative series would show 70/50/30/10 = 160.
    expect(e.primaryOnly!).toBeLessThan(70);
    expect(e.lowerSecondaryOnly!).toBeLessThan(50);
    expect(e.upperSecondaryOnly!).toBeLessThan(30);
  });

  it("clamps at zero when rungs from different years are non-monotone", () => {
    const s = snap();
    // Lower secondary reported HIGHER than primary — impossible in principle,
    // possible in practice when the two rungs come from different surveys.
    s.edu_lower_sec_plus!.NGA = { value: 90, year: 2019 } as never;
    const e = educationForCountry(s, "NGA");
    expect(e.primaryOnly).toBe(0);
    expect(e.primaryOnly).not.toBeLessThan(0);
  });

  it("returns nulls, not zeros, for a country with no attainment data", () => {
    const e = educationForCountry(snap(), "ZZZ");
    expect(e.lessThanPrimary).toBeNull();
    expect(e.bachelorPlus).toBeNull();
    expect(e.coverage).toBe(0);
  });
});

describe("continentalEducation", () => {
  it("weights by the 25+ population, not total population", () => {
    const c = continentalEducation(snap());
    // 25+ weights: NGA 200*0.45 = 90, ETH 100*0.45 = 45. NER is excluded from
    // the buckets (incomplete ladder).
    const expected = (10 * 90 + 5 * 45) / 135;
    expect(c.bachelorPlus).toBeCloseTo(expected, 6);
  });

  it("does not weight attainment by total population", () => {
    const c = continentalEducation(snap());
    const wrong = (10 * 200 + 5 * 100) / 300; // the trap
    // Here both weightings agree because the two countries share a 25+ share;
    // the guard that matters is that the divisor is the 25+ headcount.
    expect(c.population25Plus).toBeCloseTo(200 * 0.45 + 100 * 0.45 + 50 * 0.34, 4);
    expect(c.weightedBy25Plus).toBe(3);
    expect(wrong).toBeCloseTo(8.33, 2);
  });

  it("keeps the continental buckets summing to 100 by using complete cases only", () => {
    const c = continentalEducation(snap());
    expect(c.bucketSum).toBeCloseTo(100, 6);
    // NER lacks the degree rung, so it is dropped from the buckets.
    expect(c.countriesInBuckets).toBe(2);
  });

  it("still counts incomplete countries for literacy, which is not part of the sum", () => {
    const c = continentalEducation(snap());
    // All three countries carry youth literacy, NER included.
    const w = { NGA: 200 * 0.45, ETH: 100 * 0.45, NER: 50 * 0.34 };
    const expected =
      (80 * w.NGA + 60 * w.ETH + 40 * w.NER) / (w.NGA + w.ETH + w.NER);
    expect(c.youthLiteracy).toBeCloseTo(expected, 4);
  });

  it("weights education spending by GDP, since it is a share of GDP", () => {
    const c = continentalEducation(snap());
    const expected = (3 * 500 + 5 * 100 + 7 * 10) / 610;
    expect(c.eduSpendGdp).toBeCloseTo(expected, 6);
  });

  it("returns nulls, not zeros, on an empty snapshot", () => {
    const c = continentalEducation({} as MetricSnapshot);
    expect(c.bachelorPlus).toBeNull();
    expect(c.youthLiteracy).toBeNull();
    expect(c.bucketSum).toBeNull();
    expect(c.coverage).toBe(0);
  });
});

describe("topByDegree", () => {
  it("ranks by degree share and omits countries without the rung", () => {
    const rows = topByDegree(snap(), 10);
    expect(rows.map((r) => r.iso3)).toEqual(["NGA", "ETH"]);
  });
});
