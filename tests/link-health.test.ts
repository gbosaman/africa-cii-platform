import { describe, it, expect } from "vitest";
import {
  LINK_HEALTH_ISSUES,
  LINK_HEALTH_CHECKED,
  LINK_HEALTH_SWEPT_AT,
  LINK_HEALTH_SUMMARY,
  HEALTH_LABEL,
  healthFor,
} from "@/lib/data/link-health";
import { buildStudioDirectory } from "@/lib/data/studio-directory";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";

// Guards on the GENERATED link-health data. CI regenerates this file on a
// schedule and opens a PR; these tests run before that PR is proposed, so a
// broken generator can never ship a green-looking change.

describe("link-health generated data", () => {
  it("records a sweep date and a plausible number of checked sites", () => {
    expect(LINK_HEALTH_SWEPT_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LINK_HEALTH_CHECKED).toBeGreaterThan(100);
  });

  it("only records genuinely unhealthy statuses — never 'ok' or 'redirect'", () => {
    for (const r of LINK_HEALTH_ISSUES) {
      expect(["ok", "redirect"]).not.toContain(r.status);
      expect(Object.keys(HEALTH_LABEL)).toContain(r.status);
    }
  });

  it("keeps the failure rate plausible (a huge rate means the checker broke)", () => {
    expect(LINK_HEALTH_ISSUES.length / LINK_HEALTH_CHECKED).toBeLessThan(0.4);
  });

  it("summary counts add up to the number of sites checked", () => {
    const total = Object.values(LINK_HEALTH_SUMMARY).reduce((a, b) => a + b, 0);
    expect(total).toBe(LINK_HEALTH_CHECKED);
  });

  it("every issue points at a real directory record and African country", () => {
    const ids = new Set(buildStudioDirectory().studios.map((s) => s.id));
    for (const r of LINK_HEALTH_ISSUES) {
      expect(ids.has(r.id), `${r.name} (${r.id}) not in directory`).toBe(true);
      expect(COUNTRY_BY_ISO3[r.countryIso3], `${r.name} → ${r.countryIso3}`).toBeDefined();
      expect(r.url).toMatch(/^https?:\/\//);
    }
  });

  it("has no duplicate records and healthFor() resolves them", () => {
    const ids = LINK_HEALTH_ISSUES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of LINK_HEALTH_ISSUES) expect(healthFor(r.id)?.status).toBe(r.status);
  });

  it("returns undefined for a healthy studio", () => {
    const healthyOne = buildStudioDirectory().studios.find(
      (s) => s.website && !LINK_HEALTH_ISSUES.some((r) => r.id === s.id),
    );
    expect(healthyOne).toBeDefined();
    expect(healthFor(healthyOne!.id)).toBeUndefined();
  });
});
