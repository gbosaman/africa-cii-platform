"use client";

// Dependency-free horizontal bar chart.
//
// This is the honest default for percentages that DO NOT partition a whole —
// overlapping survey responses ("63% have purchased", "47% prefer free games")
// where a respondent can appear in several bars at once. Those must never be
// drawn as a pie, and the caption says so where it matters.

export interface Bar {
  label: string;
  /** null renders an explicit N/A row rather than a zero-length bar. */
  value: number | null;
  note?: string;
  /** Visually separates a bar measured against a different denominator. */
  muted?: boolean;
}

export function BarChart({
  bars,
  color = "#22c55e",
  max,
  unit = "%",
}: {
  bars: Bar[];
  color?: string;
  /** Defaults to 100 for percentages so bars stay comparable across cards. */
  max?: number;
  unit?: string;
}) {
  const values = bars.map((b) => b.value).filter((v): v is number => v !== null);
  if (values.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-line bg-ink-850/50 p-6 text-xs text-slate-500">
        No data to chart
      </div>
    );
  }
  const ceiling = max ?? Math.max(100, ...values);

  return (
    <ul className="space-y-2.5">
      {bars.map((b) => (
        <li key={b.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span
              className={`min-w-0 text-[12px] ${b.muted ? "text-slate-500" : "text-slate-300"}`}
            >
              {b.label}
            </span>
            <span
              className={`figure shrink-0 text-[12px] font-bold ${
                b.value === null ? "text-slate-600" : "text-white"
              }`}
            >
              {b.value === null ? "N/A" : `${b.value}${unit}`}
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-700">
            {b.value !== null && (
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.min(100, (b.value / ceiling) * 100)}%`,
                  background: b.muted ? "#475569" : color,
                  opacity: b.muted ? 0.8 : 1,
                }}
              />
            )}
          </div>
          {b.note && <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">{b.note}</p>}
        </li>
      ))}
    </ul>
  );
}
