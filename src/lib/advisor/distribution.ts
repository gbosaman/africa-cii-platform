// ---------------------------------------------------------------------------
// Distribution channels for the advisor.
//
// THE DISTINCTION THAT MATTERS MOST: these are not all the same kind of thing.
//
//   self-serve   — you can publish yourself today, for a published fee
//   gated        — open in principle, but approval or curation stands in front
//   commissioned — you cannot choose this at all. Someone chooses you.
//
// Netflix is the clearest case. It is not a distribution method a new studio
// can plan around: Netflix does not accept unsolicited self-submissions, so
// "we'll release on Netflix" is an outcome of being commissioned or licensed,
// not a step in a plan. Presenting it beside Google Play — where $25 and a
// build genuinely gets you listed — would flatter the plan and mislead the
// person writing it. The advisor says so instead.
//
// Fees are PUBLISHED LIST FEES, researched and dated, each with its source.
// Where no fee is published (console dev kits, festival submissions) the value
// is null and the reason is stated — never a filled-in guess.
// ---------------------------------------------------------------------------

import type { ProjectType } from "@/lib/advisor/engine";

export type DistributionAccess = "self_serve" | "gated" | "commissioned";
export type DistributionKind = "video" | "mobile" | "pc" | "console" | "festival";

export interface DistributionChannel {
  id: string;
  name: string;
  kind: DistributionKind;
  access: DistributionAccess;
  /** One-off cost to get access, USD. null = none published. */
  entryUsd: number | null;
  /** Recurring annual cost, USD. null = none. */
  annualUsd: number | null;
  entryBasis: string;
  /** Platform's cut, as a percentage range. null where no rate is published. */
  cutLowPct: number | null;
  cutHighPct: number | null;
  cutNote: string;
  /** Official source for the fee and the cut. */
  url: string;
  checkedAt: string;
  /** Which project types this channel is actually a fit for. */
  fitsTypes: ProjectType[];
  note: string;
}

const CHECKED = "2026-08-25";

export const DISTRIBUTION_CHANNELS: DistributionChannel[] = [
  {
    id: "youtube",
    name: "YouTube",
    kind: "video",
    access: "self_serve",
    entryUsd: 0,
    annualUsd: null,
    entryBasis: "Free to upload. Monetisation requires acceptance into the YouTube Partner Program.",
    cutLowPct: 45,
    cutHighPct: 45,
    cutNote:
      "YouTube keeps 45% of net ad revenue on long-form watch pages; the creator keeps 55%. Shorts are pooled and split differently.",
    url: "https://blog.youtube/news-and-events/youtube-partner-program-updates-2027-new-opportunities-earn/",
    checkedAt: CHECKED,
    fitsTypes: ["Game", "Animation", "Comic", "Gamer/Creator"],
    note:
      "The only channel here with no gatekeeper at upload, which is why most African animation studios on this platform's competitive map built an audience here first. Monetisation currently needs 1,000 subscribers and 4,000 watch hours in 12 months — but from 1 February 2027 new applicants need 8,000 watch hours (or 20M Shorts views in 90 days). A studio starting now will be judged on the higher bar, so plan against 8,000.",
  },
  {
    id: "prime_video",
    name: "Prime Video (Prime Video Direct)",
    kind: "video",
    access: "gated",
    entryUsd: 0,
    annualUsd: null,
    entryBasis: "No listing fee. Submissions are reviewed, and categories open and close.",
    cutLowPct: null,
    cutHighPct: null,
    cutNote:
      "Not a percentage cut. Royalties are paid per hour streamed and vary by territory and engagement ranking, so revenue cannot be projected from a price the way a store cut can.",
    url: "https://videodirect.amazon.com/home/help?topicId=G201973750",
    checkedAt: CHECKED,
    fitsTypes: ["Animation", "Gamer/Creator"],
    note:
      "The one major streamer with a self-submission route — which is how AnimaxFYB reached it from Accra. Important limit: Amazon is no longer accepting unsolicited non-fiction or short-form submissions through Prime Video Direct; standalone and episodic scripted content is still accepted. Royalty rates have been cut before, so treat any per-hour figure as unstable.",
  },
  {
    id: "netflix",
    name: "Netflix",
    kind: "video",
    access: "commissioned",
    entryUsd: null,
    annualUsd: null,
    entryBasis: "No self-submission route exists. Netflix commissions or licenses; it does not accept unsolicited work.",
    cutLowPct: null,
    cutHighPct: null,
    cutNote:
      "No revenue share applies. Commissioned work is paid as a production budget or licence fee negotiated per deal, and those terms are not published.",
    url: "https://help.netflix.com/en/node/2064",
    checkedAt: CHECKED,
    fitsTypes: ["Animation", "Game"],
    note:
      "Cannot be planned for directly. Every African title that reached Netflix got there through a production partner — Supa Team 4 came via Triggerfish with Cake Entertainment. The realistic route is a body of work that earns a commission, or a co-production with a studio that already has the relationship. Budget nothing for it and plan nothing around it.",
  },
  {
    id: "film_festivals",
    name: "Film festivals",
    kind: "festival",
    access: "gated",
    entryUsd: null,
    annualUsd: null,
    entryBasis:
      "Submission fees are set per festival and range from free (many African and student categories) to substantial for major international festivals. No single figure exists, so none is quoted here.",
    cutLowPct: null,
    cutHighPct: null,
    cutNote: "No revenue share. Festivals are a credibility and buyer-access channel, not a revenue channel.",
    url: "https://filmfreeway.com/festivals",
    checkedAt: CHECKED,
    fitsTypes: ["Animation", "Comic"],
    note:
      "The route most African animation studios on the competitive map actually used to reach commissioners — festival selection is how work gets seen by the people who commission. Budget submission fees per festival from its own page; FESPACO and Annecy are the reference points for this sector.",
  },
  {
    id: "google_play",
    name: "Google Play Store",
    kind: "mobile",
    access: "self_serve",
    entryUsd: 25,
    annualUsd: null,
    entryBasis: "One-time Play Console registration fee of $25. No renewal.",
    cutLowPct: 15,
    cutHighPct: 30,
    cutNote:
      "15% on the first $1M of earnings each year, 30% above it. Applied automatically — no application needed.",
    url: "https://support.google.com/googleplay/android-developer/answer/6112435",
    checkedAt: CHECKED,
    fitsTypes: ["Game", "Gamer/Creator", "Comic"],
    note:
      "The cheapest paid route to a global audience, and the right default for African markets: this platform's own demographics data shows 92% of African gamers play on a mobile phone and 92% have downloaded from Google Play.",
  },
  {
    id: "app_store",
    name: "Apple App Store",
    kind: "mobile",
    access: "self_serve",
    entryUsd: null,
    annualUsd: 99,
    entryBasis: "Apple Developer Program membership, $99 per year, renewed annually.",
    cutLowPct: 15,
    cutHighPct: 30,
    cutNote:
      "15% under the Small Business Program (under $1M proceeds in the prior calendar year, or a new developer), otherwise 30%. Enrolment is required, and crossing $1M moves you to 30% for the rest of that year.",
    url: "https://developer.apple.com/programs/",
    checkedAt: CHECKED,
    fitsTypes: ["Game", "Gamer/Creator", "Comic"],
    note:
      "A recurring cost rather than a one-off, and iOS share is low across most African markets — so for an Africa-first launch this is usually the second platform, not the first. It matters most if you are targeting diaspora or non-African revenue.",
  },
  {
    id: "pc_steam",
    name: "PC (Steam)",
    kind: "pc",
    access: "self_serve",
    entryUsd: 100,
    annualUsd: null,
    entryBasis:
      "Steam Direct fee of $100 per title, recoupable — returned once the title earns $1,000 in adjusted gross revenue.",
    cutLowPct: 20,
    cutHighPct: 30,
    cutNote:
      "30% on the first $10M of lifetime revenue, 25% from $10M–$50M, 20% above. Tiers are incremental and set by the prior year's earnings.",
    url: "https://partner.steamgames.com/steamdirect",
    checkedAt: CHECKED,
    fitsTypes: ["Game"],
    note:
      "Per-title, not per-account — a three-game slate costs $300. The fee is small; discovery is the real cost, and this platform's Steam intelligence page shows review volume, not rating, is what separates African titles that found an audience from those that did not.",
  },
  {
    id: "console",
    name: "Console (PlayStation / Xbox / Switch)",
    kind: "console",
    access: "gated",
    entryUsd: null,
    annualUsd: null,
    entryBasis:
      "Requires acceptance into a platform developer programme. Dev-kit and certification costs are under NDA and not published, so no figure is quoted.",
    cutLowPct: 30,
    cutHighPct: 30,
    cutNote: "Widely reported at around 30%, but the platform holders do not publish their rates.",
    url: "https://www.xbox.com/en-US/developers/id",
    checkedAt: CHECKED,
    fitsTypes: ["Game"],
    note:
      "Approval is the barrier, not money. ID@Xbox is the most accessible to small studios; PlayStation Partners reviews applications over weeks to months and favours a shipped track record; Nintendo is the most restrictive and effectively expects a shipped portfolio. For a first title from a new African studio this is a second-release target, not a launch platform.",
  },
];

