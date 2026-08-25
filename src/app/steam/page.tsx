import type { Metadata } from "next";
import Link from "next/link";
import { GAMES } from "@/lib/data/games";
import { STUDIO_BY_ID } from "@/lib/data/studios";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { fetchSteamData } from "@/lib/data-sources/steam";
import { Panel, SectionHeader, Pill, DataUnavailable } from "@/components/ui/primitives";
import { SteamCharts } from "@/components/steam/SteamCharts";
import { Icon } from "@/components/ui/Icon";
import { fmtNumber } from "@/lib/format";
import type { SteamData } from "@/lib/types";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Steam Intelligence — African games on PC",
  description:
    "Live Steam signals for every verified African-developed title: review scores, volumes, genres, publishers and release timeline.",
};

export interface SteamRow {
  id: string;
  title: string;
  studio: string | null;
  studioId: string | null;
  iso2: string;
  country: string;
  appId: number;
  releaseYear: number | null;
  genres: string[];
  positivePct: number | null;
  totalReviews: number | null;
  reviewDesc: string | null;
  publishers: string[] | null;
  price: string | null;
  isFree: boolean | null;
  available: boolean;
}

function reviewTier(pct: number | null): string {
  if (pct === null) return "unrated";
  if (pct >= 95) return "overwhelmingly positive";
  if (pct >= 80) return "very positive";
  if (pct >= 70) return "mostly positive";
  if (pct >= 40) return "mixed";
  return "negative";
}

