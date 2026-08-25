// ---------------------------------------------------------------------------
// Funding & grant opportunities for African games / animation / creative tech.
//
// EVERY entry below was found through research and its official URL was
// VERIFIED to resolve (HTTP 200) — no guessed links. Two URLs I initially
// assumed (`play.google.com/console/about/indiegamesfund/` and
// `supercell.com/en/developer-grants/`) returned 404 and were replaced with the
// real announcement pages.
//
// DEADLINES ARE RECORDED AS PUBLISHED, WITH THE DATE WE CHECKED.
// Open/closed status is COMPUTED from the deadline, never hand-asserted, so it
// cannot silently go stale. Programmes change their dates without notice, so
// the UI always tells the user to confirm on the official page before relying
// on it. Where a programme runs on a rolling basis with no published deadline,
// status is "rolling" rather than a guessed date.
// ---------------------------------------------------------------------------

export type OpportunityKind = "grant" | "fund" | "accelerator" | "market" | "investor_network";
export type OpportunityFocus = "games" | "animation" | "creative" | "startup";

export interface FundingOpportunity {
  id: string;
  name: string;
  organisation: string;
  kind: OpportunityKind;
  focus: OpportunityFocus[];
  /** Amount as published. null where the programme publishes no figure. */
  amountMinUsd: number | null;
  amountMaxUsd: number | null;
  equityFree: boolean | null;
  /** ISO date of the published application deadline; null when rolling/unknown. */
  deadline: string | null;
  /** true when the programme accepts applications continuously. */
  rolling: boolean;
  /** Recurs annually — matters for planning the next cycle even when closed. */
  recurring: boolean;
  eligibility: string;
  /** Official page, verified to resolve. */
  url: string;
  sourceLabel: string;
  /** Date we last verified the URL and the published dates. */
  checkedAt: string;
  /** ISO3 restriction, or null for pan-African / global. */
  countryScope: string[] | null;
  notes?: string;
}

const CHECKED = "2026-08-25";

