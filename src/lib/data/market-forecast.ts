// ---------------------------------------------------------------------------
// Hero headline forecast figures.
//
// PROVENANCE STATUS: these three figures were supplied for display and could
// not be matched to a free, checkable published source. A sweep of the
// available 2026 forecasts found a wide spread — roughly $2.29B to $4.8B for
// market size, and mobile share reported anywhere from 61% to 87% depending on
// whether the number counts revenue or players — so no free source corroborates
// this particular set.
//
// They are therefore rendered as a clearly-labelled FORECAST, never as a
// measured fact, and never mixed in with the World Bank series that the rest of
// the platform runs on. `sourceLabel` is the field to fill once the originating
// report is known; until then the UI says the source is pending rather than
// implying one exists.
// ---------------------------------------------------------------------------

export interface ForecastStat {
  id: string;
  /** The headline figure exactly as supplied. */
  value: string;
  /** Small line under the figure. */
  caption: string;
  /** Optional second line, e.g. the year or a parenthetical. */
  sub?: string;
  /** Palette token — the platform's own accents, not the reference poster's. */
  accent: "orange" | "blue" | "violet";
  icon: string;
}

export const FORECAST_YEAR = 2026;

export const MARKET_FORECAST: ForecastStat[] = [
  {
    id: "market-size",
    value: "$1.98B",
    caption: "Africa's games market is forecast to reach",
    sub: "in 2026",
    accent: "orange",
    icon: "controller",
  },
  {
    id: "players",
    value: "406.25M",
    caption: "players",
    accent: "blue",
    icon: "users",
  },
  {
    id: "mobile-share",
    value: "81.8%",
    caption: "mobile represents",
    sub: "($1.62B)",
    accent: "violet",
    icon: "target",
  },
];

/** Shown beside the figures so the status is never ambiguous. */
export const FORECAST_PROVENANCE = {
  kind: "FORECAST" as const,
  sourceLabel: null as string | null,
  note:
    "Forward-looking estimate supplied for display. No free published source corroborating this exact set was found — 2026 forecasts elsewhere range from $2.29B to $4.8B, and mobile share is reported between 61% and 87% depending on whether it measures revenue or players. Treat as a projection, not a measurement.",
};
