import { describe, it, expect } from "vitest";
import { resolveSiteUrl } from "@/lib/site-url";

// Regression guard for a real production-build failure: Vercel supplied
// NEXT_PUBLIC_SITE_URL as an EMPTY STRING (imported from a blank .env template).
// `??` passed "" through to new URL(""), which throws and failed the build.
describe("resolveSiteUrl", () => {
  it("falls back when the value is an empty string — the bug that broke the build", () => {
    expect(resolveSiteUrl("").href).toBe("http://localhost:3000/");
    expect(resolveSiteUrl("   ").href).toBe("http://localhost:3000/");
  });

  it("falls back when unset", () => {
    expect(resolveSiteUrl(undefined).href).toBe("http://localhost:3000/");
    expect(resolveSiteUrl(null).href).toBe("http://localhost:3000/");
  });

  it("uses a well-formed URL as given", () => {
    expect(resolveSiteUrl("https://africa-cii.vercel.app").href).toBe("https://africa-cii.vercel.app/");
  });

  it("accepts a bare hostname by adding https rather than crashing", () => {
    expect(resolveSiteUrl("africa-cii.vercel.app").href).toBe("https://africa-cii.vercel.app/");
  });

  it("never throws on garbage — bad metadata must not break a deployment", () => {
    // The guarantee is that a bad value degrades SEO, never fails the build.
    // URL parsing is lenient, so some junk parses rather than falling back —
    // what matters is that a usable URL always comes back and nothing throws.
    for (const junk of ["ht!tp://%%%", "://", "http://", "%", "a b c"]) {
      expect(() => resolveSiteUrl(junk), junk).not.toThrow();
      expect(resolveSiteUrl(junk)).toBeInstanceOf(URL);
    }
  });
});
