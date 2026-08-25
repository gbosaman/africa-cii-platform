import type { Metadata } from "next";
import { getIntelligence } from "@/lib/data/intelligence";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";
import { CountriesTable, type CountryRow } from "@/components/countries/CountriesTable";
import { SectionHeader } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Countries — Africa creative-industry intelligence",
  description: "All 54 African countries ranked by market attractiveness with live macro & digital-access signals.",
};

export default async function CountriesPage() {
  const intel = await getIntelligence();
  const val = (id: string, iso3: string) => intel.snapshot.metrics[id]?.[iso3]?.value ?? null;

  const rows: CountryRow[] = intel.scores.market_attractiveness.map((s, i) => {
    const c = COUNTRY_BY_ISO3[s.entityId]!;
    return {
      iso3: c.iso3,
      iso2: c.iso2,
      name: c.name,
      region: c.region,
      rank: i + 1,
      score: s.total,
      coverage: s.coverage,
      confidence: s.confidence,
      population: val("population", c.iso3),
      internet: val("internet_pct", c.iso3),
      gdpPerCapita: val("gdp_per_capita", c.iso3),
      digital: s.components.find((x) => x.dimension === "digital_access")?.score ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`${rows.length} countries · live World Bank data`}
        title="Country intelligence"
      />
      <p className="max-w-2xl text-sm text-slate-400">
        Every country scored on the same transparent framework. Sort, filter by region, or search.
        Click any country for the full drill-down; click any figure for its source lineage.
      </p>
      <CountriesTable rows={rows} />
    </div>
  );
}
