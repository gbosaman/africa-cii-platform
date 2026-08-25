import type { EsportsTournamentSeed } from "@/lib/data/creative-types";

// ---------------------------------------------------------------------------
// Liquipedia adapter (Phase 3). Liquipedia data is COMMUNITY tier (CC BY-SA)
// and its API terms are strict: a descriptive User-Agent is REQUIRED, requests
// are heavily rate-limited (cache aggressively, ~1 req / 30s for parse), and
// attribution must be shown. This adapter is intentionally conservative and
// OPT-IN — it returns [] unless explicitly enabled, and never fabricates
// prize pools. Everything it yields is labelled `tier: "community"`.
//
// Enable by setting ENABLE_LIQUIPEDIA=1 (and accepting the attribution/rate
// requirements). Off by default so we never breach their terms unattended.
// ---------------------------------------------------------------------------

const API = "https://liquipedia.net";
const USER_AGENT =
  "AfricaCII/0.1 (Africa Creative Industries Intelligence; contact via repository) MediaWiki-API";

export function isLiquipediaEnabled(): boolean {
  return process.env.ENABLE_LIQUIPEDIA === "1";
}

/**
 * Search a wiki (e.g. "counterstrike") for a page. Returns [] when disabled or
 * on any failure — never throws, never fabricates. Cached for a full day to
 * respect rate limits.
 */
export async function liquipediaSearch(
  wiki: string,
  query: string,
): Promise<{ title: string; url: string }[]> {
  if (!isLiquipediaEnabled()) return [];
  try {
    const url =
      `${API}/${wiki}/api.php?action=opensearch&format=json&limit=5&search=` +
      encodeURIComponent(query);
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as [string, string[], string[], string[]];
    const titles = json[1] ?? [];
    const urls = json[3] ?? [];
    return titles.map((title, i) => ({ title, url: urls[i] ?? `${API}/${wiki}` }));
  } catch {
    return [];
  }
}

/**
 * Placeholder for structured tournament extraction. Real implementation would
 * parse a tournament page's infobox via action=parse and map prize pools —
 * always labelled `tier: "community"` with the source URL. Returns [] until
 * enabled + implemented; we never emit invented prize pools.
 */
export async function liquipediaTournaments(
  _wiki: string,
  _query: string,
): Promise<EsportsTournamentSeed[]> {
  if (!isLiquipediaEnabled()) return [];
  return [];
}
