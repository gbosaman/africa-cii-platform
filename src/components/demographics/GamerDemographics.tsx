"use client";

import { useEffect, useState } from "react";
import { Panel, SectionHeader, Pill } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { fmtNumber } from "@/lib/format";
import {
  GAMER_CATEGORIES,
  MARKET_TOTALS,
  sourceFor,
  type GamerCategory,
  type GamerStat,
  type Provenance,
} from "@/lib/data/gamer-demographics";

/** Percentages and percentage points both scale 0..100, so both get a bar. */
const isPctLike = (unit: GamerStat["unit"]) => unit === "%" || unit === "pp";

const PROV_STYLE: Record<Provenance, string> = {
  published: "border-accent-500/40 bg-accent-500/10 text-accent-400",
  partial: "border-warn-500/40 bg-warn-500/10 text-warn-400",
  unpublished: "border-slate-500/30 bg-slate-500/10 text-slate-400",
};

const PROV_LABEL: Record<Provenance, string> = {
  published: "Published",
  partial: "Partial",
  unpublished: "Not published",
};

const ICON_TONE: Record<string, string> = {
  emerald: "bg-[var(--emerald-soft)] text-accent-400",
  blue: "bg-[var(--blue-soft)] text-info-400",
  violet: "bg-[var(--violet-soft)] text-violet2-400",
  orange: "bg-[var(--orange-soft)] text-warn-400",
};

const BAR_TONE: Record<string, string> = {
  emerald: "from-accent-600 to-accent-400",
  blue: "from-info-600 to-info-400",
  violet: "from-violet2-600 to-violet2-400",
  orange: "from-warn-600 to-warn-400",
};

