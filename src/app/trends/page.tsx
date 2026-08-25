import type { Metadata } from "next";
import Link from "next/link";
import { getIntelligence } from "@/lib/data/intelligence";
import { computeMomentum } from "@/lib/scoring/momentum";
import { buildIndustryEvents, EVENT_META } from "@/lib/data/events";
import { generateInsights } from "@/lib/insights";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { STUDIOS } from "@/lib/data/studios";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { SectionHeader, Panel, Pill, ScoreBar } from "@/components/ui/primitives";
import { fmtScore } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Trends — momentum, emerging markets & industry events",
  description: "Real momentum from World Bank growth data, emerging-market detection and a source-linked industry events feed.",
};

export default async function TrendsPage() {
  const intel = await getIntelligence();
  const momentum = computeMomentum(intel.snapshot.metrics);
  const events = buildIndustryEvents();

  const studioCountByCountry = STUDIOS.reduce<Record<string, number>>((acc, s) => {
    acc[s.countryIso3] = (acc[s.countryIso3] ?? 0) + 1;
    return acc;
  }, {});
  const insights = generateInsights({
    scores: intel.scores,
    value: (id, iso3) => intel.snapshot.metrics[id]?.[iso3]?.value ?? null,
    studioCountByCountry,
  });

  const topMomentum = momentum.filter((m) => m.momentum !== null).slice(0, 8);
  const emerging = momentum.filter((m) => m.emerging).slice(0, 6);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Phase 4 · real growth data" title="Trends & momentum" />

      {/* Automated insights */}
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((ins) => (
          <Link key={ins.id} href={ins.href ?? "#"} className="flex items-start gap-3 rounded-xl border border-line bg-ink-850/60 p-4 transition-colors hover:border-gold-500/30">
            <span className="mt-0.5 text-gold-400">◆</span>
            <p className="text-sm text-slate-200">{ins.text}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Momentum ranking */}
        <Panel className="lg:col-span-3">
          <SectionHeader
            eyebrow="GDP + population growth · verified"
            title="Momentum ranking"
          />
          <p className="mb-3 text-xs text-slate-500">
            Blend of verified GDP growth (60%) and population growth (40%), normalised. Click any
            figure for its source.
          </p>
          <div className="space-y-2">
            {topMomentum.map((m, i) => {
              const c = COUNTRY_BY_ISO3[m.iso3]!;
              return (
                <div key={m.iso3} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-slate-500">{i + 1}</span>
                  <span>{flagEmoji(c.iso2)}</span>
                  <Link href={`/countries/${m.iso3.toLowerCase()}`} className="w-24 shrink-0 truncate text-sm text-slate-200 hover:text-gold-400">
                    {c.name}
                  </Link>
                  <div className="flex-1"><ScoreBar value={m.momentum} color="#16E07A" /></div>
                  <span className="hidden w-14 justify-end text-right text-xs sm:flex">
                    <MetricNumber metricId="gdp_growth" iso3={m.iso3} value={m.gdpGrowth} unit="%" />
                  </span>
                  <span className="figure w-9 text-right text-sm font-semibold text-emerald2-400">{fmtScore(m.momentum)}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Emerging markets */}
        <Panel className="lg:col-span-2">
          <SectionHeader eyebrow="High momentum · low base" title="Emerging markets" />
          <p className="mb-3 text-xs text-slate-500">
            Strong momentum from a below-median income base — runway markets.
          </p>
          {emerging.length ? (
            <div className="space-y-2">
              {emerging.map((m) => {
                const c = COUNTRY_BY_ISO3[m.iso3]!;
                return (
                  <Link key={m.iso3} href={`/countries/${m.iso3.toLowerCase()}`} className="flex items-center justify-between rounded-lg border border-line bg-ink-850/60 px-3 py-2 hover:border-gold-500/30">
                    <span className="text-sm text-slate-200">{flagEmoji(c.iso2)} {c.name}</span>
                    <span className="figure text-sm font-semibold text-emerald2-400">{fmtScore(m.momentum)}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No markets meet the emerging threshold in the current data.</p>
          )}
        </Panel>
      </div>

      {/* Industry events feed */}
      <Panel>
        <SectionHeader
          eyebrow="Structured · source-linked"
          title="Industry events"
          action={<Pill>{events.length} events</Pill>}
        />
        <p className="mb-4 text-sm text-slate-400">
          Derived from verified records — foundings, releases, disclosed funding, milestones and
          partnerships. Each links back to its source. Not a news feed.
        </p>
        <ol className="relative space-y-3 border-l border-line pl-5">
          {events.slice(0, 20).map((e) => {
            const meta = EVENT_META[e.eventType] ?? { label: e.eventType, tone: "slate" as const };
            const c = e.countryIso3 ? COUNTRY_BY_ISO3[e.countryIso3] : undefined;
            return (
              <li key={e.id} className="relative">
                <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-gold-500" />
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={meta.tone}>{meta.label}</Pill>
                  <span className="figure text-xs text-slate-500">{e.date.slice(0, 4)}</span>
                  {c && <span className="text-xs text-slate-500">{flagEmoji(c.iso2)} {c.name}</span>}
                  {!e.verified && <span className="text-[10px] text-orange-400">unverified</span>}
                </div>
                <p className="mt-1 text-sm text-slate-200">
                  {e.description}
                  {e.sourceUrl && (
                    <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-gold-400 hover:text-gold-500">
                      source ↗
                    </a>
                  )}
                </p>
              </li>
            );
          })}
        </ol>
      </Panel>
    </div>
  );
}
