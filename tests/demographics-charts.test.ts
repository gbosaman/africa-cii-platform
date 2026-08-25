import { describe, it, expect } from "vitest";
import { GAMER_CATEGORIES, type ChartSpec } from "@/lib/data/gamer-demographics";
import type { MetricSnapshot } from "@/lib/scoring/market";
import {
  continentalAgeStructure,
  continentalSexStructure,
  ageStructureForCountry,
} from "@/lib/scoring/population-structure";

// ---------------------------------------------------------------------------
// The rule these tests exist to enforce:
//
//   A PIE CHART ASSERTS A PARTITION. Slices must be mutually exclusive and sum
//   to 100. Drawing overlapping survey percentages as a pie claims a
//   relationship the data does not have — one respondent can sit in several
//   rows at once, so the slices would overlap and the circle would be a lie.
//
// Overlapping percentages must therefore declare kind "bar".
// ---------------------------------------------------------------------------

function sumOf(chart: ChartSpec) {
  return chart.series
    .filter((s) => s.value !== null)
    .reduce((a, s) => a + (s.value ?? 0), 0);
}

describe("chart specs on static categories", () => {
  it("uses bars, never a pie, for overlapping survey percentages", () => {
    for (const id of ["income", "hours"]) {
      const cat = GAMER_CATEGORIES.find((c) => c.id === id);
      expect(cat?.chart?.kind, `${id} must not be a pie`).toBe("bar");
    }
  });

  it("proves those series really do overlap — they exceed 100%", () => {
    const income = GAMER_CATEGORIES.find((c) => c.id === "income")!.chart!;
    // 63 + 29 + 47 + 44 + 42 + 31 — a pie here would be nonsense.
    expect(sumOf(income)).toBeGreaterThan(100);
  });

  it("gives every pie a caption saying what it does and does not claim", () => {
    for (const c of GAMER_CATEGORIES) {
      if (c.chart?.kind === "pie") {
        expect(c.chart.caption, `${c.id} pie needs a caption`).toBeTruthy();
      }
    }
  });

  it("keeps any statically-declared pie summing to 100", () => {
    for (const c of GAMER_CATEGORIES) {
      if (c.chart?.kind === "pie") {
        expect(Math.abs(sumOf(c.chart) - 100), `${c.id} pie must partition`).toBeLessThanOrEqual(1.5);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Population structure, which backs the Age and Gender pies.
// ---------------------------------------------------------------------------

const mv = (v: Record<string, number>) =>
  Object.fromEntries(Object.entries(v).map(([k, value]) => [k, { value, year: 2025 }]));

function snap(): MetricSnapshot {
  return {
    population: mv({ NGA: 200, ETH: 100 }),
    youth_pct: mv({ NGA: 40, ETH: 30 }),
    pop_65_plus: mv({ NGA: 3, ETH: 5 }),
    female_pct: mv({ NGA: 49, ETH: 51 }),
    pop_15_19_male: mv({ NGA: 10, ETH: 8 }),
    pop_15_19_female: mv({ NGA: 10, ETH: 8 }),
    pop_20_24_male: mv({ NGA: 5, ETH: 4 }),
    pop_20_24_female: mv({ NGA: 5, ETH: 4 }),
  } as unknown as MetricSnapshot;
}

describe("age structure", () => {
  it("partitions the population into four bands summing to 100", () => {
    const a = ageStructureForCountry(snap(), "NGA");
    expect(a.under15! + a.age15to24! + a.age25to64! + a.age65plus!).toBeCloseTo(100, 6);
  });

  it("derives 25-64 as the residual so rounding never breaks the partition", () => {
    const a = ageStructureForCountry(snap(), "NGA");
    // 15-24 = (10+5)*51% + (10+5)*49% = 15 ⇒ 25-64 = 100 - 40 - 15 - 3 = 42
    expect(a.age15to24).toBeCloseTo(15, 6);
    expect(a.age25to64).toBeCloseTo(42, 6);
  });

  it("keeps the continental bands summing to 100", () => {
    const c = continentalAgeStructure(snap());
    expect(c.under15! + c.age15to24! + c.age25to64! + c.age65plus!).toBeCloseTo(100, 6);
  });

  it("weights by population rather than averaging countries equally", () => {
    const c = continentalAgeStructure(snap());
    expect(c.under15).toBeCloseTo((40 * 200 + 30 * 100) / 300, 6);
    expect(c.under15).not.toBeCloseTo(35, 4); // the naive country mean
  });

  it("returns nulls, not zeros, when the age bands are missing", () => {
    const s = snap();
    delete (s as Record<string, unknown>).pop_20_24_male;
    const a = ageStructureForCountry(s, "NGA");
    expect(a.age15to24).toBeNull();
    expect(a.age25to64).toBeNull();
    expect(continentalAgeStructure(s).under15).toBeNull();
  });
});

describe("sex structure", () => {
  it("splits female and male to exactly 100", () => {
    const s = continentalSexStructure(snap());
    expect(s.female! + s.male!).toBeCloseTo(100, 9);
  });

  it("weights by population", () => {
    const s = continentalSexStructure(snap());
    expect(s.female).toBeCloseTo((49 * 200 + 51 * 100) / 300, 6);
  });

  it("returns nulls, not zeros, on an empty snapshot", () => {
    const s = continentalSexStructure({} as MetricSnapshot);
    expect(s.female).toBeNull();
    expect(s.male).toBeNull();
  });
});
