import { describe, it, expect } from "vitest";
import { deriveToken, safeEqual } from "@/lib/admin/token";

describe("admin token", () => {
  it("derives a stable, non-reversible token (not the raw key)", () => {
    const t = deriveToken("super-secret");
    expect(t).toHaveLength(64); // sha256 hex
    expect(t).not.toContain("super-secret");
    expect(deriveToken("super-secret")).toBe(t); // stable
  });

  it("produces different tokens for different keys", () => {
    expect(deriveToken("a")).not.toBe(deriveToken("b"));
  });

  it("safeEqual matches identical strings and rejects others without throwing", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false); // length mismatch → false, no throw
    expect(safeEqual("", "")).toBe(true);
  });

  it("a valid passphrase reproduces the stored token; a wrong one does not", () => {
    const stored = deriveToken("correct-horse");
    expect(safeEqual(deriveToken("correct-horse"), stored)).toBe(true);
    expect(safeEqual(deriveToken("wrong-horse"), stored)).toBe(false);
  });
});
