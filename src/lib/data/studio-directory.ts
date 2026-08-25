import { STUDIOS } from "@/lib/data/studios";
import { GAMEDEVMAP_ENTRIES, GAMEDEVMAP_SOURCE, type GameDevMapEntry } from "@/lib/data/gamedevmap";
import type { Studio, StudioCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Unified studio directory: our hand-verified records (VERIFIED tier) merged
// with the GameDevMap community directory (COMMUNITY tier).
//
// The two tiers are NEVER silently mixed. A community record that matches a
// verified one enriches it (adding an alias + an extra source) instead of
// creating a duplicate — the entity-resolution requirement.
// ---------------------------------------------------------------------------

/** Normalise a studio name for matching: case, accents, punctuation, and
 *  common suffixes (Ltd, Studios, Games…) that vary between directories. */
export function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    // drop parenthetical qualifiers, e.g. "24 Bit Games (Annapurna Interactive)"
    .replace(/\([^)]*\)/g, " ")
    .replace(/&/g, " and ")
    // Apostrophes are elided, not split on, so "Kiro'o" === "Kiroo".
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(
      /\b(ltd|limited|inc|llc|pty|plc|studio|studios|games|gaming|interactive|entertainment|technologies|technology|media|group|co)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalise a website URL for comparison and storage: adds a missing scheme
 *  (the source directory contains bare hostnames), drops a leading "www.",
 *  lowercases the host and strips a trailing slash. */
export function normaliseUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;
  const hasScheme = new RegExp("^https?://", "i").test(raw);
  const withScheme = hasScheme ? raw : "https://" + raw;
  try {
    const u = new URL(withScheme);
    const host = u.hostname.replace(new RegExp("^www[.]", "i"), "").toLowerCase();
    const path = u.pathname.replace(new RegExp("/+$"), "");
    return u.protocol + "//" + host + path;
  } catch {
    return null;
  }
}


/** Map a GameDevMap category label onto our studio categories. */
function mapCategory(gdmType: string): StudioCategory[] {
  switch (gdmType) {
    case "Developer":
      return ["Indie"];
    case "Developer and Publisher":
      return ["Indie", "Publisher"];
    case "Publisher":
      return ["Publisher"];
    case "Mobile":
      return ["Mobile"];
    case "Microstudio":
      return ["Indie"];
    case "Serious Games":
      return ["Serious Games"];
    case "Extended Reality (XR)":
      return ["VR/AR"];
    case "Incubator/Accelerator":
      return ["Service"];
    case "Investment":
      return ["Service"];
    case "Organization":
      return ["Service"];
    case "Online":
      return ["Service"];
    case "Health":
      return ["Serious Games"];
    default:
      return ["Indie"];
  }
}

export interface DirectoryStudio extends Studio {
  /** Where this record's facts come from. */
  tier: "verified" | "community";
  /** GameDevMap's own label, kept for traceability when tier === community. */
  gdmType?: string;
  otherOffices?: string[] | null;
  attribution?: { name: string; url: string; retrievedAt: string };
}

function fromGdm(e: GameDevMapEntry): DirectoryStudio {
  return {
    id: e.id,
    name: e.name,
    countryIso3: e.countryIso3,
    city: e.city,
    foundedYear: null, // GameDevMap does not publish founding years
    website: normaliseUrl(e.website),
    categories: mapCategory(e.gdmType),
    teamSize: null,
    engines: null,
    notableGames: null,
    status: "unknown",
    verified: false, // community directory entry, not independently verified
    tier: "community",
    gdmType: e.gdmType,
    otherOffices: e.otherOffices,
    sources: [
      {
        url: GAMEDEVMAP_SOURCE.url,
        label: `${GAMEDEVMAP_SOURCE.name} directory listing`,
        retrievedAt: GAMEDEVMAP_SOURCE.retrievedAt,
      },
    ],
    attribution: {
      name: GAMEDEVMAP_SOURCE.name,
      url: GAMEDEVMAP_SOURCE.url,
      retrievedAt: GAMEDEVMAP_SOURCE.retrievedAt,
    },
    notes: `Directory listing (${e.gdmType})${e.region ? ` · ${e.region}` : ""}. Not independently verified against the organisation's own site.`,
  };
}

