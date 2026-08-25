import { COUNTRIES } from "@/lib/data/countries";
import { getMetric } from "@/lib/data/metrics";
import {
  clamp,
  normalise,
  weightedMean,
  type NormMethod,
} from "@/lib/scoring/normalize";
import { DIMENSIONS, MODE_WEIGHTS } from "@/lib/scoring/weights";
import type {
  CompositeScore,
  Confidence,
  MetricValue,
  RankingMode,
  ScoreComponent,
  ScoreDimension,
} from "@/lib/types";

/** metricId -> iso3 -> MetricValue */
export type MetricSnapshot = Record<string, Record<string, MetricValue>>;

/** Normalised value cache: `${metricId}:${method}` -> iso3 -> 0..100|null */
type NormCache = Map<string, Map<string, number | null>>;

function buildNormCache(snapshot: MetricSnapshot): NormCache {
  const cache: NormCache = new Map();
  // Collect the (metricId, method) pairs referenced anywhere in DIMENSIONS.
  const pairs = new Set<string>();
  for (const spec of Object.values(DIMENSIONS)) {
    for (const [metricId, method] of Object.entries(spec.metrics)) {
      pairs.add(`${metricId}:${method}`);
    }
  }

  for (const pair of pairs) {
    const [metricId, method] = pair.split(":") as [string, NormMethod];
    const def = getMetric(metricId);
    const perCountry = snapshot[metricId] ?? {};
    const population = COUNTRIES.map((c) => perCountry[c.iso3]?.value ?? null);
    const map = new Map<string, number | null>();
    for (const c of COUNTRIES) {
      const raw = perCountry[c.iso3]?.value ?? null;
      map.set(
        c.iso3,
        normalise(raw, population, method, def?.higherIsBetter ?? true),
      );
    }
    cache.set(pair, map);
  }
  return cache;
}

function confidenceFromCoverage(coverage: number): Confidence {
  if (coverage >= 0.85) return "HIGH";
  if (coverage >= 0.6) return "MEDIUM";
  if (coverage > 0) return "LOW";
  return "UNVERIFIED";
}

function scoreOneCountry(
  iso3: string,
  mode: RankingMode,
  cache: NormCache,
): CompositeScore {
  const country = COUNTRIES.find((c) => c.iso3 === iso3)!;
  const weights = MODE_WEIGHTS[mode];
  const components: ScoreComponent[] = [];

  for (const [dim, weight] of Object.entries(weights) as [ScoreDimension, number][]) {
    const spec = DIMENSIONS[dim];
    const metricIds = Object.keys(spec.metrics);
    const memberPairs = metricIds.map((metricId) => {
      const method = spec.metrics[metricId]!;
      const norm = cache.get(`${metricId}:${method}`)?.get(iso3) ?? null;
      return { value: norm, weight: 1 };
    });
    const { value, coverage } = weightedMean(memberPairs);
    components.push({
      dimension: dim,
      label: spec.label,
      score: value === null ? null : Math.round(value * 10) / 10,
      weight,
      inputs: metricIds,
      coverage,
    });
  }

  // Composite: renormalise weights over dimensions that have a score.
  const scored = components.filter((c) => c.score !== null);
  const availableWeight = scored.reduce((s, c) => s + c.weight, 0);
  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  const total =
    availableWeight === 0
      ? 0
      : scored.reduce((s, c) => s + (c.score as number) * c.weight, 0) / availableWeight;

  // Overall coverage weights dimension coverage by dimension weight.
  const coverage =
    totalWeight === 0
      ? 0
      : components.reduce((s, c) => s + c.coverage * c.weight, 0) / totalWeight;

  return {
    entityId: iso3,
    label: country.name,
    total: Math.round(clamp(total) * 10) / 10,
    components,
    coverage: Math.round(coverage * 100) / 100,
    confidence: confidenceFromCoverage(coverage),
    mode,
  };
}

/** Score every country for a given mode, ranked high→low. */
export function computeScores(
  snapshot: MetricSnapshot,
  mode: RankingMode,
): CompositeScore[] {
  const cache = buildNormCache(snapshot);
  return COUNTRIES.map((c) => scoreOneCountry(c.iso3, mode, cache)).sort(
    (a, b) => b.total - a.total,
  );
}

/** Score a single country (builds the cache from the full snapshot). */
export function computeScore(
  snapshot: MetricSnapshot,
  iso3: string,
  mode: RankingMode,
): CompositeScore {
  return scoreOneCountry(iso3, mode, buildNormCache(snapshot));
}

/** All modes for one country — used on the country intelligence page. */
export function computeAllModeScores(
  snapshot: MetricSnapshot,
  iso3: string,
): Record<RankingMode, CompositeScore> {
  const cache = buildNormCache(snapshot);
  const modes = Object.keys(MODE_WEIGHTS) as RankingMode[];
  return Object.fromEntries(
    modes.map((m) => [m, scoreOneCountry(iso3, m, cache)]),
  ) as Record<RankingMode, CompositeScore>;
}
