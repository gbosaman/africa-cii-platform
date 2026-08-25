import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data/snapshot";
import { COUNTRIES } from "@/lib/data/countries";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";
import { ExplorerView } from "@/components/explorer/ExplorerView";
import { SectionHeader } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Data Explorer — African creative-economy indicators",
  description: "Filter, sort, chart and export verified African market indicators. CSV & JSON download.",
};

export default async function ExplorerPage() {
  const snap = await getSnapshot();
  const rows: Record<string, Record<string, { value: number | null; year: number }>> = {};
  for (const m of WORLD_BANK_METRICS) {
    rows[m.id] = {};
    for (const c of COUNTRIES) {
      const mv = snap.metrics[m.id]?.[c.iso3];
      rows[m.id]![c.iso3] = { value: mv?.value ?? null, year: mv?.year ?? 0 };
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Filter · sort · chart · export" title="Data explorer" />
      <p className="max-w-2xl text-sm text-slate-400">
        Every series here is live from the World Bank Open Data API (CC BY-4.0). Export any view to
        CSV or JSON — provenance travels with it.
      </p>
      <ExplorerView
        countries={COUNTRIES.map((c) => ({ iso3: c.iso3, iso2: c.iso2, name: c.name, region: c.region }))}
        metrics={WORLD_BANK_METRICS.map((m) => ({ id: m.id, label: m.label, unit: m.unit, wb: m.wbIndicator }))}
        rows={rows}
      />
    </div>
  );
}
