import type { Metadata } from "next";
import Link from "next/link";
import { ESPORTS_ORGS, ESPORTS_TOURNAMENTS } from "@/lib/data/creative";
import { getIntelligence } from "@/lib/data/intelligence";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { SectionHeader, Panel, Pill, ScoreBar, DataUnavailable } from "@/components/ui/primitives";
import { fmtScore } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Esports — African esports intelligence",
  description: "African esports organisations, readiness ranking and the provenance-tier framework.",
};

const TIERS: [string, string, string][] = [
  ["OFFICIAL", "Publisher / official tournament APIs", "border-emerald2-500/30 bg-emerald2-500/10 text-emerald2-300"],
  ["VERIFIED", "Sourced to an organisation's own official site", "border-gold-500/30 bg-gold-500/10 text-gold-300"],
  ["COMMUNITY", "Liquipedia (CC BY-SA, attribution + rate limits)", "border-slate-500/30 bg-slate-500/10 text-slate-300"],
];

export default async function EsportsPage() {
  const intel = await getIntelligence();
  const ranking = intel.scores.esports.slice(0, 10);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Phase 3" title="Esports intelligence" />
      <div className="flex flex-wrap gap-2">
        <Pill tone="gold">{ESPORTS_ORGS.length} organisations</Pill>
        <Pill>{ESPORTS_TOURNAMENTS.length} tournaments tracked</Pill>
        <Pill tone="emerald">Provenance-tiered</Pill>
      </div>

      <div className="rounded-lg border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-gold-200">
        <span className="font-semibold">Readiness, not activity. </span>
        Verified African prize pools & player earnings sit behind community sources with strict
        terms. The ranking below scores esports <span className="font-semibold text-white">readiness</span> from
        verified data — audience, digital access, purchasing power and catalogued org presence — not
        tournament activity. Tournament & prize data is added via the Liquipedia (COMMUNITY) and
        publisher (OFFICIAL) adapters, never estimated.
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Readiness ranking */}
        <Panel className="lg:col-span-3">
          <SectionHeader eyebrow="Best for esports · readiness" title="Country ranking" />
          <div className="space-y-2">
            {ranking.map((s, i) => {
              const c = COUNTRY_BY_ISO3[s.entityId]!;
              return (
                <div key={s.entityId} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-slate-500">{i + 1}</span>
                  <span>{flagEmoji(c.iso2)}</span>
                  <Link href={`/countries/${s.entityId.toLowerCase()}`} className="w-28 shrink-0 truncate text-sm text-slate-200 hover:text-gold-400">
                    {c.name}
                  </Link>
                  <div className="flex-1"><ScoreBar value={s.total} color="#16E07A" /></div>
                  <span className="figure w-9 text-right text-sm font-semibold text-emerald2-400">{fmtScore(s.total)}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Provenance tiers */}
        <Panel className="lg:col-span-2">
          <SectionHeader eyebrow="Never mixed" title="Provenance tiers" />
          <div className="space-y-3">
            {TIERS.map(([tier, desc, cls]) => (
              <div key={tier} className="rounded-lg border border-line bg-ink-850/60 p-3">
                <span className={`pill ${cls}`}>{tier}</span>
                <p className="mt-2 text-sm text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Org directory */}
      <Panel>
        <SectionHeader eyebrow="Directory · verified seed" title="Esports organisations" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ESPORTS_ORGS.map((o) => {
            const c = COUNTRY_BY_ISO3[o.countryIso3]!;
            return (
              <Link key={o.id} href={`/esports/${o.id}`} className="block rounded-lg border border-line bg-ink-850/60 p-4 transition-colors hover:border-gold-500/30">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">{o.name}</p>
                  {o.verified ? <Pill tone="emerald">✓</Pill> : <Pill tone="gold">⚠</Pill>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{flagEmoji(c.iso2)} {o.city ?? c.name}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {o.games?.slice(0, 3).map((g) => (
                    <span key={g} className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-400">{g}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>

      {/* Tournaments */}
      <Panel>
        <SectionHeader eyebrow="Prize pools never estimated" title="Tournaments" />
        <DataUnavailable label="No tournaments with a verified free source yet. Prize pools & results arrive via the Liquipedia (COMMUNITY) and publisher (OFFICIAL) adapters — shown N/A until then, never invented." />
      </Panel>
    </div>
  );
}
