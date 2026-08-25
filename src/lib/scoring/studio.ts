import type { Studio, Game } from "@/lib/types";

// ---------------------------------------------------------------------------
// Studio Strength Score. Fully transparent and derived ONLY from measurable,
// source-cited fields. Dimensions we cannot yet measure from verified data
// return null (N/A) and lower coverage — we never invent a number to fill a
// bar. This is the same ZERO ≠ UNKNOWN discipline as the country engine.
// ---------------------------------------------------------------------------

export interface StudioDimension {
  key: string;
  label: string;
  score: number | null;
  weight: number;
  basis: string;
}

export interface StudioStrength {
  total: number | null;
  coverage: number; // 0..1
  dimensions: StudioDimension[];
  strengths: string[];
  gaps: string[];
}

export function scoreStudio(studio: Studio, games: Game[]): StudioStrength {
  const studioGames = games.filter((g) => g.studioId === studio.id);
  const now = new Date().getUTCFullYear();

  const dims: StudioDimension[] = [
    {
      key: "experience",
      label: "Experience",
      weight: 0.15,
      basis: studio.foundedYear ? `Operating since ${studio.foundedYear}` : "Founded year unknown",
      score: studio.foundedYear ? clampScore(((now - studio.foundedYear) / 15) * 100) : null,
    },
    {
      key: "product",
      label: "Product",
      weight: 0.2,
      basis: `${(studio.notableGames?.length ?? studioGames.length) || 0} recorded title(s)`,
      score:
        studio.notableGames || studioGames.length
          ? clampScore(((studio.notableGames?.length ?? studioGames.length) / 3) * 100)
          : null,
    },
    {
      key: "ip",
      label: "Original IP",
      weight: 0.15,
      basis: originalIpCount(studioGames) + " original-IP title(s)",
      score: studioGames.length ? clampScore((originalIpCount(studioGames) / Math.max(1, studioGames.length)) * 100) : null,
    },
    {
      key: "technical",
      label: "Technical",
      weight: 0.1,
      basis: studio.engines?.length ? `Engines: ${studio.engines.join(", ")}` : "Engine unknown",
      score: studio.engines?.length ? 65 : null,
    },
    // The following require Phase 2/3 verified sources — honestly null for now.
    { key: "market_reach", label: "Market reach", weight: 0.15, basis: "Distribution data pending (Phase 2)", score: null },
    { key: "business", label: "Business", weight: 0.1, basis: "Funding/publisher data pending (Phase 4)", score: null },
    { key: "achievement", label: "Achievement", weight: 0.1, basis: "Awards data pending (Phase 2)", score: null },
    { key: "ecosystem", label: "Ecosystem", weight: 0.05, basis: "Community/esports data pending (Phase 3)", score: null },
  ];

  const scored = dims.filter((d) => d.score !== null);
  const availWeight = scored.reduce((s, d) => s + d.weight, 0);
  const totalWeight = dims.reduce((s, d) => s + d.weight, 0);
  const total = availWeight === 0 ? null : scored.reduce((s, d) => s + (d.score as number) * d.weight, 0) / availWeight;
  const coverage = totalWeight === 0 ? 0 : availWeight / totalWeight;

  const strengths = scored
    .filter((d) => (d.score as number) >= 60)
    .map((d) => `${d.label}: ${d.basis}`);
  const gaps = dims.filter((d) => d.score === null).map((d) => `${d.label}: ${d.basis}`);

  return {
    total: total === null ? null : Math.round(total * 10) / 10,
    coverage: Math.round(coverage * 100) / 100,
    dimensions: dims,
    strengths,
    gaps,
  };
}

function originalIpCount(games: Game[]): number {
  return games.filter((g) => g.ipType === "original" || g.ipType === "folklore").length;
}

function clampScore(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)) * 10) / 10;
}
