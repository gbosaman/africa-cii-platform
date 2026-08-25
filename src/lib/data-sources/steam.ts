import type { SteamData } from "@/lib/types";

// ---------------------------------------------------------------------------
// Steam adapter (Phase 2). Uses Valve's public, keyless endpoints:
//   • store appdetails  — metadata (name, release, genres, devs, price)
//   • appreviews        — aggregate review score & counts
//
// All data is attributed to Steam. On any failure we return available:false
// and null fields (rendered N/A) — never invented numbers. Cached daily so we
// never hammer the endpoints.
// ---------------------------------------------------------------------------

const STORE = "https://store.steampowered.com";
const DAY = 60 * 60 * 24;

interface AppDetailsRaw {
  [appid: string]: {
    success: boolean;
    data?: {
      name?: string;
      is_free?: boolean;
      release_date?: { date?: string };
      developers?: string[];
      publishers?: string[];
      genres?: { description: string }[];
      platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
      price_overview?: { final_formatted?: string };
      header_image?: string;
    };
  };
}

interface ReviewsRaw {
  success: number;
  query_summary?: {
    review_score?: number;
    review_score_desc?: string;
    total_positive?: number;
    total_negative?: number;
    total_reviews?: number;
  };
}

export async function fetchSteamData(appId: number): Promise<SteamData> {
  const base: SteamData = {
    appId,
    name: null,
    releaseDate: null,
    developers: null,
    publishers: null,
    genres: null,
    platforms: null,
    isFree: null,
    price: null,
    headerImage: null,
    reviewDesc: null,
    reviewScore: null,
    totalPositive: null,
    totalNegative: null,
    totalReviews: null,
    positivePct: null,
    fetchedAt: new Date().toISOString(),
    available: false,
  };

  const [details, reviews] = await Promise.allSettled([
    fetch(`${STORE}/api/appdetails?appids=${appId}&l=english`, {
      next: { revalidate: DAY },
      headers: { Accept: "application/json" },
    }).then((r) => (r.ok ? (r.json() as Promise<AppDetailsRaw>) : null)),
    fetch(`${STORE}/appreviews/${appId}?json=1&language=all&purchase_type=all&num_per_page=0`, {
      next: { revalidate: DAY },
      headers: { Accept: "application/json" },
    }).then((r) => (r.ok ? (r.json() as Promise<ReviewsRaw>) : null)),
  ]);

  if (details.status === "fulfilled" && details.value) {
    const entry = details.value[String(appId)];
    if (entry?.success && entry.data) {
      const d = entry.data;
      base.available = true;
      base.name = d.name ?? null;
      base.releaseDate = d.release_date?.date ?? null;
      base.developers = d.developers ?? null;
      base.publishers = d.publishers ?? null;
      base.genres = d.genres?.map((g) => g.description) ?? null;
      base.platforms = d.platforms
        ? Object.entries(d.platforms)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : null;
      base.isFree = d.is_free ?? null;
      base.price = d.is_free ? "Free" : d.price_overview?.final_formatted ?? null;
      base.headerImage = d.header_image ?? null;
    }
  }

  if (reviews.status === "fulfilled" && reviews.value?.query_summary) {
    const q = reviews.value.query_summary;
    base.reviewDesc = q.review_score_desc ?? null;
    base.reviewScore = q.review_score ?? null;
    base.totalPositive = q.total_positive ?? null;
    base.totalNegative = q.total_negative ?? null;
    base.totalReviews = q.total_reviews ?? null;
    if (q.total_reviews && q.total_reviews > 0 && q.total_positive != null) {
      base.positivePct = Math.round((q.total_positive / q.total_reviews) * 1000) / 10;
      base.available = true;
    }
  }

  return base;
}

export function steamStoreUrl(appId: number): string {
  return `${STORE}/app/${appId}`;
}
