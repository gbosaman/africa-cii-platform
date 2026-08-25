"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { flagEmoji } from "@/lib/data/countries";
import { Icon } from "@/components/ui/Icon";

export interface DirectoryRow {
  id: string;
  name: string;
  country: string;
  iso2: string;
  iso3: string;
  city: string | null;
  categories: string[];
  gdmType: string | null;
  /** All type labels this record answers to. A studio can be both a game
   *  developer and an animation house, and must be findable under either. */
  types: string[];
  website: string | null;
  tier: "verified" | "community";
  foundedYear: number | null;
  offices: string[] | null;
  linkable: boolean;
  health: string | null;
}

export function StudioDirectory({ rows }: { rows: DirectoryRow[] }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("All");
  const [tier, setTier] = useState<"all" | "verified" | "community">("all");
  const [type, setType] = useState("All");

  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.country))].sort(),
    [rows],
  );
  const types = useMemo(
    () => [...new Set(rows.flatMap((r) => r.types))].sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!term || r.name.toLowerCase().includes(term) || (r.city ?? "").toLowerCase().includes(term)) &&
        (country === "All" || r.country === country) &&
        (tier === "all" || r.tier === tier) &&
        (type === "All" || r.types.includes(type)),
    );
  }, [rows, q, country, tier, type]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search studios or cities…"
          className="min-w-0 flex-1 rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-gold-500/40 focus:outline-none sm:flex-none"
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="min-w-0 max-w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-200"
        >
          <option value="All">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="min-w-0 max-w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-200"
        >
          <option value="All">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {(["all", "verified", "community"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition-colors ${
                tier === t
                  ? "border-gold-500/50 bg-gold-500/15 text-gold-400"
                  : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} shown</span>
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => {
          const card = (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 truncate text-sm font-semibold text-slate-100">{r.name}</p>
                {r.tier === "verified" ? (
                  <span className="pill shrink-0 border-emerald2-500/30 bg-emerald2-500/10 text-emerald2-400">
                    ✓
                  </span>
                ) : (
                  <span
                    className="pill shrink-0 border-gold-500/30 bg-gold-500/10 text-gold-400"
                    title="Community directory entry (GameDevMap) — not independently verified"
                  >
                    ~
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">
                {flagEmoji(r.iso2)} {r.city ?? "—"}
                {r.foundedYear ? ` · est. ${r.foundedYear}` : ""}
              </p>
              {r.health && (
                <p className="mt-1.5 inline-flex items-center gap-1 rounded border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-300">
                  <span aria-hidden>⚠</span> {r.health}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                {(r.gdmType ? [r.gdmType] : r.categories.slice(0, 2)).map((c) => (
                  <span
                    key={c}
                    className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-400"
                  >
                    {c}
                  </span>
                ))}
                {r.offices && r.offices.length > 1 && (
                  <span className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {r.offices.length} offices
                  </span>
                )}
              </div>
            </>
          );

          return r.linkable ? (
            <Link
              key={r.id}
              href={`/studios/${r.id}`}
              className="block min-w-0 rounded-lg border border-line bg-ink-850/60 p-4 transition-colors hover:border-gold-500/30"
            >
              {card}
            </Link>
          ) : (
            <div key={r.id} className="min-w-0 rounded-lg border border-line bg-ink-850/40 p-4">
              {card}
              {r.website && (
                <a
                  href={r.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-[11px] font-medium text-gold-400 hover:text-gold-300"
                >
                  Website <Icon name="external" className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-line bg-ink-850/50 px-4 py-6 text-center text-sm text-slate-500">
          No studios match these filters.
        </p>
      )}
    </div>
  );
}
