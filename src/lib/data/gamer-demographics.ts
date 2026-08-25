// ---------------------------------------------------------------------------
// GAMER DEMOGRAPHICS — published survey findings, attributed.
//
// Everything here is a figure PUBLISHED BY A NAMED RESEARCHER, reported with
// their sample size, markets, date and a link back. This platform ran no
// survey of its own and never claims to have: each number is presented as
// "GeoPoll found X", not "we found X". That distinction is the whole point.
//
// Where a category has no published free figure, it says so and names the kind
// of source that would fill it, rather than being estimated into existence.
// A blank cell is information; an invented one is damage.
// ---------------------------------------------------------------------------

export type Provenance = "published" | "partial" | "unpublished";

export interface SurveySource {
  id: string;
  name: string;
  publisher: string;
  sampleSize: string;
  markets: string[];
  published: string;
  url: string;
  methodology: string;
  licence: string;
}

export const SURVEY_SOURCES: Record<string, SurveySource> = {
  geopoll2024: {
    id: "geopoll2024",
    name: "Gaming in Africa 2024",
    publisher: "GeoPoll",
    sampleSize: "2,500+ gamers",
    markets: ["Egypt", "Kenya", "Nigeria", "South Africa"],
    published: "2024-03-25",
    url: "https://www.geopoll.com/blog/gaming-in-africa-2024/",
    methodology:
      "Mobile web research platform, text-message opt-in recruitment. Respondents self-identified as game players.",
    licence: "Findings reported publicly by GeoPoll; reproduced here with attribution.",
  },
  geopoll2025: {
    id: "geopoll2025",
    name: "Gaming in Africa 2025",
    publisher: "GeoPoll & PAGG (Pan-African Gaming Group)",
    sampleSize: "6,000+ players",
    markets: ["Egypt", "Kenya", "Nigeria", "South Africa", "Senegal", "Tanzania"],
    published: "2025",
    url: "https://www.geopoll.com/gaming-africa-2025/",
    methodology: "Mobile survey across six African markets.",
    licence: "Findings reported publicly; reproduced here with attribution.",
  },
  worldbankIlo: {
    id: "worldbankIlo",
    name: "World Development Indicators (ILO modelled estimates)",
    publisher: "World Bank / International Labour Organization",
    sampleSize: "National labour force statistics, all 54 African countries",
    markets: ["All 54 African countries"],
    published: "2025",
    url: "https://data.worldbank.org/indicator/SL.EMP.TOTL.SP.ZS",
    methodology:
      "ILO modelled estimates of employment, self-employment and labour force participation, re-expressed here as shares of the 15+ population so the categories share one denominator and sum to 100%.",
    licence: "CC BY-4.0",
  },
  newzooCarry1st: {
    id: "newzooCarry1st",
    name: "Africa Games Market Report",
    publisher: "Newzoo × Carry1st",
    sampleSize: "Newzoo global panel: 73,000+ respondents across 36+ markets",
    markets: ["Africa (continental estimate)"],
    published: "2024",
    url: "https://carry1st.com",
    methodology:
      "Newzoo's annual primary research panel combined with Carry1st commissioned analysis. Continental totals are modelled estimates, not a census.",
    licence:
      "Headline findings widely reported in trade press; reproduced here with attribution. The full report is commercial and is not reproduced.",
  },
};

export interface GamerStat {
  label: string;
  /** Percentage or absolute value. null = not published. */
  value: number | null;
  unit: "%" | "people" | "hours";
  sourceId: string;
  note?: string;
}

export interface GamerCategory {
  id: string;
  title: string;
  question: string;
  icon: string;
  accent: "emerald" | "blue" | "violet" | "orange";
  provenance: Provenance;
  /** The single figure shown on the card face. */
  headline: string | null;
  headlineLabel: string;
  stats: GamerStat[];
  /** Present when provenance is partial/unpublished — what is missing, and why. */
  gap?: string;
  /** What kind of source would close the gap. */
  wouldNeed?: string;
}

