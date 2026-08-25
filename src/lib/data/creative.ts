import type {
  AnimationStudioSeed,
  EsportsOrgSeed,
  EsportsTournamentSeed,
} from "@/lib/data/creative-types";

// ---------------------------------------------------------------------------
// PHASE 3 SEED — African animation studios & esports organisations.
//
// Same discipline as everywhere else: facts are sourced to official sites,
// unknowns are null, and each row carries a provenance tier. Prize pools and
// earnings are never estimated — they stay null until a verified/official
// source is wired in. This is a curated seed, not a completeness claim.
// ---------------------------------------------------------------------------

export const ANIMATION_STUDIOS: AnimationStudioSeed[] = [
  {
    id: "triggerfish",
    name: "Triggerfish Animation Studios",
    countryIso3: "ZAF",
    city: "Cape Town",
    foundedYear: 1996,
    website: "https://triggerfish.com",
    notableProductions: ["Adventures in Zambezia", "Khumba", "Kiya & the Kimoja Heroes"],
    ipCrossover: "animation_to_game",
    internationalPartners: ["Disney", "Netflix"],
    tier: "verified",
    verified: true,
    sources: [{ url: "https://triggerfish.com", label: "Official website" }],
    notes: "One of Africa's largest animation studios; international broadcaster deals.",
  },
  {
    id: "kugali",
    name: "Kugali Media",
    countryIso3: "NGA",
    city: "Lagos",
    foundedYear: 2017,
    website: "https://kugali.com",
    notableProductions: ["Iwájú (with Walt Disney Animation Studios)"],
    ipCrossover: "both",
    internationalPartners: ["Walt Disney Animation Studios"],
    tier: "verified",
    verified: true,
    sources: [{ url: "https://kugali.com", label: "Official website" }],
    notes: "Comics-to-animation-to-games; Iwájú co-produced with Disney (2024).",
  },
  {
    id: "buni-media",
    name: "Buni Media",
    countryIso3: "KEN",
    city: "Nairobi",
    foundedYear: null,
    website: "https://www.buni.media",
    notableProductions: ["The XYZ Show"],
    ipCrossover: null,
    internationalPartners: null,
    tier: "verified",
    verified: true,
    sources: [{ url: "https://www.buni.media", label: "Official website" }],
    notes: "Kenyan animation & satire studio. Founded year pending verification.",
  },
  {
    id: "anthill-studios",
    name: "Anthill Studios",
    countryIso3: "NGA",
    city: "Lagos",
    foundedYear: null,
    website: "https://anthill.studio",
    notableProductions: ["Trism"],
    ipCrossover: null,
    internationalPartners: null,
    tier: "verified",
    verified: false,
    sources: [{ url: "https://anthill.studio", label: "Official website" }],
    notes: "Nigerian animation studio. URL & founding details pending verification.",
  },
];

export const ESPORTS_ORGS: EsportsOrgSeed[] = [
  {
    id: "atk",
    name: "ATK",
    countryIso3: "ZAF",
    city: "Cape Town",
    foundedYear: null,
    website: "https://atk.gg",
    games: ["CS:GO", "Valorant"],
    status: "active",
    tier: "verified",
    verified: false,
    sources: [{ url: "https://atk.gg", label: "Official website" }],
    notes: "South African esports organisation that expanded internationally. Details pending verification.",
  },
  {
    id: "goliath-gaming",
    name: "Goliath Gaming",
    countryIso3: "ZAF",
    city: "Johannesburg",
    foundedYear: null,
    website: "https://www.goliathgaming.gg",
    games: ["Valorant", "CS:GO", "FIFA"],
    status: "active",
    tier: "verified",
    verified: false,
    sources: [{ url: "https://www.goliathgaming.gg", label: "Official website" }],
    notes: "Prominent South African esports organisation. Details pending verification.",
  },
  {
    id: "anubis-gaming",
    name: "Anubis Gaming",
    countryIso3: "EGY",
    city: "Cairo",
    foundedYear: null,
    website: "https://anubis.gg",
    games: ["CS:GO", "Valorant"],
    status: "active",
    tier: "verified",
    verified: false,
    sources: [{ url: "https://anubis.gg", label: "Official website" }],
    notes: "Egyptian esports organisation. URL & details pending verification.",
  },
];

// Tournaments: intentionally empty. Prize pools would come from Liquipedia
// (COMMUNITY tier) or official publisher APIs (OFFICIAL) — wired via the
// adapter, never hand-entered as estimates.
export const ESPORTS_TOURNAMENTS: EsportsTournamentSeed[] = [];

// --- Per-country counts (verified seed presence) ---------------------------
// These feed the scoring engine. Absence of records is treated as UNKNOWN
// (null), NOT zero — we only claim industry presence where we can source it.

export function animationCountByCountry(): Record<string, number> {
  return countBy(ANIMATION_STUDIOS.map((a) => a.countryIso3));
}

export function esportsOrgCountByCountry(): Record<string, number> {
  return countBy(ESPORTS_ORGS.map((o) => o.countryIso3));
}

function countBy(isos: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const iso of isos) out[iso] = (out[iso] ?? 0) + 1;
  return out;
}
