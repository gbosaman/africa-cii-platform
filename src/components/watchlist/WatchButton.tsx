"use client";

import { useEffect, useState } from "react";
import { isFollowed, toggleWatch, WATCHLIST_EVENT, type WatchItem } from "@/lib/watchlist";

export function WatchButton({ item }: { item: WatchItem }) {
  const [followed, setFollowed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFollowed(isFollowed(item.type, item.id));
    const onChange = () => setFollowed(isFollowed(item.type, item.id));
    window.addEventListener(WATCHLIST_EVENT, onChange);
    return () => window.removeEventListener(WATCHLIST_EVENT, onChange);
  }, [item.type, item.id]);

  return (
    <button
      onClick={() => setFollowed(toggleWatch(item))}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
        followed
          ? "border-gold-500/50 bg-gold-500/15 text-gold-400"
          : "border-line bg-ink-800 text-slate-300 hover:text-white"
      }`}
      aria-pressed={followed}
      // Avoid hydration flash: neutral until mounted
      suppressHydrationWarning
    >
      <span aria-hidden>{mounted && followed ? "★" : "☆"}</span>
      {mounted && followed ? "Following" : "Follow"}
    </button>
  );
}
