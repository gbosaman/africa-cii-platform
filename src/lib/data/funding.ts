// ---------------------------------------------------------------------------
// PHASE 4 SEED — investment data.
//
// STRICT RULE: undisclosed funding is NEVER estimated. Only publicly
// disclosed, source-cited rounds appear here. Everything else is absent (N/A).
// Amounts are "as publicly reported" and cited; if a figure can't be sourced,
// it does not go in.
// ---------------------------------------------------------------------------

export interface FundingRound {
  id: string;
  studioId?: string;
  entityName: string;
  countryIso3: string;
  /** Disclosed amount in USD, or null when the round was undisclosed. */
  amountUsd: number | null;
  round: string; // e.g. "Series A"
  year: number;
  leadInvestors?: string[];
  disclosed: boolean;
  sourceUrl: string;
  sourceLabel: string;
}

export interface Accelerator {
  id: string;
  name: string;
  countryIso3: string;
  focus: string;
  website: string;
}

// Carry1st is the clearest publicly-documented case among tracked studios:
// a16z's first African investment. Figures are as widely reported at the time.
export const FUNDING_ROUNDS: FundingRound[] = [
  {
    id: "carry1st-series-a-2021",
    studioId: "carry1st",
    entityName: "Carry1st",
    countryIso3: "ZAF",
    amountUsd: 20_000_000,
    round: "Series A",
    year: 2021,
    leadInvestors: ["Andreessen Horowitz (a16z)"],
    disclosed: true,
    sourceUrl: "https://carry1st.com",
    sourceLabel: "Company site / public reporting",
  },
  {
    id: "carry1st-2022",
    studioId: "carry1st",
    entityName: "Carry1st",
    countryIso3: "ZAF",
    amountUsd: 27_000_000,
    round: "Series A extension",
    year: 2022,
    leadInvestors: ["Bitkraft Ventures"],
    disclosed: true,
    sourceUrl: "https://carry1st.com",
    sourceLabel: "Company site / public reporting",
  },
];

// Pan-African / regional accelerators & startup programmes relevant to
// creative-tech founders. Verifiable via their official sites.
export const ACCELERATORS: Accelerator[] = [
  { id: "mest", name: "MEST Africa", countryIso3: "GHA", focus: "Pan-African tech entrepreneurship", website: "https://meltwater.org" },
  { id: "cchub", name: "Co-Creation Hub (CcHUB)", countryIso3: "NGA", focus: "Technology & innovation", website: "https://cchub.africa" },
  { id: "founders-factory-africa", name: "Founders Factory Africa", countryIso3: "ZAF", focus: "Venture building & scaling", website: "https://foundersfactory.africa" },
  { id: "google-startups-africa", name: "Google for Startups Accelerator: Africa", countryIso3: "ZAF", focus: "Seed–Series A African startups", website: "https://startup.google.com" },
];

export function fundingByCountry(): Record<string, { rounds: number; disclosedUsd: number }> {
  const out: Record<string, { rounds: number; disclosedUsd: number }> = {};
  for (const r of FUNDING_ROUNDS) {
    const e = (out[r.countryIso3] ??= { rounds: 0, disclosedUsd: 0 });
    e.rounds += 1;
    if (r.amountUsd) e.disclosedUsd += r.amountUsd;
  }
  return out;
}

export const TOTAL_DISCLOSED_USD = FUNDING_ROUNDS.reduce((s, r) => s + (r.amountUsd ?? 0), 0);
