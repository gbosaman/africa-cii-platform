import "server-only";
import { cookies } from "next/headers";
import { deriveToken, safeEqual } from "@/lib/admin/token";
import { supabaseConfigured } from "@/lib/data/repository";

// ---------------------------------------------------------------------------
// Admin authentication. MVP gate: a single server-side passphrase
// (ADMIN_ACCESS_KEY). The cookie holds a SHA-256-derived token, never the raw
// key. Writes still require the Supabase service role. When ADMIN_ACCESS_KEY
// is unset, the console is fully LOCKED (no write access is ever exposed).
//
// Production upgrade path: swap this for Supabase Auth + an admin-role RLS
// policy. The schema (audit_logs, service-role writes) already supports it.
// ---------------------------------------------------------------------------

export const ADMIN_COOKIE = "cii_admin";

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_ACCESS_KEY);
}

/** Does the request carry a valid admin session cookie? */
export function isAdmin(): boolean {
  const key = process.env.ADMIN_ACCESS_KEY;
  if (!key) return false;
  const cookie = cookies().get(ADMIN_COOKIE)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, deriveToken(key));
}

/** Verify a submitted passphrase against the configured key. */
export function verifyPassphrase(input: string): boolean {
  const key = process.env.ADMIN_ACCESS_KEY;
  if (!key) return false;
  return safeEqual(deriveToken(input), deriveToken(key));
}

export function sessionToken(): string | null {
  const key = process.env.ADMIN_ACCESS_KEY;
  return key ? deriveToken(key) : null;
}

/** Guard for server actions. Returns a reason when access is denied. */
export function guardAdmin(): { ok: true } | { ok: false; reason: string } {
  if (!adminConfigured()) return { ok: false, reason: "Admin is not configured (set ADMIN_ACCESS_KEY)." };
  if (!isAdmin()) return { ok: false, reason: "Not authenticated." };
  return { ok: true };
}

/** Whether write actions can actually persist (need admin + Supabase). */
export function canPersist(): boolean {
  return isAdmin() && supabaseConfigured();
}
