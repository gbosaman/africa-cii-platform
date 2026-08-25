"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CENTROIDS } from "@/lib/data/centroids";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";

export interface MapLayer {
  key: string;
  label: string;
  values: Record<string, number | null>; // iso3 -> 0..100 | null
}

const W = 720;
const H = 760;
// Projection bounds (equirectangular) covering the African continent + islands.
const LON = [-26, 60] as const;
const LAT = [39, -37] as const;

function project([lon, lat]: [number, number]): [number, number] {
  const x = ((lon - LON[0]) / (LON[1] - LON[0])) * (W - 60) + 30;
  const y = ((LAT[0] - lat) / (LAT[0] - LAT[1])) * (H - 60) + 30;
  return [x, y];
}

// 3-stop ramp: cool (low) → emerald (mid) → gold (high). null → hollow.
function rampColor(v: number | null): string {
  if (v === null) return "#334155";
  const t = Math.max(0, Math.min(1, v / 100));
  const stops = [
    [30, 44, 76], // navy
    [34, 197, 94], // emerald
    [56, 189, 248], // blue
  ];
  const seg = t < 0.5 ? 0 : 1;
  const lt = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
  const a = stops[seg]!;
  const b = stops[seg + 1]!;
  const c = a.map((av, i) => Math.round(av + (b[i]! - av) * lt));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

interface Node {
  iso3: string;
  name: string;
  x: number;
  y: number;
  v: number | null;
}

export function AfricaMap({ layers }: { layers: MapLayer[] }) {
  const router = useRouter();
  const [layerKey, setLayerKey] = useState(layers[0]?.key ?? "");
  const [hover, setHover] = useState<Node | null>(null);

  const layer = layers.find((l) => l.key === layerKey) ?? layers[0];

  const nodes: Node[] = useMemo(() => {
    return Object.entries(CENTROIDS).map(([iso3, ll]) => {
      const [x, y] = project(ll);
      return {
        iso3,
        name: COUNTRY_BY_ISO3[iso3]?.name ?? iso3,
        x,
        y,
        v: layer?.values[iso3] ?? null,
      };
    });
  }, [layer]);

  // Nearest-neighbour links for the "network" aesthetic (computed once).
  const links = useMemo(() => {
    const pts = Object.entries(CENTROIDS).map(([iso3, ll]) => ({ iso3, p: project(ll) }));
    const out: { a: [number, number]; b: [number, number] }[] = [];
    const seen = new Set<string>();
    for (const src of pts) {
      const nearest = pts
        .filter((d) => d.iso3 !== src.iso3)
        .map((d) => ({ d, dist: Math.hypot(d.p[0] - src.p[0], d.p[1] - src.p[1]) }))
        .sort((m, n) => m.dist - n.dist)
        .slice(0, 2);
      for (const { d } of nearest) {
        const key = [src.iso3, d.iso3].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ a: src.p, b: d.p });
      }
    }
    return out;
  }, []);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {layers.map((l) => (
          <button
            key={l.key}
            onClick={() => setLayerKey(l.key)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              l.key === layer?.key
                ? "border-gold-500/50 bg-gold-500/15 text-gold-400"
                : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Always fits the viewport width — horizontal panning inside a
          vertically-scrolling page is awkward on touch. Tappability comes from
          the oversized transparent hit circles on each node instead. */}
      <div className="relative overflow-hidden rounded-xl border border-line bg-ink-950/60">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {/* network links */}
          <g opacity="0.5">
            {links.map((l, i) => (
              <line
                key={i}
                x1={l.a[0]}
                y1={l.a[1]}
                x2={l.b[0]}
                y2={l.b[1]}
                stroke="rgba(56, 189, 248, 0.12)"
                strokeWidth="1"
              />
            ))}
          </g>
          {/* nodes */}
          {nodes.map((n) => {
            const active = hover?.iso3 === n.iso3;
            const r = n.v === null ? 5 : 5 + (n.v / 100) * 6;
            return (
              <g
                key={n.iso3}
                className="cursor-pointer focus:outline-none"
                role="button"
                tabIndex={0}
                aria-label={`${n.name}, ${layer?.label} ${n.v === null ? "not available" : n.v.toFixed(0)}`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(null)}
                // Tap/click selects the node (shows its readout) rather than
                // navigating immediately — prevents mis-taps on touch. The
                // readout carries an explicit "Open" link.
                onClick={() => setHover(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/countries/${n.iso3.toLowerCase()}`);
                  }
                }}
              >
                {/* Generous transparent hit area for touch (≈44px target). */}
                <circle cx={n.x} cy={n.y} r={20} fill="transparent" />
                {n.v !== null && (
                  <circle cx={n.x} cy={n.y} r={r + 5} fill={rampColor(n.v)} opacity={0.18} />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill={n.v === null ? "none" : rampColor(n.v)}
                  stroke={active ? "#fff" : n.v === null ? "#475569" : "rgba(255,255,255,0.35)"}
                  strokeWidth={active ? 2 : 1}
                  strokeDasharray={n.v === null ? "2 2" : undefined}
                />
                {active && (
                  <text
                    x={n.x}
                    y={n.y - r - 8}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#fff"
                    className="figure font-semibold"
                  >
                    {n.iso3} · {n.v === null ? "N/A" : n.v.toFixed(0)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

      </div>

      {/* Readout + legend live outside the scroller so they stay put while
          the map pans on small screens. */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {hover ? (
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-line bg-ink-850 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{hover.name}</p>
              <p className="figure text-xs text-slate-400">
                {layer?.label}:{" "}
                <span className="text-gold-400">{hover.v === null ? "N/A" : hover.v.toFixed(1)}</span>
              </p>
            </div>
            <Link
              href={`/countries/${hover.iso3.toLowerCase()}`}
              className="shrink-0 rounded-md border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold text-gold-400"
            >
              Open →
            </Link>
          </div>
        ) : (
          <p className="min-w-0 flex-1 text-[11px] text-slate-500">
            Schematic map — nodes at approximate centroids, sized &amp; coloured by the selected
            score. Tap a node for its readout. Hollow = data unavailable.
          </p>
        )}
        <div className="flex shrink-0 items-center gap-2 self-start rounded-lg border border-line bg-ink-850 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Low</span>
          <div
            className="h-2 w-16 rounded-full sm:w-24"
            style={{ background: "linear-gradient(90deg, #1e2c4c, #22c55e, #38bdf8)" }}
          />
          <span className="text-[10px] uppercase tracking-wider text-slate-500">High</span>
        </div>
      </div>
    </div>
  );
}
