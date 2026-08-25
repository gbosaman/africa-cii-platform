import "server-only";
import { cache } from "react";
import { getSnapshot, type PlatformSnapshot } from "@/lib/data/snapshot";
import { computeScores } from "@/lib/scoring/market";
import { ALL_MODES } from "@/lib/scoring/weights";
import { COUNTRIES } from "@/lib/data/countries";
import {
  ANIMATION_STUDIOS,
  ESPORTS_ORGS,
  animationCountByCountry,
  esportsOrgCountByCountry,
} from "@/lib/data/creative";
import { getStudios, getGames } from "@/lib/data/repository";
import { directoryCountByCountry, buildStudioDirectory } from "@/lib/data/studio-directory";
import type { CompositeScore, MetricValue, RankingMode, Studio } from "@/lib/types";
import type { MetricSnapshot } from "@/lib/scoring/market";
import type { MapLayerDef } from "@/lib/types";

/** Build a count "metric" map (iso3 → MetricValue). Zero counts become null:
 *  absence of a catalogued record is UNKNOWN, not a factual zero. */
function countMetric(
  metricId: string,
  counts: Record<string, number>,
  unit: string,
): Record<string, MetricValue> {
  const out: Record<string, MetricValue> = {};
  for (const [iso3, n] of Object.entries(counts)) {
    if (n <= 0) continue;
    out[iso3] = {
      metricId, countryIso3: iso3, value: n, unit, year: new Date().getUTCFullYear(),
      kind: "verified", confidence: "MEDIUM", sourceId: "official_site",
      datasetName: "Platform verified seed / DB",
    };
  }
  return out;
}

function studioCountByCountry(studios: Studio[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of studios) out[s.countryIso3] = (out[s.countryIso3] ?? 0) + 1;
  return out;
}

/** Merge two count maps (verified DB studios + community directory entries),
 *  taking the larger of the two per country so we never double-count an entity
 *  that appears in both. */
function mergeCounts(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

export interface Intelligence {
  snapshot: PlatformSnapshot;
  scores: Record<RankingMode, CompositeScore[]>; // ranked high→low
  scoreByCountry: Record<string, Record<RankingMode, CompositeScore>>;
  counts: {
    countries: number;
    studios: number;
    games: number;
    animationStudios: number;
    esportsTeams: number;
    tournaments: number;
    metricsTracked: number;
    coverageAvg: number; // 0..1 across countries (market_attractiveness)
  };
}

export const getIntelligence = cache(async (): Promise<Intelligence> => {
  const [snapshot, studios, games] = await Promise.all([getSnapshot(), getStudios(), getGames()]);

  // Augment the macro snapshot with verified industry-presence counts so the
  // industry_maturity & esports dimensions carry real signal. snapshot stays
  // pure; scoring reads this derived view.
  const scoringMetrics: MetricSnapshot = {
    ...snapshot.metrics,
    studio_count: countMetric(
      "studio_count",
      // Verified DB studios merged with the GameDevMap community directory —
      // the larger per country, so an entity in both is never double-counted.
      mergeCounts(studioCountByCountry(studios), directoryCountByCountry()),
      "studios",
    ),
    animation_count: countMetric("animation_count", animationCountByCountry(), "studios"),
    esports_org_count: countMetric("esports_org_count", esportsOrgCountByCountry(), "orgs"),
  };

  const scores = {} as Record<RankingMode, CompositeScore[]>;
  for (const mode of ALL_MODES) {
    scores[mode] = computeScores(scoringMetrics, mode);
  }

  const scoreByCountry: Record<string, Record<RankingMode, CompositeScore>> = {};
  for (const c of COUNTRIES) scoreByCountry[c.iso3] = {} as Record<RankingMode, CompositeScore>;
  for (const mode of ALL_MODES) {
    for (const s of scores[mode]) {
      scoreByCountry[s.entityId]![mode] = s;
    }
  }

  const market = scores.market_attractiveness;
  const coverageAvg =
    market.reduce((sum, s) => sum + s.coverage, 0) / (market.length || 1);

  return {
    snapshot,
    scores,
    scoreByCountry,
    counts: {
      countries: COUNTRIES.length,
      // Full directory (verified + community, de-duplicated) rather than just
      // the verified core, so the headline count reflects what users can browse.
      studios: buildStudioDirectory().stats.total,
      games: games.length,
      animationStudios: ANIMATION_STUDIOS.length,
      esportsTeams: ESPORTS_ORGS.length,
      tournaments: 0,
      metricsTracked: Object.keys(snapshot.metrics).length,
      coverageAvg,
    },
  };
});

/** Build the map layer set from computed scores (+ a digital-access layer). */
export function buildMapLayers(intel: Intelligence): MapLayerDef[] {
  const toValues = (mode: RankingMode) =>
    Object.fromEntries(intel.scores[mode].map((s) => [s.entityId, s.total])) as Record<
      string,
      number | null
    >;

  // Digital-access sub-score derived from the market_attractiveness components.
  const digital = Object.fromEntries(
    intel.scores.market_attractiveness.map((s) => [
      s.entityId,
      s.components.find((c) => c.dimension === "digital_access")?.score ?? null,
    ]),
  ) as Record<string, number | null>;

  return [
    { key: "market", label: "Market", values: toValues("market_attractiveness") },
    { key: "distribution", label: "Distribution", values: toValues("distribution") },
    { key: "production", label: "Production", values: toValues("production") },
    { key: "investment", label: "Investment", values: toValues("investment") },
    { key: "digital", label: "Digital Access", values: digital },
  ];
}
