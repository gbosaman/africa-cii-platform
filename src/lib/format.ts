import type { Confidence, Freshness } from "@/lib/types";

// ---------------------------------------------------------------------------
// Presentation helpers. The golden rule everywhere: null → "N/A", never 0.
// ---------------------------------------------------------------------------

export function fmtNumber(value: number | null, unit?: string): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  const abs = Math.abs(value);
  let out: string;
  if (abs >= 1e12) out = `${(value / 1e12).toFixed(2)}T`;
  else if (abs >= 1e9) out = `${(value / 1e9).toFixed(2)}B`;
  else if (abs >= 1e6) out = `${(value / 1e6).toFixed(2)}M`;
  else if (abs >= 1e3) out = value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  else out = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return unit === "US$" ? `$${out}` : out;
}

export function fmtValue(value: number | null, unit: string): string {
  if (value === null || Number.isNaN(value)) return "N/A";
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "US$") return fmtNumber(value, "US$");
  if (unit === "per 100") return value.toFixed(1);
  if (unit === "per 1M") return value.toFixed(1);
  if (unit === "people") return fmtNumber(value);
  return fmtNumber(value);
}

export function fmtScore(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

export function pctDelta(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// --- Freshness / confidence display metadata -------------------------------

export const FRESHNESS_META: Record<Freshness, { dot: string; label: string; text: string }> = {
  fresh: { dot: "bg-emerald2-500", label: "Fresh", text: "text-emerald2-400" },
  aging: { dot: "bg-gold-500", label: "Aging", text: "text-gold-400" },
  stale: { dot: "bg-orange-500", label: "Stale", text: "text-orange-400" },
  historical: { dot: "bg-slate-500", label: "Historical", text: "text-slate-400" },
};

export const CONFIDENCE_META: Record<Confidence, { label: string; className: string }> = {
  HIGH: { label: "High", className: "text-emerald2-400 border-emerald2-500/30 bg-emerald2-500/10" },
  MEDIUM: { label: "Medium", className: "text-gold-400 border-gold-500/30 bg-gold-500/10" },
  LOW: { label: "Low", className: "text-orange-400 border-orange-500/30 bg-orange-500/10" },
  UNVERIFIED: { label: "Unverified", className: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
};

export function freshnessFromYear(year: number): Freshness {
  if (!year) return "historical";
  const age = new Date().getUTCFullYear() - year;
  if (age <= 1) return "fresh";
  if (age <= 3) return "aging";
  if (age <= 6) return "stale";
  return "historical";
}

export function relativeTime(iso?: string): string {
  if (!iso) return "unknown";
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
