import Link from "next/link";
import { getIntelligence, buildMapLayers } from "@/lib/data/intelligence";
import { AfricaMap } from "@/components/map/AfricaMap";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { Panel, SectionHeader, ScoreBar, RankBadge, Pill, CoverageBadge } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { fmtScore, fmtNumber } from "@/lib/format";
import { STUDIOS, ANIMATION_STUDIOS } from "@/lib/data/studios";
import { generateInsights } from "@/lib/insights";

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

  const studioCountByCountry = STUDIOS.reduce<Record<string, number>>((acc, s) => {
    acc[s.countryIso3] = (acc[s.countryIso3] ?? 0) + 1;
    return acc;
  }, {});
  const insights = generateInsights({
    scores: intel.scores,
    value: (id, iso3) => intel.snapshot.metrics[id]?.[iso3]?.value ?? null,
    studioCountByCountry,
  }).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-line bg-ink-850/80 p-6 sm:p-9">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Pill tone="emerald">Africa · 54 countries</Pill>
            <Pill tone="gold">Live World Bank data</Pill>
            <span className="pill border-line bg-ink-700 text-slate-400">
              Games · Esports · Animation
            </span>
          </div>
          <h1 className="display text-[2rem] leading-[0.95] text-white xs:text-4xl sm:text-6xl sm:leading-[0.9]">
            Africa&apos;s creative
            <br />
            digital economy,
            <br />
            <span className="text-gold-500">decision-ready.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-slate-300">
            Fragmented data on African games, esports and animation — collected, verified,
            normalised and scored into comparable intelligence. Every number traces to its
            source. Estimates are labelled. Zero never means unknown.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/rankings"
              className="clip-slant inline-flex items-center gap-2 bg-gold-500 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink-900 transition-colors hover:bg-gold-400"
            >
              Explore rankings <Icon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-gold-500/40"
            >
              How scores work
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 opacity-30 lg:block">
          <Icon name="globe" className="h-72 w-72 text-emerald2-500/40" strokeWidth={0.5} />
        </div>
      </section>

      {/* ── Pulse KPI strip ──────────────────────────────────────────── */}
      <section>
        <p className="eyebrow mb-3">Africa creative industry pulse</p>
        {/* 7 tiles: the last one spans the full row on 2-col layouts so no
            empty cell is left dangling. */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line [&>*:last-child]:col-span-2 md:grid-cols-4 lg:grid-cols-7 lg:[&>*:last-child]:col-span-1">
          <PulseTile label="Countries" value={c.countries} href="/countries" />
          <PulseTile label="Studios" value={c.studios} href="/studios" tone="gold" />
          <PulseTile label="Games" value={c.games} href="/games" />
          <PulseTile label="Animation" value={c.animationStudios} href="/animation" />
          <PulseTile label="Esports orgs" value={c.esportsTeams} href="/esports" />
          <PulseTile label="Tournaments" value={c.tournaments} href="/esports" na />
          <PulseTile label="Metrics/country" value={c.metricsTracked} href="/explorer" tone="emerald" />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Directory counts reflect the verified seed (Phase 2/3 ingestion expands them). “N/A”
          tiles await verified free sources — shown as unavailable rather than zero.
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
            action={<CoverageBadge coverage={intel.counts.coverageAvg} />}
          />
          <AfricaMap layers={layers} />
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

function PulseTile({
  label,
  value,
  href,
  tone,
  na,
}: {
  label: string;
  value: number;
  href: string;
  tone?: "gold" | "emerald";
  na?: boolean;
}) {
  const color = na
    ? "text-slate-500"
    : tone === "gold"
      ? "text-gold-400"
      : tone === "emerald"
        ? "text-emerald2-400"
        : "text-white";
  return (
    <Link href={href} className="group bg-ink-850 p-4 transition-colors hover:bg-ink-800">
      <p className={`figure text-2xl font-bold ${color}`}>{na ? "N/A" : fmtNumber(value)}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500 group-hover:text-slate-400">
        {label}
      </p>
    </Link>
  );
}