export interface DirectoryResult {
  studios: DirectoryStudio[];
  stats: {
    verified: number;
    community: number;
    merged: number;
    total: number;
    countries: number;
  };
}

/**
 * Build the merged directory. Verified records win; matching community records
 * are folded into them as an extra source rather than duplicated.
 */
export function buildStudioDirectory(): DirectoryResult {
  const byNorm = new Map<string, DirectoryStudio>();

  // 1. Seed with our verified records.
  for (const s of STUDIOS) {
    const rec: DirectoryStudio = { ...s, tier: "verified" };
    byNorm.set(`${s.countryIso3}:${normaliseName(s.name)}`, rec);
  }
  // Secondary index on name alone, so the same company listed in another
  // country still resolves to the verified record.
  const byNameOnly = new Map<string, DirectoryStudio>();
  for (const rec of byNorm.values()) byNameOnly.set(normaliseName(rec.name), rec);

  let merged = 0;
  const community: DirectoryStudio[] = [];
  // Community-vs-community index: the source directory itself contains
  // near-duplicates (e.g. "NewGen Studio" / "NewGen Studios" sharing a domain),
  // so entries are resolved against each other too.
  const communityByNorm = new Map<string, DirectoryStudio>();
  // Same-URL index: the sweep found entries whose NAMES differ but whose
  // websites are identical (e.g. "Lantern Studios" / "Lanterns Studio" both
  // at lanterns-studios.com). Identical site === same organisation.
  const communityByUrl = new Map<string, DirectoryStudio>();

  // 2. Fold in community records.
  for (const e of GAMEDEVMAP_ENTRIES) {
    const norm = normaliseName(e.name);

    const url = normaliseUrl(e.website);
    const twin = communityByNorm.get(norm) ?? (url ? communityByUrl.get(url) : undefined);
    if (twin) {
      merged++;
      if (!twin.aliases?.includes(e.name) && twin.name !== e.name) {
        twin.aliases = [...(twin.aliases ?? []), e.name];
      }
      // Keep the alternate site as evidence rather than discarding it.
      if (e.website && e.website !== twin.website) {
        twin.notes = `${twin.notes ?? ""} Also listed with website ${e.website}.`.trim();
      }
      continue;
    }

    const existing = byNorm.get(`${e.countryIso3}:${norm}`) ?? byNameOnly.get(norm);
    if (existing) {
      merged++;
      // Enrich rather than duplicate: record the alias and the extra source.
      if (!existing.aliases?.includes(e.name) && existing.name !== e.name) {
        existing.aliases = [...(existing.aliases ?? []), e.name];
      }
      if (!existing.sources.some((s) => s.url === GAMEDEVMAP_SOURCE.url)) {
        existing.sources = [
          ...existing.sources,
          {
            url: GAMEDEVMAP_SOURCE.url,
            label: `${GAMEDEVMAP_SOURCE.name} directory listing`,
            retrievedAt: GAMEDEVMAP_SOURCE.retrievedAt,
          },
        ];
      }
      continue;
    }
    const rec = fromGdm(e);
    communityByNorm.set(norm, rec);
    if (url) communityByUrl.set(url, rec);
    community.push(rec);
  }

  const studios = [...byNorm.values(), ...community];
  return {
    studios,
    stats: {
      verified: byNorm.size,
      community: community.length,
      merged,
      total: studios.length,
      countries: new Set(studios.map((s) => s.countryIso3)).size,
    },
  };
}

/** Count studios per country across the merged directory (for scoring). */
export function directoryCountByCountry(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of buildStudioDirectory().studios) {
    out[s.countryIso3] = (out[s.countryIso3] ?? 0) + 1;
  }
  return out;
}
