// ---------------------------------------------------------------------------
// Google Play adapter — deliberately minimal, and here is exactly why.
//
// THERE IS NO FREE OFFICIAL API FOR QUERYING THE GOOGLE PLAY CATALOGUE.
//   • Google Play Developer API  → only returns apps YOU own (OAuth + service
//     account tied to your own developer account).
//   • Play Catalog API (2026)    → restricted to registered third-party app
//     stores (3PAS); returns only recently-CHANGED entries, not a catalogue.
//   • 42matters / Similarweb / SerpApi / Netrows → all PAID.
//
// Per the platform's free-tier rule, we do NOT build on a paid source and we do
// NOT scrape listing HTML for installs/ratings (that breaches Play's ToS).
//
// What this adapter therefore does — and all it does — is verify PRESENCE:
// a single cached request confirming the official store URL resolves (200) vs
// does not exist (404). play.google.com/robots.txt permits /store/apps/details.
// No metadata is parsed. Installs, ratings and review counts stay N/A rather
// than being estimated.
//
// If a free official metrics source ever becomes available, implement it here;
// nothing else in the platform needs to change.
// ---------------------------------------------------------------------------

export interface PlayPresence {
  packageId: string;
  url: string;
  /** true = listing exists, false = does not exist, null = check failed. */
  exists: boolean | null;
  checkedAt: string;
  /** Always null — no free source. Kept explicit so the UI renders N/A. */
  installs: null;
  rating: null;
  ratingCount: null;
  /** Human-readable reason the metrics are unavailable. */
  metricsUnavailableReason: string;
}

const REASON =
  "Google Play exposes no free public API for catalogue metrics; paid providers are excluded by policy and listing HTML is not scraped.";

export function playStoreUrl(packageId: string): string {
  return `https://play.google.com/store/apps/details?id=${packageId}`;
}

/**
 * Verify that a Play listing exists. Never throws; a failed check yields
 * `exists: null` (unknown) — distinct from `false` (confirmed absent).
 */
export async function verifyPlayPresence(packageId: string): Promise<PlayPresence> {
  const url = playStoreUrl(packageId);
  const base: PlayPresence = {
    packageId,
    url,
    exists: null,
    checkedAt: new Date().toISOString(),
    installs: null,
    rating: null,
    ratingCount: null,
    metricsUnavailableReason: REASON,
  };
  try {
    const res = await fetch(`${url}&hl=en`, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "AfricaCII/0.1 (link verification only)" },
      // Cached for a week — presence changes rarely and we stay light-touch.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (res.status === 200) base.exists = true;
    else if (res.status === 404) base.exists = false;
    return base;
  } catch {
    return base; // exists stays null = unknown
  }
}
