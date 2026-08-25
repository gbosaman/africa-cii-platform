import { describe, it, expect } from "vitest";
import { runAdvisor, type AdvisorInput } from "@/lib/advisor/engine";
import {
  FUNDING_OPPORTUNITIES,
  opportunityStatus,
  daysUntil,
  matchOpportunities,
} from "@/lib/data/funding-opportunities";

const base: AdvisorInput = {
  title: "Test Project",
  genre: "Action",
  teamSize: "2-5",
  projectType: "Game",
  description: "A test",
  dimension: "2D",
  countryIso3: "NGA",
  software: ["unity", "blender"],
  hardwareTier: "mid-3d",
  distribution: ["google_play"],
  indieEligible: false,
};
const ctx = { gdpPerCapita: 2000, tariffPct: 10, countryName: "Nigeria" };

describe("advisor budget model", () => {
  it("produces a positive budget with every line explaining its basis", () => {
    const r = runAdvisor(base, ctx);
    expect(r.budget.totalUsd).toBeGreaterThan(0);
    for (const line of r.budget.lines) {
      // A line may legitimately be zero — a fully free software stack costs
      // nothing, and pretending otherwise would be inventing cost.
      expect(line.amountUsd).toBeGreaterThanOrEqual(0);
      expect(line.basis.length).toBeGreaterThan(10);
    }
    // Team cost must always be real.
    expect(r.budget.lines.find((l) => l.label === "Team")!.amountUsd).toBeGreaterThan(0);
  });

  it("gives an asymmetric range — creative projects overrun more than they underrun", () => {
    const r = runAdvisor(base, ctx);
    const upside = r.budget.highUsd - r.budget.totalUsd;
    const downside = r.budget.totalUsd - r.budget.lowUsd;
    expect(upside).toBeGreaterThan(downside);
  });

  it("scales cost with team size", () => {
    const small = runAdvisor({ ...base, teamSize: "0-2" }, ctx).budget.totalUsd;
    const large = runAdvisor({ ...base, teamSize: "10+" }, ctx).budget.totalUsd;
    expect(large).toBeGreaterThan(small);
  });

  it("makes 3D longer and costlier than 2D, all else equal", () => {
    const twoD = runAdvisor({ ...base, dimension: "2D" }, ctx);
    const threeD = runAdvisor({ ...base, dimension: "3D" }, ctx);
    expect(threeD.durationMonths).toBeGreaterThan(twoD.durationMonths);
    expect(threeD.budget.totalUsd).toBeGreaterThan(twoD.budget.totalUsd);
  });

  it("applies the country's real tariff to hardware and says so", () => {
    const withTariff = runAdvisor(base, ctx);
    const noTariff = runAdvisor(base, { ...ctx, tariffPct: 0 });
    const hw = (r: ReturnType<typeof runAdvisor>) =>
      r.budget.lines.find((l) => l.label === "Hardware")!.amountUsd;
    expect(hw(withTariff)).toBeGreaterThan(hw(noTariff));
    expect(withTariff.budget.lines.find((l) => l.label === "Hardware")!.basis).toContain("tariff");
  });

  it("never silently assumes a tariff when the country has no data", () => {
    const r = runAdvisor(base, { ...ctx, tariffPct: null });
    const hwBasis = r.budget.lines.find((l) => l.label === "Hardware")!.basis;
    expect(hwBasis).toContain("no tariff data");
    expect(r.assumptions.join(" ")).toContain("No tariff data");
  });

  it("always states its assumptions and routes to the right funding focus", () => {
    expect(runAdvisor(base, ctx).assumptions.length).toBeGreaterThanOrEqual(4);
    expect(runAdvisor({ ...base, projectType: "Game" }, ctx).fundingFocus).toBe("games");
    expect(runAdvisor({ ...base, projectType: "Animation" }, ctx).fundingFocus).toBe("animation");
  });

  it("produces a phased plan covering the full duration", () => {
    const r = runAdvisor(base, ctx);
    expect(r.milestones.length).toBeGreaterThanOrEqual(4);
    expect(r.milestones.at(-1)!.months).toContain(String(r.durationMonths));
  });

  it("flags solo-team and high-tariff risks specifically", () => {
    const solo = runAdvisor({ ...base, teamSize: "0-2" }, ctx).risks.join(" ");
    expect(solo.toLowerCase()).toContain("1–2 people");
    const highTariff = runAdvisor(base, { ...ctx, tariffPct: 18 }).risks.join(" ");
    expect(highTariff).toContain("18.0%");
  });
});

