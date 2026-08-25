import type { Metadata } from "next";
import { DATA_SOURCES } from "@/lib/data-sources/registry";
import { SectionHeader, Panel, Pill } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Sources — data provenance registry",
  description: "Every source the platform trusts, with reliability, license and verification status.",
};

const TYPE_LABEL: Record<string, string> = {
  international_org: "International org",
  government: "Government",
  platform_api: "Platform API",
  official_site: "Official site",
  academic: "Academic",
  community: "Community",
};

export default function SourcesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Provenance registry" title="Data sources" />
      <p className="max-w-2xl text-sm text-slate-400">
        Every figure on the platform traces to one of these registered sources. Reliability scores
        are transparent editorial judgements of source authority — shown, never hidden. Community
        data is always labelled distinctly from official data.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {DATA_SOURCES.map((s) => (
          <Panel key={s.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">{s.organization}</h3>
                <p className="text-sm text-slate-400">{s.sourceName}</p>
              </div>
              {s.verificationStatus === "verified" ? (
                <Pill tone="emerald">✓ Verified</Pill>
              ) : (
                <Pill tone="gold">⚠ Needs verification</Pill>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <Fact k="Type" v={TYPE_LABEL[s.sourceType] ?? s.sourceType} />
              <Fact k="Cadence" v={s.updateFrequency} />
              <Fact k="License" v={s.license} />
              <Fact k="Reliability" v={`${s.reliabilityScore}/100`} />
            </div>

            {s.notes && <p className="mt-3 text-xs text-slate-400">{s.notes}</p>}

            <div className="mt-3 flex flex-wrap gap-3 border-t border-line pt-3 text-xs">
              {s.websiteUrl && <SourceLink href={s.websiteUrl} label="Website" />}
              {s.apiUrl && <SourceLink href={s.apiUrl} label="API" />}
              {s.documentationUrl && <SourceLink href={s.documentationUrl} label="Docs" />}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded border border-line bg-ink-850/60 px-2.5 py-1.5">
      <span className="text-slate-500">{k}: </span>
      <span className="text-slate-200">{v}</span>
    </div>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-gold-400 hover:text-gold-500">
      {label} <Icon name="external" className="h-3 w-3" />
    </a>
  );
}
