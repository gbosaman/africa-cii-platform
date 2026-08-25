import { describe, it, expect } from "vitest";
import { buildStudioDirectory, directoryCountByCountry } from "@/lib/data/studio-directory";
import { ANIMATION_STUDIO_PROFILES } from "@/lib/data/animation-studios";

const { studios, stats } = buildStudioDirectory();

describe("animation studios in the directory", () => {
  it("contributes every animation profile, merged or new", () => {
    expect(stats.animation).toBe(ANIMATION_STUDIO_PROFILES.length);
  });

  it("exposes Animation as a filterable type", () => {
    const types = new Set(
      studios.flatMap((s) => [
        ...(s.gdmType ? [s.gdmType] : []),
        ...(s.isAnimation && s.gdmType !== "Animation" ? ["Animation"] : []),
      ]),
    );
    expect(types.has("Animation")).toBe(true);
  });

  it("never lists the same organisation twice in one country", () => {
    const seen = new Map<string, string[]>();
    for (const s of studios) {
      const key = `${s.countryIso3}:${s.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      seen.set(key, [...(seen.get(key) ?? []), s.id]);
    }
    const dupes = [...seen.entries()].filter(([, ids]) => ids.length > 1);
    expect(dupes.map(([k]) => k)).toEqual([]);
  });

  it("merges a studio present in both datasets rather than duplicating it", () => {
    // Sea Monster is in the community game directory and the animation map.
    const merged = studios.filter((s) => s.isAnimation && !s.id.startsWith("anim-"));
    expect(merged.length).toBe(stats.animationMerged);
    expect(stats.animationMerged).toBeGreaterThan(0);
    for (const s of merged) {
      // It keeps its original type AND gains the animation category, so it is
      // findable under either filter.
      expect(s.categories).toContain("Animation");
      expect(s.categories.length).toBeGreaterThan(1);
    }
  });
});

describe("provenance is not widened by the move", () => {
  it("marks an animation record verified only when its own site is the source", () => {
    const byId = new Map(ANIMATION_STUDIO_PROFILES.map((a) => [`anim-${a.id}`, a]));
    for (const s of studios) {
      const profile = byId.get(s.id);
      if (!profile) continue;
      if (s.tier === "verified") {
        expect(profile.provenance, `${s.id} promoted without an official source`).toBe("official");
        expect(profile.website).toBeTruthy();
      }
    }
  });

  it("does not promote third-party-verified rows into the verified tier", () => {
    const byId = new Map(ANIMATION_STUDIO_PROFILES.map((a) => [`anim-${a.id}`, a]));
    const thirdParty = studios.filter((s) => byId.get(s.id)?.provenance === "verified");
    expect(thirdParty.length).toBeGreaterThan(0);
    for (const s of thirdParty) expect(s.tier).toBe("community");
  });

  it("carries the animation map's sources onto every contributed record", () => {
    for (const s of studios.filter((x) => x.id.startsWith("anim-"))) {
      expect(s.sources.length, s.id).toBeGreaterThan(0);
      for (const src of s.sources) expect(src.url).toMatch(/^https:\/\//);
    }
  });
});

describe("the game-studio count stays a game count", () => {
  it("excludes animation-only records from studio_count", () => {
    const counts = directoryCountByCountry();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const animationOnly = studios.filter(
      (s) => s.isAnimation && s.categories.length === 1 && s.categories[0] === "Animation",
    ).length;
    expect(animationOnly).toBeGreaterThan(0);
    expect(total).toBe(studios.length - animationOnly);
  });

  it("still counts a studio that makes both games and animation", () => {
    const both = studios.find((s) => s.isAnimation && s.categories.length > 1);
    expect(both).toBeDefined();
    expect(directoryCountByCountry()[both!.countryIso3]).toBeGreaterThan(0);
  });
});
