import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ESPORTS_ORGS } from "@/lib/data/creative";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { Panel, SectionHeader, Pill, DataUnavailable } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export function generateStaticParams() {
  return ESPORTS_ORGS.map((o) => ({ id: o.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const o = ESPORTS_ORGS.find((x) => x.id === params.id);
  if (!o) return { title: "Organisation not found" };
  return { title: `${o.name} — esports organisation`, description: `Profile for ${o.name}.` };
}

export default function EsportsOrgPage({ params }: { params: { id: string } }) {
  const org = ESPORTS_ORGS.find((o) => o.id === params.id);
  if (!org) notFound();
  const country = COUNTRY_BY_ISO3[org.countryIso3]!;

  const facts: [string, string | null][] = [
    ["Country", country.name],
    ["City", org.city ?? null],
    ["Founded", org.foundedYear ? String(org.foundedYear) : null],
    ["Titles", org.games?.join(", ") ?? null],
    ["Status", org.status ?? null],
    ["Provenance tier", org.tier],
  ];

  return (
    <div className="space-y-6">
      <Link href="/esports" className="text-xs font-medium text-slate-400 hover:text-white">← Esports</Link>

      <header className="panel flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flagEmoji(country.iso2)}</span>
          <p className="eyebrow">{country.name} · {org.city ?? "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="display text-3xl text-white sm:text-4xl">{org.name}</h1>
          {org.verified ? <Pill tone="emerald">✓ Verified</Pill> : <Pill tone="gold">⚠ Needs verification</Pill>}
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
          {org.website && (
            <a href={org.website} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 hover:text-gold-500">
              Official website <Icon name="external" className="h-3.5 w-3.5" />
            </a>
          )}
          {org.notes && <p className="mt-3 border-t border-line pt-3 text-xs text-slate-400">{org.notes}</p>}
        </Panel>

        <Panel>
          <SectionHeader eyebrow="Performance" title="Results & earnings" />
          <DataUnavailable label="Team results, roster and earnings arrive via COMMUNITY (Liquipedia) / OFFICIAL sources — N/A until verified, never estimated." />
        </Panel>
      </div>
    </div>
  );
}
