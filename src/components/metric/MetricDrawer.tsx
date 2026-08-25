"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { TrendChart } from "@/components/charts/TrendChart";
import { fmtValue, pctDelta } from "@/lib/format";

interface Target {
  metricId: string;
  iso3: string;
  value?: number | null;
  unit?: string;
}

interface ApiResponse {
  metric: { id: string; label: string; unit: string; description: string; category: string };
  country: { iso3: string; name: string; region: string };
  series: { year: number; value: number }[];
  provenance: {
    source: string;
    organization: string;
    datasetName: string;
    indicatorCode: string;
    license: string;
    sourceUrl: string;
    retrievedAt: string;
    methodology: string;
  };
  error?: string;
}

export function MetricDrawer({ target, onClose }: { target: Target | null; onClose: () => void }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!target) return;
    setData(null);
    setLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/metric/${target.metricId}?iso3=${target.iso3}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d: ApiResponse) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (target) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  if (!target) return null;

  const series = data?.series ?? [];
  const latest = series.at(-1);
  const prev = series.at(-2);
  const delta = latest && prev ? pctDelta(latest.value, prev.value) : null;
  const unit = data?.metric.unit ?? target.unit ?? "";

  const download = (kind: "csv" | "json") => {
    if (!data) return;
    let blob: Blob;
    if (kind === "csv") {
      const rows = ["year,value,unit,source,indicator"];
      for (const p of series) {
        rows.push(`${p.year},${p.value},${unit},"${data.provenance.source}",${data.provenance.indicatorCode}`);
      }
      blob = new Blob([rows.join("\n")], { type: "text/csv" });
    } else {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.country.iso3}_${data.metric.id}.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-line bg-ink-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <p className="eyebrow">{data?.country.name ?? target.iso3} · Metric lineage</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-white">
              {data?.metric.label ?? "Loading…"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-line p-2 text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {loading && <div className="text-sm text-slate-400">Fetching source data…</div>}

          {data?.error && series.length === 0 && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-300">
              {data.error}. The last verified value is retained; nothing is overwritten.
            </div>
          )}

          {/* Current + delta */}
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
            <Cell label="Current" value={latest ? fmtValue(latest.value, unit) : "N/A"} accent />
            <Cell label="Previous" value={prev ? fmtValue(prev.value, unit) : "N/A"} />
            <Cell
              label="Change"
              value={delta === null ? "N/A" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
              tone={delta === null ? undefined : delta >= 0 ? "up" : "down"}
            />
          </div>

          {/* Trend */}
          {series.length >= 2 && (
            <div>
              <p className="eyebrow mb-2">History · {series[0]!.year}–{series.at(-1)!.year}</p>
              <TrendChart data={series} unitLabel={unit} />
            </div>
          )}

          {/* Provenance */}
          {data && (
            <div className="panel-tight p-4">
              <p className="eyebrow mb-3 flex items-center gap-2">
                <Icon name="shield" className="h-3.5 w-3.5 text-emerald2-400" /> Source & methodology
              </p>
              <dl className="space-y-2 text-sm">
                <Row k="Source" v={`${data.provenance.organization} — ${data.provenance.source}`} />
                <Row k="Dataset" v={data.provenance.datasetName} />
                <Row k="Indicator" v={data.provenance.indicatorCode} mono />
                <Row k="License" v={data.provenance.license} />
                <Row k="Latest year" v={latest ? String(latest.year) : "N/A"} />
                <Row k="Retrieved" v={new Date(data.provenance.retrievedAt).toLocaleDateString()} />
              </dl>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-slate-400">
                {data.provenance.methodology}
              </p>
              <a
                href={data.provenance.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-500"
              >
                Open at source <Icon name="external" className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {data?.metric.description && (
            <p className="text-sm leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-300">Why it matters. </span>
              {data.metric.description}
            </p>
          )}
        </div>

        {/* Downloads */}
        <div className="flex gap-2 border-t border-line p-4">
          <button
            onClick={() => download("csv")}
            disabled={!data}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-ink-800 py-2 text-sm font-medium text-slate-200 hover:border-gold-500/40 disabled:opacity-40"
          >
            <Icon name="download" className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={() => download("json")}
            disabled={!data}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-ink-800 py-2 text-sm font-medium text-slate-200 hover:border-gold-500/40 disabled:opacity-40"
          >
            <Icon name="download" className="h-4 w-4" /> JSON
          </button>
        </div>
      </div>
    </div>
  );
}

function Cell({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "up" | "down";
}) {
  return (
    <div className="bg-ink-850 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`figure mt-1 text-lg font-semibold ${
          tone === "up"
            ? "text-emerald2-400"
            : tone === "down"
              ? "text-orange-400"
              : accent
                ? "text-gold-400"
                : "text-slate-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{k}</dt>
      <dd className={`text-right text-slate-200 ${mono ? "figure" : ""}`}>{v}</dd>
    </div>
  );
}
