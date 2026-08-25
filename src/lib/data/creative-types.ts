// Convenience re-exports + seed types for Phase 3 creative entities.
export type { Studio, Game } from "@/lib/types";

/** Source-tier discipline: never mix official, verified and community data. */
export type ProvenanceTier = "official" | "verified" | "community";

export type IpCrossover = "animation_to_game" | "game_to_animation" | "both" | null;

export interface AnimationStudioSeed {
  id: string;
  name: string;
  countryIso3: string;
  city?: string;
  foundedYear?: number | null;
  website?: string;
  notableProductions?: string[] | null;
  /** Cross-media opportunity signal — the platform's animation↔game thesis. */
  ipCrossover?: IpCrossover;
  internationalPartners?: string[] | null;
  tier: ProvenanceTier;
  verified: boolean;
  sources: { url: string; label: string }[];
  notes?: string;
}

export interface EsportsOrgSeed {
  id: string;
  name: string;
  countryIso3: string;
  city?: string;
  foundedYear?: number | null;
  website?: string;
  games?: string[];
  status?: "active" | "inactive" | "unknown";
  tier: ProvenanceTier;
  verified: boolean;
  sources: { url: string; label: string }[];
  notes?: string;
}

export interface EsportsTournamentSeed {
  id: string;
  name: string;
  game: string;
  countryIso3?: string;
  year?: number | null;
  /** Prize pools are NEVER estimated — null until a verified source exists. */
  prizePoolUsd?: number | null;
  tier: ProvenanceTier;
  sourceUrl?: string;
}
