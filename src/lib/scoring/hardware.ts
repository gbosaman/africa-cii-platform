import { COUNTRIES } from "@/lib/data/countries";
import { normalise } from "@/lib/scoring/normalize";
import type { MetricSnapshot } from "@/lib/scoring/market";

// ---------------------------------------------------------------------------
// Development-hardware access.
//
// Hardware is a real constraint on game production in Africa: a studio cannot
// ship a PC title on machines it cannot buy, afford, or get repaired. This
// module models the part of that we can source honestly.
//
// WHAT IS REAL HERE
//   • Import dependence, ICT-goods trade share and applied tariff rates come
//     from the World Bank (verified, per-country, dated).
//   • Affordability is arithmetic on verified GDP per capita.
//
// WHAT IS NOT MODELLED, AND WHY
//   Retail prices for GPUs, gaming PCs, laptops, RAM and SSDs are NOT here.
//   No free, licensable API publishes African retail pricing; the large
//   regional retailers expose no public price API, and scraping their listings
//   would breach their terms. Rather than invent or "estimate" a GPU price, the
//   affordability model takes the price as an INPUT the user supplies from
//   their own quote. The platform then does the honest part: converting that
//   price into months of average income, per country, from real GDP data.
//   See HARDWARE_UNAVAILABLE for the full list of metrics we refuse to guess.
// ---------------------------------------------------------------------------

export interface HardwareRow {
  iso3: string;
  name: string;
  /** World Bank verified inputs (null = no data, never zero). */
  ictImportsPct: number | null;
  ictExportsPct: number | null;
  tariffPct: number | null;
  importsPctGdp: number | null;
  gdpPerCapita: number | null;
  /** Composite 0-100 of the sourced trade signals; null when nothing available. */
  importAccessScore: number | null;
  /** Coverage of the four trade inputs, 0..1. */
  coverage: number;
}

/**
 * Months of average income needed to buy one machine at `priceUsd`.
 * Uses GDP per capita as the income proxy — stated plainly, since GDP/capita
 * is not take-home pay. Returns null when income data is missing.
 */
export function monthsOfIncome(priceUsd: number, gdpPerCapita: number | null): number | null {
  if (!gdpPerCapita || gdpPerCapita <= 0 || !Number.isFinite(priceUsd) || priceUsd <= 0) return null;
  const monthlyIncome = gdpPerCapita / 12;
  return Math.round((priceUsd / monthlyIncome) * 10) / 10;
}

/**
 * Landed cost estimate: price plus the country's applied tariff. Clearly a
 * MODELLED figure — tariffs are a weighted mean across all products, not the
 * specific HS line for computers — so the UI labels it as an estimate.
 */
export function landedCost(priceUsd: number, tariffPct: number | null): number | null {
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
  if (tariffPct === null) return null;
  return Math.round(priceUsd * (1 + tariffPct / 100));
}

export function buildHardwareRows(snapshot: MetricSnapshot): HardwareRow[] {
  const val = (m: string, iso3: string) => snapshot[m]?.[iso3]?.value ?? null;

  const ictImportsPop = COUNTRIES.map((c) => val("ict_goods_imports_pct", c.iso3));
  const tariffPop = COUNTRIES.map((c) => val("tariff_rate_pct", c.iso3));
  const importsGdpPop = COUNTRIES.map((c) => val("imports_pct_gdp", c.iso3));

  return COUNTRIES.map((c) => {
    const ictImportsPct = val("ict_goods_imports_pct", c.iso3);
    const tariffPct = val("tariff_rate_pct", c.iso3);
    const importsPctGdp = val("imports_pct_gdp", c.iso3);

    // Higher ICT import share and import intensity = more hardware flowing in.
    // Lower tariffs = cheaper to land. Averaged over whatever is available.
    const parts = [
      normalise(ictImportsPct, ictImportsPop, "minmax", true),
      normalise(tariffPct, tariffPop, "minmax", false), // lower is better
      normalise(importsPctGdp, importsGdpPop, "minmax", true),
    ];
    const present = parts.filter((p): p is number => p !== null);
    const importAccessScore =
      present.length === 0
        ? null
        : Math.round((present.reduce((a, b) => a + b, 0) / present.length) * 10) / 10;

    return {
      iso3: c.iso3,
      name: c.name,
      ictImportsPct,
      ictExportsPct: val("ict_goods_exports_pct", c.iso3),
      tariffPct,
      importsPctGdp,
      gdpPerCapita: val("gdp_per_capita", c.iso3),
      importAccessScore,
      coverage: Math.round((present.length / 3) * 100) / 100,
    };
  });
}

/** Metrics the brief asked for that have NO free licensable source. */
export const HARDWARE_UNAVAILABLE: { metric: string; why: string }[] = [
  {
    metric: "GPU prices",
    why: "No free public price API. Regional retailers publish no price API and scraping their listings breaches their terms.",
  },
  {
    metric: "GPU availability / stock",
    why: "Stock levels are not published in any licensable feed; they change hourly and are retailer-specific.",
  },
  {
    metric: "Gaming-PC prices",
    why: "Same constraint as GPU pricing. Configurations also differ per retailer, so a single figure would not be comparable.",
  },
  {
    metric: "Laptop prices",
    why: "No free structured pricing feed covering African markets.",
  },
  {
    metric: "RAM / SSD prices",
    why: "Component pricing is published by retailers only, without an API; global spot prices do not reflect landed African cost.",
  },
  {
    metric: "Used-PC availability",
    why: "The secondhand market is largely informal and classifieds-based, with no structured or licensable dataset.",
  },
  {
    metric: "Warranty availability",
    why: "Warranty terms are per-retailer contractual text, not published as data anywhere queryable.",
  },
];
