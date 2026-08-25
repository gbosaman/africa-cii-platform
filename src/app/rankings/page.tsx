import type { Metadata } from "next";
import { getIntelligence } from "@/lib/data/intelligence";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";
import { ALL_MODES, MODE_LABELS } from "@/lib/scoring/weights";
import { RankingsView, type RankingRow, type ModeKey } from "@/components/rankings/RankingsView";
import { SectionHeader } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Rankings — best African markets by use case",
  description: "Rank African countries for distribution, production, hiring, investment, esports and animation. Configurable, transparent scoring.",
};

const MODE_BLURB: Record<string, string> = {
  market_attractiveness: "Balanced composite across all eight dimensions — the default view of overall opportunity.",
  distribution: "Where to sell & publish: audience size, purchasing power, digital access and payment infrastructure.",
  production: "Where to build: talent base, industry maturity, infrastructure and operating economics.",
  hiring: "Where the workforce is: talent depth, digital skills base and cost context.",
  investment: "Where capital compounds: growth momentum, market scale, industry activity and purchasing power.",
  esports: "Competitive-ecosystem readiness. Phase 3 adds tournament & prize-pool data — currently audience/access-weighted.",
  animation: "Animation production potential: talent, industry maturity and distribution reach.",
};

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const intel = await getIntelligence();

  const data = {} as Record<ModeKey, RankingRow[]>;
  for (const mode of ALL_MODES) {
    data[mode] = intel.scores[mode].map((s, i) => {
      const c = COUNTRY_BY_ISO3[s.entityId]!;
      return {
        iso3: c.iso3,
        iso2: c.iso2,
        name: c.name,
        region: c.region,
        rank: i + 1,
        total: s.total,
        coverage: s.coverage,
        confidence: s.confidence,
        components: s.components.map((comp) => ({
          label: comp.label,
          score: comp.score,
          weight: comp.weight,
        })),
      };
    });
  }

  const initialMode = (
    ALL_MODES.includes(searchParams.mode as ModeKey) ? searchParams.mode : "market_attractiveness"
  ) as ModeKey;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Configurable · transparent" title="Market rankings" />
      <p className="max-w-2xl text-sm text-slate-400">
        One dataset, seven questions. Weights are renormalised over available data so a country with
        gaps is never unfairly zeroed — its confidence drops instead. Highest is not always “best”:
        each mode optimises for a different decision.
      </p>
      <RankingsView
        data={data}
        modes={ALL_MODES.map((m) => ({ key: m, label: MODE_LABELS[m], blurb: MODE_BLURB[m] ?? "" }))}
        initialMode={initialMode}
      />
    </div>
  );
}
