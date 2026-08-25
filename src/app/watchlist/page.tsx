"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWatchlist, removeWatch, WATCHLIST_EVENT, type WatchItem } from "@/lib/watchlist";
import { Icon } from "@/components/ui/Icon";

const ALERT_EXAMPLES = [
  "A followed country's market score changes materially",
  "A followed studio raises disclosed funding",
  "A new African game you follow appears on Steam",
  "An esports tournament exceeds a prize-pool threshold",
];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(getWatchlist());
    sync();
    window.addEventListener(WATCHLIST_EVENT, sync);
    return () => window.removeEventListener(WATCHLIST_EVENT, sync);
  }, []);

  const grouped = items.reduce<Record<string, WatchItem[]>>((acc, w) => {
    (acc[w.type] ??= []).push(w);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Follow · alerts</p>
        <h1 className="display text-2xl text-white sm:text-3xl">Your watchlist</h1>
      </div>

      {items.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-slate-300">You&apos;re not following anything yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Use the <span className="text-gold-400">☆ Follow</span> button on any country, studio or
            game to track it here.
          </p>
          <Link href="/countries" className="mt-4 inline-block text-sm font-medium text-gold-400 hover:text-gold-500">
            Browse countries →
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([type, list]) => (
            <div key={type} className="panel p-5">
              <p className="eyebrow mb-3 capitalize">{type}</p>
              <div className="space-y-1.5">
                {list.map((w) => (
                  <div key={`${w.type}-${w.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink-850/60 px-3 py-2">
                    <Link href={w.href} className="text-sm font-medium text-slate-100 hover:text-gold-400">
                      {w.label}
                    </Link>
                    <button
                      onClick={() => removeWatch(w.type, w.id)}
                      className="text-slate-500 hover:text-orange-400"
                      aria-label={`Unfollow ${w.label}`}
                    >
                      <Icon name="close" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts explainer */}
      <div className="panel p-5">
        <p className="eyebrow mb-3">Alerts</p>
        <p className="text-sm text-slate-400">
          Your watchlist is stored on this device. Automated alerts — email/push when a followed
          entity changes — need an account and a scheduled job. The pieces are in place: the
          <code className="figure mx-1">user_watchlists</code> table (owner-only RLS), the structured
          <Link href="/trends" className="mx-1 text-gold-400 hover:text-gold-500">events feed</Link>
          as the signal source, and GitHub Actions for scheduling. They activate once Supabase Auth
          is enabled.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {ALERT_EXAMPLES.map((a) => (
            <li key={a} className="flex items-start gap-2 rounded-lg border border-line bg-ink-850/60 px-3 py-2 text-xs text-slate-300">
              <span className="text-gold-400">🔔</span> {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
