import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data/snapshot";
import { COUNTRIES } from "@/lib/data/countries";
import type { DemoCountry } from "@/components/demographics/DemographicsView";
import { DemographicsTabs } from "@/components/demographics/DemographicsTabs";
import { SectionHeader } from "@/components/ui/primitives";
import { continentalOccupation } from "@/lib/scoring/occupation";
import type { GamerCategory } from "@/lib/data/gamer-demographics";

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

  // Occupation, computed from live ILO/World Bank labour data and normalised
  // to one denominator (share of the 15+ population) so the buckets sum.
  const occ = continentalOccupation(snap.metrics);
  const pct = (v: number | null) => (v === null ? null : Math.round(v * 10) / 10);

  const occupation: GamerCategory = {
    id: "occupation",
    title: "Occupation",
    question: "What do people of working age across Africa actually do?",
    icon: "building",
    accent: "orange",
    provenance: "partial",
    headline: pct(occ.selfEmployed) === null ? null : `${pct(occ.selfEmployed)}%`,
    headlineLabel: "Self-employed, share of 15+ population",
    stats: [
      {
        label: "Employed — wage or salaried",
        value: pct(occ.wageEmployed),
        unit: "%",
        sourceId: "worldbankIlo",
        note: "Share of the 15+ population in paid employment for an employer.",
      },
      {
        label: "Self-employed",
        value: pct(occ.selfEmployed),
        unit: "%",
        sourceId: "worldbankIlo",
        note: "Share of the 15+ population working for themselves — largely informal-sector work across Africa, not a startup indicator.",
      },
      {
        label: "Unemployed and seeking work",
        value: pct(occ.unemployed),
        unit: "%",
        sourceId: "worldbankIlo",
        note: "Share of the 15+ population, NOT the headline unemployment rate (which is measured against the labour force and is therefore higher).",
      },
      {
        label: "Not in the labour force — includes students",
        value: pct(occ.notInLabourForce),
        unit: "%",
        sourceId: "worldbankIlo",
        note: "Students, homemakers, retired and discouraged workers combined. Students cannot be isolated from this group with free data.",
      },
      {
        label: "Youth (15–24) not in employment, education or training",
        value: pct(occ.youthNeet),
        unit: "%",
        sourceId: "worldbankIlo",
        note: "Different denominator — share of 15–24s, not of the whole 15+ population. Shown because it is the closest read on disconnected youth.",
      },
    ],
    gap:
      "These are working-age POPULATION figures, not gamers. No free survey publishes an occupation split for African gamers specifically — and since gamers skew 16–35 and urban, their mix almost certainly differs from the population average shown here.",
    wouldNeed:
      "A survey crossing gaming participation with employment status, or first-party publisher telemetry with registration data.",
  };

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

      <DemographicsTabs countries={countries} occupation={occupation} />
    </div>
  );
}
