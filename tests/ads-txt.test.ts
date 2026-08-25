import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// ads.txt declares who may sell advertising on this domain. Two ways it fails
// silently, both covered here:
//
//   1. The publisher ID drifts from the one in the AdSense script tag. The two
//      live in different files and use different prefixes ("pub-" here,
//      "ca-pub-" in the script), so a change to one is easy to miss.
//   2. The line format is wrong. AdSense reports "earnings at risk" and some
//      buyers stop bidding, but the site itself looks perfectly fine.
// ---------------------------------------------------------------------------

const root = resolve(__dirname, "..");
const adsTxt = readFileSync(resolve(root, "public/ads.txt"), "utf8");
const layout = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");

/** The single non-comment record line. */
const records = adsTxt
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length > 0 && !l.startsWith("#"));

describe("ads.txt", () => {
  it("contains exactly one seller record", () => {
    expect(records).toHaveLength(1);
  });

  it("uses the format Google publishes", () => {
    // domain, publisher id, relationship, certification authority id
    expect(records[0]).toMatch(/^google\.com, pub-\d{10,20}, DIRECT, f08c47fec0942fa0$/);
  });

  it("declares DIRECT, not RESELLER", () => {
    expect(records[0]).toContain(", DIRECT,");
    expect(records[0]).not.toContain("RESELLER");
  });

  it("uses the bare pub- form, never the ca-pub- form from the script tag", () => {
    expect(adsTxt).not.toMatch(/^\s*google\.com, ca-pub-/m);
    expect(records[0]).toMatch(/ pub-/);
  });

  it("matches the publisher ID used by the AdSense script tag", () => {
    const inAdsTxt = records[0]!.match(/pub-(\d+)/)?.[1];
    const inLayout = layout.match(/ca-pub-(\d+)/)?.[1];
    expect(inAdsTxt, "no publisher id in ads.txt").toBeTruthy();
    expect(inLayout, "no publisher id in layout.tsx").toBeTruthy();
    expect(inAdsTxt).toBe(inLayout);
  });
});
