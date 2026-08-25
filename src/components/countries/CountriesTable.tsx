"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { flagEmoji, REGIONS } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { ScoreBar, RankBadge } from "@/components/ui/primitives";
import { fmtScore, fmtValue } from "@/lib/format";
import type { Confidence } from "@/lib/types";

export interface CountryRow {
  iso3: string;
  iso2: string;
  name: string;
  region: string;
  rank: number;
  score: number;
  coverage: number;
  confidence: Confidence;
  population: number | null;
  internet: number | null;
  gdpPerCapita: number | null;
  digital: number | null;
}

type SortKey = "score" | "name" | "population" | "internet" | "gdpPerCapita" | "digital";

export function CountriesTable({ rows }: { rows: CountryRow[] }) {
  const [region, setRegion] = useState<string>("All");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("score");
  const [dir, setDir] = useState<1 | -1>(-1);

  const filtered = useMemo(() => {
    let r = rows;
    if (region !== "All") r = r.filter((x) => x.region === region);
    if (q.trim()) r = r.filter((x) => x.name.toLowerCase().includes(q.trim().toLowerCase()));
    return [...r].sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      return (((av as number) ?? -Infinity) - ((bv as number) ?? -Infinity)) * dir;
    });
  }, [rows, region, q, sort, dir]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(key);
      setDir(key === "name" ? 1 : -1);
    }
  };

  const Th = ({ label, k, className = "" }: { label: string; k: SortKey; className?: string }) => (
    <th className={`px-3 py-2 text-right font-medium ${className}`}>
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-white ${sort === k ? "text-gold-400" : ""}`}
      >
        {label}
        {sort === k && <span>{dir === 1 ? "▲" : "▼"}</span>}
      </button>
    </th>
  );

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search countries…"
          className="rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold-500/40 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1">
          {["All", ...REGIONS].map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                region === r
                  ? "border-gold-500/50 bg-gold-500/15 text-gold-400"
                  : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {r === "All" ? "All regions" : r.replace(" Africa", "")}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} shown</span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-line md:block">
        <table className="w-full text-sm">
          <thead className="bg-ink-850 text-xs text-slate-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">
                <button
                  onClick={() => toggleSort("name")}
                  className={`hover:text-white ${sort === "name" ? "text-gold-400" : ""}`}
                >
                  Country
                </button>
              </th>
              <Th label="Market" k="score" />
              <Th label="Digital" k="digital" />
              <Th label="Population" k="population" />
              <Th label="Internet %" k="internet" />
              <Th label="GDP/cap" k="gdpPerCapita" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((r) => (
              <tr key={r.iso3} className="group hover:bg-ink-800/60">
                <td className="px-3 py-2">
                  <RankBadge rank={r.rank} />
                </td>
                <td className="px-3 py-2">
                  <Link href={`/countries/${r.iso3.toLowerCase()}`} className="flex items-center gap-2 font-medium text-slate-100 hover:text-gold-400">
                    <span>{flagEmoji(r.iso2)}</span>
                    {r.name}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <span className="w-16"><ScoreBar value={r.score} /></span>
                    <span className="figure w-9 text-right font-semibold text-gold-400">{fmtScore(r.score)}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right figure text-emerald2-400">{fmtScore(r.digital)}</td>
                <td className="px-3 py-2 text-right">
                  <MetricNumber metricId="population" iso3={r.iso3} value={r.population} unit="people" />
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricNumber metricId="internet_pct" iso3={r.iso3} value={r.internet} unit="%" />
                </td>
                <td className="px-3 py-2 text-right">
                  <MetricNumber metricId="gdp_per_capita" iso3={r.iso3} value={r.gdpPerCapita} unit="US$" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {filtered.map((r) => (
          <Link
            key={r.iso3}
            href={`/countries/${r.iso3.toLowerCase()}`}
            className="flex items-center gap-3 rounded-lg border border-line bg-ink-850/60 p-3"
          >
            <RankBadge rank={r.rank} />
            <span className="text-lg">{flagEmoji(r.iso2)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-100">{r.name}</p>
              <ScoreBar value={r.score} />
            </div>
            <span className="figure text-sm font-bold text-gold-400">{fmtScore(r.score)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
