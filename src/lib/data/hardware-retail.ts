// ---------------------------------------------------------------------------
// Hardware-retail presence from OpenStreetMap (Overpass API).
//
// SOURCE & ATTRIBUTION (required by licence)
//   © OpenStreetMap contributors, ODbL 1.0 — https://www.openstreetmap.org/copyright
//   Queried via the Overpass API for shop=computer and shop=electronics.
//
// STATUS: AWAITING HARVEST.
//   The harvester (scripts/harvest-hardware-retail.ts) is written, rate-limit
//   aware and verified working — sample queries returned real data (Kenya: 51
//   mapped computer shops; South Africa: named stores with branch counts).
//   The full 54-country run could not complete from this environment: the
//   primary Overpass endpoint rate-limited us and the public mirrors are not
//   reachable here. Rather than ship invented retailer counts, this dataset is
//   EMPTY and the UI reports it as pending. Run the harvester from an
//   environment with Overpass access to populate it.
//
// INTERPRETATION CAVEAT (must stay in the UI once populated)
//   OSM counts MAPPED retailers, not all retailers. African retail mapping is
//   incomplete and uneven, so counts are a LOWER BOUND and cross-country
//   comparison is confounded by differing mapping intensity. It is a presence
//   signal, never a census.
// ---------------------------------------------------------------------------

export interface RetailStore {
  name: string;
  branches: number;
  website: string | null;
}

export interface CountryRetail {
  iso3: string;
  computerShops: number;
  electronicsShops: number;
  total: number;
  namedStores: RetailStore[];
}

export const RETAIL_SOURCE = {
  name: "OpenStreetMap (Overpass API)",
  url: "https://www.openstreetmap.org/copyright",
  licence: "ODbL 1.0 — © OpenStreetMap contributors",
  tier: "community" as const,
};

/** Populated by scripts/harvest-hardware-retail.ts. Empty = not yet harvested. */
export const RETAIL_BY_COUNTRY: CountryRetail[] = [];

export const RETAIL_HARVESTED_AT: string | null = null;

export function retailFor(iso3: string): CountryRetail | undefined {
  return RETAIL_BY_COUNTRY.find((r) => r.iso3 === iso3);
}

export const RETAIL_PENDING = RETAIL_BY_COUNTRY.length === 0;
