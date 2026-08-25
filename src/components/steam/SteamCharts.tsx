"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel, SectionHeader } from "@/components/ui/primitives";
import { fmtNumber } from "@/lib/format";
import type { SteamRow } from "@/app/steam/page";

type Mode = "rating" | "reviews";

/**
 * Two views over the same catalogue, because they answer different questions:
 * rating is "how well was it received", review volume is "how many people
 * actually turned up". A small title can win on the first and lose badly on
 * the second, and conflating them would flatter the catalogue.
 */
export function SteamCharts({ rows }: { rows: SteamRow[] }) {
  const [mode, setMode] = useState<Mode>("reviews");

  const ranked = useMemo(() => {
    const list = rows.filter((r) => (mode === "rating" ? r.positivePct !== null : (r.totalReviews ?? 0) > 0));
    return [...list].sort((a, b) =>
      mode === "rating"
        ? (b.positivePct ?? 0) - (a.positivePct ?? 0)
        : (b.totalReviews ?? 0) - (a.totalReviews ?? 0),
    );
  }, [rows, mode]);

  const max = mode === "rating" ? 100 : Math.max(...ranked.map((r) => r.totalReviews ?? 0), 1);

  // Genre mix across the catalogue.
  const genres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) for (const g of r.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [rows]);

  // Release timeline.
  const timeline = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of rows) if (r.releaseYear) counts.set(r.releaseYear, (counts.get(r.releaseYear) ?? 0) + 1);
    const years = [...counts.keys()].sort((a, b) => a - b);
    if (years.length === 0) return [];
    const out: { year: number; n: number }[] = [];
    for (let y = years[0]!; y <= years[years.length - 1]!; y++) out.push({ year: y, n: counts.get(y) ?? 0 });
    return out;
  }, [rows]);

  const maxYear = Math.max(...timeline.map((t) => t.n), 1);
  const genreMax = Math.max(...genres.map(([, n]) => n), 1);

  return (
    <div className="space-y-6">
      <Panel>
        <SectionHeader
          eyebrow="Same catalogue, two questions"
          title={mode === "rating" ? "Ranked by rating" : "Ranked by audience"}
          action={
            <div className="flex gap-1">
              {(["reviews", "rating"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition-colors ${
                    mode === m
                      ? "border-accent-500/50 bg-accent-500/15 text-accent-400"
                      : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m === "reviews" ? "Audience" : "Rating"}
                </button>
              ))}
            </div>
          }
        />
        <div className="space-y-2">
          {ranked.map((r, i) => {
            const v = mode === "rating" ? (r.positivePct ?? 0) : (r.totalReviews ?? 0);
            return (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-right text-xs text-slate-500">{i + 1}</span>
                <Link
                  href={`/games/${r.id}`}
                  className="w-36 shrink-0 truncate text-sm text-slate-200 hover:text-accent-400"
                  title={r.title}
                >
                  {r.title}
                </Link>
                <div className="h-5 flex-1 overflow-hidden rounded bg-ink-700">
                  <div
                    className="flex h-full items-center justify-end rounded bg-gradient-to-r from-accent-600 to-accent-400 px-2"
                    style={{ width: `${Math.max(3, (v / max) * 100)}%` }}
                  >
                    <span className="figure text-[10px] font-bold text-[#04140a]">
                      {mode === "rating" ? `${r.positivePct}%` : fmtNumber(r.totalReviews)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {mode === "reviews" && (
          <p className="mt-3 text-[11px] text-slate-500">
            Review counts are a proxy for audience, not sales — only a fraction of players leave one.
            Useful for relative comparison, not for estimating revenue.
          </p>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader eyebrow="Steam's own tags" title="Genre mix" />
          <div className="space-y-2">
            {genres.map(([g, n]) => (
              <div key={g}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">{g}</span>
                  <span className="figure text-slate-400">{n}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-ink-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-info-600 to-info-400"
                    style={{ width: `${(n / genreMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader eyebrow="Releases per year" title="Catalogue timeline" />
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500">No dated releases.</p>
          ) : (
            <div className="flex h-40 items-end gap-1.5">
              {timeline.map((t) => (
                <div key={t.year} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-violet2-600 to-violet2-400"
                      style={{ height: `${Math.max(2, (t.n / maxYear) * 100)}%` }}
                      title={`${t.year}: ${t.n} release${t.n === 1 ? "" : "s"}`}
                    />
                  </div>
                  <span className="figure text-[9px] text-slate-500">{String(t.year).slice(2)}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-500">
            Only titles in this database with a recorded release year — a floor on African Steam
            output, not a census of it.
          </p>
        </Panel>
      </div>
    </div>
  );
}
