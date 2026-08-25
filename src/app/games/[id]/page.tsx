import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GAMES, STUDIO_BY_ID } from "@/lib/data/studios";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { fetchSteamData } from "@/lib/data-sources/steam";
import { verifyPlayPresence } from "@/lib/data-sources/googleplay";
import { SteamPanel } from "@/components/directory/SteamPanel";
import { Panel, SectionHeader, Pill, DataUnavailable } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { WatchButton } from "@/components/watchlist/WatchButton";

export const revalidate = 86400;

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const g = GAMES.find((x) => x.id === params.id);
  if (!g) return { title: "Game not found" };
  return { title: `${g.title} — African game profile`, description: `Profile, platforms and live Steam signals for ${g.title}.` };
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const game = GAMES.find((g) => g.id === params.id);
  if (!game) notFound();
  const country = COUNTRY_BY_ISO3[game.countryIso3]!;
  const studio = game.studioId ? STUDIO_BY_ID[game.studioId] : undefined;
  const [steam, play] = await Promise.all([
    game.steamAppId ? fetchSteamData(game.steamAppId) : Promise.resolve(null),
    game.androidPackage ? verifyPlayPresence(game.androidPackage) : Promise.resolve(null),
  ]);

  const facts: [string, string | null][] = [
    ["Studio", studio?.name ?? null],
    ["Country", country.name],
    ["Release year", game.releaseYear ? String(game.releaseYear) : null],
    ["Genres", game.genres?.join(", ") ?? null],
    ["Engine", game.engine ?? null],
    ["IP type", game.ipType ?? null],
    ["Platforms", game.platforms?.join(", ") ?? null],
  ];

  return (
    <div className="space-y-6">
      <Link href="/games" className="text-xs font-medium text-slate-400 hover:text-white">← All games</Link>

      <header className="panel flex flex-col gap-3 p-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flagEmoji(country.iso2)}</span>
          <p className="eyebrow">{country.name}{studio ? ` · ${studio.name}` : ""}</p>
        </div>
        <h1 className="display text-3xl text-white sm:text-4xl">{game.title}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {game.genres?.map((g) => (
            <span key={g} className="rounded border border-line bg-ink-800 px-2 py-0.5 text-[11px] text-slate-400">{g}</span>
          ))}
          {game.steamAppId && <Pill tone="emerald">Live Steam data</Pill>}
          <span className="ml-1">
            <WatchButton item={{ type: "game", id: game.id, label: game.title, href: `/games/${game.id}` }} />
          </span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Facts */}
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
          {studio && (
            <Link href={`/studios/${studio.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 hover:text-gold-500">
              View studio <Icon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          )}
        </Panel>

        {/* Live Steam */}
        {steam ? (
          <SteamPanel steam={steam} />
        ) : play ? (
          <Panel>
            <SectionHeader eyebrow="Verified presence · Google Play" title="Android" />
            <div className="mb-3 flex items-center gap-2">
              {play.exists === true ? (
                <Pill tone="emerald">✓ Listing verified</Pill>
              ) : play.exists === false ? (
                <Pill tone="gold">Listing not found</Pill>
              ) : (
                <Pill>Check unavailable</Pill>
              )}
              <span className="figure text-xs text-slate-500">{play.packageId}</span>
            </div>
            <dl className="divide-y divide-line text-sm">
              {[
                ["Installs", null],
                ["Rating", null],
                ["Rating count", null],
              ].map(([k]) => (
                <div key={String(k)} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="figure text-slate-500">N/A</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-slate-500">
              {play.metricsUnavailableReason}
            </p>
            <a
              href={play.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 hover:text-gold-500"
            >
              Play Store listing <Icon name="external" className="h-3.5 w-3.5" />
            </a>
          </Panel>
        ) : (
          <Panel>
            <SectionHeader eyebrow="Platform data" title="Store presence" />
            <DataUnavailable label="No verified store id recorded. Store metrics show N/A until a link is confirmed against the source — never guessed." />
          </Panel>
        )}
      </div>

      {/* Achievements */}
      <Panel>
        <SectionHeader eyebrow="Verified milestones" title="Achievements" />
        {game.achievements?.length ? (
          <ul className="space-y-2 text-sm text-slate-300">
            {game.achievements.map((a) => (
              <li key={a} className="flex gap-2">
                <span className="text-gold-400">★</span>
                {a}
              </li>
            ))}
          </ul>
        ) : (
          <DataUnavailable label="No verified milestones recorded yet. Awards & festival selections are added with sources." />
        )}
      </Panel>
    </div>
  );
}
