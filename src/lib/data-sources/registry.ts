import type { DataSource } from "@/lib/types";

// ---------------------------------------------------------------------------
// Central registry of every data source the platform trusts.
// Each displayed number must trace to one of these. Reliability scores are
// editorial judgements of source authority (official stats agency > community
// wiki) and are shown transparently in the UI, never hidden.
// ---------------------------------------------------------------------------

export const DATA_SOURCES: DataSource[] = [
  {
    id: "worldbank",
    sourceName: "World Development Indicators",
    organization: "World Bank",
    sourceType: "international_org",
    apiUrl: "https://api.worldbank.org/v2",
    websiteUrl: "https://data.worldbank.org",
    documentationUrl: "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392",
    license: "CC BY-4.0",
    updateFrequency: "annual",
    reliabilityScore: 95,
    verificationStatus: "verified",
    notes: "Keyless JSON/XML API. Primary source for macro, demographic and connectivity indicators.",
  },
  {
    id: "itu",
    sourceName: "ICT Indicators Database",
    organization: "International Telecommunication Union",
    sourceType: "international_org",
    websiteUrl: "https://www.itu.int/en/ITU-D/Statistics",
    license: "ITU terms",
    updateFrequency: "annual",
    reliabilityScore: 92,
    verificationStatus: "verified",
    notes: "Connectivity ground-truth. Some series mirrored via World Bank WDI.",
  },
  {
    id: "imf",
    sourceName: "World Economic Outlook / IFS",
    organization: "International Monetary Fund",
    sourceType: "international_org",
    apiUrl: "https://www.imf.org/external/datamapper/api/v1",
    websiteUrl: "https://www.imf.org/en/Data",
    license: "IMF terms",
    updateFrequency: "quarterly",
    reliabilityScore: 93,
    verificationStatus: "verified",
  },
  {
    id: "un_wpp",
    sourceName: "World Population Prospects",
    organization: "UN DESA Population Division",
    sourceType: "international_org",
    websiteUrl: "https://population.un.org/wpp",
    license: "CC BY-3.0 IGO",
    updateFrequency: "irregular",
    reliabilityScore: 94,
    verificationStatus: "verified",
    notes: "Authoritative for population by age (youth/working-age shares).",
  },
  {
    id: "steam",
    sourceName: "Steam Web API / Store",
    organization: "Valve",
    sourceType: "platform_api",
    apiUrl: "https://api.steampowered.com",
    websiteUrl: "https://store.steampowered.com",
    documentationUrl: "https://steamcommunity.com/dev",
    license: "Steamworks API terms",
    updateFrequency: "daily",
    reliabilityScore: 80,
    verificationStatus: "verified",
    notes: "Phase 2. Game availability & metadata. Respect rate limits & ToS.",
  },
  {
    id: "igdb",
    sourceName: "Internet Game Database",
    organization: "IGDB / Twitch",
    sourceType: "platform_api",
    apiUrl: "https://api.igdb.com/v4",
    websiteUrl: "https://www.igdb.com",
    license: "IGDB API terms (free tier)",
    updateFrequency: "weekly",
    reliabilityScore: 72,
    verificationStatus: "verified",
    notes: "Phase 2. Requires Twitch OAuth client id/secret.",
  },
  {
    id: "openalex",
    sourceName: "OpenAlex",
    organization: "OurResearch",
    sourceType: "academic",
    apiUrl: "https://api.openalex.org",
    websiteUrl: "https://openalex.org",
    license: "CC0",
    updateFrequency: "monthly",
    reliabilityScore: 85,
    verificationStatus: "verified",
    notes: "Phase 3. Research & talent signal (institutions, output).",
  },
  {
    id: "liquipedia",
    sourceName: "Liquipedia (MediaWiki API)",
    organization: "Team Liquid",
    sourceType: "community",
    apiUrl: "https://liquipedia.net/api.php",
    websiteUrl: "https://liquipedia.net",
    license: "CC BY-SA 3.0 (attribution + rate limits required)",
    updateFrequency: "daily",
    reliabilityScore: 65,
    verificationStatus: "needs_verification",
    notes: "Phase 3. Community esports data — labelled COMMUNITY, not OFFICIAL.",
  },
  {
    id: "gamedevmap",
    sourceName: "GameDevMap",
    organization: "GameDevMap (community-maintained)",
    sourceType: "community",
    websiteUrl: "https://www.gamedevmap.com/",
    license:
      "Community-maintained directory. Facts (organisation, type, city, region, country, website) reproduced with attribution; no editorial text copied.",
    updateFrequency: "irregular",
    reliabilityScore: 62,
    verificationStatus: "needs_verification",
    notes:
      "Long-running global directory of game-development organisations. Harvested via the public query interface (robots.txt permits it); the /cmsdata/ CSV is Disallowed and is not accessed. Entries are COMMUNITY tier — third-party listings not verified against each organisation's own site.",
  },
  {
    id: "official_site",
    sourceName: "Official studio / game websites",
    organization: "Various",
    sourceType: "official_site",
    license: "Publisher terms",
    updateFrequency: "irregular",
    reliabilityScore: 78,
    verificationStatus: "verified",
    notes: "Primary source for studio facts (founded year, location, titles).",
  },
];

export const SOURCE_BY_ID: Record<string, DataSource> = Object.fromEntries(
  DATA_SOURCES.map((s) => [s.id, s]),
);

export function getSource(id: string): DataSource | undefined {
  return SOURCE_BY_ID[id];
}
