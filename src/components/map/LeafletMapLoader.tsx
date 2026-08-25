"use client";

import dynamic from "next/dynamic";
import type { MapLayerDef } from "@/components/map/LeafletAfricaMap";

/**
 * Leaflet touches `window` at module scope, so the map must never be imported
 * during SSR. This loader is the only place that knows that.
 */
const LeafletAfricaMap = dynamic(
  () => import("@/components/map/LeafletAfricaMap").then((m) => m.LeafletAfricaMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-[18px] border border-line bg-ink-850/60">
        <span className="text-sm text-slate-500">Loading map…</span>
      </div>
    ),
  },
);

export function AfricaLeafletMap({ layers }: { layers: MapLayerDef[] }) {
  return <LeafletAfricaMap layers={layers} />;
}
