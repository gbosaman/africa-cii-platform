"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { flagEmoji, REGIONS } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { Panel, SectionHeader, Pill, DataUnavailable } from "@/components/ui/primitives";
import { fmtValue } from "@/lib/format";

export interface DemoCountry {
  iso3: string;
  iso2: string;
  name: string;
  region: string;
  values: Record<string, number | null>;
  years: Record<string, number | null>;
}

/** One panel of the profile: a set of related indicators. */
const PANELS: {
  title: string;
  eyebrow: string;
  accent: "emerald" | "blue" | "violet" | "orange";
  rows: { key: string; label: string; unit: string }[];
}[] = [
  {
    title: "Age distribution",
    eyebrow: "Who is here now, and who is coming",
    accent: "emerald",
    rows: [
      { key: "youth_pct", label: "0–14", unit: "%" },
      { key: "working_age_pct", label: "15–64", unit: "%" },
      { key: "pop_65_plus", label: "65+", unit: "%" },
    ],
  },
  {
    title: "Gender",
    eyebrow: "Population & workforce",
    accent: "violet",
    rows: [
      { key: "female_pct", label: "Female share of population", unit: "%" },
      { key: "labour_participation_female", label: "Female labour participation", unit: "%" },
      { key: "labour_participation", label: "Overall labour participation", unit: "%" },
    ],
  },
  {
    title: "Income",
    eyebrow: "Ability to spend, and how evenly",
    accent: "emerald",
    rows: [
      { key: "gni_per_capita", label: "GNI per capita", unit: "US$" },
      { key: "gini", label: "Gini index (inequality)", unit: "index" },
    ],
  },
  {
    title: "Education",
    eyebrow: "The talent pipeline",
    accent: "blue",
    rows: [
      { key: "literacy_pct", label: "Adult literacy", unit: "%" },
      { key: "secondary_enrolment", label: "Secondary enrolment", unit: "%" },
      { key: "tertiary_enrolment", label: "Tertiary enrolment", unit: "%" },
    ],
  },
  {
    title: "Employment",
    eyebrow: "Available labour, and its cost",
    accent: "orange",
    rows: [
      { key: "unemployment_pct", label: "Unemployment", unit: "%" },
      { key: "youth_unemployment_pct", label: "Youth unemployment (15–24)", unit: "%" },
    ],
  },
  {
    title: "Device & connectivity",
    eyebrow: "Can they actually reach you",
    accent: "blue",
    rows: [
      { key: "internet_pct", label: "Internet users", unit: "%" },
      { key: "mobile_per_100", label: "Mobile subscriptions", unit: "per 100" },
      { key: "electricity_pct", label: "Electricity access", unit: "%" },
    ],
  },
  {
    title: "Urban vs rural",
    eyebrow: "Where infrastructure reaches",
    accent: "violet",
    rows: [
      { key: "urban_pct", label: "Urban", unit: "%" },
      { key: "rural_pct", label: "Rural", unit: "%" },
    ],
  },
];

/** Indicators worth comparing across the continent. */
const COMPARE_KEYS: { key: string; label: string; unit: string; lowerIsBetter?: boolean }[] = [
  { key: "youth_pct", label: "Under-15 share", unit: "%" },
  { key: "working_age_pct", label: "Working-age share", unit: "%" },
  { key: "tertiary_enrolment", label: "Tertiary enrolment", unit: "%" },
  { key: "literacy_pct", label: "Adult literacy", unit: "%" },
  { key: "internet_pct", label: "Internet users", unit: "%" },
  { key: "gni_per_capita", label: "GNI per capita", unit: "US$" },
  { key: "urban_pct", label: "Urbanisation", unit: "%" },
  { key: "youth_unemployment_pct", label: "Youth unemployment", unit: "%", lowerIsBetter: true },
  { key: "gini", label: "Gini index", unit: "index", lowerIsBetter: true },
];

