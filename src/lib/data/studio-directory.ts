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
import { ANIMATION_STUDIO_PROFILES } from "@/lib/data/animation-studios";

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
  /** True when the animation competitive map contributed to this record. */
  isAnimation?: boolean;
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
    /** Records that the animation map contributed to, new or merged. */
    animation: number;
    /** Animation records that resolved to a studio already in the directory. */
    animationMerged: number;
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

  // 3. Fold in the animation competitive map.
  //
  // Several studios appear in BOTH datasets — Triggerfish, Kugali and Sea
  // Monster are game-adjacent as well as animation houses — so these resolve
  // against the existing records by normalised name and by URL exactly as the
  // community entries do. A studio listed twice under slightly different names
  // would inflate the directory and double-count in every derived figure.
  const animationCommunity: DirectoryStudio[] = [];
  let animationMerged = 0;
  let animationTouched = 0;

  for (const a of ANIMATION_STUDIO_PROFILES) {
    const norm = normaliseName(a.name);
    const url = normaliseUrl(a.website);
    const existing =
      byNorm.get(`${a.countryIso3}:${norm}`) ??
      byNameOnly.get(norm) ??
      communityByNorm.get(norm) ??
      (url ? communityByUrl.get(url) : undefined);

    if (existing) {
      animationMerged++;
      animationTouched++;
      existing.isAnimation = true;
      if (!existing.categories.includes("Animation")) {
        existing.categories = [...existing.categories, "Animation"];
      }
      if (existing.name !== a.name && !existing.aliases?.includes(a.name)) {
        existing.aliases = [...(existing.aliases ?? []), a.name];
      }
      for (const src of a.sources) {
        if (!existing.sources.some((x) => x.url === src.url)) {
          existing.sources = [...existing.sources, { url: src.url, label: src.label }];
        }
      }
      continue;
    }

    animationTouched++;
    const rec: DirectoryStudio = {
      id: `anim-${a.id}`,
      name: a.name,
      countryIso3: a.countryIso3,
      city: a.city,
      foundedYear: a.founded,
      website: url,
      categories: ["Animation"],
      // The animation map records a coarse size BAND, not a headcount, and this
      // field is a number — so it stays null rather than being coerced into a
      // false precision. The band is preserved in the notes.
      teamSize: null,
      engines: null,
      notableGames: null,
      status: a.status === "closed" ? "inactive" : a.status === "active" ? "active" : "unknown",
      verified: a.provenance === "official",
      // PROVENANCE IS NOT WIDENED IN TRANSIT. This directory defines
      // "verified" as sourced to the organisation's OWN site and checked by us.
      // Only the animation map's "official" tier meets that bar. Its
      // "verified" tier is third-party (trade press, reference works), which is
      // real evidence but not the organisation speaking for itself — so it
      // lands in "community" here rather than being promoted by the move.
      tier: a.provenance === "official" ? "verified" : "community",
      gdmType: "Animation",
      isAnimation: true,
      otherOffices: null,
      sources: a.sources.map((src) => ({ url: src.url, label: src.label })),
      notes: [a.notes, a.sizeBand ? `Estimated size: ${a.sizeBand} people.` : null]
        .filter(Boolean)
        .join(" ") || undefined,
    };

    communityByNorm.set(norm, rec);
    if (url) communityByUrl.set(url, rec);
    animationCommunity.push(rec);
  }

  const studios = [...byNorm.values(), ...community, ...animationCommunity];
  return {
    studios,
    stats: {
      verified: studios.filter((s) => s.tier === "verified").length,
      community: studios.filter((s) => s.tier === "community").length,
      merged,
      total: studios.length,
      countries: new Set(studios.map((s) => s.countryIso3)).size,
      animation: animationTouched,
      animationMerged,
    },
  };
}

/**
 * Count studios per country across the merged directory (for scoring).
 *
 * EXCLUDES animation-only records. This feeds `studio_count`, which is the
 * GAME-industry maturity input; animation has its own `animation_count`.
 * Folding 48 animation houses into the game count would inflate game-industry
 * maturity with companies that make no games, which is a different claim than
 * the metric makes.
 */
export function directoryCountByCountry(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of buildStudioDirectory().studios) {
    if (s.isAnimation && s.categories.length === 1 && s.categories[0] === "Animation") continue;
    out[s.countryIso3] = (out[s.countryIso3] ?? 0) + 1;
  }
  return out;
}
