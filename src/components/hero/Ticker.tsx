"use client";

export interface TickerItem {
  label: string;
  value: string;
  tone?: "emerald" | "blue" | "violet" | "orange" | "dim";
}

const TONE: Record<string, string> = {
  emerald: "text-accent-400",
  blue: "text-info-400",
  violet: "text-violet2-400",
  orange: "text-warn-400",
  dim: "text-slate-400",
};

/**
 * Continuously scrolling stat strip.
 *
 * The list is rendered twice and translated by exactly -50%, so the loop is
 * seamless rather than snapping. Paused on hover so a reader can actually
 * finish reading a figure, and CSS `prefers-reduced-motion` stops it entirely.
 */
export function Ticker({ items }: { items: TickerItem[] }) {
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="group relative overflow-hidden border-y border-line bg-[var(--glass)] py-2.5">
      <div className="flex w-max animate-scroll-x gap-8 group-hover:[animation-play-state:paused]">
        {doubled.map((it, i) => (
          <span key={`${it.label}-${i}`} className="flex shrink-0 items-center gap-2 text-xs">
            <span className="uppercase tracking-wider text-slate-500">{it.label}</span>
            <span className={`figure font-semibold ${TONE[it.tone ?? "dim"]}`}>{it.value}</span>
            <span className="text-slate-700">·</span>
          </span>
        ))}
      </div>
      {/* Edge fades so items enter and leave rather than popping. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--navy-900)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--navy-900)] to-transparent" />
    </div>
  );
}
