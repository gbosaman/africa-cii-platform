// ---------------------------------------------------------------------------
// Hero headline figures.
//
// PROVENANCE IS PER-FIGURE, not per-block. These six numbers do not share a
// pedigree and must not share a label:
//
//   • The two film/audiovisual figures are UNESCO's, from a named report, and
//     are cited as such.
//   • The animation figure is a commercial research house's valuation, named
//     and linked, with its year stated — it is a 2025 valuation, not a forecast
//     year, which is how it was supplied.
//   • The three games figures could not be matched to any free published
//     source and say so rather than borrowing credibility from the others.
//
// Collapsing all six under one "FORECAST" badge would have understated the
// UNESCO pair and overstated the games trio. Each carries its own tag, source
// and caveat.
// ---------------------------------------------------------------------------

export type FigureTag = "FORECAST" | "ESTIMATE" | "RESEARCH";

export interface ForecastStat {
  id: string;
  /** The headline figure exactly as supplied. */
  value: string;
  /** Small line under the figure. */
  caption: string;
  /** Optional second line, e.g. the year or a parenthetical. */
  sub?: string;
  /** Palette token — the platform's own accents, not the reference poster's. */
  accent: "orange" | "blue" | "violet" | "emerald";
  icon: string;
  tag: FigureTag;
  /** Null only where no checkable source could be found. */
  source: { label: string; url: string } | null;
  /** Shown on hover; states scope, year and any conflict with other sources. */
  note: string;
}

const UNESCO = {
  label: "UNESCO — The African Film Industry (2021)",
  url: "https://www.unesco.org/creativity/sites/default/files/medias/fichiers/2023/01/379165eng.pdf",
};

const MDF_ANIMATION = {
  label: "Market Data Forecast — Africa Animation Market",
  url: "https://www.marketdataforecast.com/market-reports/africa-animation-market",
};

/** No free source corroborates the games trio; recorded once, referenced thrice. */
const GAMES_NOTE =
  "Forward-looking figure supplied for display. No free published source carrying this exact set was found — other 2026 forecasts range from $2.29B to $4.8B for market size, and mobile share is reported between 61% and 87% depending on whether it measures revenue or players. Treat as a projection, not a measurement.";

export const MARKET_FORECAST: ForecastStat[] = [
  {
    id: "market-size",
    value: "$1.98B",
    caption: "Africa's games market is forecast to reach",
    sub: "in 2026",
    accent: "orange",
    icon: "controller",
    tag: "FORECAST",
    source: null,
    note: GAMES_NOTE,
  },
  {
    id: "players",
    value: "406.25M",
    caption: "players",
    accent: "blue",
    icon: "users",
    tag: "FORECAST",
    source: null,
    note: GAMES_NOTE,
  },
  {
    id: "mobile-share",
    value: "81.8%",
    caption: "mobile represents",
    sub: "($1.62B)",
    accent: "violet",
    icon: "target",
    tag: "FORECAST",
    source: null,
    note: GAMES_NOTE,
  },
  {
    id: "film-gdp",
    value: "$5B",
    caption: "Africa's film & audiovisual industry contributes",
    sub: "to GDP",
    accent: "emerald",
    icon: "film",
    tag: "ESTIMATE",
    source: UNESCO,
    note: "UNESCO's estimate for the African film and audiovisual industry, published 2021 in the first continent-wide mapping of the sector. UNESCO puts the sector's untapped potential at $20B of GDP and 20 million jobs.",
  },
  {
    id: "film-jobs",
    value: "5M",
    caption: "people employed by the sector",
    sub: "estimated",
    accent: "orange",
    icon: "users",
    tag: "ESTIMATE",
    source: UNESCO,
    note: "UNESCO's estimate, published 2021. The same report finds piracy takes 50–75% of the industry's revenue and that only 19 of 54 African countries offer financial support to filmmakers.",
  },
  {
    id: "animation-market",
    value: "$15.71B",
    caption: "Africa's animation market, valued at",
    sub: "in 2025",
    accent: "violet",
    icon: "film",
    tag: "RESEARCH",
    source: MDF_ANIMATION,
    note: "Market Data Forecast's valuation of the Africa animation market for 2025 — a valuation year, not a forecast year; the same publisher puts 2026 at $17B and 2034 at $31.93B. Treat with caution: other research houses size Middle East AND Africa animation at $1.8B–$8.76B, which is far below this figure for Africa alone. Commercial research, methodology not public.",
  },
];
