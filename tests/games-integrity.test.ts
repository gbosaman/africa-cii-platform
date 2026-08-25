import { describe, it, expect } from "vitest";
import { GAMES } from "@/lib/data/games";
import { STUDIOS } from "@/lib/data/studios";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";

// Guards on the games dataset. These encode the platform's core promise:
// every store id is verified, every entity is source-cited, nothing is guessed.

const KNOWN_BAD_APPIDS = new Set([
  378810, // "Steamroll" (Anticto) — was wrongly attributed to Aurion
  700990, // "Gunship Battle2 VR" (JOYCITY) — was wrongly attributed to Semblance
]);

describe("games dataset integrity", () => {
  it("never reuses a store id that was previously mis-attributed", () => {
    for (const g of GAMES) {
      if (g.steamAppId) expect(KNOWN_BAD_APPIDS.has(g.steamAppId)).toBe(false);
    }
  });

  it("has unique ids and unique Steam appids", () => {
    const ids = GAMES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    const appIds = GAMES.map((g) => g.steamAppId).filter(Boolean);
    expect(new Set(appIds).size).toBe(appIds.length);
  });

  it("cites at least one source for every game", () => {
    for (const g of GAMES) {
      expect(g.sources.length, `${g.title} has no source`).toBeGreaterThan(0);
      expect(g.sources[0]!.url).toMatch(/^https?:\/\//);
    }
  });

  it("references only known studios and ISO3 countries", () => {
    const studioIds = new Set(STUDIOS.map((s) => s.id));
    for (const g of GAMES) {
      if (g.studioId) expect(studioIds.has(g.studioId), `${g.title} → ${g.studioId}`).toBe(true);
      expect(COUNTRY_BY_ISO3[g.countryIso3], `${g.title} → ${g.countryIso3}`).toBeDefined();
    }
  });

  it("keeps store links consistent with their ids", () => {
    for (const g of GAMES) {
      if (g.steamAppId) {
        expect(g.storeLinks?.steam).toBe(`https://store.steampowered.com/app/${g.steamAppId}`);
      }
      if (g.androidPackage) {
        expect(g.storeLinks?.googleplay).toBe(
          `https://play.google.com/store/apps/details?id=${g.androidPackage}`,
        );
      }
    }
  });

  it("never records a release year of 0 (unknown must be null)", () => {
    for (const g of GAMES) {
      expect(g.releaseYear === null || (g.releaseYear ?? 0) > 1900).toBe(true);
    }
  });
});
