"use client";

import { useState } from "react";
import { flagEmoji } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { fmtScore } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

interface CountryOpt { iso3: string; iso2: string; name: string }
interface MetricOpt { id: string; label: string; unit: string }

export function CompareView({
  countries,
  metrics,
  values,
  marketScore,
  preset,
}: {
  countries: CountryOpt[];
  metrics: MetricOpt[];
  values: Record<string, Record<string, number | null>>;
  marketScore: Record<string, number>;
  preset: string[];
}) {
  const [selected, setSelected] = useState<string[]>(preset.slice(0, 4));

  const add = (iso3: string) => {
    if (selected.includes(iso3) || selected.length >= 4) return;
    setSelected([...selected, iso3]);
  };
  const remove = (iso3: string) => setSelected(selected.filter((x) => x !== iso3));

  const cols = selected.map((iso3) => countries.find((c) => c.iso3 === iso3)!);

  const extremes = (metricId: string) => {
    const vals = selected
      .map((iso3) => values[metricId]?.[iso3] ?? null)
      .filter((v): v is number => v !== null);
    if (vals.length < 2) return { hi: null, lo: null };
    return { hi: Math.max(...vals), lo: Math.min(...vals) };
  };

  return (
    <div className="space-y-5">
      {/* Selector */}
      <div className="flex flex-wrap items-center gap-2">
        {cols.map((c) => (
          <span key={c.iso3} className="inline-flex items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-sm text-gold-300">
            {flagEmoji(c.iso2)} {c.name}
            <button onClick={() => remove(c.iso3)} aria-label={`Remove ${c.name}`}>
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        {selected.length < 4 && (
          <select
            onChange={(e) => {
              add(e.target.value);
              e.target.value = "";
            }}
            defaultValue=""
            className="rounded-lg border border-line bg-ink-850 px-3 py-1.5 text-sm text-slate-300"
          >
            <option value="" disabled>+ Add country</option>
            {countries
              .filter((c) => !selected.includes(c.iso3))
              .map((c) => (
                <option key={c.iso3} value={c.iso3}>{c.name}</option>
              ))}
          </select>
        )}
      </div>

      {selected.length === 0 ? (
        <p className="text-sm text-slate-500">Add countries to compare.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-ink-850">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Metric</th>
                {cols.map((c) => (
                  <th key={c.iso3} className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1.5 font-semibold text-slate-100">
                      {flagEmoji(c.iso2)} {c.iso3}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {/* Market score row */}
              <tr className="bg-ink-900/40">
                <td className="px-4 py-2.5 font-medium text-slate-300">Market score</td>
                {cols.map((c) => {
                  const v = marketScore[c.iso3] ?? null;
                  const all = selected.map((i) => marketScore[i] ?? -1);
                  const isHi = v !== null && v === Math.max(...all);
                  return (
                    <td key={c.iso3} className={`px-4 py-2.5 text-right figure font-bold ${isHi ? "text-gold-400" : "text-slate-200"}`}>
                      {fmtScore(v)}
                    </td>
                  );
                })}
              </tr>
              {metrics.map((m) => {
                const { hi, lo } = extremes(m.id);
                return (
                  <tr key={m.id} className="hover:bg-ink-800/40">
                    <td className="px-4 py-2.5 text-slate-400">{m.label}</td>
                    {cols.map((c) => {
                      const v = values[m.id]?.[c.iso3] ?? null;
                      const isHi = v !== null && v === hi && hi !== lo;
                      const isLo = v !== null && v === lo && hi !== lo;
                      return (
                        <td
                          key={c.iso3}
                          className={`px-4 py-2.5 text-right ${
                            isHi ? "bg-emerald2-500/10" : isLo ? "bg-orange-500/5" : ""
                          }`}
                        >
                          <MetricNumber metricId={m.id} iso3={c.iso3} value={v} unit={m.unit} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate-500">
        <span className="rounded bg-emerald2-500/10 px-1.5 py-0.5 text-emerald2-400">Green</span> = highest,{" "}
        <span className="rounded bg-orange-500/5 px-1.5 py-0.5 text-orange-400">amber</span> = lowest among selected.
      </p>
    </div>
  );
}
