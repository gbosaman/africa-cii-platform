// ---------------------------------------------------------------------------
// Normalisation utilities. Raw African metrics span many orders of magnitude
// (Nigeria's population vs Seychelles'), so we never compare raw values.
// Skewed magnitude series are log-transformed before min-max so large
// countries don't automatically dominate every ranking.
// ---------------------------------------------------------------------------

export type NormMethod = "minmax" | "logminmax" | "percentile" | "zeromax";

/** Clamp helper. */
export const clamp = (n: number, lo = 0, hi = 100): number =>
  Math.max(lo, Math.min(hi, n));

/**
 * Normalise a value to 0–100 given the population of values across all
 * countries. Nulls are ignored when computing the distribution.
 */
export function normalise(
  value: number | null,
  population: (number | null)[],
  method: NormMethod = "minmax",
  higherIsBetter = true,
): number | null {
  if (value === null || Number.isNaN(value)) return null;
  const clean = population.filter((v): v is number => v !== null && !Number.isNaN(v));
  if (clean.length === 0) return null;

  let v = value;
  let pop = clean;
  if (method === "logminmax") {
    // Shift so the smallest positive value maps sensibly; guard against <=0.
    const shift = 1 - Math.min(...clean);
    const safe = (x: number) => Math.log(Math.max(x + (shift > 0 ? shift : 0), 1e-9));
    v = safe(v);
    pop = clean.map(safe);
  }

  let score: number;
  if (method === "zeromax") {
    // For COUNT metrics, zero is meaningful: one recorded studio must score
    // above none. Min-max would pin the smallest observed count to 0, making a
    // country with a small real presence look identical to the worst case —
    // and worse than a country whose count is simply unknown (skipped).
    const max = Math.max(...pop, 0);
    score = max === 0 ? 0 : (v / max) * 100;
  } else if (method === "percentile") {
    const below = pop.filter((x) => x < v).length;
    const equal = pop.filter((x) => x === v).length;
    score = ((below + 0.5 * equal) / pop.length) * 100;
  } else {
    const min = Math.min(...pop);
    const max = Math.max(...pop);
    score = max === min ? 50 : ((v - min) / (max - min)) * 100;
  }

  return clamp(higherIsBetter ? score : 100 - score);
}

/** Percentile rank of a value within a set (0–100). Public for tests. */
export function percentileRank(value: number, all: number[]): number {
  if (all.length === 0) return 0;
  const below = all.filter((x) => x < value).length;
  const equal = all.filter((x) => x === value).length;
  return clamp(((below + 0.5 * equal) / all.length) * 100);
}

/** Simple weighted mean ignoring null components; returns null if all null. */
export function weightedMean(
  pairs: { value: number | null; weight: number }[],
): { value: number | null; coverage: number } {
  const present = pairs.filter((p) => p.value !== null);
  const totalWeight = pairs.reduce((s, p) => s + p.weight, 0);
  const presentWeight = present.reduce((s, p) => s + p.weight, 0);
  if (present.length === 0 || presentWeight === 0) {
    return { value: null, coverage: 0 };
  }
  const sum = present.reduce((s, p) => s + (p.value as number) * p.weight, 0);
  return {
    value: sum / presentWeight,
    coverage: totalWeight === 0 ? 0 : presentWeight / totalWeight,
  };
}
