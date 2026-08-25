import { describe, it, expect } from "vitest";
import type { MetricSnapshot } from "@/lib/scoring/market";
import {
  settlementForCountry,
  continentalSettlement,
  widestElectricityGaps,
} from "@/lib/scoring/settlement";

// Two synthetic countries chosen to expose the weighting trap:
// NGA is large and heavily urban with good urban power and poor rural power.
// ETH is large and heavily rural. If rural electrification were weighted by
// TOTAL population instead of RURAL population, NGA's mostly-urban mass would
// pull the continental rural figure upward toward a number no rural person sees.
function snap(): MetricSnapshot {
  const m = (v: Record<string, number>) =>
    Object.fromEntries(Object.entries(v).map(([k, value]) => [k, { value, year: 2023 }]));
  return {
    population: m({ NGA: 200, ETH: 100 }),
    urban_population: m({ NGA: 160, ETH: 20 }),
    urban_pct: m({ NGA: 80, ETH: 20 }),
    rural_pct: m({ NGA: 20, ETH: 80 }),
    urban_growth: m({ NGA: 4, ETH: 2 }),
    electricity_urban: m({ NGA: 90, ETH: 50 }),
    electricity_rural: m({ NGA: 30, ETH: 10 }),
  } as unknown as MetricSnapshot;
}

describe("settlementForCountry", () => {
  it("derives rural population as the residual of total minus urban", () => {
    const s = settlementForCountry(snap(), "NGA");
    expect(s.urbanPopulation).toBe(160);
    expect(s.ruralPopulation).toBe(40);
  });

  it("reports the electrification gap in percentage points", () => {
    expect(settlementForCountry(snap(), "NGA").electricityGap).toBe(60);
    expect(settlementForCountry(snap(), "ETH").electricityGap).toBe(40);
  });

  it("returns nulls rather than zeros for a country with no data", () => {
    const s = settlementForCountry(snap(), "ZZZ");
    expect(s.urbanPct).toBeNull();
    expect(s.electricityGap).toBeNull();
    expect(s.coverage).toBe(0);
  });
});

describe("continentalSettlement", () => {
  it("weights each electrification rate by the population it describes", () => {
    const c = continentalSettlement(snap());
    // urban: (90*160 + 50*20) / 180 = 15400/180
    expect(c.electricityUrban).toBeCloseTo(15400 / 180, 6);
    // rural: (30*40 + 10*80) / 120 = 2000/120
    expect(c.electricityRural).toBeCloseTo(2000 / 120, 6);
  });

  it("does not weight rural electrification by total population", () => {
    const c = continentalSettlement(snap());
    const wrong = (30 * 200 + 10 * 100) / 300; // the trap: total-population weighting
    expect(wrong).toBeCloseTo(23.33, 1);
    expect(c.electricityRural).toBeCloseTo(16.67, 1);
    expect(c.electricityRural).not.toBeCloseTo(wrong, 1);
  });

  it("produces urban and rural shares that sum to 100", () => {
    const c = continentalSettlement(snap());
    expect((c.urbanPct ?? 0) + (c.ruralPct ?? 0)).toBeCloseTo(100, 6);
    expect(c.urbanPct).toBeCloseTo(60, 6); // 180 of 300
  });

  it("weights urban growth by urban population", () => {
    // (4*160 + 2*20) / 180 = 680/180
    expect(continentalSettlement(snap()).urbanGrowth).toBeCloseTo(680 / 180, 6);
  });

  it("returns nulls, not zeros, when no country has data", () => {
    const c = continentalSettlement({} as MetricSnapshot);
    expect(c.electricityUrban).toBeNull();
    expect(c.electricityRural).toBeNull();
    expect(c.urbanPct).toBeNull();
    expect(c.coverage).toBe(0);
  });
});

describe("widestElectricityGaps", () => {
  it("ranks by gap descending and omits countries with no gap", () => {
    const rows = widestElectricityGaps(snap(), 10);
    expect(rows.map((r) => r.iso3)).toEqual(["NGA", "ETH"]);
    expect(rows.every((r) => r.electricityGap !== null)).toBe(true);
  });

  it("respects the limit", () => {
    expect(widestElectricityGaps(snap(), 1)).toHaveLength(1);
  });
});
