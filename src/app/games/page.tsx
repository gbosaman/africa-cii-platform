import type { Metadata } from "next";
import Link from "next/link";
import { GAMES, STUDIO_BY_ID } from "@/lib/data/studios";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { fetchSteamData } from "@/lib/data-sources/steam";
import { SectionHeader, Pill, DataUnavailable } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { fmtNumber } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Games — African games database",
  description: "Source-cited database of African-made games with live Steam review signals.",
};

function reviewTone(pct: number | null): string {
  if (pct === null) return "text-slate-500";
  if (pct >= 80) return "text-emerald2-400";
  if (pct >= 60) return "text-gold-400";
  return "text-orange-400";
}

export default async function GamesPage() {
  // Live Steam pull for every linked title, in parallel (cached daily).
  const steamMap = new Map(
    await Promise.all(
      GAMES.filter((g) => g.steamAppId).map(async (g) => [g.id, await fetchSteamData(g.steamAppId!)] as const),
    ),
  );

  const steamCount = GAMES.filter((g) => g.steamAppId).length;
  const androidCount = GAMES.filter((g) => g.androidPackage).length;
  const consoleCount = GAMES.filter((g) =>
    g.platforms?.some((p) => ["PlayStation", "Nintendo Switch", "Xbox"].includes(p)),
  ).length;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Verified seed · live Steam review signals" title="African games" />
      <div className="flex flex-wrap gap-2">
        <Pill tone="gold">{GAMES.length} titles</Pill>
        <Pill tone="emerald">{steamMap.size} live on Steam</Pill>
        <Pill>Source-cited</Pill>
      </div>
      <p className="max-w-2xl rounded-lg border border-line bg-ink-850/60 p-4 text-sm text-slate-300">
        Every Steam appid here is <span className="font-semibold text-white">verified against the
        live API</span> — resolved by search, then confirmed by checking Steam&apos;s own developer
        field names the expected African studio. Ratings and review counts are pulled live
        (attributed to Valve).
      </p>

      {/* Platform intelligence */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        <PlatformTile label="On Steam (PC)" value={String(steamCount)} tone="emerald" />
        <PlatformTile label="On Android" value={String(androidCount)} tone="gold" />
        <PlatformTile label="On console" value={String(consoleCount)} />
        <PlatformTile label="Play metrics" value="N/A" muted />
      </div>
      <p className="max-w-2xl text-[11px] leading-relaxed text-slate-500">
        <span className="font-semibold text-slate-400">Why Play metrics are N/A. </span>
        Google offers no free public API for Play catalogue data — the Developer API covers only
        apps you own, and the 2026 Play Catalog API is limited to registered third-party app stores.
        Paid providers are excluded by policy and listing pages are not scraped, so Android presence
        is verified (the listing resolves) while installs and ratings remain unavailable.
      </p>
      {/* Mobile: cards. Desktop: full table. */}
      <div className="space-y-2 md:hidden">
        {GAMES.map((g) => {
          const c = COUNTRY_BY_ISO3[g.countryIso3]!;
          const studio = g.studioId ? STUDIO_BY_ID[g.studioId] : undefined;
          const steam = steamMap.get(g.id);
          return (
            <Link
              key={g.id}
              href={`/games/${g.id}`}
              className="block rounded-lg border border-line bg-ink-850/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{g.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {studio?.name ?? "—"} · {flagEmoji(c.iso2)} {c.name}
                  </p>
                </div>
                <span className="figure shrink-0 text-xs text-slate-400">{g.releaseYear ?? "N/A"}</span>
              </div>
              {g.steamAppId && (
                <div className="mt-2.5 flex items-center gap-3 border-t border-line pt-2.5 text-xs">
                  <span className="text-slate-500">Steam</span>
                  <span className={`figure font-semibold ${reviewTone(steam?.positivePct ?? null)}`}>
                    {steam?.available && steam.positivePct !== null ? `${steam.positivePct}%` : "N/A"}
                  </span>
                  {steam?.available && steam.totalReviews !== null && (
                    <span className="figure text-slate-500">{fmtNumber(steam.totalReviews)} reviews</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-line md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-ink-850 text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Studio</th>
              <th className="px-4 py-3 text-left font-medium">Country</th>
              <th className="px-4 py-3 text-left font-medium">Year</th>
              <th className="px-4 py-3 text-right font-medium">Steam rating</th>
              <th className="px-4 py-3 text-right font-medium">Reviews</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {GAMES.map((g) => {
              const c = COUNTRY_BY_ISO3[g.countryIso3]!;
              const studio = g.studioId ? STUDIO_BY_ID[g.studioId] : undefined;
              const steam = steamMap.get(g.id);
              return (
                <tr key={g.id} className="hover:bg-ink-800/40">
                  <td className="px-4 py-3">
                    <Link href={`/games/${g.id}`} className="font-semibold text-slate-100 hover:text-gold-400">
                      {g.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {studio ? (
                      <Link href={`/studios/${studio.id}`} className="hover:text-gold-400">{studio.name}</Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{flagEmoji(c.iso2)} {c.name}</td>
                  <td className="px-4 py-3 figure text-slate-300">{g.releaseYear ?? "N/A"}</td>
                  <td className={`px-4 py-3 text-right ${reviewTone(steam?.positivePct ?? null)}`}>
                    {steam?.available && steam.positivePct !== null ? (
                      <span className="figure font-semibold">{steam.positivePct}%</span>
                    ) : g.steamAppId ? (
                      <span className="figure text-slate-500">N/A</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right figure text-slate-300">
                    {steam?.available && steam.totalReviews !== null ? fmtNumber(steam.totalReviews) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <DataUnavailable label="Genre & engine analytics unlock once the games dataset reaches a statistically meaningful sample." />
    </div>
  );
}

function PlatformTile({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: "gold" | "emerald";
  muted?: boolean;
}) {
  const color = muted
    ? "text-slate-500"
    : tone === "gold"
      ? "text-gold-400"
      : tone === "emerald"
        ? "text-emerald2-400"
        : "text-white";
  return (
    <div className="bg-ink-850 p-4">
      <p className={`figure text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}
