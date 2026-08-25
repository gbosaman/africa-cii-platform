"use client";

import { useState } from "react";

export type ProvenanceTier = "live" | "analytical" | "historical";

export interface ExecKpi {
  label: string;
  value: string;
  tier: ProvenanceTier;
  accent: "emerald" | "blue" | "violet" | "orange";
  sub?: string;
  /** When present, the card links through to that metric's source lineage. */
  metricId?: string;
}

const TIER_STYLE: Record<ProvenanceTier, string> = {
  live: "border-accent-500/40 bg-accent-500/10 text-accent-400",
  analytical: "border-info-500/40 bg-info-500/10 text-info-400",
  historical: "border-slate-500/30 bg-slate-500/10 text-slate-400",
};

const TIER_LABEL: Record<ProvenanceTier, string> = {
  live: "Live",
  analytical: "Analytical",
  historical: "Historical",
};

const TIER_EXPLAIN: Record<ProvenanceTier, string> = {
  live: "Read directly from a verified source series.",
  analytical: "Computed by this platform from verified inputs — the formula is on the methodology page.",
  historical: "Verified, but the latest published observation is several years old.",
};

/**
 * Headline indicator grid. Every card wears its provenance tier, because a
 * number computed by us and a number read from the World Bank are different
 * kinds of claim and should not look identical.
 */
export function ExecKpiGrid({ kpis }: { kpis: ExecKpi[] }) {
  const [filter, setFilter] = useState<ProvenanceTier | "all">("all");
  const shown = filter === "all" ? kpis : kpis.filter((k) => k.tier === filter);
  const tiers: (ProvenanceTier | "all")[] = ["all", "live", "analytical"];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              filter === t
                ? "border-accent-500/50 bg-accent-500/15 text-accent-400"
                : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {t === "all" ? "All" : TIER_LABEL[t]}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-slate-500">
          {filter === "all" ? `${kpis.length} indicators` : TIER_EXPLAIN[filter as ProvenanceTier]}
        </span>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]">
        {shown.map((k) => (
          <div key={k.label} className="panel kpi p-[18px]" data-accent={k.accent}>
            <span className={`pill ${TIER_STYLE[k.tier]}`} title={TIER_EXPLAIN[k.tier]}>
              {k.tier === "live" && <span className="dot-live" />}
              {TIER_LABEL[k.tier]}
            </span>
            <p className="figure mt-3 text-2xl font-bold text-white">{k.value}</p>
            <p className="mt-1 text-[12.5px] font-medium text-slate-400">{k.label}</p>
            {k.sub && <p className="mt-0.5 text-[11px] text-slate-500">{k.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
