import { describe, it, expect } from "vitest";
import { normalise, weightedMean, percentileRank } from "@/lib/scoring/normalize";
import { computeScores } from "@/lib/scoring/market";
import type { MetricSnapshot } from "@/lib/scoring/market";
import { COUNTRIES } from "@/lib/data/countries";

describe("normalise", () => {
  const pop = [10, 20, 30, 40, 50];

  it("maps min→0 and max→100 (min-max)", () => {
    expect(normalise(10, pop, "minmax")).toBe(0);
    expect(normalise(50, pop, "minmax")).toBe(100);
    expect(normalise(30, pop, "minmax")).toBe(50);
  });

  it("returns null for missing values — never 0", () => {
    expect(normalise(null, pop, "minmax")).toBeNull();
  });

  it("inverts when higherIsBetter is false", () => {
    expect(normalise(10, pop, "minmax", false)).toBe(100);
    expect(normalise(50, pop, "minmax", false)).toBe(0);
  });

  it("log-normalises skewed magnitude data without NaN", () => {
    const skewed = [1_000, 5_000, 200_000_000];
    const r = normalise(200_000_000, skewed, "logminmax");
    expect(r).not.toBeNull();
    expect(r).toBeGreaterThan(90); // largest still highest, but compressed
  });

  it("ignores nulls in the population distribution", () => {
    expect(normalise(30, [null, 30, null, 10, 50], "minmax")).toBe(50);
  });

  it("zeromax scales counts against zero, so a small real presence beats none", () => {
    const counts = [1, 12, 19, 45];
    // min-max would pin the smallest count to 0 — perverse for counts.
    expect(normalise(1, counts, "minmax")).toBe(0);
    // zeromax keeps it proportional and strictly above zero.
    const one = normalise(1, counts, "zeromax")!;
    const twelve = normalise(12, counts, "zeromax")!;
    expect(one).toBeGreaterThan(0);
    expect(twelve).toBeGreaterThan(one);
    expect(normalise(45, counts, "zeromax")).toBe(100); // max still 100
  });
});

describe("percentileRank", () => {
  it("computes mid-rank correctly", () => {
    expect(percentileRank(30, [10, 20, 30, 40, 50])).toBe(50);
  });
});

describe("weightedMean (missing-data handling)", () => {
  it("skips null components and reports coverage", () => {
    const r = weightedMean([
      { value: 80, weight: 1 },
      { value: null, weight: 1 },
    ]);
    expect(r.value).toBe(80);
    expect(r.coverage).toBe(0.5);
  });

  it("returns null value + 0 coverage when everything is missing", () => {
    const r = weightedMean([{ value: null, weight: 1 }]);
    expect(r.value).toBeNull();
    expect(r.coverage).toBe(0);
  });
});

describe("computeScores (integration)", () => {
  // Build a minimal snapshot: two metrics that feed audience/digital dimensions.
  const snapshot: MetricSnapshot = { population: {}, internet_pct: {} };
  for (const c of COUNTRIES) {
    snapshot.population![c.iso3] = mv("population", c.iso3, c.iso3 === "NGA" ? 200_000_000 : 1_000_000);
    snapshot.internet_pct![c.iso3] = mv("internet_pct", c.iso3, c.iso3 === "ZAF" ? 75 : 10);
  }

  it("returns one ranked score per country, sorted high→low", () => {
    const scores = computeScores(snapshot, "market_attractiveness");
    expect(scores).toHaveLength(COUNTRIES.length);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]!.total).toBeGreaterThanOrEqual(scores[i]!.total);
    }
  });

  it("does not let the largest country automatically win", () => {
    const scores = computeScores(snapshot, "market_attractiveness");
    const top = scores[0]!;
    // ZAF (high internet) should beat NGA (only large population) here.
    const nga = scores.find((s) => s.entityId === "NGA")!;
    const zaf = scores.find((s) => s.entityId === "ZAF")!;
    expect(zaf.total).toBeGreaterThan(nga.total);
    expect(top.total).toBeLessThanOrEqual(100);
  });

  it("attaches coverage and confidence to every score", () => {
    const scores = computeScores(snapshot, "market_attractiveness");
    for (const s of scores) {
      expect(s.coverage).toBeGreaterThanOrEqual(0);
      expect(s.coverage).toBeLessThanOrEqual(1);
      expect(["HIGH", "MEDIUM", "LOW", "UNVERIFIED"]).toContain(s.confidence);
    }
  });
});

function mv(metricId: string, iso3: string, value: number) {
  return {
    metricId, countryIso3: iso3, value, unit: "", year: 2023,
    kind: "verified" as const, confidence: "HIGH" as const, sourceId: "worldbank",
  };
}
