"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { flagEmoji, REGIONS } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { fmtValue, freshnessFromYear, FRESHNESS_META } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import clsx from "clsx";

interface CountryOpt { iso3: string; iso2: string; name: string; region: string }
interface MetricOpt { id: string; label: string; unit: string; wb: string }
type Rows = Record<string, Record<string, { value: number | null; year: number }>>;

export function ExplorerView({
  countries,
  metrics,
  rows,
}: {
  countries: CountryOpt[];
  metrics: MetricOpt[];
  rows: Rows;
}) {
  const [metricId, setMetricId] = useState(metrics[0]!.id);
  const [region, setRegion] = useState("All");
  const [dir, setDir] = useState<1 | -1>(-1);

  const metric = metrics.find((m) => m.id === metricId)!;

  const data = useMemo(() => {
    const list = countries
      .filter((c) => region === "All" || c.region === region)
      .map((c) => ({ ...c, ...rows[metricId]![c.iso3]! }));
    return list.sort((a, b) => (((a.value ?? -Infinity) - (b.value ?? -Infinity)) * dir));
  }, [countries, rows, metricId, region, dir]);

  const withValues = data.filter((d) => d.value !== null).map((d) => d.value as number);
  const max = withValues.length ? Math.max(...withValues) : 1;

  const download = (kind: "csv" | "json") => {
    const payload = data.map((d) => ({
      iso3: d.iso3,
      country: d.name,
      metric: metric.label,
      value: d.value,
      unit: metric.unit,
      year: d.year || null,
      source: "World Bank WDI",
      indicator: metric.wb,
    }));
    let blob: Blob;
    if (kind === "csv") {
      const head = "iso3,country,metric,value,unit,year,source,indicator";
      const body = payload
        .map((p) => `${p.iso3},"${p.country}","${p.metric}",${p.value ?? ""},${p.unit},${p.year ?? ""},"${p.source}",${p.indicator}`)
        .join("\n");
      blob = new Blob([head + "\n" + body], { type: "text/csv" });
    } else {
      blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${metric.id}_${region.replace(/\s/g, "")}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={metricId}
          onChange={(e) => setMetricId(e.target.value)}
          className="w-full min-w-0 max-w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100 focus:border-gold-500/40 focus:outline-none sm:w-auto"
        >
          {metrics.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="min-w-0 max-w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100"
        >
          <option value="All">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={() => setDir((d) => (d === 1 ? -1 : 1))}
          className="rounded-lg border border-line bg-ink-800 px-3 py-2 text-sm text-slate-300 hover:text-white"
        >
          {dir === -1 ? "High → Low" : "Low → High"}
        </button>
        <div className="ml-auto flex gap-2">
          <button onClick={() => download("csv")} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-800 px-3 py-2 text-sm text-slate-200 hover:border-gold-500/40">
            <Icon name="download" className="h-4 w-4" /> CSV
          </button>
          <button onClick={() => download("json")} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-800 px-3 py-2 text-sm text-slate-200 hover:border-gold-500/40">
            <Icon name="download" className="h-4 w-4" /> JSON
          </button>
        </div>
      </div>

      {/* Ranked bars */}
      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">{metric.label}</p>
          <span className="figure text-[11px] text-slate-500">{metric.wb}</span>
        </div>
        <div className="space-y-1.5">
          {data.map((d) => {
            const fresh = freshnessFromYear(d.year);
            return (
              <div key={d.iso3} className="flex items-center gap-3">
                <Link href={`/countries/${d.iso3.toLowerCase()}`} className="flex w-32 shrink-0 items-center gap-1.5 text-sm text-slate-300 hover:text-gold-400">
                  <span>{flagEmoji(d.iso2)}</span>
                  <span className="truncate">{d.name}</span>
                </Link>
                <div className="h-5 flex-1 overflow-hidden rounded bg-ink-700">
                  {d.value !== null && (
                    <div
                      className="h-full rounded bg-gradient-to-r from-emerald2-600 to-emerald2-400"
                      style={{ width: `${Math.max(2, (d.value / max) * 100)}%` }}
                    />
                  )}
                </div>
                {d.value !== null && (
                  <span className={clsx("h-1.5 w-1.5 rounded-full", FRESHNESS_META[fresh].dot)} />
                )}
                <span className="w-24 text-right text-sm">
                  <MetricNumber metricId={metric.id} iso3={d.iso3} value={d.value} unit={metric.unit} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
