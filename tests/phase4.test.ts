import { describe, it, expect } from "vitest";
import { computeMomentum } from "@/lib/scoring/momentum";
import type { MetricSnapshot } from "@/lib/scoring/market";
import { buildIndustryEvents } from "@/lib/data/events";
import { FUNDING_ROUNDS } from "@/lib/data/funding";
import type { MetricValue } from "@/lib/types";

function mv(iso3: string, metricId: string, value: number | null): MetricValue {
  return {
    metricId, countryIso3: iso3, value, unit: "%", year: 2024,
    kind: "verified", confidence: "HIGH", sourceId: "worldbank",
  };
}

describe("computeMomentum", () => {
  const snapshot: MetricSnapshot = {
    gdp_growth: { NGA: mv("NGA", "gdp_growth", 8), ZAF: mv("ZAF", "gdp_growth", 1), KEN: mv("KEN", "gdp_growth", 5) },
    population_growth: { NGA: mv("NGA", "population_growth", 2.4), ZAF: mv("ZAF", "population_growth", 1), KEN: mv("KEN", "population_growth", 2) },
    gdp_per_capita: { NGA: mv("NGA", "gdp_per_capita", 2000), ZAF: mv("ZAF", "gdp_per_capita", 6500), KEN: mv("KEN", "gdp_per_capita", 2100) },
  };

  it("ranks the highest-growth country top", () => {
    const m = computeMomentum(snapshot);
    expect(m[0]!.iso3).toBe("NGA");
    expect(m[0]!.momentum).toBeGreaterThan(m[m.length - 1]!.momentum ?? 0);
  });

  it("returns null momentum for countries with no growth data (not 0)", () => {
    const m = computeMomentum(snapshot);
    const noData = m.find((x) => x.iso3 === "EGY"); // absent from snapshot
    expect(noData?.momentum).toBeNull();
  });

  it("flags a high-growth, below-median-income country as emerging", () => {
    const m = computeMomentum(snapshot);
    const nga = m.find((x) => x.iso3 === "NGA")!;
    expect(nga.emerging).toBe(true); // strong growth + low GDP/capita
    const zaf = m.find((x) => x.iso3 === "ZAF")!;
    expect(zaf.emerging).toBe(false); // above-median income
  });
});

describe("industry events", () => {
  it("derives dated, source-backed events from verified records", () => {
    const events = buildIndustryEvents();
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) {
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.entity).toBeTruthy();
    }
  });

  it("includes a funding event for every disclosed round", () => {
    const events = buildIndustryEvents();
    const funding = events.filter((e) => e.eventType === "funding");
    expect(funding.length).toBe(FUNDING_ROUNDS.length);
  });

  it("sorts most-recent first", () => {
    const events = buildIndustryEvents().filter((e) => e.date > "0001-01-01");
    for (let i = 1; i < events.length; i++) {
      expect(events[i - 1]!.date >= events[i]!.date).toBe(true);
    }
  });
});
