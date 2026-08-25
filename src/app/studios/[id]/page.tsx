import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { STUDIOS, STUDIO_BY_ID, GAMES } from "@/lib/data/studios";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { scoreStudio } from "@/lib/scoring/studio";
import { Panel, SectionHeader, ScoreBar, Pill, DataUnavailable } from "@/components/ui/primitives";
import { WatchButton } from "@/components/watchlist/WatchButton";
import { Icon } from "@/components/ui/Icon";
import { fmtScore } from "@/lib/format";

export function generateStaticParams() {
  return STUDIOS.map((s) => ({ id: s.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const s = STUDIO_BY_ID[params.id];
  if (!s) return { title: "Studio not found" };
  return { title: `${s.name} — studio profile`, description: `Profile & strength scorecard for ${s.name}.` };
}

export default function StudioPage({ params }: { params: { id: string } }) {
  const studio = STUDIO_BY_ID[params.id];
  if (!studio) notFound();
  const country = COUNTRY_BY_ISO3[studio.countryIso3]!;
  const games = GAMES.filter((g) => g.studioId === studio.id);
  const strength = scoreStudio(studio, GAMES);

  const facts: [string, string | null][] = [
    ["Country", country.name],
    ["City", studio.city ?? null],
    ["Founded", studio.foundedYear ? String(studio.foundedYear) : null],
    ["Team size", studio.teamSize ? String(studio.teamSize) : null],
    ["Founders", studio.founders?.join(", ") ?? null],
    ["Engines", studio.engines?.join(", ") ?? null],
    ["Status", studio.status],
  ];

  return (
    <div className="space-y-6">
      <Link href="/studios" className="text-xs font-medium text-slate-400 hover:text-white">← All studios</Link>

      <header className="panel flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">{flagEmoji(country.iso2)}</span>
            <p className="eyebrow">{country.name} · {studio.city}</p>
          </div>
          <h1 className="display text-3xl text-white sm:text-4xl">{studio.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {studio.categories.map((cat) => (
              <span key={cat} className="rounded border border-line bg-ink-800 px-2 py-0.5 text-[11px] text-slate-400">{cat}</span>
            ))}
            <span className="ml-1">
              <WatchButton item={{ type: "studio", id: studio.id, label: studio.name, href: `/studios/${studio.id}` }} />
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="eyebrow">Strength score</p>
          <p className="figure text-4xl font-bold text-gold-400">{strength.total === null ? "—" : fmtScore(strength.total)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Coverage {Math.round(strength.coverage * 100)}%</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Facts */}
        <Panel>
          <SectionHeader eyebrow="Source-cited facts" title="Profile" />
          <dl className="divide-y divide-line">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className={v ? "text-slate-200" : "figure text-slate-500"}>{v ?? "N/A"}</dd>
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

        {/* Strength scorecard */}
        <Panel>
          <SectionHeader eyebrow="Transparent · measurable only" title="Strength scorecard" />
          <div className="space-y-2.5">
            {strength.dimensions.map((d) => (
              <div key={d.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{d.label} <span className="text-[10px] text-slate-600">·{(d.weight * 100).toFixed(0)}%</span></span>
                  <span className="figure text-slate-100">{d.score === null ? <span className="text-slate-500">N/A</span> : fmtScore(d.score)}</span>
                </div>
                <ScoreBar value={d.score} />
                <p className="mt-0.5 text-[10px] text-slate-500">{d.basis}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* SWOT-lite from measurable data */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader eyebrow="Data-derived" title="Strengths" />
          {strength.strengths.length ? (
            <ul className="space-y-2 text-sm text-slate-300">
              {strength.strengths.map((s) => (
                <li key={s} className="flex gap-2"><span className="text-emerald2-400">▸</span>{s}</li>
              ))}
            </ul>
          ) : (
            <DataUnavailable label="No dimension scored ≥60 with current verified data." />
          )}
        </Panel>
        <Panel>
          <SectionHeader eyebrow="Measurable gaps · not opinions" title="Data gaps & weaknesses" />
          <ul className="space-y-2 text-sm text-slate-400">
            {strength.gaps.map((g) => (
              <li key={g} className="flex gap-2"><span className="text-orange-400">▸</span>{g}</li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Games */}
      <Panel>
        <SectionHeader eyebrow="Linked titles" title="Games" />
        {games.length === 0 ? (
          <DataUnavailable label="No individual titles recorded with verified sources yet." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.id}`}
                className="block rounded-lg border border-line bg-ink-850/60 p-4 transition-colors hover:border-gold-500/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">{g.title}</p>
                  {g.steamAppId && (
                    <span className="pill shrink-0 border-emerald2-500/30 bg-emerald2-500/10 text-emerald2-400">Steam</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {g.releaseYear ?? "TBA"} · {g.genres?.join(", ") ?? "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {g.platforms?.map((p) => (
                    <span key={p} className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-400">{p}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
