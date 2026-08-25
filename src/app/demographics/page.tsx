import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data/snapshot";
import { COUNTRIES } from "@/lib/data/countries";
import { DemographicsView, type DemoCountry } from "@/components/demographics/DemographicsView";
import { SectionHeader } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Demographics — audience & workforce structure across Africa",
  description:
    "Age structure, gender, income, education, employment, connectivity and urbanisation for all 54 African countries, from verified World Bank series.",
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
        eyebrow="Audience & workforce structure · 54 countries · World Bank verified"
        title="Demographics"
      />

      <p className="max-w-3xl text-sm text-slate-400">
        Who is actually out there — by age, gender, income, education, employment and connectivity.
        Every figure is a verified World Bank observation for that specific country, with its
        publication year shown. Pick a country to see its profile, or compare any indicator across
        the continent.
      </p>

      {/* The honest note about what this is, and is not */}
      <div className="rounded-lg border border-line bg-ink-850/60 p-4 text-sm text-slate-300">
        <span className="font-semibold text-white">Population demographics, not a gamer survey. </span>
        This is the structure of each country&apos;s population from official statistics. It is not a
        survey of players — we have not run one, and reproducing someone else&apos;s survey under our
        own provenance would be dishonest. So there are no figures here for daily play hours, genre
        preference or gamer gender split: those require primary research, and where we lack it the
        page says so rather than estimating. What these indicators <em>do</em> support is the
        upstream question — how large, how young, how connected, how educated and how employed the
        addressable population is.
      </div>

      <DemographicsView countries={countries} />
    </div>
  );
}
