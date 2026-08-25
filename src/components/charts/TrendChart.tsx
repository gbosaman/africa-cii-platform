"use client";

// Dependency-free inline-SVG line chart for time series. Kept tiny so it can
// live inside the metric drawer and country pages without pulling a chart lib.

interface Point {
  year: number;
  value: number;
}

export function TrendChart({
  data,
  height = 160,
  color = "#F5C518",
  unitLabel = "",
}: {
  data: Point[];
  height?: number;
  color?: string;
  unitLabel?: string;
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-line bg-ink-850 text-xs text-slate-500"
        style={{ height }}
      >
        Not enough history to chart
      </div>
    );
  }

  const W = 600;
  const H = height;
  const pad = { t: 14, r: 12, b: 22, l: 44 };
  const xs = data.map((d) => d.year);
  const ys = data.map((d) => d.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanY = maxY - minY || 1;

  const px = (x: number) =>
    pad.l + ((x - minX) / (maxX - minX || 1)) * (W - pad.l - pad.r);
  const py = (y: number) =>
    H - pad.b - ((y - minY) / spanY) * (H - pad.t - pad.b);

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${px(d.year)} ${py(d.value)}`).join(" ");
  const area = `${path} L ${px(maxX)} ${H - pad.b} L ${px(minX)} ${H - pad.b} Z`;

  const fmt = (v: number) => {
    const a = Math.abs(v);
    if (a >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (a >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
    return v.toFixed(a < 10 ? 1 : 0);
  };

  const gridYs = [minY, minY + spanY / 2, maxY];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Time series">
      <defs>
        <linearGradient id="tc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridYs.map((gy, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={py(gy)}
            y2={py(gy)}
            stroke="rgba(148,163,184,0.14)"
            strokeDasharray="3 4"
          />
          <text x={4} y={py(gy) + 3} fontSize="10" fill="#64748b" className="figure">
            {fmt(gy)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#tc-fill)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) =>
        i === data.length - 1 ? (
          <circle key={i} cx={px(d.year)} cy={py(d.value)} r="3.5" fill={color} />
        ) : null,
      )}
      <text x={pad.l} y={H - 6} fontSize="10" fill="#64748b" className="figure">
        {minX}
      </text>
      <text x={W - pad.r} y={H - 6} fontSize="10" fill="#64748b" textAnchor="end" className="figure">
        {maxX} {unitLabel}
      </text>
    </svg>
  );
}
