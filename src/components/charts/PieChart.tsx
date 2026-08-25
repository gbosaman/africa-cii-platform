"use client";

// Dependency-free donut chart, drawn with stroke-dasharray on concentric
// circles rather than path arcs — no large-arc-flag edge cases, no chart lib.
//
// A PIE IS ONLY HONEST FOR A PARTITION. Slices must be mutually exclusive and
// sum to 100, or the shape asserts a relationship that does not exist. This
// component therefore refuses to draw anything else: if the values do not sum
// to 100 it says so instead of rendering a misleading circle. Overlapping
// percentages belong in a BarChart.

export interface Slice {
  label: string;
  /** Percentage of the whole. */
  value: number;
  note?: string;
}

/** Slate leads deliberately: the largest bucket is usually the least-served. */
export const CHART_PALETTE = [
  "#64748b",
  "#38bdf8",
  "#a855f7",
  "#f59e0b",
  "#22c55e",
  "#f43f5e",
];

/** A partition may drift a little through rounding; beyond this it is wrong. */
const SUM_TOLERANCE = 1.5;

export function PieChart({
  slices,
  size = 200,
  thickness = 30,
  palette = CHART_PALETTE,
  centreLabel,
  centreValue,
}: {
  slices: Slice[];
  size?: number;
  thickness?: number;
  palette?: string[];
  centreLabel?: string;
  centreValue?: string;
}) {
  const usable = slices.filter((s) => Number.isFinite(s.value) && s.value > 0);
  const sum = usable.reduce((a, s) => a + s.value, 0);

  if (usable.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-line bg-ink-850/50 p-6 text-xs text-slate-500">
        No data to chart
      </div>
    );
  }

  if (Math.abs(sum - 100) > SUM_TOLERANCE) {
    return (
      <div className="rounded-lg border border-warn-500/30 bg-warn-500/10 p-4 text-xs leading-relaxed text-warn-400">
        These values sum to {sum.toFixed(1)}%, not 100%, so they are not mutually exclusive shares
        of one whole. Drawing them as a pie would assert a partition that does not exist — see the
        bars below instead.
      </div>
    );
  }

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={usable.map((s) => `${s.label}: ${s.value.toFixed(1)}%`).join(", ")}
        className="shrink-0"
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {usable.map((s, i) => {
            const len = (s.value / sum) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={palette[i % palette.length]}
                strokeWidth={thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        {(centreValue || centreLabel) && (
          <>
            <text
              x={size / 2}
              y={size / 2 - 2}
              textAnchor="middle"
              className="fill-white"
              style={{ fontSize: 20, fontWeight: 700 }}
            >
              {centreValue}
            </text>
            <text
              x={size / 2}
              y={size / 2 + 15}
              textAnchor="middle"
              className="fill-slate-500"
              style={{ fontSize: 10 }}
            >
              {centreLabel}
            </text>
          </>
        )}
      </svg>

      <ul className="min-w-0 flex-1 space-y-1.5" style={{ minWidth: 180 }}>
        {usable.map((s, i) => (
          <li key={s.label} className="flex items-baseline gap-2 text-[12px]">
            <span
              aria-hidden
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: palette[i % palette.length] }}
            />
            <span className="min-w-0 flex-1 text-slate-300">{s.label}</span>
            <span className="figure shrink-0 font-semibold text-white">{s.value.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiny legend-less donut for card faces. */
export function MiniDonut({
  slices,
  size = 44,
  palette = CHART_PALETTE,
}: {
  slices: Slice[];
  size?: number;
  palette?: string[];
}) {
  const usable = slices.filter((s) => Number.isFinite(s.value) && s.value > 0);
  const sum = usable.reduce((a, s) => a + s.value, 0);
  if (usable.length === 0 || sum <= 0) return null;

  const thickness = 8;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {usable.map((s, i) => {
          const len = (s.value / sum) * c;
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={palette[i % palette.length]}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </g>
    </svg>
  );
}
