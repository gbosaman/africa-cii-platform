"use client";

import { useState } from "react";
import Link from "next/link";
import { flagEmoji } from "@/lib/data/countries";
import { ScoreBar, RankBadge, ConfidenceBadge } from "@/components/ui/primitives";
import { fmtScore } from "@/lib/format";
import type { Confidence } from "@/lib/types";

export type ModeKey =
  | "market_attractiveness"
  | "distribution"
  | "production"
  | "hiring"
  | "investment"
  | "esports"
  | "animation";

export interface RankingRow {
  iso3: string;
  iso2: string;
  name: string;
  region: string;
  rank: number;
  total: number;
  coverage: number;
  confidence: Confidence;
  components: { label: string; score: number | null; weight: number }[];
}

export function RankingsView({
  data,
  modes,
  initialMode,
}: {
  data: Record<ModeKey, RankingRow[]>;
  modes: { key: ModeKey; label: string; blurb: string }[];
  initialMode: ModeKey;
}) {
  const [mode, setMode] = useState<ModeKey>(initialMode);
  const [expanded, setExpanded] = useState<string | null>(null);
  const rows = data[mode];
  const active = modes.find((m) => m.key === mode)!;
  const max = rows[0]?.total ?? 100;

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-1.5">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => {
              setMode(m.key);
              setExpanded(null);
            }}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              m.key === mode
                ? "border-gold-500/50 bg-gold-500/15 text-gold-400"
                : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="rounded-lg border border-line bg-ink-850/60 px-4 py-3 text-sm text-slate-300">
        <span className="font-semibold text-white">{active.label}. </span>
        {active.blurb}
      </p>

      {/* Top-10 bar chart */}
      <div className="panel p-5">
        <p className="eyebrow mb-4">Top 10</p>
        <div className="space-y-2.5">
          {rows.slice(0, 10).map((r) => (
            <div key={r.iso3} className="flex items-center gap-3">
              <span className="w-6 text-right text-xs text-slate-500">{r.rank}</span>
              <span>{flagEmoji(r.iso2)}</span>
              <Link
                href={`/countries/${r.iso3.toLowerCase()}`}
                className="w-28 shrink-0 truncate text-sm font-medium text-slate-200 hover:text-gold-400"
              >
                {r.name}
              </Link>
              <div className="h-6 flex-1 overflow-hidden rounded bg-ink-700">
                <div
                  className="flex h-full items-center justify-end rounded bg-gradient-to-r from-gold-600 to-gold-400 px-2"
                  style={{ width: `${(r.total / max) * 100}%` }}
                >
                  <span className="figure text-xs font-bold text-ink-900">{fmtScore(r.total)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full ranked list, expandable breakdown */}
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 bg-ink-850 px-4 py-2 text-xs text-slate-400">
          <span>#</span>
          <span>Country</span>
          <span className="text-right">Coverage</span>
          <span className="text-right">Score</span>
        </div>
        <div className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.iso3}>
              <button
                onClick={() => setExpanded(expanded === r.iso3 ? null : r.iso3)}
                className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-2.5 text-left hover:bg-ink-800/60"
              >
                <RankBadge rank={r.rank} />
                <span className="flex items-center gap-2 text-sm font-medium text-slate-100">
                  {flagEmoji(r.iso2)} {r.name}
                  <span className="text-[10px] text-slate-500">{r.region.replace(" Africa", "")}</span>
                </span>
                <span className="figure text-right text-xs text-slate-400">
                  {Math.round(r.coverage * 100)}%
                </span>
                <span className="figure w-12 text-right text-sm font-bold text-gold-400">
                  {fmtScore(r.total)}
                </span>
              </button>
              {expanded === r.iso3 && (
                <div className="border-t border-line bg-ink-900/60 px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="eyebrow">Dimension breakdown</p>
                    <ConfidenceBadge confidence={r.confidence} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {r.components.map((c) => (
                      <div key={c.label}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-slate-400">
                            {c.label} <span className="text-slate-600">·{(c.weight * 100).toFixed(0)}%</span>
                          </span>
                          <span className="figure text-slate-200">
                            {c.score === null ? <span className="text-slate-500">N/A</span> : fmtScore(c.score)}
                          </span>
                        </div>
                        <ScoreBar value={c.score} />
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/countries/${r.iso3.toLowerCase()}`}
                    className="mt-4 inline-block text-xs font-medium text-gold-400 hover:text-gold-500"
                  >
                    Full country intelligence →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
