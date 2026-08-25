import clsx from "clsx";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { Confidence, Freshness } from "@/lib/types";
import { CONFIDENCE_META, FRESHNESS_META } from "@/lib/format";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  // min-w-0 lets the panel shrink below its content's min-content when used as
  // a grid/flex child — essential for mobile (prevents horizontal overflow).
  return <div className={clsx("panel min-w-0 p-5", className)}>{children}</div>;
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="display text-lg text-white sm:text-[22px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const m = CONFIDENCE_META[confidence];
  return <span className={clsx("pill", m.className)}>{m.label}</span>;
}

export function FreshnessDot({
  freshness,
  withLabel = true,
}: {
  freshness: Freshness;
  withLabel?: boolean;
}) {
  const m = FRESHNESS_META[freshness];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx("h-2 w-2 rounded-full", m.dot)} />
      {withLabel && <span className={clsx("text-[11px] font-medium", m.text)}>{m.label}</span>}
    </span>
  );
}

export function CoverageBadge({ coverage }: { coverage: number }) {
  const pct = Math.round(coverage * 100);
  const tone =
    pct >= 85 ? "text-emerald2-400" : pct >= 60 ? "text-gold-400" : "text-orange-400";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
      <span className={clsx("figure font-semibold", tone)}>{pct}%</span>
      coverage
    </span>
  );
}

export function DataUnavailable({ label = "Data unavailable" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-line bg-ink-850/50 px-3 py-2 text-sm text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
      {label}
    </div>
  );
}

export function ScoreBar({
  value,
  max = 100,
  color = "#22c55e",
}: {
  value: number | null;
  max?: number;
  color?: string;
}) {
  const pct = value === null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: value === null ? "#334155" : color }}
      />
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "gold" | "emerald";
}) {
  const map = {
    slate: "border-line bg-ink-700 text-slate-300",
    gold: "border-gold-500/30 bg-gold-500/10 text-gold-400",
    emerald: "border-emerald2-500/30 bg-emerald2-500/10 text-emerald2-400",
  } as const;
  return <span className={clsx("pill", map[tone])}>{children}</span>;
}

/** Rank badge — gold for #1, subtle for the rest. */
export function RankBadge({ rank }: { rank: number }) {
  const top = rank <= 3;
  return (
    <span
      className={clsx(
        "figure inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold",
        rank === 1
          ? "bg-gold-500 text-ink-900"
          : top
            ? "bg-gold-500/15 text-gold-400"
            : "bg-ink-700 text-slate-400",
      )}
    >
      {rank}
    </span>
  );
}

/**
 * KPI card with an accent glow — the reference's signature surface.
 * Hover lifts it 4px and deepens the shadow.
 */
export function KpiCard({
  label,
  value,
  sub,
  accent = "emerald",
  icon,
  href,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: "emerald" | "blue" | "violet" | "orange";
  icon?: string;
  href?: string;
}) {
  const tone = {
    emerald: "text-accent-400 bg-[var(--emerald-soft)]",
    blue: "text-info-400 bg-[var(--blue-soft)]",
    violet: "text-violet2-400 bg-[var(--violet-soft)]",
    orange: "text-warn-400 bg-[var(--orange-soft)]",
  }[accent];

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        {icon && (
          <span className={clsx("kpi-icon", tone)}>
            <Icon name={icon} className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className="figure mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[12.5px] font-medium text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </>
  );

  const cls = "panel kpi block p-[18px]";
  return href ? (
    <Link href={href} className={cls} data-accent={accent}>
      {body}
    </Link>
  ) : (
    <div className={cls} data-accent={accent}>
      {body}
    </div>
  );
}