export function GamerDemographics({
  occupation,
  settlement,
  education,
}: {
  occupation?: GamerCategory;
  settlement?: GamerCategory;
  education?: GamerCategory;
}) {
  const [open, setOpen] = useState<GamerCategory | null>(null);

  // Occupation and urban/rural are computed server-side from live World Bank
  // series, so they replace their static placeholders when available.
  const overrides: Record<string, GamerCategory | undefined> = {
    occupation,
    urban: settlement,
    education,
  };
  const categories = GAMER_CATEGORIES.map((c) => overrides[c.id] ?? c);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="space-y-6">
      {/* Continental totals */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
        {MARKET_TOTALS.map((t) => {
          const src = sourceFor(t.sourceId);
          return (
            <div key={t.label} className="panel kpi p-[18px]" data-accent="emerald">
              <p className="figure text-2xl font-bold text-white">{t.value}</p>
              <p className="mt-1 text-[12.5px] font-medium text-slate-400">{t.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{t.note}</p>
              <p className="mt-2 border-t border-line pt-2 text-[10px] text-slate-600">
                {src?.publisher}
              </p>
            </div>
          );
        })}
      </div>

      {/* Provenance summary */}
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="emerald">{categories.filter((c) => c.provenance === "published").length} published</Pill>
        <Pill tone="gold">{categories.filter((c) => c.provenance === "partial").length} partial</Pill>
        <span className="pill border-line bg-ink-800 text-slate-400">
          {categories.filter((c) => c.provenance === "unpublished").length} not published
        </span>
        <span className="ml-auto text-[11px] text-slate-500">
          Click any card for the full breakdown and its source
        </span>
      </div>

      {/* The eight categories */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpen(c)}
            className="panel kpi p-[18px] text-left"
            data-accent={c.accent}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`kpi-icon ${ICON_TONE[c.accent]}`}>
                <Icon name={c.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className={`pill ${PROV_STYLE[c.provenance]}`}>{PROV_LABEL[c.provenance]}</span>
            </div>

            <p
              className={`figure mt-3 text-2xl font-bold ${
                c.headline ? "text-white" : "text-slate-600"
              }`}
            >
              {c.headline ?? "N/A"}
            </p>
            <p className="mt-1 text-[12.5px] font-medium text-slate-400">{c.headlineLabel}</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">{c.title}</p>

            {/* Miniature bars so the card previews the shape of the data */}
            {c.stats.filter((s) => s.value !== null && isPctLike(s.unit)).length > 0 && (
              <div className="mt-3 space-y-1">
                {c.stats
                  .filter((s) => s.value !== null && isPctLike(s.unit))
                  .slice(0, 3)
                  .map((s) => (
                    <div key={s.label} className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${BAR_TONE[c.accent]}`}
                        style={{ width: `${s.value}%` }}
                      />
                    </div>
                  ))}
              </div>
            )}

            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-accent-400">
              Detail <Icon name="arrow" className="h-3 w-3" />
            </span>
          </button>
        ))}
      </div>

      {open && <DrillDown category={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function DrillDown({ category, onClose }: { category: GamerCategory; onClose: () => void }) {
  const sourceIds = [...new Set(category.stats.map((s) => s.sourceId))];
  const maxPct = Math.max(
    ...category.stats.filter((s) => isPctLike(s.unit) && s.value !== null).map((s) => s.value!),
    100,
  );

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col border-l border-line bg-ink-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <p className="eyebrow">{category.question}</p>
            <h2 className="mt-1 truncate text-lg font-semibold text-white">{category.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-line p-2 text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <span className={`pill ${PROV_STYLE[category.provenance]}`}>
            {PROV_LABEL[category.provenance]}
          </span>

          {/* The numbers */}
          {category.stats.length > 0 ? (
            <div className="space-y-3">
              {category.stats.map((s) => {
                const src = sourceFor(s.sourceId);
                return (
                  <div key={s.label} className="panel-tight p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 text-sm text-slate-300">{s.label}</span>
                      <span className="figure shrink-0 text-sm font-bold text-accent-400">
                        {s.value === null
                          ? "N/A"
                          : isPctLike(s.unit)
                            ? `${s.value}${s.unit}`
                            : fmtNumber(s.value)}
                      </span>
                    </div>
                    {isPctLike(s.unit) && s.value !== null && (
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-700">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${BAR_TONE[category.accent]}`}
                          style={{ width: `${(s.value / maxPct) * 100}%` }}
                        />
                      </div>
                    )}
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {src?.publisher}
                      {s.note ? ` · ${s.note}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-ink-850/50 p-4 text-sm text-slate-400">
              No published figures for this category.
            </div>
          )}

          {/* What's missing */}
          {category.gap && (
            <div className="rounded-lg border border-warn-500/25 bg-warn-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-warn-400">
                What is missing
              </p>
              <p className="mt-1.5 text-sm text-slate-300">{category.gap}</p>
              {category.wouldNeed && (
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-300">To close it: </span>
                  {category.wouldNeed}
                </p>
              )}
            </div>
          )}

          {/* Sources */}
          {sourceIds.length > 0 && (
            <div>
              <p className="eyebrow mb-2 flex items-center gap-2">
                <Icon name="shield" className="h-3.5 w-3.5 text-accent-400" /> Sources
              </p>
              <div className="space-y-3">
                {sourceIds.map((id) => {
                  const src = sourceFor(id);
                  if (!src) return null;
                  return (
                    <div key={id} className="panel-tight p-4">
                      <p className="text-sm font-semibold text-white">{src.name}</p>
                      <p className="text-xs text-slate-400">{src.publisher}</p>
                      <dl className="mt-3 space-y-1.5 text-xs">
                        <Row k="Sample" v={src.sampleSize} />
                        <Row k="Markets" v={src.markets.join(", ")} />
                        <Row k="Published" v={src.published} />
                      </dl>
                      <p className="mt-2 border-t border-line pt-2 text-[11px] leading-relaxed text-slate-500">
                        {src.methodology}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{src.licence}</p>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent-400 hover:text-accent-500"
                      >
                        Open at source <Icon name="external" className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="border-t border-line pt-3 text-[11px] leading-relaxed text-slate-500">
            These are other researchers&apos; findings, reported here with attribution. This platform
            has not run a player survey, so nothing on this page is presented as our own primary
            research. Sample sizes and market coverage are shown above precisely so you can judge how
            far each figure travels.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{k}</dt>
      <dd className="text-right text-slate-300">{v}</dd>
    </div>
  );
}
