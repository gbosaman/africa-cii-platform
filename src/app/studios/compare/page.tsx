import type { Metadata } from "next";
import { STUDIOS, GAMES } from "@/lib/data/studios";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";
import { scoreStudio } from "@/lib/scoring/studio";
import { StudioCompareView, type StudioCompareData } from "@/components/compare/StudioCompareView";
import { SectionHeader } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Compare studios — African game studios side by side",
  description: "Compare African game studios on strength dimensions, experience, output and IP.",
};

export default function StudioComparePage({ searchParams }: { searchParams: { ids?: string } }) {
  const data: StudioCompareData[] = STUDIOS.map((s) => {
    const strength = scoreStudio(s, GAMES);
    const games = GAMES.filter((g) => g.studioId === s.id);
    return {
      id: s.id,
      name: s.name,
      country: COUNTRY_BY_ISO3[s.countryIso3]?.name ?? s.countryIso3,
      iso2: COUNTRY_BY_ISO3[s.countryIso3]?.iso2 ?? "",
      city: s.city ?? null,
      foundedYear: s.foundedYear ?? null,
      categories: s.categories,
      engines: s.engines ?? null,
      gamesCount: games.length || (s.notableGames?.length ?? 0),
      total: strength.total,
      coverage: strength.coverage,
      dimensions: strength.dimensions.map((d) => ({ key: d.key, label: d.label, score: d.score })),
    };
  });

  const preset = (searchParams.ids ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => STUDIOS.some((s) => s.id === x));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Side by side · up to 3" title="Compare studios" />
      <p className="max-w-2xl text-sm text-slate-400">
        Strength dimensions are scored only from measurable, source-cited data. Where a studio leads,
        it&apos;s shown as an advantage; where data is missing, it&apos;s shown as a gap — never an
        invented weakness.
      </p>
      <StudioCompareView
        studios={data}
        preset={preset.length ? preset : ["free-lives", "nyamakop", "kiroo-games"]}
      />
    </div>
  );
}
