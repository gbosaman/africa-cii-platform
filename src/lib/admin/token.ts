import { createHash, timingSafeEqual } from "node:crypto";

// Pure admin-token helpers (no server-only, no cookies) so they are unit
// testable. The cookie stores a derived token, never the raw access key.

export function deriveToken(key: string): string {
  return createHash("sha256").update(`cii-admin::${key}`).digest("hex");
}

/** Constant-time string compare that never throws on length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
