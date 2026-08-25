import { describe, it, expect } from "vitest";
import { rowsToSnapshot, type DbMetricRow } from "@/lib/data/repository-transform";
import { COUNTRIES } from "@/lib/data/countries";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";

function row(partial: Partial<DbMetricRow>): DbMetricRow {
  return {
    metric_id: "population",
    country_iso3: "NGA",
    value: 1,
    unit: "people",
    year: 2020,
    confidence: "HIGH",
    source_id: "worldbank",
    retrieved_at: null,
    ...partial,
  };
}

describe("rowsToSnapshot (Supabase read path)", () => {
  it("covers every metric × country, filling gaps with null (N/A, not 0)", () => {
    const snap = rowsToSnapshot([]);
    expect(Object.keys(snap)).toHaveLength(WORLD_BANK_METRICS.length);
    for (const m of WORLD_BANK_METRICS) {
      expect(Object.keys(snap[m.id]!)).toHaveLength(COUNTRIES.length);
      expect(snap[m.id]!.NGA!.value).toBeNull(); // gap → null, never 0
    }
  });

  it("keeps the most recent year when multiple observations exist", () => {
    const snap = rowsToSnapshot([
      row({ year: 2018, value: 100 }),
      row({ year: 2023, value: 200 }),
      row({ year: 2020, value: 150 }),
    ]);
    expect(snap.population!.NGA!.value).toBe(200);
    expect(snap.population!.NGA!.year).toBe(2023);
  });

  it("preserves a genuine zero from the source (0 ≠ unknown)", () => {
    const snap = rowsToSnapshot([row({ metric_id: "gdp_growth", value: 0, year: 2023 })]);
    expect(snap.gdp_growth!.NGA!.value).toBe(0);
  });

  it("maps provenance fields through from the DB row", () => {
    const snap = rowsToSnapshot([
      row({ metric_id: "internet_pct", value: 41.2, confidence: "MEDIUM", source_id: "worldbank" }),
    ]);
    const cell = snap.internet_pct!.NGA!;
    expect(cell.confidence).toBe("MEDIUM");
    expect(cell.sourceId).toBe("worldbank");
    expect(cell.datasetName).toBe("World Development Indicators");
  });
});
