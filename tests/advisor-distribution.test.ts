import { describe, it, expect } from "vitest";
import {
  DISTRIBUTION_CHANNELS,
  DISTRIBUTION_BY_ID,
  distributionEntryCost,
  distributionAnnualCost,
  worstCutPct,
  commissionedOnly,
  mismatchedChannels,
} from "@/lib/advisor/distribution";
import { runAdvisor, type AdvisorInput } from "@/lib/advisor/engine";

const base: AdvisorInput = {
  title: "Test",
  genre: "Adventure",
  teamSize: "2-5",
  projectType: "Game",
  description: "A test project",
  dimension: "2D",
  countryIso3: "NGA",
  software: ["blender"],
  hardwareTier: "mid-3d",
  distribution: [],
  indieEligible: false,
};

const ctx = { gdpPerCapita: 2000, tariffPct: 10, countryName: "Nigeria" };

describe("catalogue integrity", () => {
  it("gives every channel a dated, sourced entry", () => {
    for (const c of DISTRIBUTION_CHANNELS) {
      expect(c.url, c.id).toMatch(/^https:\/\//);
      expect(c.checkedAt, c.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.entryBasis.length, c.id).toBeGreaterThan(10);
      expect(c.cutNote.length, c.id).toBeGreaterThan(10);
    }
  });

  it("covers every channel the brief asked for", () => {
    for (const id of [
      "youtube",
      "netflix",
      "prime_video",
      "film_festivals",
      "google_play",
      "app_store",
      "pc_steam",
      "console",
    ]) {
      expect(DISTRIBUTION_BY_ID[id], id).toBeDefined();
    }
  });

  it("leaves a fee null rather than inventing one where none is published", () => {
    // Festival submission fees are per-festival; console dev kits are under NDA.
    expect(DISTRIBUTION_BY_ID.film_festivals!.entryUsd).toBeNull();
    expect(DISTRIBUTION_BY_ID.console!.entryUsd).toBeNull();
    expect(DISTRIBUTION_BY_ID.netflix!.entryUsd).toBeNull();
  });
});

describe("cost arithmetic", () => {
  it("separates one-off entry from recurring annual cost", () => {
    // Google Play is $25 once; Apple is $99 every year. Conflating them would
    // understate Apple over a multi-year project.
    expect(distributionEntryCost(["google_play"])).toBe(25);
    expect(distributionAnnualCost(["google_play"])).toBe(0);
    expect(distributionEntryCost(["app_store"])).toBe(0);
    expect(distributionAnnualCost(["app_store"])).toBe(99);
  });

  it("sums Steam and Play correctly", () => {
    expect(distributionEntryCost(["pc_steam", "google_play"])).toBe(125);
  });

  it("treats an unpublished fee as zero cost, not as a guess", () => {
    expect(distributionEntryCost(["console", "netflix", "film_festivals"])).toBe(0);
  });

  it("reports the steepest cut across the selection", () => {
    expect(worstCutPct(["google_play"])).toBe(30);
    expect(worstCutPct(["youtube"])).toBe(45);
    expect(worstCutPct(["google_play", "youtube"])).toBe(45);
    // No published rate anywhere in the selection.
    expect(worstCutPct(["netflix", "film_festivals"])).toBeNull();
    expect(worstCutPct([])).toBeNull();
  });
});

describe("access classification", () => {
  it("marks Netflix as commissioned-only, not a channel you can pick", () => {
    expect(DISTRIBUTION_BY_ID.netflix!.access).toBe("commissioned");
    expect(commissionedOnly(["netflix", "google_play"]).map((c) => c.id)).toEqual(["netflix"]);
  });

  it("keeps Prime Video separate from Netflix — it does have a self-submission route", () => {
    expect(DISTRIBUTION_BY_ID.prime_video!.access).not.toBe("commissioned");
  });

  it("treats the stores as genuinely self-serve", () => {
    for (const id of ["google_play", "app_store", "pc_steam", "youtube"]) {
      expect(DISTRIBUTION_BY_ID[id]!.access, id).toBe("self_serve");
    }
  });

  it("flags a channel that does not suit the project type", () => {
    // Steam is a game channel; a Comic project does not belong there.
    const bad = mismatchedChannels(["pc_steam"], "Comic");
    expect(bad.map((c) => c.id)).toEqual(["pc_steam"]);
    expect(mismatchedChannels(["pc_steam"], "Game")).toEqual([]);
  });
});

describe("the advisor responds to the selection", () => {
  it("adds a platform-access budget line", () => {
    const r = runAdvisor({ ...base, distribution: ["google_play", "pc_steam"] }, ctx);
    const line = r.budget.lines.find((l) => l.label === "Platform access fees");
    expect(line).toBeDefined();
    expect(line!.amountUsd).toBeGreaterThanOrEqual(125);
  });

  it("charges the Apple fee for every year of the project, not once", () => {
    const long = { ...base, teamSize: "10+" as const, distribution: ["app_store"] };
    const r = runAdvisor(long, ctx);
    const line = r.budget.lines.find((l) => l.label === "Platform access fees")!;
    // 10+ team runs 18 months = 1.5 years ⇒ more than a single $99.
    expect(r.durationMonths).toBeGreaterThan(12);
    expect(line.amountUsd).toBeGreaterThan(99);
  });

  it("warns that a commissioned platform cannot be planned for", () => {
    const r = runAdvisor({ ...base, distribution: ["netflix"] }, ctx);
    expect(r.risks.join(" ")).toContain("Netflix is not a channel you can choose");
    expect(r.distributionPlan.commissioned.map((c) => c.name)).toContain("Netflix");
  });

  it("warns when nothing is selected at all", () => {
    const r = runAdvisor({ ...base, distribution: [] }, ctx);
    expect(r.risks.join(" ")).toContain("No distribution channel selected");
  });

  it("warns about the revenue cut when it is steep", () => {
    const r = runAdvisor({ ...base, distribution: ["youtube"] }, ctx);
    expect(r.risks.join(" ")).toContain("45%");
    expect(r.distributionPlan.worstCutPct).toBe(45);
  });

  it("tells a solo team to ship self-serve before chasing console approval", () => {
    const r = runAdvisor({ ...base, teamSize: "0-2", distribution: ["console"] }, ctx);
    expect(r.risks.join(" ")).toContain("Console platforms gate on approval");
  });

  it("puts opening the developer account into the next steps", () => {
    const r = runAdvisor({ ...base, distribution: ["google_play"] }, ctx);
    expect(r.nextSteps.join(" ")).toContain("Google Play Store");
  });

  it("does not add distribution risks that were not selected", () => {
    const r = runAdvisor({ ...base, distribution: ["google_play"] }, ctx);
    expect(r.risks.join(" ")).not.toContain("Netflix");
    expect(r.risks.join(" ")).not.toContain("Console platforms gate");
  });
});
