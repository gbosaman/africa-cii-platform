import type { Metadata } from "next";
import { getIntelligence } from "@/lib/data/intelligence";
import { COUNTRIES } from "@/lib/data/countries";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";
import { CompareView } from "@/components/compare/CompareView";
import { SectionHeader } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Compare — African markets side by side",
  description: "Compare up to four African countries across market score and live macro & digital indicators.",
};

export default async function ComparePage({ searchParams }: { searchParams: { a?: string; b?: string; c?: string; d?: string } }) {
  const intel = await getIntelligence();

  const values: Record<string, Record<string, number | null>> = {};
  for (const m of WORLD_BANK_METRICS) {
    values[m.id] = {};
    for (const c of COUNTRIES) {
      values[m.id]![c.iso3] = intel.snapshot.metrics[m.id]?.[c.iso3]?.value ?? null;
    }
  }
  const marketScore = Object.fromEntries(
    intel.scores.market_attractiveness.map((s) => [s.entityId, s.total]),
  );

  const preset = [searchParams.a, searchParams.b, searchParams.c, searchParams.d]
    .filter(Boolean)
    .map((x) => (x as string).toUpperCase())
    .filter((x) => COUNTRIES.some((c) => c.iso3 === x));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Side by side · up to 4" title="Compare markets" />
      <p className="max-w-2xl text-sm text-slate-400">
        Highest and lowest per row are highlighted. Highest is not automatically best — read each
        metric in context. Every figure remains clickable for its source.
      </p>
      <CompareView
        countries={COUNTRIES.map((c) => ({ iso3: c.iso3, iso2: c.iso2, name: c.name }))}
        metrics={WORLD_BANK_METRICS.map((m) => ({ id: m.id, label: m.shortLabel ?? m.label, unit: m.unit }))}
        values={values}
        marketScore={marketScore}
        preset={preset.length ? preset : ["NGA", "ZAF", "KEN", "EGY"]}
      />
    </div>
  );
}
