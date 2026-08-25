import type { Metadata } from "next";
import { getIntelligence } from "@/lib/data/intelligence";
import Link from "next/link";
import { InvestorFinder, type IntentData } from "@/components/investors/InvestorFinder";
import { SectionHeader, Panel, Pill, DataUnavailable } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { FUNDING_ROUNDS, ACCELERATORS, TOTAL_DISCLOSED_USD } from "@/lib/data/funding";
import { flagEmoji, COUNTRY_BY_ISO3 } from "@/lib/data/countries";
import { fmtNumber } from "@/lib/format";
import type { RankingMode } from "@/lib/types";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Investor Mode — where to invest, build, hire, publish",
  description: "Turn an objective into a ranked shortlist of African markets with transparent rationale.",
};

const INTENTS: { key: string; mode: RankingMode; label: string; question: string }[] = [
  { key: "invest", mode: "investment", label: "Invest in African games", question: "Where does capital compound?" },
  { key: "build", mode: "production", label: "Establish a studio", question: "Where should I build?" },
  { key: "hire", mode: "hiring", label: "Hire creative & technical talent", question: "Where is the workforce?" },
  { key: "publish", mode: "distribution", label: "Publish / distribute games", question: "Where should I ship?" },
  { key: "esports", mode: "esports", label: "Enter African esports", question: "Where is the audience & access?" },
];

export default async function InvestorsPage() {
  const intel = await getIntelligence();
  const val = (id: string, iso3: string) => intel.snapshot.metrics[id]?.[iso3]?.value ?? null;

  const data: IntentData[] = INTENTS.map((intent) => ({
    key: intent.key,
    label: intent.label,
    question: intent.question,
    mode: intent.mode,
    top: intel.scores[intent.mode].slice(0, 6).map((s) => {
      const c = COUNTRY_BY_ISO3[s.entityId]!;
      return {
        iso3: c.iso3,
        iso2: c.iso2,
        name: c.name,
        total: s.total,
        confidence: s.confidence,
        drivers: s.components
          .filter((x) => x.score !== null)
          .sort((a, b) => (b.score as number) - (a.score as number))
          .slice(0, 3)
          .map((x) => ({ label: x.label, score: x.score as number })),
        gdpPerCapita: val("gdp_per_capita", c.iso3),
        internet: val("internet_pct", c.iso3),
        gdpGrowth: val("gdp_growth", c.iso3),
      };
    }),
  }));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Query → ranked shortlist" title="Investor mode" />
      <p className="max-w-2xl text-sm text-slate-400">
        State an objective. Get a shortlist ranked on the dimensions that objective actually
        depends on — with the top drivers and the risk of thin data shown for every market.
      </p>
      <InvestorFinder data={data} />

      {/* Disclosed funding — never estimated */}
      <Panel>
        <SectionHeader
          eyebrow="Disclosed only · never estimated"
          title="Funding rounds"
          action={<Pill tone="gold">${fmtNumber(TOTAL_DISCLOSED_USD).replace("$", "")} tracked</Pill>}
        />
        <p className="mb-4 text-sm text-slate-400">
          Only publicly disclosed, source-cited rounds appear here. Undisclosed funding is shown as
          N/A — the platform does not estimate private figures.
        </p>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-ink-850 text-xs text-slate-400">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Entity</th>
                <th className="px-4 py-2.5 text-left font-medium">Round</th>
                <th className="px-4 py-2.5 text-left font-medium">Year</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium">Lead</th>
                <th className="px-4 py-2.5 text-right font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FUNDING_ROUNDS.map((r) => (
                <tr key={r.id} className="hover:bg-ink-800/40">
                  <td className="px-4 py-2.5 font-semibold text-slate-100">
                    {flagEmoji(COUNTRY_BY_ISO3[r.countryIso3]?.iso2 ?? "")}{" "}
                    {r.studioId ? <Link href={`/studios/${r.studioId}`} className="hover:text-gold-400">{r.entityName}</Link> : r.entityName}
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{r.round}</td>
                  <td className="px-4 py-2.5 figure text-slate-300">{r.year}</td>
                  <td className="px-4 py-2.5 text-right figure text-emerald2-400">
                    {r.amountUsd ? `$${fmtNumber(r.amountUsd).replace("$", "")}` : "N/A"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{r.leadInvestors?.join(", ") ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-500">
                      <Icon name="external" className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Accelerators */}
      <Panel>
        <SectionHeader eyebrow="Ecosystem" title="Accelerators & programmes" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACCELERATORS.map((a) => (
            <a key={a.id} href={a.website} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line bg-ink-850/60 p-4 transition-colors hover:border-gold-500/30">
              <p className="text-sm font-semibold text-slate-100">{a.name}</p>
              <p className="mt-1 text-xs text-slate-500">{a.focus}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-gold-400">Visit <Icon name="external" className="h-3 w-3" /></span>
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}
