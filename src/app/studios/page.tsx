import type { Metadata } from "next";
import Link from "next/link";
import { buildStudioDirectory } from "@/lib/data/studio-directory";
import { GAMEDEVMAP_SOURCE } from "@/lib/data/gamedevmap";
import { healthFor, HEALTH_LABEL, LINK_HEALTH_ISSUES, LINK_HEALTH_CHECKED, LINK_HEALTH_SWEPT_AT } from "@/lib/data/link-health";
import { StudioDirectory } from "@/components/directory/StudioDirectory";
import { SectionHeader, Pill } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { COUNTRY_BY_ISO3 } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Studios — African game studio directory",
  description:
    "Directory of African game-development organisations: independently verified records plus the GameDevMap community directory, with source attribution on every entry.",
};

export default function StudiosPage() {
  const { studios, stats } = buildStudioDirectory();

  const rows = studios
    .map((s) => ({
      id: s.id,
      name: s.name,
      country: COUNTRY_BY_ISO3[s.countryIso3]?.name ?? s.countryIso3,
      iso2: COUNTRY_BY_ISO3[s.countryIso3]?.iso2 ?? "",
      iso3: s.countryIso3,
      city: s.city ?? null,
      categories: s.categories,
      gdmType: s.gdmType ?? null,
      website: s.website ?? null,
      tier: s.tier,
      foundedYear: s.foundedYear ?? null,
      offices: s.otherOffices ?? null,
      linkable: s.tier === "verified",
      health: healthFor(s.id) ? HEALTH_LABEL[healthFor(s.id)!.status] : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={`${stats.total} organisations · ${stats.countries} countries`}
        title="Studio directory"
        action={
          <Link
            href="/studios/compare"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-800 px-3 py-2 text-sm font-medium text-slate-200 hover:border-gold-500/40"
          >
            <Icon name="compare" className="h-4 w-4" /> Compare
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Pill tone="emerald">{stats.verified} verified</Pill>
        <Pill tone="gold">{stats.community} community</Pill>
        <Pill>{stats.merged} merged duplicates</Pill>
        <Pill tone="gold">{LINK_HEALTH_ISSUES.length} broken links</Pill>
      </div>

      {/* Attribution — required by the source and by our own provenance rules */}
      <div className="rounded-lg border border-line bg-ink-850/60 p-4 text-sm text-slate-300">
        <p>
          <span className="font-semibold text-white">Two provenance tiers, never mixed. </span>
          <span className="text-emerald2-400">Verified</span> records are sourced to each
          organisation&apos;s own site and checked by us.{" "}
          <span className="text-gold-400">Community</span> records come from{" "}
          <a
            href={GAMEDEVMAP_SOURCE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold-400 underline decoration-dotted underline-offset-2 hover:text-gold-300"
          >
            GameDevMap
          </a>
          , a long-running community-maintained directory of game-development organisations, and are
          <span className="font-semibold"> not independently verified</span>.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Attribution: organisation name, type, city, region, country and website are reproduced as
          facts from GameDevMap with credit; no editorial text is copied. Retrieved{" "}
          {GAMEDEVMAP_SOURCE.retrievedAt} via the site&apos;s public query interface, which its
          robots.txt permits — the underlying CSV under <code className="figure">/cmsdata/</code> is
          Disallowed and was not accessed. GameDevMap is registered on our{" "}
          <Link href="/sources" className="text-gold-400 hover:text-gold-300">
            sources page
          </Link>
          . Corrections welcome — this directory improves as entries are verified.
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-400">Link health. </span>
          All {LINK_HEALTH_CHECKED} studio websites were swept on {LINK_HEALTH_SWEPT_AT};{" "}
          {LINK_HEALTH_ISSUES.length} are unreachable and are flagged in place. Every failure was
          re-checked with a longer timeout and a retry before being recorded — the first pass
          produced 8 false positives.
        </p>
      </div>

      <StudioDirectory rows={rows} />
    </div>
  );
}
