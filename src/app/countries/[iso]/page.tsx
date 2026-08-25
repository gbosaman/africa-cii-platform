import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COUNTRIES, getCountry, flagEmoji } from "@/lib/data/countries";
import { getIntelligence } from "@/lib/data/intelligence";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";
import { MODE_LABELS, ALL_MODES } from "@/lib/scoring/weights";
import { MetricNumber } from "@/components/metric/MetricNumber";
import {
  Panel,
  SectionHeader,
  ScoreBar,
  ConfidenceBadge,
  CoverageBadge,
  RankBadge,
  DataUnavailable,
} from "@/components/ui/primitives";
import { StudioMini } from "@/components/directory/StudioMini";
import { WatchButton } from "@/components/watchlist/WatchButton";
import { fmtScore, freshnessFromYear, FRESHNESS_META } from "@/lib/format";
import { STUDIOS } from "@/lib/data/studios";
import { ANIMATION_STUDIOS, ESPORTS_ORGS } from "@/lib/data/creative";
import clsx from "clsx";

export const revalidate = 86400;

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ iso: c.iso3.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: { iso: string } }): Promise<Metadata> {
  const country = getCountry(params.iso);
  if (!country) return { title: "Country not found" };
  return {
    title: `${country.name} — Creative Industry Intelligence`,
    description: `Market attractiveness, digital access, talent and investment signals for ${country.name}'s games, esports and animation economy.`,
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  market_size: "Market snapshot",
  digital_access: "Digital access",
  talent: "Talent & workforce",
  investment: "Investment climate",
  distribution: "Distribution infrastructure",
};

export default async function CountryPage({ params }: { params: { iso: string } }) {
  const country = getCountry(params.iso);
  if (!country) notFound();

  const intel = await getIntelligence();
  const iso3 = country.iso3;
  const modeScores = intel.scoreByCountry[iso3]!;
  const market = modeScores.market_attractiveness;
  const rank = intel.scores.market_attractiveness.findIndex((s) => s.entityId === iso3) + 1;
  const val = (id: string) => intel.snapshot.metrics[id]?.[iso3]?.value ?? null;
  const yr = (id: string) => intel.snapshot.metrics[id]?.[iso3]?.year ?? 0;

  const studios = STUDIOS.filter((s) => s.countryIso3 === iso3);
  const animationStudios = ANIMATION_STUDIOS.filter((a) => a.countryIso3 === iso3);
  const esportsOrgs = ESPORTS_ORGS.filter((o) => o.countryIso3 === iso3);

  // Group metrics by category for the source-traced sections.
  const byCategory = WORLD_BANK_METRICS.reduce<Record<string, typeof WORLD_BANK_METRICS>>(
    (acc, m) => {
      (acc[m.category] ??= []).push(m);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <Link href="/countries" className="text-xs font-medium text-slate-400 hover:text-white">
        ← All countries
      </Link>

      {/* Header */}
      <header className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{flagEmoji(country.iso2)}</span>
          <div>
            <p className="eyebrow">{country.region} · {country.iso3}</p>
            <h1 className="display text-3xl text-white sm:text-4xl">{country.name}</h1>
            <p className="mt-1 text-sm text-slate-400">Capital · {country.capital}</p>
            <div className="mt-2">
              <WatchButton item={{ type: "country", id: country.iso3, label: country.name, href: `/countries/${country.iso3.toLowerCase()}` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="eyebrow">Market score</p>
            <p className="figure text-4xl font-bold text-gold-400">{fmtScore(market.total)}</p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <RankBadge rank={rank} />
              <span className="text-xs text-slate-400">of 54</span>
            </div>
          </div>
          <div className="hidden flex-col items-end gap-2 sm:flex">
            <ConfidenceBadge confidence={market.confidence} />
            <CoverageBadge coverage={market.coverage} />
          </div>
        </div>
      </header>

      {/* Score breakdown + mode ranks */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <SectionHeader eyebrow="Transparent breakdown" title="Market attractiveness score" />
          <p className="mb-4 text-sm text-slate-400">
            Weighted composite of eight dimensions. Weights renormalise over dimensions with data,
            so missing data lowers coverage — never silently scores zero.
          </p>
          <div className="space-y-3">
            {market.components.map((comp) => (
              <div key={comp.dimension}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-300">
                    {comp.label}
                    <span className="text-[10px] text-slate-500">·{(comp.weight * 100).toFixed(0)}%</span>
                  </span>
                  <span className="figure font-semibold text-slate-100">
                    {comp.score === null ? (
                      <span className="text-slate-500">N/A</span>
                    ) : (
                      fmtScore(comp.score)
                    )}
                  </span>
                </div>
                <ScoreBar
                  value={comp.score}
                  color={comp.dimension === "digital_access" ? "#16E07A" : "#F5C518"}
                />
                {comp.coverage < 1 && comp.coverage > 0 && (
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {Math.round(comp.coverage * 100)}% of inputs available
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionHeader eyebrow="Answering different questions" title="Scores by use case" />
          <div className="space-y-1">
            {ALL_MODES.map((mode) => {
              const s = modeScores[mode];
              const modeRank = intel.scores[mode].findIndex((x) => x.entityId === iso3) + 1;
              return (
                <Link
                  key={mode}
                  href={`/rankings?mode=${mode}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-700/60"
                >
                  <span className="min-w-0 flex-1 text-sm text-slate-300">{MODE_LABELS[mode]}</span>
                  <span className="text-[11px] text-slate-500">#{modeRank}</span>
                  <span className="w-24">
                    <ScoreBar value={s.total} />
                  </span>
                  <span className="figure w-10 text-right text-sm font-semibold text-gold-400">
                    {fmtScore(s.total)}
                  </span>
                </Link>
              );
            })}
          </div>
        </Panel>
      </section>

      {/* Source-traced metric sections */}
      {Object.entries(byCategory).map(([cat, metrics]) => (
        <Panel key={cat}>
          <SectionHeader eyebrow="Source: World Bank WDI · click any figure" title={CATEGORY_LABELS[cat] ?? cat} />
          <div className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => {
              const value = val(metric.id);
              const year = yr(metric.id);
              const fresh = freshnessFromYear(year);
              return (
                <div key={metric.id} className="bg-ink-850 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-400">{metric.shortLabel ?? metric.label}</p>
                    {value !== null && (
                      <span className={clsx("h-2 w-2 shrink-0 rounded-full", FRESHNESS_META[fresh].dot)} />
                    )}
                  </div>
                  <div className="mt-1.5 text-xl font-bold">
                    <MetricNumber metricId={metric.id} iso3={iso3} value={value} unit={metric.unit} />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {value !== null ? `${year} · ${FRESHNESS_META[fresh].label}` : "No verified value"}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
      ))}

      {/* Studios in country */}
      <Panel>
        <SectionHeader
          eyebrow="Verified seed directory"
          title={`Studios in ${country.name}`}
          action={
            <Link href="/studios" className="text-xs font-medium text-gold-400 hover:text-gold-500">
              All studios →
            </Link>
          }
        />
        {studios.length === 0 ? (
          <DataUnavailable label="No verified studios recorded yet for this country. Contribute via the admin console." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {studios.map((s) => (
              <StudioMini key={s.id} studio={s} />
            ))}
          </div>
        )}
      </Panel>

      {/* Esports / animation */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader
            eyebrow="Phase 3 · verified seed"
            title="Esports"
            action={<Link href="/esports" className="text-xs font-medium text-gold-400 hover:text-gold-500">All →</Link>}
          />
          {esportsOrgs.length === 0 ? (
            <DataUnavailable label="No verified esports organisations recorded yet. Tournament/prize data pending COMMUNITY/OFFICIAL sources." />
          ) : (
            <ul className="space-y-2">
              {esportsOrgs.map((o) => (
                <li key={o.id}>
                  <Link href={`/esports/${o.id}`} className="flex items-center justify-between rounded-lg border border-line bg-ink-850/60 px-3 py-2 text-sm hover:border-gold-500/30">
                    <span className="text-slate-200">{o.name}</span>
                    <span className="text-xs text-slate-500">{o.games?.slice(0, 2).join(", ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <SectionHeader
            eyebrow="Phase 3 · verified seed"
            title="Animation"
            action={<Link href="/animation" className="text-xs font-medium text-gold-400 hover:text-gold-500">All →</Link>}
          />
          {animationStudios.length === 0 ? (
            <DataUnavailable label="No verified animation studios recorded yet for this country." />
          ) : (
            <ul className="space-y-2">
              {animationStudios.map((a) => (
                <li key={a.id}>
                  <Link href={`/animation/${a.id}`} className="flex items-center justify-between rounded-lg border border-line bg-ink-850/60 px-3 py-2 text-sm hover:border-gold-500/30">
                    <span className="text-slate-200">{a.name}</span>
                    <span className="text-xs text-slate-500">{a.notableProductions?.[0]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
