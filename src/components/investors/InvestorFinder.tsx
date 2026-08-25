"use client";

import { useState } from "react";
import Link from "next/link";
import { flagEmoji } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { ConfidenceBadge, RankBadge } from "@/components/ui/primitives";
import { fmtScore } from "@/lib/format";
import type { Confidence, RankingMode } from "@/lib/types";

export interface IntentData {
  key: string;
  label: string;
  question: string;
  mode: RankingMode;
  top: {
    iso3: string;
    iso2: string;
    name: string;
    total: number;
    confidence: Confidence;
    drivers: { label: string; score: number }[];
    gdpPerCapita: number | null;
    internet: number | null;
    gdpGrowth: number | null;
  }[];
}

export function InvestorFinder({ data }: { data: IntentData[] }) {
  const [key, setKey] = useState(data[0]!.key);
  const intent = data.find((d) => d.key === key)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {data.map((d) => (
          <button
            key={d.key}
            onClick={() => setKey(d.key)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              d.key === key
                ? "border-gold-500/50 bg-gold-500/15 text-gold-300"
                : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-line bg-ink-850/60 p-5">
        <p className="eyebrow">{intent.question}</p>
        <h3 className="display mt-1 text-2xl text-white">Top markets · {intent.label}</h3>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {intent.top.map((r, i) => (
            <div key={r.iso3} className="rounded-lg border border-line bg-ink-900/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <RankBadge rank={i + 1} />
                  <Link href={`/countries/${r.iso3.toLowerCase()}`} className="text-base font-semibold text-slate-100 hover:text-gold-400">
                    {flagEmoji(r.iso2)} {r.name}
                  </Link>
                </div>
                <span className="figure text-xl font-bold text-gold-400">{fmtScore(r.total)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.drivers.map((d) => (
                  <span key={d.label} className="rounded-full border border-emerald2-500/25 bg-emerald2-500/10 px-2 py-0.5 text-[11px] text-emerald2-300">
                    {d.label} {fmtScore(d.score)}
                  </span>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
                <Rationale label="GDP/cap" iso3={r.iso3} metricId="gdp_per_capita" value={r.gdpPerCapita} unit="US$" />
                <Rationale label="Internet" iso3={r.iso3} metricId="internet_pct" value={r.internet} unit="%" />
                <Rationale label="Growth" iso3={r.iso3} metricId="gdp_growth" value={r.gdpGrowth} unit="%" />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Data confidence</span>
                <ConfidenceBadge confidence={r.confidence} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-slate-500">
          Rankings are leading indicators from verified free data, not investment advice. Low
          confidence flags markets where thin data should temper conclusions.
        </p>
      </div>
    </div>
  );
}

function Rationale({
  label,
  iso3,
  metricId,
  value,
  unit,
}: {
  label: string;
  iso3: string;
  metricId: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <div className="text-sm">
        <MetricNumber metricId={metricId} iso3={iso3} value={value} unit={unit} />
      </div>
    </div>
  );
}
