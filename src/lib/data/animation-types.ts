// ---------------------------------------------------------------------------
// ANIMATION COMPETITIVE MAP — schema.
//
// THE CENTRAL DESIGN DECISION: every capability and distribution field is
// `true | null`, never `false`.
//
// "We found no evidence of a Netflix deal" is NOT "this studio has no Netflix
// deal". Writing `false` would convert absence of evidence into a positive
// claim about a real company — the boolean equivalent of the ZERO ≠ UNKNOWN
// rule that governs the rest of this platform, and more damaging here because
// it would understate a named business on a competitive map. `null` renders as
// "—" (not documented), and only a documented, sourced fact yields `true`.
//
// The tier is an EDITORIAL CLASSIFICATION, not a measurement. Its criteria are
// stated below and shown in the UI so a reader can disagree with the call
// rather than mistake it for a published fact.
// ---------------------------------------------------------------------------

/** Present and documented, or not established. Never "absent". */
export type Documented = true | null;

export type ProvenanceTier = "official" | "verified" | "community";

/** Whether the studio is still trading, where we could establish it. */
export type StudioStatus = "active" | "closed" | "unknown";

/**
 * Competitive tier. Editorial, applied against the criteria below.
 *
 *  big               — documented work for a global platform or major studio,
 *                      plus a multi-title slate (feature, or multi-season series)
 *  scaleup           — at least one international platform or major-studio
 *                      credit, with an expanding slate
 *  established_indie — long-running (roughly 8+ years) with a documented body
 *                      of work, principally regional or commercial
 *  emerging_indie    — newer or smaller, with limited documented output
 */
export type CompetitiveTier = "big" | "scaleup" | "established_indie" | "emerging_indie";

export const TIER_META: Record<
  CompetitiveTier,
  { label: string; dot: string; hex: string; criteria: string }
> = {
  big: {
    label: "Big",
    dot: "🔵",
    hex: "#38bdf8",
    criteria:
      "Documented work for a global platform or major studio, plus a multi-title slate — a feature, or a multi-season series.",
  },
  scaleup: {
    label: "Scale-up",
    dot: "🟣",
    hex: "#a855f7",
    criteria:
      "At least one international platform or major-studio credit, with an expanding slate behind it.",
  },
  established_indie: {
    label: "Established indie",
    dot: "🟢",
    hex: "#22c55e",
    criteria:
      "Roughly eight years or more of operation with a documented body of work, principally regional or commercial.",
  },
  emerging_indie: {
    label: "Emerging indie",
    dot: "🟡",
    hex: "#f59e0b",
    criteria: "Newer or smaller, with limited documented output at the time of writing.",
  },
};

/** Headcount bands. Deliberately coarse — precise headcounts are not published. */
export type SizeBand = "1-10" | "11-50" | "51-200" | "200+";

export interface AnimationCapability {
  twoD: Documented;
  threeD: Documented;
  vfx: Documented;
  motionGraphics: Documented;
  games: Documented;
  characterAnimation: Documented;
  featureFilms: Documented;
  tvSeries: Documented;
  shorts: Documented;
  commercial: Documented;
}

export interface Distribution {
  netflix: Documented;
  disneyPlus: Documented;
  primeVideo: Documented;
  youtube: Documented;
  cartoonNetwork: Documented;
  nickelodeon: Documented;
  disneyJunior: Documented;
  dstv: Documented;
  sabc: Documented;
  theatrical: Documented;
  filmFestivals: Documented;
}

export const CAPABILITY_LABELS: Record<keyof AnimationCapability, string> = {
  twoD: "2D",
  threeD: "3D",
  vfx: "VFX",
  motionGraphics: "Motion graphics",
  games: "Games",
  characterAnimation: "Character animation",
  featureFilms: "Feature films",
  tvSeries: "TV series",
  shorts: "Shorts",
  commercial: "Commercial",
};

export const DISTRIBUTION_LABELS: Record<keyof Distribution, string> = {
  netflix: "Netflix",
  disneyPlus: "Disney+",
  primeVideo: "Prime Video",
  youtube: "YouTube",
  cartoonNetwork: "Cartoon Network",
  nickelodeon: "Nickelodeon",
  disneyJunior: "Disney Junior",
  dstv: "DStv",
  sabc: "SABC",
  theatrical: "Theatrical",
  filmFestivals: "Film festivals",
};

export interface AnimationStudioProfile {
  id: string;
  name: string;
  countryIso3: string;
  city: string | null;

  // Business intelligence
  founded: number | null;
  founderCeo: string | null;
  sizeBand: SizeBand | null;
  website: string | null;
  youtube: string | null;
  instagram: string | null;
  linkedin: string | null;
  /** Free text — funding is rarely disclosed, and is never estimated here. */
  funding: string | null;
  majorClients: string[];
  internationalPartnerships: string[];

  capability: AnimationCapability;
  /** Studio-owned IP, as distinct from service work. */
  originalIp: string[];
  distribution: Distribution;

  tier: CompetitiveTier;
  status: StudioStatus;
  provenance: ProvenanceTier;
  sources: { url: string; label: string }[];
  notes: string | null;
}

/** Blank capability set — the honest default before anything is established. */
export const NO_CAPABILITY: AnimationCapability = {
  twoD: null,
  threeD: null,
  vfx: null,
  motionGraphics: null,
  games: null,
  characterAnimation: null,
  featureFilms: null,
  tvSeries: null,
  shorts: null,
  commercial: null,
};

export const NO_DISTRIBUTION: Distribution = {
  netflix: null,
  disneyPlus: null,
  primeVideo: null,
  youtube: null,
  cartoonNetwork: null,
  nickelodeon: null,
  disneyJunior: null,
  dstv: null,
  sabc: null,
  theatrical: null,
  filmFestivals: null,
};

export function capabilityCount(c: AnimationCapability): number {
  return Object.values(c).filter((v) => v === true).length;
}

export function distributionCount(d: Distribution): number {
  return Object.values(d).filter((v) => v === true).length;
}
