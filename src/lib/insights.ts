import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import type { CompositeScore, RankingMode } from "@/lib/types";

// ---------------------------------------------------------------------------
// Automated insight layer. Generates plain-language statements ONLY when the
// underlying data supports them — no speculation. Each insight is derived from
// computed scores / verified metrics the user can click through to.
// ---------------------------------------------------------------------------

export interface InsightInput {
  scores: Record<RankingMode, CompositeScore[]>;
  /** metricId -> iso3 -> value */
  value: (metricId: string, iso3: string) => number | null;
  studioCountByCountry: Record<string, number>;
}

export interface Insight {
  id: string;
  text: string;
  href?: string;
}

export function generateInsights(input: InsightInput): Insight[] {
  const out: Insight[] = [];
  const flag = (iso3: string) => flagEmoji(COUNTRY_BY_ISO3[iso3]?.iso2 ?? "");
  const name = (iso3: string) => COUNTRY_BY_ISO3[iso3]?.name ?? iso3;

  const market = input.scores.market_attractiveness;
  const top = market[0];
  if (top) {
    out.push({
      id: "top-market",
      text: `${flag(top.entityId)} ${name(top.entityId)} leads overall market attractiveness at ${top.total.toFixed(1)}.`,
      href: `/countries/${top.entityId.toLowerCase()}`,
    });
  }

  // Largest audience vs strongest digital access — the classic nuance insight.
  const byPopulation = [...market]
    .map((s) => ({ iso3: s.entityId, v: input.value("population", s.entityId) }))
    .filter((x) => x.v !== null)
    .sort((a, b) => (b.v as number) - (a.v as number));
  const byDigital = [...market]
    .map((s) => ({
      iso3: s.entityId,
      v: s.components.find((c) => c.dimension === "digital_access")?.score ?? null,
    }))
    .filter((x) => x.v !== null)
    .sort((a, b) => (b.v as number) - (a.v as number));
  const bigAudience = byPopulation[0];
  const bestDigital = byDigital[0];
  if (bigAudience && bestDigital && bigAudience.iso3 !== bestDigital.iso3) {
    out.push({
      id: "audience-vs-infra",
      text: `${flag(bigAudience.iso3)} ${name(bigAudience.iso3)} has the largest audience in this dataset, but ${flag(bestDigital.iso3)} ${name(bestDigital.iso3)} scores higher on digital infrastructure.`,
      href: `/compare?a=${bigAudience.iso3}&b=${bestDigital.iso3}`,
    });
  }

  // Most catalogued studios.
  const mostStudios = Object.entries(input.studioCountByCountry).sort((a, b) => b[1] - a[1])[0];
  if (mostStudios && mostStudios[1] > 0) {
    out.push({
      id: "most-studios",
      text: `${flag(mostStudios[0])} ${name(mostStudios[0])} has the most game studios currently catalogued (${mostStudios[1]}).`,
      href: `/countries/${mostStudios[0].toLowerCase()}`,
    });
  }

  // Fastest GDP growth (verified WB series).
  const byGrowth = [...market]
    .map((s) => ({ iso3: s.entityId, v: input.value("gdp_growth", s.entityId) }))
    .filter((x) => x.v !== null)
    .sort((a, b) => (b.v as number) - (a.v as number));
  const grower = byGrowth[0];
  if (grower) {
    out.push({
      id: "fastest-growth",
      text: `${flag(grower.iso3)} ${name(grower.iso3)} posts the fastest GDP growth tracked at ${(grower.v as number).toFixed(1)}%.`,
      href: `/trends`,
    });
  }

  return out;
}