export function DemographicsView({ countries }: { countries: DemoCountry[] }) {
  const [iso3, setIso3] = useState("NGA");
  const [compareKey, setCompareKey] = useState(COMPARE_KEYS[0]!.key);
  const [region, setRegion] = useState("All");

  const country = countries.find((c) => c.iso3 === iso3) ?? countries[0]!;
  const compare = COMPARE_KEYS.find((c) => c.key === compareKey)!;

  const ranked = useMemo(() => {
    const list = countries
      .filter((c) => region === "All" || c.region === region)
      .map((c) => ({ ...c, v: c.values[compareKey] ?? null }))
      .filter((c) => c.v !== null) as (DemoCountry & { v: number })[];
    return list.sort((a, b) => (compare.lowerIsBetter ? a.v - b.v : b.v - a.v));
  }, [countries, compareKey, region, compare.lowerIsBetter]);

  const max = ranked.length ? Math.max(...ranked.map((r) => r.v)) : 1;
  const missing = countries.length - ranked.length;

  return (
    <div className="space-y-6">
      {/* Country profile */}
      <Panel>
        <SectionHeader
          eyebrow="Country profile"
          title={`${country.name} at a glance`}
          action={
            <select
              value={iso3}
              onChange={(e) => setIso3(e.target.value)}
              className="max-w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-200"
            >
              {countries.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.name}
                </option>
              ))}
            </select>
          }
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-2xl">{flagEmoji(country.iso2)}</span>
          <Pill tone="emerald">
            {fmtValue(country.values.population ?? null, "people")} people
          </Pill>
          <Pill>{country.region}</Pill>
          <Link
            href={`/countries/${country.iso3.toLowerCase()}`}
            className="text-xs font-medium text-accent-400 hover:text-accent-500"
          >
            Full country intelligence →
          </Link>
        </div>

        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {PANELS.map((p) => (
            <div key={p.title} className="panel kpi p-[18px]" data-accent={p.accent}>
              <p className="eyebrow">{p.eyebrow}</p>
              <h3 className="mt-1 text-sm font-semibold text-white">{p.title}</h3>
              <dl className="mt-3 space-y-2">
                {p.rows.map((r) => {
                  const v = country.values[r.key] ?? null;
                  const yr = country.years[r.key] ?? null;
                  return (
                    <div key={r.key} className="flex items-baseline justify-between gap-3">
                      <dt className="min-w-0 truncate text-xs text-slate-400" title={r.label}>
                        {r.label}
                        {yr ? <span className="ml-1 text-slate-600">{yr}</span> : null}
                      </dt>
                      <dd className="shrink-0 text-sm">
                        <MetricNumber
                          metricId={r.key}
                          iso3={country.iso3}
                          value={v}
                          unit={r.unit}
                        />
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}

          {/* The one category we will not fill in */}
          <div className="panel p-[18px]">
            <p className="eyebrow">Requires primary research</p>
            <h3 className="mt-1 text-sm font-semibold text-white">Play behaviour</h3>
            <div className="mt-3">
              <DataUnavailable label="Daily play hours, genre preference and gamer gender split — N/A" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              These need a player survey. We have not run one, and publishing someone else&apos;s
              survey under our provenance would be dishonest — so the field stays empty rather than
              estimated.
            </p>
          </div>
        </div>
      </Panel>

      {/* Continental comparison */}
      <Panel>
        <SectionHeader
          eyebrow={`Ranked across ${ranked.length} countries with data`}
          title={compare.label}
          action={
            <div className="flex flex-wrap gap-2">
              <select
                value={compareKey}
                onChange={(e) => setCompareKey(e.target.value)}
                className="max-w-full rounded-lg border border-line bg-ink-850 px-2.5 py-1.5 text-xs text-slate-200"
              >
                {COMPARE_KEYS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="max-w-full rounded-lg border border-line bg-ink-850 px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="All">All regions</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {compare.lowerIsBetter && (
          <p className="mb-3 text-[11px] text-slate-500">
            Sorted lowest-first — for this indicator a lower value is the better outcome.
          </p>
        )}

        <div className="space-y-1.5">
          {ranked.map((c, i) => (
            <div key={c.iso3} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-right text-xs text-slate-500">{i + 1}</span>
              <span>{flagEmoji(c.iso2)}</span>
              <button
                onClick={() => setIso3(c.iso3)}
                className={`w-32 shrink-0 truncate text-left text-sm transition-colors hover:text-accent-400 ${
                  c.iso3 === iso3 ? "font-semibold text-accent-400" : "text-slate-300"
                }`}
              >
                {c.name}
              </button>
              <div className="h-5 flex-1 overflow-hidden rounded bg-ink-700">
                <div
                  className="h-full rounded bg-gradient-to-r from-info-600 to-info-400"
                  style={{ width: `${Math.max(2, (c.v / max) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-sm">
                <MetricNumber metricId={compare.key} iso3={c.iso3} value={c.v} unit={compare.unit} />
              </span>
            </div>
          ))}
        </div>

        {missing > 0 && (
          <p className="mt-3 text-[11px] text-slate-500">
            {missing} {missing === 1 ? "country has" : "countries have"} no published value for this
            indicator and are omitted rather than plotted as zero.
          </p>
        )}
      </Panel>
    </div>
  );
}
