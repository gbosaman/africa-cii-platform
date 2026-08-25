import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data/snapshot";
import { COUNTRIES } from "@/lib/data/countries";
import type { DemoCountry } from "@/components/demographics/DemographicsView";
import { DemographicsTabs } from "@/components/demographics/DemographicsTabs";
import { SectionHeader } from "@/components/ui/primitives";
import { continentalOccupation } from "@/lib/scoring/occupation";
import { continentalSettlement, widestElectricityGaps } from "@/lib/scoring/settlement";
import { continentalEducation, topByDegree } from "@/lib/scoring/education";
import {
  continentalAgeStructure,
  continentalSexStructure,
} from "@/lib/scoring/population-structure";
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
    chart: {
      kind: "pie",
      caption:
        "A true partition: every person of working age falls in exactly one slice, and the four sum to 100% of the 15+ population.",
      centreValue: pct(occ.selfEmployed) === null ? undefined : `${pct(occ.selfEmployed)}%`,
      centreLabel: "self-employed",
      series: [
        { label: "Self-employed", value: pct(occ.selfEmployed) },
        { label: "Not in labour force (incl. students)", value: pct(occ.notInLabourForce) },
        { label: "Wage or salaried employment", value: pct(occ.wageEmployed) },
        { label: "Unemployed, seeking work", value: pct(occ.unemployed) },
      ],
      secondary: {
        kind: "bar",
        title: "Measured against a different denominator",
        series: [
          {
            label: "Youth (15–24) not in employment, education or training",
            value: pct(occ.youthNeet),
            muted: true,
            note: "Share of 15–24s, not of the 15+ population — which is why it sits outside the pie.",
          },
        ],
      },
    },
  };

  // Urban / rural, with the electrification gap that decides whether rural
  // populations can play at all. Electrification is weighted by the population
  // it describes, not by total population.
  const st = continentalSettlement(snap.metrics);
  const gaps = widestElectricityGaps(snap.metrics, 4);
  // Below 10% a whole-number round turns 0.8% into "1%", which reads as a
  // rounding artefact rather than near-total absence of grid power.
  const acc = (v: number | null) => (v === null ? "N/A" : `${v < 10 ? v.toFixed(1) : v.toFixed(0)}%`);

  const settlement: GamerCategory = {
    id: "urban",
    title: "Urban vs rural",
    question: "Where do people live, and where is playing even possible?",
    icon: "globe",
    accent: "violet",
    provenance: "partial",
    headline: pct(st.electricityGap) === null ? null : `${pct(st.electricityGap)}pp`,
    headlineLabel: "Urban–rural electrification gap",
    stats: [
      {
        label: "Living in urban areas",
        value: pct(st.urbanPct),
        unit: "%",
        sourceId: "worldbankWdi",
        note: st.urbanPopulation ? `About ${Math.round(st.urbanPopulation / 1e6)}M people.` : undefined,
      },
      {
        label: "Living in rural areas",
        value: pct(st.ruralPct),
        unit: "%",
        sourceId: "worldbankWdi",
        note: st.ruralPopulation ? `About ${Math.round(st.ruralPopulation / 1e6)}M people.` : undefined,
      },
      {
        label: "Electricity access — urban",
        value: pct(st.electricityUrban),
        unit: "%",
        sourceId: "worldbankWdi",
        note: "Weighted by urban population.",
      },
      {
        label: "Electricity access — rural",
        value: pct(st.electricityRural),
        unit: "%",
        sourceId: "worldbankWdi",
        note: "Weighted by rural population. Power is the gate before device, data or content — without it there is no play.",
      },
      {
        label: "Urban population growth per year",
        value: pct(st.urbanGrowth),
        unit: "%",
        sourceId: "worldbankWdi",
        note: "Cities absorb people faster than the population grows, so the reachable audience expands through migration as well as birth.",
      },
      ...gaps.map((g) => ({
        label: `Widest gap — ${g.name}: urban ${acc(g.electricityUrban)} vs rural ${acc(g.electricityRural)}`,
        value: pct(g.electricityGap),
        unit: "pp" as const,
        sourceId: "worldbankWdi",
        note: "Percentage-point gap between urban and rural electrification.",
      })),
    ],
    gap:
      "These are POPULATION figures, not gamers. No free survey splits African gamers by settlement type — and mobile-survey recruitment systematically under-reaches rural respondents, so even a commissioned study needs careful weighting before its urban/rural split can be trusted.",
    wouldNeed:
      "A survey cut by settlement type with rural weighting, or telemetry geolocated at a finer grain than country level.",
  };

  // Educational attainment. The World Bank ladder is CUMULATIVE ("at least
  // completed X"), so it is differenced into exclusive buckets, and weighted by
  // the 25+ population the indicators actually describe.
  const edu = continentalEducation(snap.metrics);
  const degreeLeaders = topByDegree(snap.metrics, 4);

  const education: GamerCategory = {
    id: "education",
    title: "Education level",
    question: "What schooling has the adult population completed?",
    icon: "book",
    accent: "blue",
    provenance: "partial",
    headline: pct(edu.bachelorPlus) === null ? null : `${pct(edu.bachelorPlus)}%`,
    headlineLabel: "Hold a degree, share of 25+ population",
    stats: [
      {
        label: "Did not complete primary school",
        value: pct(edu.lessThanPrimary),
        unit: "%",
        sourceId: "worldbankEdu",
        note: "The single largest group. A floor on the addressable market for any text-heavy game or tool.",
      },
      {
        label: "Completed primary, no lower secondary",
        value: pct(edu.primaryOnly),
        unit: "%",
        sourceId: "worldbankEdu",
      },
      {
        label: "Completed lower secondary, no upper secondary",
        value: pct(edu.lowerSecondaryOnly),
        unit: "%",
        sourceId: "worldbankEdu",
      },
      {
        label: "Completed upper secondary, no degree",
        value: pct(edu.upperSecondaryOnly),
        unit: "%",
        sourceId: "worldbankEdu",
        note: "Includes post-secondary non-tertiary and short-cycle tertiary — the diploma and technical-certificate route most vocational art and code training runs through.",
      },
      {
        label: "Hold a bachelor's degree or higher",
        value: pct(edu.bachelorPlus),
        unit: "%",
        sourceId: "worldbankEdu",
        note: "The closest free read on a formally-credentialled talent pool.",
      },
      {
        label: "Youth literacy (15–24)",
        value: pct(edu.youthLiteracy),
        unit: "%",
        sourceId: "worldbankEdu",
        note: "The pipeline, not the stock — and the more relevant figure for an audience that skews young.",
      },
      {
        label: "Adult literacy (15+)",
        value: pct(edu.adultLiteracy),
        unit: "%",
        sourceId: "worldbankEdu",
        note:
          edu.youthLiteracy !== null && edu.adultLiteracy !== null
            ? `Youth literacy runs ${(edu.youthLiteracy - edu.adultLiteracy).toFixed(1)}pp ahead of the adult rate, which is the schooling expansion showing up in the data.`
            : undefined,
      },
      {
        label: "Government education spending, % of GDP",
        value: pct(edu.eduSpendGdp),
        unit: "%",
        sourceId: "worldbankEdu",
        note: "Weighted by GDP, since the indicator is itself a share of GDP.",
      },
      ...degreeLeaders.map((d) => ({
        label: `Highest degree share — ${d.name}`,
        value: pct(d.bachelorPlus),
        unit: "%" as const,
        sourceId: "worldbankEdu",
        note: `Against ${pct(d.lessThanPrimary) ?? "N/A"}% who did not complete primary — attainment is polarised, not uniformly low.`,
      })),
    ],
    gap:
      `These are POPULATION figures, not gamers, and they describe the 25+ population — while African gamers skew 16–35, a younger and better-schooled cohort, so their mix is almost certainly higher than shown. The five attainment buckets are differenced from a cumulative "at least completed X" ladder and cover ${edu.countriesInBuckets} of 54 countries with a complete ladder.`,
    wouldNeed:
      "A survey crossing gaming participation with educational attainment. No free source publishes one for African markets.",
    chart: {
      kind: "pie",
      caption: `A true partition, differenced from the cumulative “at least completed X” ladder so nobody is counted twice: the five slices sum to 100% of the 25+ population across the ${edu.countriesInBuckets} countries with a complete ladder.`,
      centreValue: pct(edu.bachelorPlus) === null ? undefined : `${pct(edu.bachelorPlus)}%`,
      centreLabel: "hold a degree",
      series: [
        { label: "Did not complete primary", value: pct(edu.lessThanPrimary) },
        { label: "Primary only", value: pct(edu.primaryOnly) },
        { label: "Lower secondary only", value: pct(edu.lowerSecondaryOnly) },
        { label: "Upper secondary, no degree", value: pct(edu.upperSecondaryOnly) },
        { label: "Bachelor's degree or higher", value: pct(edu.bachelorPlus) },
      ],
      secondary: {
        kind: "bar",
        title: "Literacy and investment (not part of the partition)",
        series: [
          { label: "Youth literacy (15–24)", value: pct(edu.youthLiteracy) },
          { label: "Adult literacy (15+)", value: pct(edu.adultLiteracy) },
          {
            label: "Government education spending, % of GDP",
            value: pct(edu.eduSpendGdp),
            muted: true,
            note: "A share of GDP, not of people — shown on the same axis only for compactness.",
          },
        ],
      },
    },
  };

  // Age and gender: no free source publishes a numeric split for African
  // GAMERS, only the qualitative "mostly 16-35" and "largely male". What can be
  // charted is the population they are drawn from — a different quantity, and
  // both cards say so rather than passing it off as a gamer statistic.
  const age = continentalAgeStructure(snap.metrics);
  const sex = continentalSexStructure(snap.metrics);

  const ageCategory: GamerCategory = {
    id: "age",
    title: "Age distribution",
    question: "How old are African gamers?",
    icon: "users",
    accent: "emerald",
    provenance: "partial",
    headline: pct(age.age15to24) === null ? null : `${pct(age.age15to24)}%`,
    headlineLabel: "Population aged 15–24",
    stats: [
      {
        label: "Under 15",
        value: pct(age.under15),
        unit: "%",
        sourceId: "worldbankWdi",
        note: "Below the age most published gaming research samples.",
      },
      { label: "15–24", value: pct(age.age15to24), unit: "%", sourceId: "worldbankWdi" },
      { label: "25–64", value: pct(age.age25to64), unit: "%", sourceId: "worldbankWdi" },
      { label: "65 and over", value: pct(age.age65plus), unit: "%", sourceId: "worldbankWdi" },
      {
        label: "Majority of African gamers fall in the 16–35 band",
        value: null,
        unit: "%",
        sourceId: "newzooCarry1st",
        note: "Published as a band, not as a numeric split by bracket. It straddles the 15–24 and 25–64 rows above and cannot be resolved into them without inventing the boundary.",
      },
    ],
    gap:
      "The pie is POPULATION age structure, not gamers. No free source publishes an age-bracket split for African gamers — only the qualitative 16–35 band, which straddles two of these slices and cannot be split between them without inventing numbers.",
    wouldNeed:
      "A licensed Newzoo or GeoPoll data cut, or first-party telemetry from a publisher such as Carry1st or Maliyo.",
    chart: {
      kind: "pie",
      caption:
        "Population age structure — a true partition of everyone alive, weighted by country population. This is the pool gamers are drawn from, NOT a measured age split of gamers themselves.",
      centreValue: pct(age.age15to24) === null ? undefined : `${pct(age.age15to24)}%`,
      centreLabel: "aged 15–24",
      series: [
        { label: "Under 15", value: pct(age.under15) },
        { label: "15–24", value: pct(age.age15to24) },
        { label: "25–64", value: pct(age.age25to64) },
        { label: "65 and over", value: pct(age.age65plus) },
      ],
    },
  };

  const genderCategory: GamerCategory = {
    id: "gender",
    title: "Gender",
    question: "What is the gender split among African gamers?",
    icon: "users",
    accent: "violet",
    provenance: "partial",
    headline: pct(sex.female) === null ? null : `${pct(sex.female)}%`,
    headlineLabel: "Female share of population",
    stats: [
      { label: "Female", value: pct(sex.female), unit: "%", sourceId: "worldbankWdi" },
      { label: "Male", value: pct(sex.male), unit: "%", sourceId: "worldbankWdi" },
      {
        label: "Gamers described as “largely but not entirely male”",
        value: null,
        unit: "%",
        sourceId: "newzooCarry1st",
        note: "Published as a direction of skew. No numeric male/female split for African gamers appears in any free source.",
      },
    ],
    gap:
      "The pie is the POPULATION sex split, which is near-even. The gamer split is not — it is reported as male-skewed, but no free source puts a number on it, so the size of that skew is unknown. Reading the population figure as a gamer figure would be exactly the error this card exists to prevent.",
    wouldNeed:
      "The full Newzoo × Carry1st report or a GeoPoll data cut. Global comparators exist but do not transfer to African markets.",
    chart: {
      kind: "pie",
      caption:
        "Population sex split, weighted by country population — near-even, and deliberately NOT presented as the gamer split, which is reported as male-skewed by an unpublished margin.",
      centreValue: pct(sex.female) === null ? undefined : `${pct(sex.female)}%`,
      centreLabel: "female",
      series: [
        { label: "Female", value: pct(sex.female) },
        { label: "Male", value: pct(sex.male) },
      ],
    },
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

      <DemographicsTabs countries={countries} occupation={occupation} settlement={settlement} education={education} age={ageCategory} gender={genderCategory} />
    </div>
  );
}