export const FUNDING_OPPORTUNITIES: FundingOpportunity[] = [
  {
    id: "google-indie-games-fund-africa-2026",
    name: "Indie Games Fund Africa 2026",
    organisation: "Google Play",
    kind: "fund",
    focus: ["games"],
    amountMinUsd: 50_000,
    amountMaxUsd: 200_000,
    equityFree: true,
    deadline: "2026-07-31",
    rolling: false,
    recurring: true,
    eligibility:
      "Independent studios with 50 or fewer employees, registered in an eligible Sub-Saharan African country, that have already published at least one mobile, PC or console game.",
    url: "https://blog.google/products-and-platforms/platforms/google-play/indie-games-fund-africa/",
    sourceLabel: "Google (official announcement)",
    checkedAt: CHECKED,
    countryScope: null,
    notes:
      "$1M total across 10 studios; equity-free, paired with technical support and mentorship. First edition — watch for a 2027 cycle.",
  },
  {
    id: "supercell-developer-grants-2026",
    name: "Developer Grants Program (first cohort)",
    organisation: "Supercell",
    kind: "grant",
    focus: ["games"],
    amountMinUsd: 20_000,
    amountMaxUsd: 200_000,
    equityFree: true,
    deadline: "2026-08-09",
    rolling: false,
    recurring: false,
    eligibility: "Game development studios across Africa seeking to reach their next stage of growth.",
    url: "https://supercell.com/en/news/developer-grants-program/",
    sourceLabel: "Supercell (official announcement)",
    checkedAt: CHECKED,
    countryScope: null,
    notes:
      "Non-dilutive — no equity or game ownership taken. Roughly 3–5 studios expected in the first cohort; shortlist notified October, funding from December.",
  },
  {
    id: "annecy-animation-du-monde",
    name: "Animation du Monde (Mifa Pitches)",
    organisation: "Annecy Festival / MIFA",
    kind: "market",
    focus: ["animation"],
    amountMinUsd: null,
    amountMaxUsd: null,
    equityFree: null,
    deadline: null,
    rolling: false,
    recurring: true,
    eligibility:
      "Projects from territories where animation is still emerging — created to open access for regions lacking industry, funding or training.",
    url: "https://www.annecyfestival.com/en/the-mifa/mifa-business/mifa-pitches/animation-du-monde",
    sourceLabel: "Annecy Festival (official)",
    checkedAt: CHECKED,
    countryScope: null,
    notes:
      "Annual. The 2026 edition's market ran in June 2026, so that cycle has passed — the value now is preparing for the next call. Route to international co-production rather than direct cash.",
  },
  {
    id: "founders-fund-africa-creative-accelerator-2026",
    name: "Creative Economy Accelerator 2026",
    organisation: "Founders Fund Africa",
    kind: "accelerator",
    focus: ["creative", "games"],
    amountMinUsd: null,
    amountMaxUsd: 50_000,
    equityFree: null,
    deadline: null,
    rolling: true,
    recurring: true,
    eligibility:
      "Ventures operating in or directly supporting music, film, gaming, content creation or creative technology.",
    url: "https://opportunitydesk.org/2026/08/01/founders-fund-africa-creative-economy-accelerator-2026/",
    sourceLabel: "Opportunity Desk (listing — confirm on the programme site)",
    checkedAt: CHECKED,
    countryScope: null,
    notes:
      "Listed as open at time of checking. Sourced from an opportunities aggregator rather than the programme's own page, so confirm terms directly before applying.",
  },
  {
    id: "games-industry-africa",
    name: "Games Industry Africa",
    organisation: "Games Industry Africa",
    kind: "market",
    focus: ["games"],
    amountMinUsd: null,
    amountMaxUsd: null,
    equityFree: null,
    deadline: null,
    rolling: true,
    recurring: true,
    eligibility: "African games industry participants — network, events and industry programming.",
    url: "https://gamesindustryafrica.com/",
    sourceLabel: "Games Industry Africa (official)",
    checkedAt: CHECKED,
    countryScope: null,
    notes: "Ecosystem and networking route rather than a funding instrument.",
  },
  {
    id: "mest-africa",
    name: "MEST Africa Training & Investment",
    organisation: "MEST Africa (Meltwater)",
    kind: "accelerator",
    focus: ["startup", "creative"],
    amountMinUsd: null,
    amountMaxUsd: null,
    equityFree: false,
    deadline: null,
    rolling: true,
    recurring: true,
    eligibility: "Pan-African technology entrepreneurs; cohort-based training plus investment.",
    url: "https://meltwater.org",
    sourceLabel: "MEST Africa (official)",
    checkedAt: CHECKED,
    countryScope: null,
  },
  {
    id: "cchub",
    name: "Co-Creation Hub programmes",
    organisation: "CcHUB",
    kind: "accelerator",
    focus: ["startup", "creative"],
    amountMinUsd: null,
    amountMaxUsd: null,
    equityFree: null,
    deadline: null,
    rolling: true,
    recurring: true,
    eligibility: "Technology and innovation ventures, primarily Nigeria and Kenya.",
    url: "https://cchub.africa",
    sourceLabel: "CcHUB (official)",
    checkedAt: CHECKED,
    countryScope: null,
  },
  {
    id: "google-startups-accelerator-africa",
    name: "Google for Startups Accelerator: Africa",
    organisation: "Google",
    kind: "accelerator",
    focus: ["startup"],
    amountMinUsd: null,
    amountMaxUsd: null,
    equityFree: true,
    deadline: null,
    rolling: false,
    recurring: true,
    eligibility: "Seed to Series A African startups; equity-free accelerator programme.",
    url: "https://startup.google.com",
    sourceLabel: "Google for Startups (official)",
    checkedAt: CHECKED,
    countryScope: null,
    notes: "Runs in cohorts — check the site for the current call.",
  },
  {
    id: "au-startups",
    name: "AU-Startups investor dealflow",
    organisation: "AU-Startups",
    kind: "investor_network",
    focus: ["startup", "creative"],
    amountMinUsd: 25_000,
    amountMaxUsd: 1_000_000,
    equityFree: false,
    deadline: null,
    rolling: true,
    recurring: true,
    eligibility:
      "African founders raising pre-seed to Series A; editorial screen, no category gates, no pay-to-play.",
    url: "https://au-startups.com/",
    sourceLabel: "AU-Startups (official)",
    checkedAt: CHECKED,
    countryScope: null,
    notes: "Investor-matching rather than a grant: pitches are shared with investors writing cheques.",
  },
];

export type OpportunityStatus = "open" | "closed" | "rolling" | "unknown";

/**
 * Status is COMPUTED from the published deadline against today, never stored.
 * A stored "open" flag would silently rot; a computed one cannot.
 */
export function opportunityStatus(o: FundingOpportunity, now = new Date()): OpportunityStatus {
  if (o.deadline) {
    const end = new Date(`${o.deadline}T23:59:59Z`);
    return now.getTime() <= end.getTime() ? "open" : "closed";
  }
  if (o.rolling) return "rolling";
  return "unknown";
}

export function daysUntil(deadline: string, now = new Date()): number {
  const end = new Date(`${deadline}T23:59:59Z`).getTime();
  return Math.ceil((end - now.getTime()) / 86_400_000);
}

/** Opportunities relevant to a given project type, best-matched first. */
export function matchOpportunities(
  focus: OpportunityFocus,
  now = new Date(),
): (FundingOpportunity & { status: OpportunityStatus })[] {
  const rank = (s: OpportunityStatus) => (s === "open" ? 0 : s === "rolling" ? 1 : s === "unknown" ? 2 : 3);
  return FUNDING_OPPORTUNITIES.filter((o) => o.focus.includes(focus) || o.focus.includes("creative"))
    .map((o) => ({ ...o, status: opportunityStatus(o, now) }))
    .sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name));
}