describe("funding opportunity status", () => {
  it("computes open/closed from the deadline rather than storing it", () => {
    const o = FUNDING_OPPORTUNITIES.find((x) => x.deadline)!;
    const before = new Date(`${o.deadline}T00:00:00Z`);
    const after = new Date(new Date(`${o.deadline}T23:59:59Z`).getTime() + 86_400_000);
    expect(opportunityStatus(o, before)).toBe("open");
    expect(opportunityStatus(o, after)).toBe("closed");
  });

  it("reports rolling programmes as rolling, not guessed dates", () => {
    const rolling = FUNDING_OPPORTUNITIES.filter((o) => o.rolling && !o.deadline);
    expect(rolling.length).toBeGreaterThan(0);
    for (const o of rolling) expect(opportunityStatus(o)).toBe("rolling");
  });

  it("gives every opportunity a verified official URL, source label and check date", () => {
    for (const o of FUNDING_OPPORTUNITIES) {
      expect(o.url).toMatch(/^https:\/\//);
      expect(o.sourceLabel.length).toBeGreaterThan(3);
      expect(o.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(o.eligibility.length).toBeGreaterThan(20);
    }
  });

  it("never records a deadline without also being able to derive status", () => {
    for (const o of FUNDING_OPPORTUNITIES) {
      const s = opportunityStatus(o);
      expect(["open", "closed", "rolling", "unknown"]).toContain(s);
      if (o.deadline) expect(Number.isFinite(daysUntil(o.deadline))).toBe(true);
    }
  });

  it("ranks open and rolling opportunities above closed ones", () => {
    const matched = matchOpportunities("games");
    const idxClosed = matched.findIndex((m) => m.status === "closed");
    const idxLive = matched.findIndex((m) => m.status === "open" || m.status === "rolling");
    if (idxClosed !== -1 && idxLive !== -1) expect(idxLive).toBeLessThan(idxClosed);
  });
});

describe("software & hardware selection", () => {
  it("costs a free-only stack at zero licence fees", () => {
    const r = runAdvisor({ ...base, software: ["blender", "krita", "unreal", "davinci-resolve"] }, ctx);
    expect(r.softwarePerSeatUsd).toBe(0);
    expect(r.budget.lines.find((l) => l.label === "Software & tools")!.amountUsd).toBe(0);
  });

  it("charges for paid tools and names them in the basis", () => {
    const r = runAdvisor({ ...base, software: ["maya", "photoshop"] }, ctx);
    expect(r.softwarePerSeatUsd).toBeGreaterThan(0);
    const basis = r.budget.lines.find((l) => l.label === "Software & tools")!.basis;
    expect(basis).toContain("Autodesk Maya");
    expect(basis).toContain("Photoshop");
  });

  it("applies indie licence tiers when eligible, and says so", () => {
    const std = runAdvisor({ ...base, software: ["maya"], indieEligible: false }, ctx);
    const indie = runAdvisor({ ...base, software: ["maya"], indieEligible: true }, ctx);
    expect(indie.softwarePerSeatUsd).toBeLessThan(std.softwarePerSeatUsd);
    expect(indie.budget.lines.find((l) => l.label === "Software & tools")!.basis).toContain("indie tiers");
  });

  it("surfaces the saving from swapping paid tools for free equivalents", () => {
    const r = runAdvisor({ ...base, software: ["maya", "photoshop"], indieEligible: false }, ctx);
    expect(r.toolSaving.savingUsd).toBeGreaterThan(0);
    expect(r.toolSaving.swaps.map((s) => s.to)).toContain("Blender");
  });

  it("reports no saving when the stack is already free", () => {
    const r = runAdvisor({ ...base, software: ["blender", "krita"] }, ctx);
    expect(r.toolSaving.savingUsd).toBe(0);
    expect(r.toolSaving.swaps).toHaveLength(0);
  });

  it("prices hardware from the selected spec tier", () => {
    const hw = (id: string) =>
      runAdvisor({ ...base, hardwareTier: id }, ctx).budget.lines.find((l) => l.label === "Hardware")!.amountUsd;
    expect(hw("entry-2d")).toBeLessThan(hw("mid-3d"));
    expect(hw("mid-3d")).toBeLessThan(hw("high-3d"));
    expect(hw("high-3d")).toBeLessThan(hw("workstation"));
  });

  it("names the chosen tier and its spec in the assumptions", () => {
    const r = runAdvisor({ ...base, hardwareTier: "workstation" }, ctx);
    expect(r.assumptions.join(" ")).toContain("Workstation");
    expect(r.assumptions.join(" ")).toContain("128 GB RAM");
  });

  it("handles an empty software selection without inventing a cost", () => {
    const r = runAdvisor({ ...base, software: [] }, ctx);
    expect(r.softwarePerSeatUsd).toBe(0);
    expect(r.budget.lines.find((l) => l.label === "Software & tools")!.basis).toContain("No tools selected");
  });
});
