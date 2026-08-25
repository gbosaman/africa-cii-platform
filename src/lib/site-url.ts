/**
 * Resolve the public site URL used for metadata.
 *
 * Deliberately tolerant about how the value arrives. A deploy platform can
 * supply an env var as an EMPTY STRING rather than leaving it unset — for
 * example when the project is created by importing a .env template whose values
 * are blank. `??` does not catch that: it only falls back on null/undefined, so
 * "" flows straight into `new URL("")`, which throws and fails the entire
 * production build with an unhelpful "Invalid URL".
 *
 * This function treats blank as absent, accepts a bare hostname by adding the
 * scheme instead of crashing on it, and falls back rather than throwing if the
 * value is unparseable. A misconfigured metadata URL should degrade SEO, never
 * break the deployment.
 */
export function resolveSiteUrl(raw?: string | null): URL {
  const fallback = "http://localhost:3000";
  const trimmed = raw?.trim();
  if (!trimmed) return new URL(fallback);
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme);
  } catch {
    return new URL(fallback);
  }
}
