import type { RankingMode, ScoreDimension } from "@/lib/types";
import type { NormMethod } from "@/lib/scoring/normalize";

// ---------------------------------------------------------------------------
// Scoring configuration. Weights are configurable per ranking mode so the
// same underlying metrics answer different questions (invest vs hire vs ship).
// ---------------------------------------------------------------------------

export interface DimensionSpec {
  label: string;
  /** metricId -> normalisation method. Higher-is-better comes from the metric def. */
  metrics: Record<string, NormMethod>;
}

/** Which metrics compose each analytical dimension (Phase 1 = macro/World Bank). */
export const DIMENSIONS: Record<ScoreDimension, DimensionSpec> = {
  audience: {
    label: "Audience",
    metrics: {
      population: "logminmax",
      youth_pct: "minmax",
      internet_pct: "minmax",
      population_growth: "minmax",
    },
  },
  purchasing_power: {
    label: "Purchasing Power",
    metrics: {
      gdp_per_capita: "logminmax",
      hh_consumption: "logminmax",
    },
  },
  digital_access: {
    label: "Digital Access",
    metrics: {
      internet_pct: "minmax",
      mobile_per_100: "minmax",
      broadband_per_100: "minmax",
      electricity_pct: "minmax",
    },
  },
  talent: {
    label: "Talent",
    // Phase 1 proxy: working-age share. Phase 3 adds OpenAlex / studio density.
    metrics: {
      working_age_pct: "minmax",
    },
  },
  industry_maturity: {
    label: "Industry Maturity",
    // Phase 2–3: verified studio & animation-studio counts. Absence = null (N/A),
    // so uncatalogued countries lower coverage rather than scoring a false zero.
    // zeromax: counts have a meaningful zero — one recorded studio must rank
    // above none, and must not be pinned to 0 by the observed minimum.
    metrics: {
      studio_count: "zeromax",
      animation_count: "zeromax",
    },
  },
  distribution: {
    label: "Distribution Infrastructure",
    metrics: {
      secure_servers: "logminmax",
      broadband_per_100: "minmax",
      urban_pct: "minmax",
    },
  },
  investment: {
    label: "Investment Climate",
    metrics: {
      gdp_growth: "minmax",
      gdp: "logminmax",
    },
  },
  esports: {
    label: "Esports Ecosystem",
    // Phase 3: verified org presence. Tournament & prize-pool data (Liquipedia
    // COMMUNITY / publisher OFFICIAL) extends this once wired. Absence = null.
    metrics: {
      esports_org_count: "zeromax",
    },
  },
};

/** Weight profile per ranking mode. Weights need not sum to 1 — they are
 *  renormalised over the dimensions that actually have data. */
export const MODE_WEIGHTS: Record<RankingMode, Partial<Record<ScoreDimension, number>>> = {
  market_attractiveness: {
    audience: 0.2,
    purchasing_power: 0.15,
    digital_access: 0.15,
    talent: 0.15,
    industry_maturity: 0.1,
    distribution: 0.1,
    investment: 0.1,
    esports: 0.05,
  },
  distribution: {
    audience: 0.3,
    purchasing_power: 0.25,
    digital_access: 0.25,
    distribution: 0.2,
  },
  production: {
    talent: 0.35,
    industry_maturity: 0.2,
    digital_access: 0.15,
    distribution: 0.15,
    purchasing_power: 0.15, // labour-cost proxy (lower is cheaper, handled in metric direction)
  },
  hiring: {
    talent: 0.5,
    digital_access: 0.2,
    industry_maturity: 0.15,
    purchasing_power: 0.15,
  },
  investment: {
    investment: 0.3,
    audience: 0.2,
    purchasing_power: 0.2,
    industry_maturity: 0.15,
    digital_access: 0.15,
  },
  esports: {
    esports: 0.35,
    audience: 0.25,
    digital_access: 0.25,
    purchasing_power: 0.15,
  },
  animation: {
    talent: 0.35,
    industry_maturity: 0.2,
    distribution: 0.15,
    investment: 0.15,
    purchasing_power: 0.15,
  },
};

export const MODE_LABELS: Record<RankingMode, string> = {
  market_attractiveness: "Market Attractiveness",
  distribution: "Best for Distribution",
  production: "Best for Production",
  hiring: "Best for Hiring",
  investment: "Best for Investment",
  esports: "Best for Esports",
  animation: "Best for Animation",
};

export const ALL_MODES: RankingMode[] = [
  "market_attractiveness",
  "distribution",
  "production",
  "hiring",
  "investment",
  "esports",
  "animation",
];
