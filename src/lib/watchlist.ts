"use client";

// Client-side watchlist backed by localStorage. Gives a real "follow" feature
// without requiring user auth. When Supabase Auth is added, this syncs to the
// `user_watchlists` table (RLS owner-only) — same shape, server-persisted.

export type WatchType = "country" | "studio" | "game" | "animation" | "esports";

export interface WatchItem {
  type: WatchType;
  id: string;
  label: string;
  href: string;
}

const KEY = "cii_watchlist";
const EVENT = "cii_watchlist_change";

export function getWatchlist(): WatchItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as WatchItem[];
  } catch {
    return [];
  }
}

function save(items: WatchItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function isFollowed(type: WatchType, id: string): boolean {
  return getWatchlist().some((w) => w.type === type && w.id === id);
}

export function toggleWatch(item: WatchItem): boolean {
  const items = getWatchlist();
  const exists = items.some((w) => w.type === item.type && w.id === item.id);
  save(exists ? items.filter((w) => !(w.type === item.type && w.id === item.id)) : [...items, item]);
  return !exists;
}

export function removeWatch(type: WatchType, id: string) {
  save(getWatchlist().filter((w) => !(w.type === type && w.id === id)));
}

export const WATCHLIST_EVENT = EVENT;
