# Scoring & normalization

All scoring lives in `src/lib/scoring/` and is unit-tested in `tests/scoring.test.ts`.

## 1. Normalise (`normalize.ts`)

Raw African metrics span orders of magnitude, so raw values are never compared directly. Each
metric is normalised to **0–100** across all 54 countries:

- **min-max** for bounded/rate metrics (percentages, per-100 rates).
- **zero-max** for **count** metrics (studios, animation studios, esports orgs). Counts have a
  meaningful zero, so they are scaled against 0 rather than the observed minimum. Min-max would pin
  the smallest observed count to 0 — making a country with one real studio look identical to the
  worst case, and *worse* than a country whose count is merely unknown (null, and therefore
  skipped). That inversion was real: before the fix Kenya (19 studios) scored **below** Tunisia
  (12). *(Tested.)*
- **log-min-max** for skewed magnitude metrics (population, GDP, household consumption) — the log
  transform stops the largest countries from automatically dominating every ranking. *(Tested.)*
- **percentile** available as an alternative robust method.
- `higherIsBetter=false` inverts direction (for risk-style metrics).
- **Nulls are excluded** from the distribution and never coerced to 0.

## 2. Compose dimensions (`weights.ts` → `market.ts`)

Normalised metrics are averaged (equal weight within a dimension) into eight dimensions:
**Audience, Purchasing Power, Digital Access, Talent, Industry Maturity, Distribution, Investment,
Esports.** A dimension with no available inputs scores `null` (N/A) — not 0.

`weightedMean` skips null members and reports **coverage** = present weight ÷ total weight.

## 3. Weight per mode

Seven modes reweight the dimensions to answer different questions (see `MODE_WEIGHTS`). Default
**Market Attractiveness** weights: Audience 20 · Purchasing Power 15 · Digital Access 15 · Talent
15 · Industry Maturity 10 · Distribution 10 · Investment 10 · Esports 5.

The composite **renormalises weights over dimensions that actually have data**, so a country with a
missing dimension isn't silently zeroed — instead its **coverage** drops and its **confidence** tier
falls (HIGH ≥ 85% · MEDIUM ≥ 60% · LOW > 0 · UNVERIFIED = 0).

## 4. Output

Each `CompositeScore` carries `total`, per-dimension `components` (score + weight + coverage),
overall `coverage`, and `confidence`. The UI renders the full breakdown — the methodology is never
hidden.

## Studio Strength (`studio.ts`)

Same discipline for studios: only measurable, source-cited dimensions (Experience, Product,
Original IP, Technical) are scored; Market Reach, Business, Achievement, Ecosystem return `null`
until Phase 2–4 sources exist. "Weaknesses" are the measurable gaps, never invented opinions.

## Phase-1 honesty note

Industry Maturity and Esports dimensions have no free macro inputs yet, so they read N/A for all
countries in Phase 1 and are excluded from the composite via renormalisation. They activate once
studio/game/esports datasets reach coverage thresholds.
