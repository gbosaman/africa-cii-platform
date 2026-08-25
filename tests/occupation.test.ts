import { describe, it, expect } from "vitest";
import { continentalOccupation, splitForCountry } from "@/lib/scoring/occupation";
import type { MetricSnapshot } from "@/lib/scoring/market";
import type { MetricValue } from "@/lib/types";

function mv(iso3: string, metricId: string, value: number | null): MetricValue {
  return {
    metricId, countryIso3: iso3, value, unit: "%", year: 2025,
    kind: "verified", confidence: "HIGH", sourceId: "worldbank",
  };
}

// A country where: 50% of 15+ are employed, 60% of those self-employed,
// labour-force participation 60% -> 10% of population unemployed,
// 40% outside the labour force.
const snapshot: MetricSnapshot = {
  population: { KEN: mv("KEN", "population", 55_000_000), NGA: mv("NGA", "population", 220_000_000) },
  employment_ratio: { KEN: mv("KEN", "employment_ratio", 50), NGA: mv("NGA", "employment_ratio", 50) },
  self_employed_share: { KEN: mv("KEN", "self_employed_share", 60), NGA: mv("NGA", "self_employed_share", 60) },
  labour_participation: { KEN: mv("KEN", "labour_participation", 60), NGA: mv("NGA", "labour_participation", 60) },
  youth_neet: { KEN: mv("KEN", "youth_neet", 20), NGA: mv("NGA", "youth_neet", 30) },
};

describe("occupation split — denominator normalisation", () => {
  it("re-expresses self-employment as a share of population, not of employment", () => {
    const s = splitForCountry(snapshot, "KEN");
    // 60% of employment, where employment is 50% of population => 30% of population.
    expect(s.selfEmployed).toBeCloseTo(30, 5);
    // NOT the raw 60 that the source indicator reports.
    expect(s.selfEmployed).not.toBe(60);
  });

  it("derives unemployed as participation minus employed, on the population base", () => {
    const s = splitForCountry(snapshot, "KEN");
    expect(s.unemployed).toBeCloseTo(10, 5); // 60 - 50
  });

  it("makes the four buckets sum to 100% of the 15+ population", () => {
    const s = splitForCountry(snapshot, "KEN");
    const total = s.wageEmployed! + s.selfEmployed! + s.unemployed! + s.notInLabourForce!;
    expect(total).toBeCloseTo(100, 5);
  });

  it("splits employment into wage and self without double counting", () => {
    const s = splitForCountry(snapshot, "KEN");
    expect(s.wageEmployed! + s.selfEmployed!).toBeCloseTo(50, 5); // the employment ratio
  });

  it("returns null rather than zero when inputs are missing", () => {
    const sparse: MetricSnapshot = { population: { KEN: mv("KEN", "population", 55e6) } };
    const s = splitForCountry(sparse, "KEN");
    expect(s.wageEmployed).toBeNull();
    expect(s.unemployed).toBeNull();
    expect(s.coverage).toBe(0);
  });

  it("weights the continental average by population", () => {
    // Both countries share every labour value except NEET (KEN 20, NGA 30).
    // Nigeria is 4x Kenya's population, so the mean must sit nearer 30.
    const c = continentalOccupation(snapshot);
    expect(c.youthNeet).toBeGreaterThan(25);
    expect(c.youthNeet).toBeLessThan(30);
    // The shared values survive weighting unchanged.
    expect(c.selfEmployed).toBeCloseTo(30, 5);
  });

  it("keeps the continental buckets summing to 100 too", () => {
    const c = continentalOccupation(snapshot);
    const total = c.wageEmployed! + c.selfEmployed! + c.unemployed! + c.notInLabourForce!;
    expect(total).toBeCloseTo(100, 5);
  });
});
