"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { Feature, Geometry } from "geojson";
import "leaflet/dist/leaflet.css";

import { AFRICA_GEOJSON, MISSING_GEOMETRY } from "@/lib/data/africa-geo";
import { CENTROIDS } from "@/lib/data/centroids";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";
import { fmtScore } from "@/lib/format";

export interface MapLayerDef {
  key: string;
  label: string;
  values: Record<string, number | null>;
}

/**
 * Choropleth ramp: navy (low) → emerald (mid) → blue (high), matching the
 * platform accents. `null` renders as a hollow grey — unknown is never drawn as
 * if it were a low score.
 */
function ramp(v: number | null): string {
  if (v === null) return "#1b2436";
  const t = Math.max(0, Math.min(1, v / 100));
  const stops: [number, number, number][] = [
    [30, 44, 76],
    [34, 197, 94],
    [56, 189, 248],
  ];
  const seg = t < 0.5 ? 0 : 1;
  const lt = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
  const a = stops[seg]!;
  const b = stops[seg + 1]!;
  const c = a.map((av, i) => Math.round(av + (b[i]! - av) * lt));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function LeafletAfricaMap({ layers }: { layers: MapLayerDef[] }) {
  const router = useRouter();
  const [layerKey, setLayerKey] = useState(layers[0]?.key ?? "");
  const [hover, setHover] = useState<{ iso3: string; name: string; v: number | null } | null>(null);

  const layer = layers.find((l) => l.key === layerKey) ?? layers[0];
  const values = layer?.values ?? {};

  const style = useMemo(
    () =>
      (feature?: Feature<Geometry, { name: string }>): PathOptions => {
        const iso3 = String(feature?.id ?? "");
        const v = values[iso3] ?? null;
        const active = hover?.iso3 === iso3;
        return {
          fillColor: ramp(v),
          fillOpacity: v === null ? 0.35 : 0.82,
          color: active ? "#ffffff" : "rgba(255,255,255,0.22)",
          weight: active ? 2 : 0.7,
          dashArray: v === null ? "2 3" : undefined,
        };
      },
    [values, hover],
  );

  const onEach = (feature: Feature<Geometry, { name: string }>, lyr: Layer) => {
    const iso3 = String(feature.id ?? "");
    const country = COUNTRY_BY_ISO3[iso3];
    const name = country?.name ?? feature.properties?.name ?? iso3;
    lyr.on({
      mouseover: () => setHover({ iso3, name, v: values[iso3] ?? null }),
      mouseout: () => setHover(null),
      click: () => router.push(`/countries/${iso3.toLowerCase()}`),
      keypress: (e) => {
        if ((e.originalEvent as KeyboardEvent).key === "Enter") {
          router.push(`/countries/${iso3.toLowerCase()}`);
        }
      },
    });
    lyr.bindTooltip(
      `<span style="font-weight:600">${name}</span> · ${
        values[iso3] == null ? "N/A" : fmtScore(values[iso3]!)
      }`,
      { sticky: true, className: "cii-tip" },
    );
  };

  // Island states absent from the boundary source, drawn as markers so all 54
  // countries are represented rather than silently missing.
  const islands = MISSING_GEOMETRY.map((iso3) => {
    const c = CENTROIDS[iso3];
    const country = COUNTRY_BY_ISO3[iso3];
    if (!c || !country) return null;
    return { iso3, name: country.name, lat: c[1], lon: c[0], v: values[iso3] ?? null };
  }).filter(Boolean) as { iso3: string; name: string; lat: number; lon: number; v: number | null }[];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {layers.map((l) => (
          <button
            key={l.key}
            onClick={() => setLayerKey(l.key)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              l.key === layer?.key
                ? "border-accent-500/50 bg-accent-500/15 text-accent-400"
                : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-line">
        <MapContainer
          center={[1.5, 18]}
          zoom={3}
          minZoom={2}
          maxZoom={7}
          scrollWheelZoom={false}
          style={{ height: 520, width: "100%", background: "#070a12" }}
          attributionControl
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <GeoJSON
            key={layerKey /* restyle on layer change */}
            data={AFRICA_GEOJSON}
            style={style}
            onEachFeature={onEach}
          />
          {islands.map((i) => (
            <CircleMarker
              key={i.iso3}
              center={[i.lat, i.lon]}
              radius={6}
              pathOptions={{
                fillColor: ramp(i.v),
                fillOpacity: i.v === null ? 0.35 : 0.85,
                color: "rgba(255,255,255,0.5)",
                weight: 1,
              }}
              eventHandlers={{ click: () => router.push(`/countries/${i.iso3.toLowerCase()}`) }}
            >
              <Tooltip sticky className="cii-tip">
                <span style={{ fontWeight: 600 }}>{i.name}</span> ·{" "}
                {i.v === null ? "N/A" : fmtScore(i.v)}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-slate-500">
          Boundaries © OpenStreetMap contributors / Natural Earth (public domain), bundled with the
          app. Hollow, dashed countries have no value for this layer — unknown, not zero. The five
          island states without boundary geometry in the source are drawn as points.
        </p>
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
