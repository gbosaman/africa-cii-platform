import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ANIMATION_STUDIOS } from "@/lib/data/creative";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { Panel, SectionHeader, Pill, DataUnavailable } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export function generateStaticParams() {
  return ANIMATION_STUDIOS.map((a) => ({ id: a.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const a = ANIMATION_STUDIOS.find((x) => x.id === params.id);
  if (!a) return { title: "Animation studio not found" };
  return { title: `${a.name} — animation studio`, description: `Profile & productions for ${a.name}.` };
}

const CROSSOVER_LABEL: Record<string, string> = {
  animation_to_game: "Animation → Game",
  game_to_animation: "Game → Animation",
  both: "Animation ⇄ Game",
};

export default function AnimationStudioPage({ params }: { params: { id: string } }) {
  const studio = ANIMATION_STUDIOS.find((a) => a.id === params.id);
  if (!studio) notFound();
  const country = COUNTRY_BY_ISO3[studio.countryIso3]!;

  const facts: [string, string | null][] = [
    ["Country", country.name],
    ["City", studio.city ?? null],
    ["Founded", studio.foundedYear ? String(studio.foundedYear) : null],
    ["IP crossover", studio.ipCrossover ? CROSSOVER_LABEL[studio.ipCrossover] ?? null : null],
    ["International partners", studio.internationalPartners?.join(", ") ?? null],
    ["Provenance tier", studio.tier],
  ];

  return (
    <div className="space-y-6">
      <Link href="/animation" className="text-xs font-medium text-slate-400 hover:text-white">← Animation</Link>

      <header className="panel flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flagEmoji(country.iso2)}</span>
          <p className="eyebrow">{country.name} · {studio.city ?? "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="display text-3xl text-white sm:text-4xl">{studio.name}</h1>
          {studio.verified ? <Pill tone="emerald">✓ Verified</Pill> : <Pill tone="gold">⚠ Needs verification</Pill>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader eyebrow="Source-cited facts" title="Profile" />
          <dl className="divide-y divide-line">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className={v ? "capitalize text-slate-200" : "figure text-slate-500"}>{v ?? "N/A"}</dd>
              </div>
            ))}
          </dl>
          {studio.website && (
            <a href={studio.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 hover:text-gold-500">
              Official website <Icon name="external" className="h-3.5 w-3.5" />
            </a>
          )}
          {studio.notes && <p className="mt-3 border-t border-line pt-3 text-xs text-slate-400">{studio.notes}</p>}
        </Panel>

        <Panel>
          <SectionHeader eyebrow="Catalogue" title="Notable productions" />
          {studio.notableProductions?.length ? (
            <ul className="space-y-2 text-sm text-slate-300">
              {studio.notableProductions.map((p) => (
                <li key={p} className="flex gap-2"><span className="text-gold-400">▸</span>{p}</li>
              ))}
            </ul>
          ) : (
            <DataUnavailable label="No verified productions recorded yet." />
          )}
        </Panel>
      </div>
    </div>
  );
}
