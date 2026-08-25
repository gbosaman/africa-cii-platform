import Link from "next/link";
import { getIntelligence, buildMapLayers } from "@/lib/data/intelligence";
import { AfricaLeafletMap } from "@/components/map/LeafletMapLoader";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { Panel, SectionHeader, ScoreBar, RankBadge, Pill, CoverageBadge, KpiCard } from "@/components/ui/primitives";
import { HeroCanvas } from "@/components/hero/HeroCanvas";
import { Ticker, type TickerItem } from "@/components/hero/Ticker";
import { HeroForecast } from "@/components/hero/HeroForecast";
import { Icon } from "@/components/ui/Icon";
import { fmtScore, fmtNumber } from "@/lib/format";
import { STUDIOS, ANIMATION_STUDIOS } from "@/lib/data/studios";
import { generateInsights } from "@/lib/insights";
import { directoryCountByCountry } from "@/lib/data/studio-directory";

export const revalidate = 86400;

export default async function DashboardPage() {
  const intel = await getIntelligence();
  const layers = buildMapLayers(intel);
  const m = intel.snapshot.metrics;
  const val = (metricId: string, iso3: string) => m[metricId]?.[iso3]?.value ?? null;

  const topMarkets = intel.scores.market_attractiveness.slice(0, 8);

  // Fastest-growing = ranked by GDP growth (real World Bank series).
  const growth = [...intel.scores.market_attractiveness]
    .map((s) => ({ iso3: s.entityId, name: s.label, g: val("gdp_growth", s.entityId) }))
    .filter((r) => r.g !== null)
    .sort((a, b) => (b.g as number) - (a.g as number))
    .slice(0, 6);

  const c = intel.counts;

  // Use the SAME source as the headline studio count (verified + community,
  // de-duplicated). Deriving the insight from the verified seed alone made
  // the page contradict itself: "182 studios" beside "the most catalogued (5)".
  const studioCountByCountry = directoryCountByCountry();
  const insights = generateInsights({
    scores: intel.scores,
    value: (id, iso3) => intel.snapshot.metrics[id]?.[iso3]?.value ?? null,
    studioCountByCountry,
  }).slice(0, 3);

  const tickerItems: TickerItem[] = [
    ...intel.scores.market_attractiveness.slice(0, 6).map((sc) => ({
      label: COUNTRY_BY_ISO3[sc.entityId]?.name ?? sc.entityId,
      value: fmtScore(sc.total),
      tone: "emerald" as const,
    })),
    ...growth.slice(0, 4).map((g) => ({
      label: `${COUNTRY_BY_ISO3[g.iso3]?.name ?? g.iso3} growth`,
      value: `${(g.g as number).toFixed(1)}%`,
      tone: "blue" as const,
    })),
    { label: "Studios tracked", value: String(c.studios), tone: "violet" as const },
    { label: "Games tracked", value: String(c.games), tone: "orange" as const },
  ];

  return (
    <div className="space-y-8 view-enter">
      {/* ── Hero with ambient constellation banner ───────────────────── */}
      <section className="relative -mx-4 overflow-hidden border-b border-line px-4 pb-10 pt-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <HeroCanvas />
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="min-w-0 max-w-3xl">
          <span className="pill mb-5 border-[rgba(34,197,94,0.3)] bg-[var(--emerald-soft)] text-accent-400">
            <span className="dot-live" /> Live market intelligence · 54 countries
          </span>
          <h1 className="display text-[2.1rem] text-white xs:text-5xl sm:text-[3.4rem]">
            African <span className="gradient-text">gaming and</span>
            <br />
            <span className="gradient-text">animation</span> intelligence
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Decision-ready intelligence on Africa&apos;s games, esports and animation economy —
            markets, studios, titles, hardware and funding across all 54 countries, continuously
            updated from free public data. Every number traces to its source.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/rankings"
              className="inline-flex items-center gap-2 rounded-[12px] bg-accent-500 px-5 py-2.5 text-sm font-semibold text-[#04140a] transition-colors hover:bg-accent-400"
            >
              Open rankings <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href="/countries"
              className="inline-flex items-center gap-2 rounded-[12px] border border-line-strong px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-[rgba(34,197,94,0.4)]"
            >
              Explore the map
            </Link>
            </div>
          </div>

          {/* Forecast figures — labelled as projection, kept apart from the
              measured World Bank series the rest of the page runs on. */}
          <div className="min-w-0 lg:justify-self-end lg:border-l lg:border-line lg:pl-10">
            <HeroForecast />
          </div>
        </div>
      </section>

      {/* ── Live ticker ──────────────────────────────────────────────── */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <Ticker items={tickerItems} />
      </div>

      {/* ── Pulse KPI cards ──────────────────────────────────────────── */}
      <section>
        <p className="eyebrow mb-3">Africa creative industry pulse</p>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]">
          <KpiCard label="Countries tracked" value={fmtNumber(c.countries)} accent="emerald" icon="globe" href="/countries" />
          <KpiCard label="Studios" value={fmtNumber(c.studios)} sub="verified + community" accent="blue" icon="building" href="/studios" />
          <KpiCard label="Games" value={fmtNumber(c.games)} sub="live Steam signals" accent="violet" icon="controller" href="/games" />
          <KpiCard label="Animation studios" value={fmtNumber(c.animationStudios)} accent="orange" icon="film" href="/animation" />
          <KpiCard label="Esports orgs" value={fmtNumber(c.esportsTeams)} accent="emerald" icon="trophy" href="/esports" />
          <KpiCard label="Metrics per country" value={fmtNumber(c.metricsTracked)} sub="World Bank, live" accent="blue" icon="table" href="/explorer" />
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Studios combine our verified records with the GameDevMap community directory,
          de-duplicated. Tournament data awaits a verified free source — shown as unavailable
          rather than zero.
        </p>
      </section>

      {/* ── Automated insights ───────────────────────────────────────── */}
      {insights.length > 0 && (
        <section className="grid gap-3 md:grid-cols-3">
          {insights.map((ins) => (
            <Link
              key={ins.id}
              href={ins.href ?? "#"}
              className="flex items-start gap-3 rounded-xl border border-line bg-ink-850/60 p-4 transition-colors hover:border-gold-500/30"
            >
              <span className="mt-0.5 shrink-0 text-gold-400">◆</span>
              <p className="text-sm text-slate-200">{ins.text}</p>
            </Link>
          ))}
        </section>
      )}

      {/* ── Map + Top markets ────────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <SectionHeader
            eyebrow="Interactive map"
            title="Africa by score"
            action={
              <div className="flex items-center gap-3">
                <CoverageBadge coverage={intel.counts.coverageAvg} />
                <Link href="/map" className="text-xs font-medium text-accent-400 hover:text-accent-500">
                  Full map →
                </Link>
              </div>
            }
          />
          <AfricaLeafletMap layers={layers} height={420} compact />
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionHeader
            eyebrow="Ranked · market attractiveness"
            title="Top markets"
            action={
              <Link href="/rankings" className="text-xs font-medium text-gold-400 hover:text-gold-500">
                All →
              </Link>
            }
          />
          <ol className="space-y-1">
            {topMarkets.map((s, i) => {
              const country = COUNTRY_BY_ISO3[s.entityId]!;
              return (
                <li key={s.entityId}>
                  <Link
                    href={`/countries/${s.entityId.toLowerCase()}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-700/60"
                  >
                    <RankBadge rank={i + 1} />
                    <span className="text-base">{flagEmoji(country.iso2)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-100">
                        {country.name}
                      </span>
                      <ScoreBar value={s.total} />
                    </span>
                    <span className="figure w-12 text-right text-sm font-bold text-gold-400">
                      {fmtScore(s.total)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </Panel>
      </section>

      {/* ── Fastest growing + directories pulse ──────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader eyebrow="Momentum · GDP growth (annual %)" title="Fastest-growing markets" />
          <div className="space-y-2">
            {growth.map((r) => {
              const country = COUNTRY_BY_ISO3[r.iso3]!;
              return (
                <div key={r.iso3} className="flex items-center gap-3">
                  <span className="text-base">{flagEmoji(country.iso2)}</span>
                  <Link
                    href={`/countries/${r.iso3.toLowerCase()}`}
                    className="flex-1 text-sm font-medium text-slate-200 hover:text-white"
                  >
                    {country.name}
                  </Link>
                  <MetricNumber
                    metricId="gdp_growth"
                    iso3={r.iso3}
                    value={r.g}
                    unit="%"
                    className="text-sm font-semibold text-emerald2-400"
                  />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            eyebrow="Verified seed"
            title="Studio & animation pulse"
            action={
              <Link href="/studios" className="text-xs font-medium text-gold-400 hover:text-gold-500">
                Directory →
              </Link>
            }
          />
          <div className="space-y-2">
            {STUDIOS.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                href={`/studios/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink-850/60 px-3 py-2.5 hover:border-gold-500/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    {flagEmoji(COUNTRY_BY_ISO3[s.countryIso3]?.iso2 ?? "")} {s.city ?? "—"} ·{" "}
                    {s.categories.slice(0, 2).join(", ")}
                  </p>
                </div>
                <span className="pill border-emerald2-500/30 bg-emerald2-500/10 text-emerald2-400">
                  Verified
                </span>
              </Link>
            ))}
            {ANIMATION_STUDIOS.slice(0, 1).map((a) => (
              <Link
                key={a.id}
                href="/animation"
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink-850/60 px-3 py-2.5 hover:border-gold-500/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{a.name}</p>
                  <p className="text-xs text-slate-500">
                    {flagEmoji(COUNTRY_BY_ISO3[a.countryIso3]?.iso2 ?? "")} Animation ·{" "}
                    {a.notableProductions?.[0]}
                  </p>
                </div>
                <span className="pill border-gold-500/30 bg-gold-500/10 text-gold-400">Animation</span>
              </Link>
            ))}
          </div>
        </Panel>
      </section>

      {!intel.snapshot.live && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-300">
          Live data source is temporarily unavailable. Figures show N/A and no cached values were
          overwritten. Refresh shortly.
        </div>
      )}
    </div>
  );
}
