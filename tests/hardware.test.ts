import { describe, it, expect } from "vitest";
import { monthsOfIncome, landedCost, buildHardwareRows, HARDWARE_UNAVAILABLE } from "@/lib/scoring/hardware";
import type { MetricSnapshot } from "@/lib/scoring/market";
import type { MetricValue } from "@/lib/types";
import { COUNTRIES } from "@/lib/data/countries";

function mv(iso3: string, metricId: string, value: number | null): MetricValue {
  return {
    metricId, countryIso3: iso3, value, unit: "%", year: 2024,
    kind: "verified", confidence: "HIGH", sourceId: "worldbank",
  };
}

describe("monthsOfIncome", () => {
  it("computes months of average income from GDP per capita", () => {
    // $1,200 machine, $6,000/yr income => $500/mo => 2.4 months
    expect(monthsOfIncome(1200, 6000)).toBe(2.4);
  });

  it("is higher where income is lower (the whole point)", () => {
    const rich = monthsOfIncome(1500, 12000)!;
    const poor = monthsOfIncome(1500, 1000)!;
    expect(poor).toBeGreaterThan(rich);
  });

  it("returns null on missing or nonsensical income — never 0", () => {
    expect(monthsOfIncome(1500, null)).toBeNull();
    expect(monthsOfIncome(1500, 0)).toBeNull();
    expect(monthsOfIncome(0, 6000)).toBeNull();
  });
});

describe("landedCost", () => {
  it("applies the tariff to the entered price", () => {
    expect(landedCost(1000, 15)).toBe(1150);
    expect(landedCost(1000, 0)).toBe(1000); // a real zero tariff is meaningful
  });

  it("returns null when the tariff is unknown rather than assuming zero", () => {
    expect(landedCost(1000, null)).toBeNull();
  });
});

describe("buildHardwareRows", () => {
  const snapshot: MetricSnapshot = {
    ict_goods_imports_pct: { ZAF: mv("ZAF", "ict_goods_imports_pct", 6.85), NGA: mv("NGA", "ict_goods_imports_pct", 2.19) },
    tariff_rate_pct: { ZAF: mv("ZAF", "tariff_rate_pct", 3.2), NGA: mv("NGA", "tariff_rate_pct", 12.0) },
    imports_pct_gdp: { ZAF: mv("ZAF", "imports_pct_gdp", 30), NGA: mv("NGA", "imports_pct_gdp", 20) },
    gdp_per_capita: { ZAF: mv("ZAF", "gdp_per_capita", 6598), NGA: mv("NGA", "gdp_per_capita", 1600) },
  };

  it("returns a row for every African country", () => {
    expect(buildHardwareRows(snapshot)).toHaveLength(COUNTRIES.length);
  });

  it("scores import access where data exists and N/A where it does not", () => {
    const rows = buildHardwareRows(snapshot);
    const zaf = rows.find((r) => r.iso3 === "ZAF")!;
    const ken = rows.find((r) => r.iso3 === "KEN")!; // absent from snapshot
    expect(zaf.importAccessScore).not.toBeNull();
    expect(ken.importAccessScore).toBeNull(); // absence = unknown, never zero
    expect(ken.coverage).toBe(0);
  });

  it("treats a lower tariff as better for hardware access", () => {
    const rows = buildHardwareRows(snapshot);
    const zaf = rows.find((r) => r.iso3 === "ZAF")!; // 3.2% tariff
    const nga = rows.find((r) => r.iso3 === "NGA")!; // 12% tariff
    expect(zaf.importAccessScore!).toBeGreaterThan(nga.importAccessScore!);
  });
});

describe("unavailable-metric disclosure", () => {
  it("documents every price/availability metric we refuse to estimate", () => {
    const names = HARDWARE_UNAVAILABLE.map((u) => u.metric.toLowerCase()).join(" ");
    for (const needed of ["gpu prices", "laptop prices", "ram", "used-pc", "warranty"]) {
      expect(names).toContain(needed);
    }
    for (const u of HARDWARE_UNAVAILABLE) expect(u.why.length).toBeGreaterThan(20);
  });
});