export const GAMER_CATEGORIES: GamerCategory[] = [
  {
    id: "age",
    title: "Age distribution",
    question: "How old are African gamers?",
    icon: "users",
    accent: "emerald",
    provenance: "partial",
    headline: "16–35",
    headlineLabel: "Majority age band",
    stats: [
      {
        label: "Majority of African gamers fall in the 16–35 band",
        value: null,
        unit: "%",
        sourceId: "newzooCarry1st",
        note: "Reported qualitatively as a band, not as a percentage split by age bracket.",
      },
      {
        label: "Africa's under-15 population share (context, not gamers)",
        value: 40.5,
        unit: "%",
        sourceId: "newzooCarry1st",
        note: "World Bank population figure shown for context — see the Population tab. Not a gamer statistic.",
      },
    ],
    gap: "No free source publishes a numeric age-bracket split for African gamers — only the 16–35 band as a qualitative statement.",
    wouldNeed:
      "A licensed Newzoo/GeoPoll data cut, or first-party telemetry from a publisher such as Carry1st or Maliyo.",
  },
  {
    id: "gender",
    title: "Gender",
    question: "What is the gender split among African gamers?",
    icon: "users",
    accent: "violet",
    provenance: "partial",
    headline: "Male-skewed",
    headlineLabel: "Reported direction",
    stats: [
      {
        label: "Described as 'largely but not entirely male'",
        value: null,
        unit: "%",
        sourceId: "newzooCarry1st",
        note: "Reported as a direction of skew. No percentage split is published in the free summaries.",
      },
    ],
    gap: "No free source publishes a numeric male/female split for African gamers specifically.",
    wouldNeed:
      "The full Newzoo × Carry1st report, or a GeoPoll data cut. Global comparators exist but do not transfer to African markets.",
  },
  {
    id: "income",
    title: "Income bracket",
    question: "What do African gamers earn, and what do they spend?",
    icon: "target",
    accent: "emerald",
    provenance: "published",
    headline: "29%",
    headlineLabel: "Spend $2–$5 monthly on games",
    stats: [
      { label: "Have made a gaming-related purchase", value: 63, unit: "%", sourceId: "geopoll2024" },
      { label: "Spend $2–$5 per month on gaming", value: 29, unit: "%", sourceId: "geopoll2024" },
      { label: "Prefer free games", value: 47, unit: "%", sourceId: "geopoll2024" },
      { label: "Cite lack of funds as a barrier to purchase", value: 44, unit: "%", sourceId: "geopoll2024" },
      { label: "Cite data-bundle cost as a barrier", value: 42, unit: "%", sourceId: "geopoll2024" },
      { label: "Cite expensive gaming hardware as a barrier", value: 31, unit: "%", sourceId: "geopoll2024" },
    ],
    gap: "Spending behaviour is published; household income brackets for gamers are not.",
    wouldNeed: "A survey cut crossing gaming participation with household income deciles.",
  },
  {
    id: "education",
    title: "Education level",
    question: "How educated are African gamers?",
    icon: "book",
    accent: "blue",
    provenance: "unpublished",
    headline: null,
    headlineLabel: "Not published",
    stats: [],
    gap: "No free published survey breaks African gamers down by education level.",
    wouldNeed:
      "A survey crossing gaming participation with attainment. Population-level literacy and enrolment are on the Population tab, but those describe everyone, not gamers.",
  },
  {
    id: "occupation",
    title: "Occupation",
    question: "What do African gamers do for work?",
    icon: "building",
    accent: "orange",
    provenance: "unpublished",
    headline: null,
    headlineLabel: "Not published",
    stats: [],
    gap: "No free published survey breaks African gamers down by occupation or employment status.",
    wouldNeed:
      "A survey crossing gaming participation with employment status. Population-level labour data is on the Population tab.",
  },
  {
    id: "hours",
    title: "Daily gaming hours",
    question: "How long do African gamers play each day?",
    icon: "pulse",
    accent: "emerald",
    provenance: "published",
    headline: "32%",
    headlineLabel: "Play 3+ hours a day",
    stats: [
      { label: "Play three or more hours daily", value: 32, unit: "%", sourceId: "geopoll2024" },
      {
        label: "Play more than one hour daily",
        value: 75,
        unit: "%",
        sourceId: "geopoll2025",
        note: "Reported as 'three-quarters' in the 2025 report.",
      },
      {
        label: "Kenya: play at least one hour daily",
        value: 78,
        unit: "%",
        sourceId: "geopoll2024",
        note: "Kenya-specific figure.",
      },
      { label: "Play for fun", value: 73, unit: "%", sourceId: "geopoll2024" },
      { label: "Play for stress relief", value: 64, unit: "%", sourceId: "geopoll2024" },
    ],
  },
  {
    id: "device",
    title: "Device ownership",
    question: "What do African gamers play on?",
    icon: "controller",
    accent: "blue",
    provenance: "published",
    headline: "92%",
    headlineLabel: "Play on mobile phones",
    stats: [
      { label: "Play games on a mobile phone", value: 92, unit: "%", sourceId: "geopoll2024" },
      { label: "Have downloaded games from Google Play", value: 92, unit: "%", sourceId: "geopoll2024" },
      {
        label: "Name a smartphone as their primary platform",
        value: 91,
        unit: "%",
        sourceId: "geopoll2025",
      },
      {
        label: "Mobile gamers across Africa",
        value: 304_000_000,
        unit: "people",
        sourceId: "newzooCarry1st",
        note: "Of 349M total gamers — a modelled continental estimate, not a survey count.",
      },
    ],
  },
  {
    id: "urban",
    title: "Urban vs rural",
    question: "Where do African gamers live?",
    icon: "globe",
    accent: "violet",
    provenance: "unpublished",
    headline: null,
    headlineLabel: "Not published",
    stats: [],
    gap: "No free published survey splits African gamers by urban and rural residence.",
    wouldNeed:
      "A survey cut by settlement type. Note that mobile-survey recruitment tends to under-reach rural respondents, so even a commissioned study needs weighting to be trusted here.",
  },
];

/** Continental totals, reported by Newzoo × Carry1st. */
export const MARKET_TOTALS = [
  { label: "Total gamers in Africa", value: "349M", note: "2024", sourceId: "newzooCarry1st" },
  { label: "Playing on mobile", value: "304M", note: "87% of all gamers", sourceId: "newzooCarry1st" },
  { label: "New gamers added", value: "+32M", note: "10% YoY growth", sourceId: "newzooCarry1st" },
  { label: "Market revenue", value: "$1.8B", note: "2024, +12.4% YoY", sourceId: "newzooCarry1st" },
];

export function sourceFor(id: string): SurveySource | undefined {
  return SURVEY_SOURCES[id];
}

export const PUBLISHED_COUNT = GAMER_CATEGORIES.filter((c) => c.provenance === "published").length;
export const PARTIAL_COUNT = GAMER_CATEGORIES.filter((c) => c.provenance === "partial").length;
export const UNPUBLISHED_COUNT = GAMER_CATEGORIES.filter((c) => c.provenance === "unpublished").length;
