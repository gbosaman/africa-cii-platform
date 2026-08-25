import type { MetricDefinition } from "@/lib/types";

// ---------------------------------------------------------------------------
// Metric catalogue. Each entry declares its canonical source and (for World
// Bank series) the exact indicator code the adapter fetches. This is the
// single source of truth the ingestion layer, scoring engine and UI share.
// ---------------------------------------------------------------------------

export interface WorldBankMetric extends MetricDefinition {
  wbIndicator: string;
}

/** Metrics served live from the keyless World Bank WDI API. */
export const WORLD_BANK_METRICS: WorldBankMetric[] = [
  {
    id: "population",
    label: "Population, total",
    shortLabel: "Population",
    unit: "people",
    category: "market_size",
    higherIsBetter: true,
    description: "Total resident population — the raw size of the addressable audience.",
    primarySourceId: "worldbank",
    wbIndicator: "SP.POP.TOTL",
  },
  {
    id: "population_growth",
    label: "Population growth (annual %)",
    shortLabel: "Pop. growth",
    unit: "%",
    category: "market_size",
    higherIsBetter: true,
    description: "How fast the market is expanding demographically.",
    primarySourceId: "worldbank",
    wbIndicator: "SP.POP.GROW",
  },
  {
    id: "urban_pct",
    label: "Urban population (% of total)",
    shortLabel: "Urbanisation",
    unit: "%",
    category: "market_size",
    higherIsBetter: true,
    description: "Urban share — a proxy for connectivity, retail and payment reach.",
    primarySourceId: "worldbank",
    wbIndicator: "SP.URB.TOTL.IN.ZS",
  },
  {
    id: "working_age_pct",
    label: "Working-age population (15–64, % of total)",
    shortLabel: "Working age %",
    unit: "%",
    category: "talent",
    higherIsBetter: true,
    description: "Share of the population of working age — the talent & consumer core.",
    primarySourceId: "worldbank",
    wbIndicator: "SP.POP.1564.TO.ZS",
  },
  {
    id: "youth_pct",
    label: "Youth population (0–14, % of total)",
    shortLabel: "Youth %",
    unit: "%",
    category: "market_size",
    higherIsBetter: true,
    description: "Under-15 share — the future gaming and esports audience pipeline.",
    primarySourceId: "worldbank",
    wbIndicator: "SP.POP.0014.TO.ZS",
  },
  {
    id: "gdp",
    label: "GDP (current US$)",
    shortLabel: "GDP",
    unit: "US$",
    category: "market_size",
    higherIsBetter: true,
    description: "Total economic output — overall market scale.",
    primarySourceId: "worldbank",
    wbIndicator: "NY.GDP.MKTP.CD",
  },
  {
    id: "gdp_per_capita",
    label: "GDP per capita (current US$)",
    shortLabel: "GDP / capita",
    unit: "US$",
    category: "market_size",
    higherIsBetter: true,
    description: "Purchasing-power proxy per person — willingness/ability to spend.",
    primarySourceId: "worldbank",
    wbIndicator: "NY.GDP.PCAP.CD",
  },
  {
    id: "gdp_growth",
    label: "GDP growth (annual %)",
    shortLabel: "GDP growth",
    unit: "%",
    category: "investment",
    higherIsBetter: true,
    description: "Momentum of the economy — a core investment-climate signal.",
    primarySourceId: "worldbank",
    wbIndicator: "NY.GDP.MKTP.KD.ZG",
  },
  {
    id: "hh_consumption",
    label: "Household consumption (current US$)",
    shortLabel: "Consumer spend",
    unit: "US$",
    category: "market_size",
    higherIsBetter: true,
    description: "Households final consumption — the discretionary-spend pool.",
    primarySourceId: "worldbank",
    wbIndicator: "NE.CON.PRVT.CD",
  },
  {
    id: "internet_pct",
    label: "Individuals using the Internet (% of population)",
    shortLabel: "Internet users",
    unit: "%",
    category: "digital_access",
    higherIsBetter: true,
    description: "Share of people online — the ceiling for any digital product.",
    primarySourceId: "worldbank",
    wbIndicator: "IT.NET.USER.ZS",
  },
  {
    id: "mobile_per_100",
    label: "Mobile cellular subscriptions (per 100 people)",
    shortLabel: "Mobile subs",
    unit: "per 100",
    category: "digital_access",
    higherIsBetter: true,
    description: "Mobile penetration — the dominant African gaming device channel.",
    primarySourceId: "worldbank",
    wbIndicator: "IT.CEL.SETS.P2",
  },
  {
    id: "broadband_per_100",
    label: "Fixed broadband subscriptions (per 100 people)",
    shortLabel: "Broadband",
    unit: "per 100",
    category: "digital_access",
    higherIsBetter: true,
    description: "Fixed broadband — relevant to PC/console play and studio operations.",
    primarySourceId: "worldbank",
    wbIndicator: "IT.NET.BBND.P2",
  },
  {
    id: "electricity_pct",
    label: "Access to electricity (% of population)",
    shortLabel: "Electricity",
    unit: "%",
    category: "digital_access",
    higherIsBetter: true,
    description: "Foundational infrastructure gate for any digital consumption.",
    primarySourceId: "worldbank",
    wbIndicator: "EG.ELC.ACCS.ZS",
  },
  {
    id: "secure_servers",
    label: "Secure Internet servers (per 1M people)",
    shortLabel: "Secure servers",
    unit: "per 1M",
    category: "distribution",
    higherIsBetter: true,
    description: "Proxy for digital-commerce & payment infrastructure maturity.",
    primarySourceId: "worldbank",
    wbIndicator: "IT.NET.SECR.P6",
  },
  {
    id: "ict_goods_imports_pct",
    label: "ICT goods imports (% of total goods imports)",
    shortLabel: "ICT imports",
    unit: "%",
    category: "hardware",
    higherIsBetter: true,
    description:
      "Share of merchandise imports that are ICT goods (computers, components, telecom kit). A proxy for how much hardware physically enters the country through formal trade.",
    primarySourceId: "worldbank",
    wbIndicator: "TM.VAL.ICTG.ZS.UN",
  },
  {
    id: "ict_goods_exports_pct",
    label: "ICT goods exports (% of total goods exports)",
    shortLabel: "ICT exports",
    unit: "%",
    category: "hardware",
    higherIsBetter: true,
    description:
      "Share of merchandise exports that are ICT goods. Near-zero across most of Africa, which is itself the finding: hardware is imported, not made locally.",
    primarySourceId: "worldbank",
    wbIndicator: "TX.VAL.ICTG.ZS.UN",
  },
  {
    id: "tariff_rate_pct",
    label: "Applied tariff rate, weighted mean, all products",
    shortLabel: "Import tariff",
    unit: "%",
    category: "hardware",
    higherIsBetter: false,
    description:
      "Weighted-mean applied tariff. Directly inflates the landed cost of imported development hardware; lower is cheaper for a studio buying workstations.",
    primarySourceId: "worldbank",
    wbIndicator: "TM.TAX.MRCH.WM.AR.ZS",
  },
  {
    id: "imports_pct_gdp",
    label: "Imports of goods and services (% of GDP)",
    shortLabel: "Imports / GDP",
    unit: "%",
    category: "hardware",
    higherIsBetter: true,
    description:
      "Overall import intensity of the economy — context for how exposed hardware supply is to currency and logistics shocks.",
    primarySourceId: "worldbank",
    wbIndicator: "NE.IMP.GNFS.ZS",
  },
];

