import type { Metadata } from "next";
import Link from "next/link";
import { ANIMATION_STUDIOS } from "@/lib/data/creative";
import { getIntelligence } from "@/lib/data/intelligence";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { SectionHeader, Pill, Panel, ScoreBar, DataUnavailable } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { fmtScore } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Animation — African animation intelligence",
  description: "African animation studios, productions and IP, plus animation-market attractiveness scoring.",
};

const CROSSOVER_LABEL: Record<string, string> = {
  animation_to_game: "Animation → Game",
  game_to_animation: "Game → Animation",
  both: "Animation ⇄ Game",
};

export default async function AnimationPage() {
  const intel = await getIntelligence();
  const ranking = intel.scores.animation.slice(0, 8);

  const byCountry = ANIMATION_STUDIOS.reduce<Record<string, number>>((acc, a) => {
    acc[a.countryIso3] = (acc[a.countryIso3] ?? 0) + 1;
    return acc;
  }, {});
  const crossover = ANIMATION_STUDIOS.filter((a) => a.ipCrossover);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Phase 3 · one creative ecosystem" title="Animation industry" />
      <div className="flex flex-wrap gap-2">
        <Pill tone="gold">{ANIMATION_STUDIOS.length} studios</Pill>
        <Pill>{Object.keys(byCountry).length} countries</Pill>
        <Pill tone="emerald">Source-cited</Pill>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Animation-market ranking */}
        <Panel className="lg:col-span-2">
          <SectionHeader eyebrow="Best for animation" title="Country ranking" />
          <p className="mb-3 text-xs text-slate-500">
            Talent, industry maturity (verified studio counts), distribution & investment.
          </p>
          <ol className="space-y-2">
            {ranking.map((s, i) => {
              const c = COUNTRY_BY_ISO3[s.entityId]!;
              return (
                <li key={s.entityId} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-slate-500">{i + 1}</span>
                  <span>{flagEmoji(c.iso2)}</span>
                  <Link href={`/countries/${s.entityId.toLowerCase()}`} className="w-24 shrink-0 truncate text-sm text-slate-200 hover:text-gold-400">
                    {c.name}
                  </Link>
                  <div className="flex-1"><ScoreBar value={s.total} /></div>
                  <span className="figure w-9 text-right text-sm font-semibold text-gold-400">{fmtScore(s.total)}</span>
                </li>
              );
            })}
          </ol>
        </Panel>

        {/* Studio directory */}
        <Panel className="lg:col-span-3">
          <SectionHeader eyebrow="Directory" title="Animation studios" />
          <div className="grid gap-3 sm:grid-cols-2">
            {ANIMATION_STUDIOS.map((a) => {
              const c = COUNTRY_BY_ISO3[a.countryIso3]!;
              return (
                <Link key={a.id} href={`/animation/${a.id}`} className="block rounded-lg border border-line bg-ink-850/60 p-4 transition-colors hover:border-gold-500/30">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">{a.name}</p>
                    {a.verified ? <Pill tone="emerald">✓</Pill> : <Pill tone="gold">⚠</Pill>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {flagEmoji(c.iso2)} {a.city ?? "—"}{a.foundedYear ? ` · est. ${a.foundedYear}` : ""}
                  </p>
                  {a.ipCrossover && (
                    <span className="mt-2 inline-block rounded border border-emerald2-500/25 bg-emerald2-500/10 px-1.5 py-0.5 text-[10px] text-emerald2-300">
                      {CROSSOVER_LABEL[a.ipCrossover]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* IP crossover thesis */}
      <Panel>
        <SectionHeader eyebrow="The animation ⇄ game thesis" title="IP crossover opportunities" />
        <p className="mb-4 max-w-2xl text-sm text-slate-400">
          African animation IP is an export asset. The platform flags studios positioned to move IP
          across media — the highest-leverage opportunity for investors and publishers.
        </p>
        {crossover.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {crossover.map((a) => (
              <div key={a.id} className="rounded-lg border border-line bg-ink-850/60 p-4">
                <p className="text-sm font-semibold text-slate-100">{a.name}</p>
                <p className="mt-1 text-xs text-emerald2-300">{CROSSOVER_LABEL[a.ipCrossover!]}</p>
                <p className="mt-1 text-xs text-slate-500">{a.notableProductions?.[0]}</p>
                {a.internationalPartners?.length ? (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Partners: {a.internationalPartners.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <DataUnavailable label="No crossover-flagged studios yet." />
        )}
      </Panel>
    </div>
  );
}
