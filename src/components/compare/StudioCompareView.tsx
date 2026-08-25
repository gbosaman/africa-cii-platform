"use client";

import { useState } from "react";
import Link from "next/link";
import { flagEmoji } from "@/lib/data/countries";
import { ScoreBar } from "@/components/ui/primitives";
import { fmtScore } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

export interface StudioCompareData {
  id: string;
  name: string;
  country: string;
  iso2: string;
  city: string | null;
  foundedYear: number | null;
  categories: string[];
  engines: string[] | null;
  gamesCount: number;
  total: number | null;
  coverage: number;
  dimensions: { key: string; label: string; score: number | null }[];
}

export function StudioCompareView({
  studios,
  preset,
}: {
  studios: StudioCompareData[];
  preset: string[];
}) {
  const [selected, setSelected] = useState<string[]>(preset.slice(0, 3));
  const cols = selected.map((id) => studios.find((s) => s.id === id)!).filter(Boolean);

  const add = (id: string) => {
    if (id && !selected.includes(id) && selected.length < 3) setSelected([...selected, id]);
  };
  const remove = (id: string) => setSelected(selected.filter((x) => x !== id));

  // Advantage detection per dimension: who has the strictly-highest score.
  const dimKeys = studios[0]?.dimensions.map((d) => ({ key: d.key, label: d.label })) ?? [];
  const leaderFor = (key: string): string | null => {
    const scored = cols
      .map((c) => ({ id: c.id, s: c.dimensions.find((d) => d.key === key)?.score ?? null }))
      .filter((x): x is { id: string; s: number } => x.s !== null);
    if (scored.length < 2) return null;
    const top = Math.max(...scored.map((x) => x.s));
    const leaders = scored.filter((x) => x.s === top);
    return leaders.length === 1 ? leaders[0]!.id : null;
  };

  const advantages = (id: string) =>
    dimKeys.filter((d) => leaderFor(d.key) === id).map((d) => d.label);

  return (
    <div className="space-y-5">
      {/* Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {cols.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-sm text-gold-300">
            {flagEmoji(c.iso2)} {c.name}
            <button onClick={() => remove(c.id)} aria-label={`Remove ${c.name}`}>
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {selected.length < 3 && (
          <select
            onChange={(e) => { add(e.target.value); e.target.value = ""; }}
            defaultValue=""
            className="rounded-lg border border-line bg-ink-850 px-3 py-1.5 text-sm text-slate-300"
          >
            <option value="" disabled>+ Add studio</option>
            {studios.filter((s) => !selected.includes(s.id)).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {cols.length < 2 ? (
        <p className="text-sm text-slate-500">Select at least two studios to compare.</p>
      ) : (
        <>
          {/* Comparison table */}
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-ink-850">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Attribute</th>
                  {cols.map((c) => (
                    <th key={c.id} className="px-4 py-3 text-right">
                      <Link href={`/studios/${c.id}`} className="font-semibold text-slate-100 hover:text-gold-400">
                        {flagEmoji(c.iso2)} {c.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <Row label="Strength score" cols={cols} render={(c) => (
                  <span className="figure font-bold text-gold-400">{c.total === null ? "—" : fmtScore(c.total)}</span>
                )} />
                <Row label="Data coverage" cols={cols} render={(c) => `${Math.round(c.coverage * 100)}%`} />
                <Row label="Country" cols={cols} render={(c) => c.country} />
                <Row label="Founded" cols={cols} render={(c) => c.foundedYear ?? "N/A"} />
                <Row label="Recorded games" cols={cols} render={(c) => c.gamesCount || "N/A"} />
                <Row label="Engines" cols={cols} render={(c) => c.engines?.join(", ") ?? "N/A"} />
                <Row label="Categories" cols={cols} render={(c) => c.categories.slice(0, 3).join(", ")} />
                {dimKeys.map((d) => (
                  <tr key={d.key} className="hover:bg-ink-800/40">
                    <td className="px-4 py-2.5 text-slate-400">{d.label}</td>
                    {cols.map((c) => {
                      const score = c.dimensions.find((x) => x.key === d.key)?.score ?? null;
                      const isLeader = leaderFor(d.key) === c.id;
                      return (
                        <td key={c.id} className={`px-4 py-2.5 ${isLeader ? "bg-emerald2-500/10" : ""}`}>
                          <div className="flex items-center justify-end gap-2">
                            <span className="w-14"><ScoreBar value={score} /></span>
                            <span className="figure w-9 text-right text-slate-200">
                              {score === null ? <span className="text-slate-500">N/A</span> : fmtScore(score)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Advantages */}
          <div className="grid gap-4 md:grid-cols-3">
            {cols.map((c) => {
              const adv = advantages(c.id);
              return (
                <div key={c.id} className="rounded-xl border border-line bg-ink-850/60 p-4">
                  <p className="text-sm font-semibold text-white">{c.name} leads in</p>
                  {adv.length ? (
                    <ul className="mt-2 space-y-1 text-sm text-emerald2-300">
                      {adv.map((a) => (
                        <li key={a} className="flex gap-2"><span>▸</span>{a}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No clear single-metric lead on available data.</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            Green = strictly-highest on that dimension among the selected studios (ties excluded). N/A
            dimensions await Phase 2–4 verified sources.
          </p>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  cols,
  render,
}: {
  label: string;
  cols: StudioCompareData[];
  render: (c: StudioCompareData) => React.ReactNode;
}) {
  return (
    <tr className="hover:bg-ink-800/40">
      <td className="px-4 py-2.5 text-slate-400">{label}</td>
      {cols.map((c) => (
        <td key={c.id} className="px-4 py-2.5 text-right text-slate-200">{render(c)}</td>
      ))}
    </tr>
  );
}