/**
 * Industry-presence metrics derived from the verified seed / DB (Phase 2–3).
 * Not fetched from an external API — computed from catalogued studios, games,
 * animation studios and esports orgs. Absence of records is UNKNOWN (null),
 * never zero, so we never claim "no industry" where we simply have no record.
 */
export const INDUSTRY_METRICS: MetricDefinition[] = [
  {
    id: "studio_count",
    label: "Recorded game studios",
    shortLabel: "Game studios",
    unit: "studios",
    category: "gaming",
    higherIsBetter: true,
    description: "Number of verified game studios catalogued in a country (seed/DB).",
    primarySourceId: "official_site",
  },
  {
    id: "animation_count",
    label: "Recorded animation studios",
    shortLabel: "Animation studios",
    unit: "studios",
    category: "animation",
    higherIsBetter: true,
    description: "Number of verified animation studios catalogued in a country.",
    primarySourceId: "official_site",
  },
  {
    id: "esports_org_count",
    label: "Recorded esports organisations",
    shortLabel: "Esports orgs",
    unit: "orgs",
    category: "esports",
    higherIsBetter: true,
    description: "Number of verified esports organisations catalogued in a country.",
    primarySourceId: "official_site",
  },
];

export const ALL_METRICS: MetricDefinition[] = [...WORLD_BANK_METRICS, ...INDUSTRY_METRICS];

export const METRIC_BY_ID: Record<string, MetricDefinition> = Object.fromEntries(
  ALL_METRICS.map((m) => [m.id, m]),
);

export function getMetric(id: string): MetricDefinition | undefined {
  return METRIC_BY_ID[id];
}
