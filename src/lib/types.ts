// ---------------------------------------------------------------------------
// Shared domain types for the Africa Creative Industries Intelligence Platform.
// Kept framework-agnostic so the same types serve the DB layer, API routes,
// ingestion adapters and the React UI.
// ---------------------------------------------------------------------------

export type Iso3 = string; // ISO 3166-1 alpha-3, e.g. "NGA"

export type AfricanRegion =
  | "Northern Africa"
  | "Western Africa"
  | "Eastern Africa"
  | "Middle Africa"
  | "Southern Africa";

/** Confidence tiers. Never mix silently — the UI must show the tier. */
export type Confidence = "HIGH" | "MEDIUM" | "LOW" | "UNVERIFIED";

/** Data freshness state, driven by age relative to the source cadence. */
export type Freshness = "fresh" | "aging" | "stale" | "historical";

/** How a value came to exist. Verified > estimate; estimates must be labelled. */
export type ValueKind = "verified" | "estimate" | "modeled";

export interface Country {
  iso3: Iso3;
  iso2: string;
  name: string;
  region: AfricanRegion;
  capital: string;
  /** Free-text sub-region grouping used in some rankings. */
  incomeGroupHint?: string;
}

export interface DataSource {
  id: string;
  sourceName: string;
  organization: string;
  sourceType:
    | "international_org"
    | "government"
    | "platform_api"
    | "official_site"
    | "academic"
    | "community";
  apiUrl?: string;
  websiteUrl?: string;
  documentationUrl?: string;
  license: string;
  updateFrequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "irregular";
  reliabilityScore: number; // 0-100
  verificationStatus: "verified" | "needs_verification";
  lastSuccessfulFetch?: string; // ISO timestamp
  lastFailedFetch?: string;
  notes?: string;
}

/** A single observed data point with full lineage. ZERO is never a stand-in for UNKNOWN. */
export interface MetricValue {
  metricId: string;
  countryIso3: Iso3;
  /** null === genuinely unknown / not available. Distinct from 0. */
  value: number | null;
  unit: string;
  year: number;
  kind: ValueKind;
  confidence: Confidence;
  sourceId: string;
  sourceUrl?: string;
  datasetName?: string;
  retrievedAt?: string;
  publicationDate?: string;
  methodology?: string;
}

export interface MetricDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  unit: string;
  category:
    | "market_size"
    | "digital_access"
    | "gaming"
    | "esports"
    | "animation"
    | "talent"
    | "investment"
    | "distribution"
    | "hardware";
  /** Higher raw value is "better" for scoring? Most are true; some (risk) false. */
  higherIsBetter: boolean;
  description: string;
  /** Preferred canonical source id. */
  primarySourceId: string;
}

// --- Scoring ---------------------------------------------------------------

export type ScoreDimension =
  | "audience"
  | "purchasing_power"
  | "digital_access"
  | "talent"
  | "industry_maturity"
  | "distribution"
  | "investment"
  | "esports";

export interface ScoreComponent {
  dimension: ScoreDimension;
  label: string;
  /** Normalised 0-100 (null if no data available for this dimension). */
  score: number | null;
  weight: number; // 0-1
  /** Metric ids that fed this component, for the transparency drawer. */
  inputs: string[];
  coverage: number; // 0-1 fraction of inputs with data
}

export interface CompositeScore {
  entityId: string; // iso3 or studio id
  label: string;
  total: number; // 0-100
  components: ScoreComponent[];
  coverage: number; // 0-1 overall data coverage
  confidence: Confidence;
  mode: RankingMode;
}

export type RankingMode =
  | "market_attractiveness"
  | "distribution"
  | "production"
  | "hiring"
  | "investment"
  | "esports"
  | "animation";

// --- Studios / Games (Phase 2 schema, seeded conservatively) ---------------

export type StudioCategory =
  | "Indie"
  | "AA"
  | "AAA"
  | "Mobile"
  | "PC"
  | "Console"
  | "VR/AR"
  | "Serious Games"
  | "Educational"
  | "Outsourcing"
  | "Co-development"
  | "Animation"
  | "Esports"
  | "Publisher"
  | "Service";

export interface Studio {
  id: string;
  name: string;
  aliases?: string[];
  countryIso3: Iso3;
  city?: string | null;
  foundedYear?: number | null;
  website?: string | null;
  socials?: Record<string, string>;
  categories: StudioCategory[];
  founders?: string[] | null;
  teamSize?: number | null;
  engines?: string[] | null;
  notableGames?: string[] | null;
  status: "active" | "inactive" | "unknown";
  /** Every studio must cite where its facts come from. */
  sources: { url: string; label: string; retrievedAt?: string }[];
  verified: boolean;
  notes?: string;
}

export interface Game {
  id: string;
  title: string;
  studioId?: string;
  countryIso3: Iso3;
  releaseYear?: number | null;
  genres?: string[];
  engine?: string | null;
  platforms?: string[];
  storeLinks?: Record<string, string>;
  /** Steam appid — the live source of truth for metadata & reviews (Phase 2).
   *  MUST be verified against the live API (Steam's own `developers` field),
   *  never asserted from memory — a wrong id silently attributes another
   *  game's data to this one. See scripts/discover-steam.ts. */
  steamAppId?: number | null;
  /** Google Play package id. Presence is verified (URL resolves); Play exposes
   *  no free metrics API, so installs/ratings stay N/A. */
  androidPackage?: string | null;
  ipType?: "original" | "licensed" | "folklore" | "historical" | "contemporary";
  status: "released" | "in_development" | "unknown";
  /** Verified milestones (each should be source-backed). */
  achievements?: string[];
  sources: { url: string; label: string }[];
  verified: boolean;
}

/** Live Steam data for one game. Every field is sourced to Steam; null = N/A. */
export interface SteamData {
  appId: number;
  name: string | null;
  releaseDate: string | null;
  developers: string[] | null;
  publishers: string[] | null;
  genres: string[] | null;
  platforms: string[] | null; // windows/mac/linux
  isFree: boolean | null;
  price: string | null;
  headerImage: string | null;
  /** Reviews (Steam appreviews API). */
  reviewDesc: string | null;
  reviewScore: number | null; // 0-9 Steam scale
  totalPositive: number | null;
  totalNegative: number | null;
  totalReviews: number | null;
  positivePct: number | null;
  fetchedAt: string;
  available: boolean; // false → source temporarily unavailable / bad id
}

export interface IndustryEvent {
  id: string;
  eventType:
    | "studio_founded"
    | "game_released"
    | "funding"
    | "publisher_deal"
    | "award"
    | "tournament"
    | "acquisition"
    | "partnership";
  entity: string;
  countryIso3?: Iso3;
  date: string;
  description: string;
  sourceUrl?: string;
  importance: "low" | "medium" | "high";
  verified: boolean;
}
