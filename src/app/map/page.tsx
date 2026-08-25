import type { Metadata } from "next";
import { getIntelligence, buildMapLayers } from "@/lib/data/intelligence";
import { AfricaLeafletMap } from "@/components/map/LeafletMapLoader";
import { SectionHeader, Panel } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Africa Map — scored choropleth of all 54 countries",
  description:
    "Interactive Leaflet choropleth of Africa: switch between market, distribution, production, investment and digital-access scores.",
};

export default async function MapPage() {
  const intel = await getIntelligence();
  const layers = buildMapLayers(intel);

  return (
    <div className="view-enter space-y-6">
      <SectionHeader
        eyebrow="Interactive · switch the scored layer"
        title="Africa map"
      />
      <p className="max-w-3xl text-sm text-slate-400">
        Every country shaded by its score on the selected dimension. Hover for the value, click to
        open the full country intelligence. Countries with no data for a layer are drawn hollow and
        dashed — unknown is never shaded as though it were a low score.
      </p>
      <Panel className="p-4 sm:p-5">
        <AfricaLeafletMap layers={layers} />
      </Panel>
    </div>
  );
}
