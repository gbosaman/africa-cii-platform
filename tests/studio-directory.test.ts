import { describe, it, expect } from "vitest";
import { buildStudioDirectory, normaliseName } from "@/lib/data/studio-directory";
import { GAMEDEVMAP_ENTRIES, GAMEDEVMAP_SOURCE } from "@/lib/data/gamedevmap";
import { STUDIOS } from "@/lib/data/studios";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";

describe("normaliseName (entity resolution)", () => {
  it("ignores case, punctuation and corporate suffixes", () => {
    expect(normaliseName("Free Lives")).toBe(normaliseName("free lives"));
    expect(normaliseName("Leti Arts")).toBe(normaliseName("Leti Arts Ltd"));
    expect(normaliseName("Kiro'o Games")).toBe(normaliseName("Kiroo Games"));
    expect(normaliseName("Maliyo Games")).toBe(normaliseName("Maliyo"));
  });

  it("strips parenthetical qualifiers", () => {
    expect(normaliseName("24 Bit Games (Annapurna Interactive)")).toBe(normaliseName("24 Bit"));
  });

  it("keeps genuinely different studios apart", () => {
    expect(normaliseName("Free Lives")).not.toBe(normaliseName("Nyamakop"));
  });
});

describe("buildStudioDirectory", () => {
  const { studios, stats } = buildStudioDirectory();

  it("merges community duplicates into verified records instead of duplicating", () => {
    expect(stats.merged).toBeGreaterThan(0);
    const byNorm = new Map<string, number>();
    for (const s of studios) {
      const k = normaliseName(s.name);
      byNorm.set(k, (byNorm.get(k) ?? 0) + 1);
    }
    const dupes = [...byNorm.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    expect(dupes, `duplicate entities: ${dupes.join(", ")}`).toHaveLength(0);
  });

  it("keeps every verified studio in the directory", () => {
    for (const s of STUDIOS) {
      expect(studios.some((d) => d.id === s.id), `${s.name} missing`).toBe(true);
    }
  });

  it("labels every record with a provenance tier and never mixes them", () => {
    for (const s of studios) {
      expect(["verified", "community"]).toContain(s.tier);
      // Community entries must not claim verification.
      if (s.tier === "community") expect(s.verified).toBe(false);
    }
  });

  it("attributes every GameDevMap-sourced record to GameDevMap with a retrieval date", () => {
    // The community tier now has two upstreams: GameDevMap, and third-party
    // -sourced rows from the animation competitive map. This asserts the
    // GameDevMap contract; the animation rows carry their own sources and are
    // covered by tests/directory-animation.test.ts.
    const community = studios.filter((s) => s.tier === "community" && !s.isAnimation);
    expect(community.length).toBeGreaterThan(0);
    for (const s of community) {
      expect(s.attribution?.name).toBe(GAMEDEVMAP_SOURCE.name);
      expect(s.attribution?.url).toBe(GAMEDEVMAP_SOURCE.url);
      expect(s.attribution?.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.sources.some((src) => src.url === GAMEDEVMAP_SOURCE.url)).toBe(true);
    }
  });

  it("records a merged source on verified studios that also appear in the directory", () => {
    const enriched = studios.filter(
      (s) => s.tier === "verified" && s.sources.some((src) => src.url === GAMEDEVMAP_SOURCE.url),
    );
    expect(enriched.length).toBeGreaterThan(0);
  });

  it("maps every entry to a real African ISO3 country", () => {
    for (const s of studios) {
      expect(COUNTRY_BY_ISO3[s.countryIso3], `${s.name} → ${s.countryIso3}`).toBeDefined();
    }
  });

  it("never invents a founding year for GameDevMap entries", () => {
    // GameDevMap publishes no founding years, so any value would be invented.
    // Animation records are excluded because theirs are sourced facts, not
    // fabrications — Sunrise Productions' 1998 comes with a citation.
    for (const s of studios.filter((x) => x.tier === "community" && !x.isAnimation)) {
      expect(s.foundedYear).toBeNull();
    }
  });

  it("only accepts a founding year on an animation record when it is sourced", () => {
    for (const s of studios.filter((x) => x.isAnimation && x.foundedYear !== null)) {
      expect(s.sources.length, s.id).toBeGreaterThan(0);
      expect(s.foundedYear).toBeGreaterThan(1950);
    }
  });
});

describe("gamedevmap source data", () => {
  it("has a website for every entry and no blank names", () => {
    for (const e of GAMEDEVMAP_ENTRIES) {
      expect(e.name.trim().length).toBeGreaterThan(0);
      expect(e.countryIso3).toMatch(/^[A-Z]{3}$/);
    }
  });
});
