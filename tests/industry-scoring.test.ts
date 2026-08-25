import { describe, it, expect } from "vitest";
import { computeScore } from "@/lib/scoring/market";
import type { MetricSnapshot } from "@/lib/scoring/market";
import type { MetricValue } from "@/lib/types";

// Phase 3: verified industry counts feed the industry_maturity dimension.
// Absence of a catalogued record must be UNKNOWN (null), never a false zero.

function mv(metricId: string, iso3: string, value: number): MetricValue {
  return {
    metricId, countryIso3: iso3, value, unit: "studios", year: 2026,
    kind: "verified", confidence: "MEDIUM", sourceId: "official_site",
  };
}

describe("industry_maturity from verified counts", () => {
  // Only ZAF and NGA have catalogued studios; others have no record (absent).
  const snapshot: MetricSnapshot = {
    studio_count: { ZAF: mv("studio_count", "ZAF", 5), NGA: mv("studio_count", "NGA", 2) },
    animation_count: { ZAF: mv("animation_count", "ZAF", 1) },
  };

  it("scores industry_maturity where records exist", () => {
    const zaf = computeScore(snapshot, "ZAF", "production");
    const dim = zaf.components.find((c) => c.dimension === "industry_maturity")!;
    expect(dim.score).not.toBeNull();
    expect(dim.score!).toBeGreaterThan(0);
  });

  it("leaves industry_maturity N/A (null) for countries with no record — not zero", () => {
    const ken = computeScore(snapshot, "KEN", "production");
    const dim = ken.components.find((c) => c.dimension === "industry_maturity")!;
    expect(dim.score).toBeNull(); // absence = unknown, never 0
  });

  it("ranks a studio-rich country above one with no record on production", () => {
    const zaf = computeScore(snapshot, "ZAF", "production");
    const zafDim = zaf.components.find((c) => c.dimension === "industry_maturity")!;
    const nga = computeScore(snapshot, "NGA", "production");
    const ngaDim = nga.components.find((c) => c.dimension === "industry_maturity")!;
    expect(zafDim.score!).toBeGreaterThan(ngaDim.score!);
  });
});