export const DISTRIBUTION_BY_ID: Record<string, DistributionChannel> = Object.fromEntries(
  DISTRIBUTION_CHANNELS.map((c) => [c.id, c]),
);

export const ACCESS_META: Record<
  DistributionAccess,
  { label: string; tone: string; blurb: string }
> = {
  self_serve: {
    label: "Self-serve",
    tone: "emerald",
    blurb: "You can publish here yourself, today, for a published fee.",
  },
  gated: {
    label: "Gated",
    tone: "orange",
    blurb: "Open in principle, but approval, curation or per-case fees stand in front.",
  },
  commissioned: {
    label: "Commissioned only",
    tone: "violet",
    blurb: "You cannot choose this. Someone has to choose you — plan a route, not a release.",
  },
};

/** One-off entry cost of the selected channels. */
export function distributionEntryCost(ids: string[]): number {
  return ids.reduce((sum, id) => sum + (DISTRIBUTION_BY_ID[id]?.entryUsd ?? 0), 0);
}

/** Recurring annual cost of the selected channels. */
export function distributionAnnualCost(ids: string[]): number {
  return ids.reduce((sum, id) => sum + (DISTRIBUTION_BY_ID[id]?.annualUsd ?? 0), 0);
}

/** The worst platform cut among the selected channels, for a revenue reality check. */
export function worstCutPct(ids: string[]): number | null {
  const cuts = ids
    .map((id) => DISTRIBUTION_BY_ID[id]?.cutHighPct)
    .filter((c): c is number => typeof c === "number");
  return cuts.length > 0 ? Math.max(...cuts) : null;
}

/** Channels selected that cannot actually be planned for. */
export function commissionedOnly(ids: string[]): DistributionChannel[] {
  return ids
    .map((id) => DISTRIBUTION_BY_ID[id])
    .filter((c): c is DistributionChannel => !!c && c.access === "commissioned");
}

/** Selected channels that do not suit the project type — a mismatch worth flagging. */
export function mismatchedChannels(ids: string[], type: ProjectType): DistributionChannel[] {
  return ids
    .map((id) => DISTRIBUTION_BY_ID[id])
    .filter((c): c is DistributionChannel => !!c && !c.fitsTypes.includes(type));
}
