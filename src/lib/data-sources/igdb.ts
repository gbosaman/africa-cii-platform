// ---------------------------------------------------------------------------
// IGDB adapter (Phase 2, optional). IGDB requires a Twitch OAuth app
// (free tier): set IGDB_CLIENT_ID + IGDB_CLIENT_SECRET. When unconfigured,
// every function is a no-op returning [] — the platform never fabricates data
// to stand in for a source it can't reach.
// ---------------------------------------------------------------------------

export interface IgdbGame {
  id: number;
  name: string;
  firstReleaseYear: number | null;
  rating: number | null; // IGDB aggregate 0-100
  ratingCount: number | null;
  genres: string[];
  platforms: string[];
  url: string;
}

export function isIgdbConfigured(): boolean {
  return Boolean(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET);
}

let cachedToken: { token: string; expires: number } | null = null;

async function getToken(): Promise<string | null> {
  if (!isIgdbConfigured()) return null;
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.token;
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}` +
      `&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: "POST" },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expires: Date.now() + (json.expires_in - 60) * 1000 };
  return cachedToken.token;
}

/**
 * Search IGDB by name. Returns [] (never throws, never fabricates) when the
 * adapter is unconfigured or the request fails.
 */
export async function searchIgdbGame(name: string): Promise<IgdbGame[]> {
  const token = await getToken();
  if (!token) return [];
  try {
    const res = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.IGDB_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: `search "${name.replace(/"/g, "")}"; fields name,first_release_date,aggregated_rating,aggregated_rating_count,genres.name,platforms.name,url; limit 5;`,
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      firstReleaseYear: r.first_release_date ? new Date(r.first_release_date * 1000).getUTCFullYear() : null,
      rating: r.aggregated_rating ? Math.round(r.aggregated_rating) : null,
      ratingCount: r.aggregated_rating_count ?? null,
      genres: (r.genres ?? []).map((g: { name: string }) => g.name),
      platforms: (r.platforms ?? []).map((p: { name: string }) => p.name),
      url: r.url,
    }));
  } catch {
    return [];
  }
}