export default async function SteamPage() {
  const linked = GAMES.filter((g) => g.steamAppId);
  const steam = await Promise.all(
    linked.map(async (g) => [g.id, await fetchSteamData(g.steamAppId!)] as const),
  );
  const byId = new Map<string, SteamData>(steam);

  const rows: SteamRow[] = linked
    .map((g) => {
      const s = byId.get(g.id)!;
      const c = COUNTRY_BY_ISO3[g.countryIso3]!;
      const studio = g.studioId ? STUDIO_BY_ID[g.studioId] : undefined;
      return {
        id: g.id,
        title: g.title,
        studio: studio?.name ?? null,
        studioId: g.studioId ?? null,
        iso2: c.iso2,
        country: c.name,
        appId: g.steamAppId!,
        releaseYear: g.releaseYear ?? null,
        genres: s.genres ?? g.genres ?? [],
        positivePct: s.positivePct,
        totalReviews: s.totalReviews,
        reviewDesc: s.reviewDesc,
        publishers: s.publishers,
        price: s.price,
        isFree: s.isFree,
        available: s.available,
      };
    })
    .sort((a, b) => (b.totalReviews ?? 0) - (a.totalReviews ?? 0));

  const rated = rows.filter((r) => r.positivePct !== null);
  const totalReviews = rows.reduce((s, r) => s + (r.totalReviews ?? 0), 0);
  // Review-weighted mean: a 95% score on 60,000 reviews is stronger evidence
  // than 95% on 40, and a plain average would treat them identically.
  const weighted =
    rated.length && totalReviews
      ? rated.reduce((s, r) => s + r.positivePct! * (r.totalReviews ?? 0), 0) / totalReviews
      : null;
  const best = rated.reduce<SteamRow | null>(
    (acc, r) => (!acc || (r.positivePct ?? 0) > (acc.positivePct ?? 0) ? r : acc),
    null,
  );
  const biggest = rows[0] ?? null;

  const studioCount = new Set(rows.map((r) => r.studioId).filter(Boolean)).size;
  const countryCount = new Set(rows.map((r) => r.country)).size;
  const unavailable = rows.filter((r) => !r.available).length;

  // Publisher relationships — who is backing African studios internationally.
  const publisherCounts = new Map<string, number>();
  for (const r of rows) {
    for (const p of r.publishers ?? []) {
      if (r.studio && p.toLowerCase() === r.studio.toLowerCase()) continue; // self-published
      publisherCounts.set(p, (publisherCounts.get(p) ?? 0) + 1);
    }
  }
  const publishers = [...publisherCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const selfPublished = rows.filter(
    (r) => r.studio && r.publishers?.some((p) => p.toLowerCase() === r.studio!.toLowerCase()),
  ).length;

  return (
    <div className="view-enter space-y-6">
      <SectionHeader
        eyebrow="Live from the Steam Web API · attributed to Valve"
        title="Steam intelligence"
      />

      <div className="flex flex-wrap gap-2">
        <Pill tone="emerald">{rows.length} verified titles</Pill>
        <Pill tone="gold">{studioCount} studios</Pill>
        <Pill>{countryCount} countries</Pill>
        {unavailable > 0 && <Pill tone="gold">{unavailable} unreachable</Pill>}
      </div>

      <p className="max-w-3xl text-sm text-slate-400">
        Every appid here was confirmed against Steam&apos;s own developer field before entering the
        database — the harness rejects anything it cannot verify. Scores and review counts below are
        fetched live and cached daily.
      </p>

      {/* Headline signals */}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]">
        <div className="panel kpi p-[18px]" data-accent="emerald">
          <span className="kpi-icon bg-[var(--emerald-soft)] text-accent-400">
            <Icon name="controller" className="h-[18px] w-[18px]" />
          </span>
          <p className="figure mt-3 text-2xl font-bold text-white">{fmtNumber(totalReviews)}</p>
          <p className="mt-1 text-[12.5px] font-medium text-slate-400">Total player reviews</p>
          <p className="mt-0.5 text-[11px] text-slate-500">across all tracked titles</p>
        </div>
        <div className="panel kpi p-[18px]" data-accent="blue">
          <span className="kpi-icon bg-[var(--blue-soft)] text-info-400">
            <Icon name="bars" className="h-[18px] w-[18px]" />
          </span>
          <p className="figure mt-3 text-2xl font-bold text-white">
            {weighted === null ? "N/A" : `${weighted.toFixed(1)}%`}
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-slate-400">Mean positive rating</p>
          <p className="mt-0.5 text-[11px] text-slate-500">weighted by review volume</p>
        </div>
        <div className="panel kpi p-[18px]" data-accent="violet">
          <span className="kpi-icon bg-[var(--violet-soft)] text-violet2-400">
            <Icon name="trophy" className="h-[18px] w-[18px]" />
          </span>
          <p className="figure mt-3 text-2xl font-bold text-white">
            {best?.positivePct === undefined || best?.positivePct === null
              ? "N/A"
              : `${best.positivePct}%`}
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-slate-400">Best-rated title</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{best?.title ?? "—"}</p>
        </div>
        <div className="panel kpi p-[18px]" data-accent="orange">
          <span className="kpi-icon bg-[var(--orange-soft)] text-warn-400">
            <Icon name="pulse" className="h-[18px] w-[18px]" />
          </span>
          <p className="figure mt-3 text-2xl font-bold text-white">
            {fmtNumber(biggest?.totalReviews ?? null)}
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-slate-400">Largest audience</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{biggest?.title ?? "—"}</p>
        </div>
      </div>

      <SteamCharts rows={rows} />

      {/* Publisher relationships */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader eyebrow="International backing" title="Publishers" />
          {publishers.length === 0 ? (
            <DataUnavailable label="No third-party publishers recorded across the catalogue." />
          ) : (
            <div className="space-y-2">
              {publishers.map(([name, n]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-line bg-ink-850/60 px-3 py-2"
                >
                  <span className="text-sm text-slate-200">{name}</span>
                  <span className="figure text-xs text-accent-400">
                    {n} title{n > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-slate-500">
            {selfPublished} of {rows.length} titles are self-published. External publishing deals are
            one of the clearest signals that a studio has cleared an international quality bar.
          </p>
        </Panel>

        <Panel>
          <SectionHeader eyebrow="Reception spread" title="How the catalogue rates" />
          <div className="space-y-2">
            {["overwhelmingly positive", "very positive", "mostly positive", "mixed", "negative"].map(
              (tier) => {
                const n = rows.filter((r) => reviewTier(r.positivePct) === tier).length;
                const pct = rows.length ? (n / rows.length) * 100 : 0;
                return (
                  <div key={tier}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="capitalize text-slate-400">{tier}</span>
                      <span className="figure text-slate-300">{n}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </Panel>
      </div>

      {/* Full table */}
      <Panel>
        <SectionHeader eyebrow="Ranked by review volume" title="Every tracked title" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-ink-850 text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Studio</th>
                <th className="px-3 py-2 text-left font-medium">Country</th>
                <th className="px-3 py-2 text-right font-medium">Year</th>
                <th className="px-3 py-2 text-right font-medium">Rating</th>
                <th className="px-3 py-2 text-right font-medium">Reviews</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ink-800/40">
                  <td className="px-3 py-2">
                    <Link href={`/games/${r.id}`} className="font-semibold text-slate-100 hover:text-accent-400">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {r.studioId ? (
                      <Link href={`/studios/${r.studioId}`} className="hover:text-accent-400">
                        {r.studio}
                      </Link>
                    ) : (
                      r.studio ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {flagEmoji(r.iso2)} {r.country}
                  </td>
                  <td className="px-3 py-2 text-right figure text-slate-400">
                    {r.releaseYear ?? "N/A"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right figure font-semibold ${
                      r.positivePct === null
                        ? "text-slate-500"
                        : r.positivePct >= 80
                          ? "text-accent-400"
                          : r.positivePct >= 70
                            ? "text-info-400"
                            : r.positivePct >= 40
                              ? "text-warn-400"
                              : "text-danger-400"
                    }`}
                    title={r.reviewDesc ?? undefined}
                  >
                    {r.positivePct === null ? "N/A" : `${r.positivePct}%`}
                  </td>
                  <td className="px-3 py-2 text-right figure text-slate-300">
                    {fmtNumber(r.totalReviews)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {r.isFree ? "Free" : (r.price ?? "N/A")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Data © Valve Corporation, fetched from the public Steam Web API and cached daily. Review
          counts are all-language, all purchase types. A title whose data cannot be fetched shows
          N/A — the last verified value is never overwritten with a guess. Prices are Steam&apos;s
          US-region list price and will differ in local storefronts.
        </p>
      </Panel>
    </div>
  );
}
