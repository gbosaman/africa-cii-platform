import { describe, it, expect } from "vitest";
import { ANIMATION_STUDIO_PROFILES } from "@/lib/data/animation-studios";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";
import {
  CAPABILITY_LABELS,
  DISTRIBUTION_LABELS,
  TIER_META,
  type AnimationCapability,
  type Distribution,
} from "@/lib/data/animation-types";

const S = ANIMATION_STUDIO_PROFILES;

describe("dataset shape", () => {
  it("has a unique id per studio", () => {
    const ids = S.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only real African countries", () => {
    for (const s of S) {
      expect(COUNTRY_BY_ISO3[s.countryIso3], `${s.id} → ${s.countryIso3}`).toBeDefined();
    }
  });

  it("covers a broad set of countries rather than one or two markets", () => {
    const countries = new Set(S.map((s) => s.countryIso3));
    expect(countries.size).toBeGreaterThanOrEqual(16);
  });
});

// ---------------------------------------------------------------------------
// The rule that matters most on a competitive map of REAL, NAMED COMPANIES:
// we can show that a studio HAS a credit or capability. We can never show that
// it lacks one. `false` would turn "we found nothing" into a claim about a
// real business, so the type permits only `true | null`.
// ---------------------------------------------------------------------------
describe("no field ever asserts absence", () => {
  it("uses only true or null for capability flags", () => {
    for (const s of S) {
      for (const k of Object.keys(CAPABILITY_LABELS) as (keyof AnimationCapability)[]) {
        const v = s.capability[k];
        expect([true, null], `${s.id}.capability.${k} = ${String(v)}`).toContain(v);
        expect(v, `${s.id}.capability.${k} must never be false`).not.toBe(false);
      }
    }
  });

  it("uses only true or null for distribution flags", () => {
    for (const s of S) {
      for (const k of Object.keys(DISTRIBUTION_LABELS) as (keyof Distribution)[]) {
        const v = s.distribution[k];
        expect([true, null], `${s.id}.distribution.${k} = ${String(v)}`).toContain(v);
        expect(v, `${s.id}.distribution.${k} must never be false`).not.toBe(false);
      }
    }
  });

  it("never uses zero as a stand-in for an unknown founding year", () => {
    for (const s of S) {
      if (s.founded !== null) {
        expect(s.founded, `${s.id} founded`).toBeGreaterThan(1950);
        expect(s.founded, `${s.id} founded`).toBeLessThanOrEqual(new Date().getFullYear());
      }
    }
  });
});

describe("every row is sourced", () => {
  it("carries at least one source", () => {
    for (const s of S) {
      expect(s.sources.length, `${s.id} has no source`).toBeGreaterThan(0);
    }
  });

  it("uses https URLs with a label", () => {
    for (const s of S) {
      for (const src of s.sources) {
        expect(src.url, `${s.id}`).toMatch(/^https:\/\//);
        expect(src.label.length, `${s.id} source label`).toBeGreaterThan(3);
      }
    }
  });

  it("marks a studio official only when an official site is cited", () => {
    for (const s of S.filter((x) => x.provenance === "official")) {
      expect(s.website, `${s.id} claims official provenance without a website`).toBeTruthy();
    }
  });
});

describe("claims are backed by the record", () => {
  it("gives every studio with a COMMISSIONED platform credit a named partner or client", () => {
    // YouTube and festival selections are self-published or self-submitted —
    // neither implies a commissioning relationship, so neither requires a named
    // partner. Everything else (Netflix, Disney+, a broadcaster) does: a studio
    // does not appear on Netflix without someone putting it there.
    const SELF_SERVE = new Set(["youtube", "filmFestivals"]);

    for (const s of S) {
      const commissioned = Object.entries(s.distribution).filter(
        ([k, v]) => v === true && !SELF_SERVE.has(k),
      );
      if (commissioned.length === 0) continue;
      const named = s.majorClients.length + s.internationalPartnerships.length;
      expect(
        named,
        `${s.id} claims ${commissioned.map(([k]) => k).join("/")} with no named partner`,
      ).toBeGreaterThan(0);
    }
  });

  it("assigns every studio a tier that exists in the published criteria", () => {
    for (const s of S) {
      expect(TIER_META[s.tier], `${s.id} tier`).toBeDefined();
    }
  });

  it("reserves the top tier for studios with both a platform credit and original IP", () => {
    for (const s of S.filter((x) => x.tier === "big")) {
      const hasCredit = Object.values(s.distribution).some((v) => v === true);
      expect(hasCredit, `${s.id} is tier 'big' without a documented platform credit`).toBe(true);
      expect(s.originalIp.length, `${s.id} is tier 'big' without original IP`).toBeGreaterThan(0);
    }
  });

  it("flags a closed studio rather than silently presenting it as trading", () => {
    const closed = S.filter((s) => s.status === "closed");
    for (const s of closed) {
      expect(s.notes, `${s.id} is closed but says nothing about it`).toBeTruthy();
      expect(s.notes!.toUpperCase()).toContain("CLOSED");
    }
  });
});

describe("specific facts the user supplied, as recorded", () => {
  it("credits Iwájú to Kugali with Walt Disney Animation Studios, on Disney+", () => {
    const k = S.find((s) => s.id === "kugali")!;
    expect(k.originalIp).toContain("Iwájú");
    expect(k.internationalPartnerships).toContain("Walt Disney Animation Studios");
    expect(k.distribution.disneyPlus).toBe(true);
  });

  it("does NOT credit Iwájú to Anthill Studios", () => {
    const a = S.find((s) => s.id === "anthill-studios")!;
    expect(a.originalIp.join(" ")).not.toContain("Iwájú");
    // A widely-syndicated listicle makes this error; the note records the correction.
    expect(a.notes).toContain("Iwájú");
  });

  it("records Triggerfish's Netflix and Disney work", () => {
    const t = S.find((s) => s.id === "triggerfish")!;
    expect(t.distribution.netflix).toBe(true);
    expect(t.distribution.disneyPlus).toBe(true);
    expect(t.majorClients).toContain("Netflix");
    expect(t.originalIp).toContain("Kizazi Moto: Generation Fire");
  });

  it("records AnimaxFYB as a Ghanaian studio with a Prime Video credit", () => {
    const a = S.find((s) => s.id === "animaxfyb")!;
    expect(a.countryIso3).toBe("GHA");
    expect(a.distribution.primeVideo).toBe(true);
    expect(a.originalIp).toContain("Mmofra");
  });
});
