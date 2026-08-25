import type { Metadata } from "next";
import Link from "next/link";
import { getIntelligence } from "@/lib/data/intelligence";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { SectionHeader, Panel, ScoreBar, Pill } from "@/components/ui/primitives";
import { fmtScore } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Gaming market — Africa digital readiness",
  description: "African gaming-market readiness via verified digital-access and audience signals.",
};

export default async function MarketsPage() {
  const intel = await getIntelligence();
  const digital = intel.scores.market_attractiveness
    .map((s) => ({
      iso3: s.entityId,
      name: s.label,
      digital: s.components.find((c) => c.dimension === "digital_access")?.score ?? null,
      audience: s.components.find((c) => c.dimension === "audience")?.score ?? null,
    }))
    .sort((a, b) => (b.digital ?? -1) - (a.digital ?? -1));

  const val = (id: string, iso3: string) => intel.snapshot.metrics[id]?.[iso3]?.value ?? null;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Verified proxies · no paid data" title="Gaming market readiness" />
      <div className="rounded-lg border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-gold-200">
        <span className="font-semibold">Methodology note. </span>
        Verified African gamer counts and gaming revenue sit behind paid sources (e.g. Newzoo). Per
        the free-tier constraint, this platform does not present those as facts. Instead it ranks
        <span className="font-semibold text-white"> gaming-market readiness</span> from verified,
        free digital-access and audience indicators — a leading indicator, clearly labelled, not a
        revenue figure.
      </div>

      <Panel>
        <SectionHeader eyebrow="Digital readiness · World Bank inputs" title="Market readiness ranking" />
        <div className="space-y-2">
          {digital.slice(0, 15).map((d, i) => {
            const c = COUNTRY_BY_ISO3[d.iso3]!;
            return (
              <div key={d.iso3} className="flex items-center gap-3">
                <span className="w-5 text-right text-xs text-slate-500">{i + 1}</span>
                <span>{flagEmoji(c.iso2)}</span>
                <Link href={`/countries/${d.iso3.toLowerCase()}`} className="w-28 shrink-0 truncate text-sm text-slate-200 hover:text-gold-400">
                  {c.name}
                </Link>
                <div className="flex-1"><ScoreBar value={d.digital} color="#16E07A" /></div>
                <span className="figure w-10 text-right text-sm font-semibold text-emerald2-400">{fmtScore(d.digital)}</span>
                <span className="hidden w-28 justify-end text-right text-xs text-slate-400 sm:flex">
                  <MetricNumber metricId="internet_pct" iso3={d.iso3} value={val("internet_pct", d.iso3)} unit="%" />
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        <Panel>
          <p className="eyebrow mb-2">Inputs · verified</p>
          <ul className="space-y-1 text-sm text-slate-300">
            <li>Internet penetration</li>
            <li>Mobile subscriptions</li>
            <li>Fixed broadband</li>
            <li>Electricity access</li>
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow mb-2">Proxy for</p>
          <ul className="space-y-1 text-sm text-slate-300">
            <li>Addressable digital audience</li>
            <li>Payment/distribution reach</li>
            <li>Device channel (mobile-first)</li>
          </ul>
        </Panel>
        <Panel>
          <p className="eyebrow mb-2">Phase 2+ additions</p>
          <ul className="space-y-1 text-sm text-slate-400">
            <li>Steam availability counts</li>
            <li>Store presence (Play/App)</li>
            <li>Verified download signals</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
