import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data/snapshot";
import { COUNTRIES } from "@/lib/data/countries";
import { FUNDING_OPPORTUNITIES } from "@/lib/data/funding-opportunities";
import { AdvisorForm } from "@/components/advisor/AdvisorForm";
import { SectionHeader } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Studio Advisor — plan, budget and fund your project",
  description:
    "Turn a project brief into a structured production plan, a transparent budget model and matched African funding opportunities.",
};

export default async function AdvisorPage() {
  const snap = await getSnapshot();

  // Ship only what the model needs, per country, from verified data.
  const countryData = COUNTRIES.map((c) => ({
    iso3: c.iso3,
    iso2: c.iso2,
    name: c.name,
    gdpPerCapita: snap.metrics.gdp_per_capita?.[c.iso3]?.value ?? null,
    tariffPct: snap.metrics.tariff_rate_pct?.[c.iso3]?.value ?? null,
  })).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Brief in · plan, budget and funding out"
        title="Studio advisor"
      />

      <p className="max-w-3xl text-sm text-slate-400">
        Describe what you want to build and where you are. The advisor returns a phased production
        plan, a costed budget built from your country&apos;s verified economic data, the risks worth
        planning for, and the funding calls that actually match your project.
      </p>

      <div className="rounded-lg border border-line bg-ink-850/60 p-4 text-sm text-slate-300">
        <span className="font-semibold text-white">How this works, and what it is not. </span>
        This is a transparent model, not a language model guessing at numbers. Every figure is
        arithmetic on assumptions you can see and edit, anchored to verified World Bank data for the
        country you pick — salaries scale from local GDP per capita, hardware carries your
        country&apos;s real applied tariff. It shows its working and states every assumption, because
        a confident invented budget is precisely the failure this platform exists to avoid. Treat the
        output as a starting scaffold to replace with your own quotes, not a valuation.
      </div>

      <AdvisorForm countries={countryData} opportunities={FUNDING_OPPORTUNITIES} />
    </div>
  );
}
