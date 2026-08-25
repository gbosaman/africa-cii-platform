import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data/snapshot";
import { COUNTRIES } from "@/lib/data/countries";
import type { DemoCountry } from "@/components/demographics/DemographicsView";
import { DemographicsTabs } from "@/components/demographics/DemographicsTabs";
import { SectionHeader } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Demographics — who plays games in Africa, and who could",
  description:
    "Gamer demographics from published survey research, alongside per-country population structure from World Bank series. Every figure attributed.",
};

const KEYS = [
  "population",
  "youth_pct",
  "working_age_pct",
  "pop_65_plus",
  "female_pct",
  "urban_pct",
  "rural_pct",
  "literacy_pct",
  "secondary_enrolment",
  "tertiary_enrolment",
  "labour_participation",
  "labour_participation_female",
  "unemployment_pct",
  "youth_unemployment_pct",
  "gni_per_capita",
  "gini",
  "internet_pct",
  "mobile_per_100",
  "electricity_pct",
] as const;

export default async function DemographicsPage() {
  const snap = await getSnapshot();

  const countries: DemoCountry[] = COUNTRIES.map((c) => {
    const values: Record<string, number | null> = {};
    const years: Record<string, number | null> = {};
    for (const k of KEYS) {
      const mv = snap.metrics[k]?.[c.iso3];
      values[k] = mv?.value ?? null;
      years[k] = mv?.year || null;
    }
    return { iso3: c.iso3, iso2: c.iso2, name: c.name, region: c.region, values, years };
  });

  return (
    <div className="view-enter space-y-6">
      <SectionHeader
        eyebrow="Who plays, and who could · survey research + official statistics"
        title="Demographics"
      />

      <p className="max-w-3xl text-sm text-slate-400">
Two datasets, deliberately kept apart. <span className="text-slate-300">Gamer demographics</span> are
        published survey findings about players, attributed to the researchers who ran them.{" "}
        <span className="text-slate-300">Population demographics</span> are official per-country
        statistics about everyone. Every figure carries its source, and every gap is labelled.
      </p>

      <DemographicsTabs countries={countries} />
    </div>
  );
}
