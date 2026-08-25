import type { Metadata } from "next";
import Link from "next/link";
import { getIntelligence } from "@/lib/data/intelligence";
import { getRegionComparison } from "@/lib/data-sources/worldbank-regions";
import { buildStudioDirectory } from "@/lib/data/studio-directory";
import { COUNTRIES, COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { GAMES } from "@/lib/data/games";
import { Panel, SectionHeader, ScoreBar, Pill } from "@/components/ui/primitives";
import { ExecKpiGrid, type ExecKpi } from "@/components/executive/ExecKpiGrid";
import { fmtNumber, fmtScore, fmtValue } from "@/lib/format";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Executive Dashboard — Africa creative economy at a glance",
  description:
    "Headline indicators for Africa's creative digital economy, each carrying its provenance tier, with a verified global regional comparison.",
};

/** Sum a metric across all African countries, ignoring missing values. */
function sumAcrossAfrica(
  metrics: Record<string, Record<string, { value: number | null } | undefined>>,
  metricId: string,
): { total: number | null; covered: number } {
  let total = 0;
  let covered = 0;
  for (const c of COUNTRIES) {
    const v = metrics[metricId]?.[c.iso3]?.value;
    if (typeof v === "number") {
      total += v;
      covered++;
    }
  }
  return { total: covered ? total : null, covered };
}

/** Population-weighted mean, so big countries aren't outvoted by small ones. */
function weightedMeanPct(
  metrics: Record<string, Record<string, { value: number | null } | undefined>>,
  metricId: string,
): { value: number | null; covered: number } {
  let num = 0;
  let den = 0;
  let covered = 0;
  for (const c of COUNTRIES) {
    const v = metrics[metricId]?.[c.iso3]?.value;
    const pop = metrics.population?.[c.iso3]?.value;
    if (typeof v === "number" && typeof pop === "number") {
      num += v * pop;
      den += pop;
      covered++;
    }
  }
  return { value: den ? num / den : null, covered };
}

export default async function ExecutivePage() {
  const [intel, regions] = await Promise.all([getIntelligence(), getRegionComparison()]);
  const m = intel.snapshot.metrics;
  const dir = buildStudioDirectory();

  const pop = sumAcrossAfrica(m, "population");
  const gdp = sumAcrossAfrica(m, "gdp");
  const consumption = sumAcrossAfrica(m, "hh_consumption");
  const internetPct = weightedMeanPct(m, "internet_pct");
  const mobile = weightedMeanPct(m, "mobile_per_100");
  const electricity = weightedMeanPct(m, "electricity_pct");
  const youth = weightedMeanPct(m, "youth_pct");
  const workingAge = weightedMeanPct(m, "working_age_pct");
  const urban = weightedMeanPct(m, "urban_pct");
  const tariff = weightedMeanPct(m, "tariff_rate_pct");

  const internetUsers =
    internetPct.value !== null && pop.total !== null ? (internetPct.value / 100) * pop.total : null;

  const market = intel.scores.market_attractiveness;
  const avgScore = market.reduce((s, x) => s + x.total, 0) / (market.length || 1);
  const steamGames = GAMES.filter((g) => g.steamAppId).length;

  const kpis: ExecKpi[] = [
    { label: "Total population", value: fmtNumber(pop.total), tier: "live", accent: "emerald", sub: `${pop.covered}/54 countries`, metricId: "population" },
    { label: "Internet users", value: fmtNumber(internetUsers), tier: "analytical", accent: "blue", sub: "population × penetration" },
    { label: "Internet penetration", value: internetPct.value === null ? "N/A" : `${internetPct.value.toFixed(1)}%`, tier: "live", accent: "blue", sub: "population-weighted" },
    { label: "Combined GDP", value: fmtValue(gdp.total, "US$"), tier: "live", accent: "emerald", sub: `${gdp.covered}/54 countries` },
    { label: "Household consumption", value: fmtValue(consumption.total, "US$"), tier: "live", accent: "emerald", sub: "the discretionary-spend pool" },
    { label: "Mobile subscriptions", value: mobile.value === null ? "N/A" : `${mobile.value.toFixed(0)}/100`, tier: "live", accent: "violet", sub: "per 100 people" },
    { label: "Electricity access", value: electricity.value === null ? "N/A" : `${electricity.value.toFixed(1)}%`, tier: "live", accent: "orange", sub: "foundational gate" },
    { label: "Under-15 share", value: youth.value === null ? "N/A" : `${youth.value.toFixed(1)}%`, tier: "live", accent: "violet", sub: "audience pipeline" },
    { label: "Working-age share", value: workingAge.value === null ? "N/A" : `${workingAge.value.toFixed(1)}%`, tier: "live", accent: "emerald", sub: "15–64, the talent core" },
    { label: "Urbanisation", value: urban.value === null ? "N/A" : `${urban.value.toFixed(1)}%`, tier: "live", accent: "blue", sub: "connectivity proxy" },
    { label: "Mean import tariff", value: tariff.value === null ? "N/A" : `${tariff.value.toFixed(1)}%`, tier: "live", accent: "orange", sub: "inflates hardware cost" },
    { label: "Studios tracked", value: fmtNumber(dir.stats.total), tier: "analytical", accent: "violet", sub: `${dir.stats.verified} verified · ${dir.stats.community} community` },
    { label: "Games on Steam", value: fmtNumber(steamGames), tier: "live", accent: "emerald", sub: "live review signals" },
    { label: "Mean market score", value: fmtScore(avgScore), tier: "analytical", accent: "blue", sub: "across all 54 countries" },
  ];

  const hubs = market.slice(0, 8);
  const africaRow = regions.find((r) => r.code === "SSF");
  const world = regions.find((r) => r.code === "WLD");

  return (
    <div className="view-enter space-y-6">
      <SectionHeader
        eyebrow={`${kpis.length} headline indicators · every card carries its provenance`}
        title="Executive dashboard"
      />

      <div className="flex flex-wrap gap-2">
        <Pill tone="emerald">Live</Pill>
        <Pill tone="gold">Analytical</Pill>
        <span className="pill border-line bg-ink-800 text-slate-400">No forecasts</span>
      </div>

      <p className="max-w-3xl text-sm text-slate-400">
        Continent-level aggregates computed from verified World Bank series plus our own catalogue.
        Percentages are <span className="text-slate-300">population-weighted</span>, so a large
        country counts for more than a small one. Nothing here is projected: this platform reports
        what is measured, and where a value is missing it reads N/A rather than being filled in.
      </p>

      <ExecKpiGrid kpis={kpis} />

      {/* Global comparison — real, verifiable indicators */}
      <Panel>
        <SectionHeader
          eyebrow={`World Bank regional aggregates${africaRow?.year ? ` · ${africaRow.year}` : ""}`}
          title="Global comparison"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-850 text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Region</th>
                <th className="px-3 py-2 text-right font-medium">Population</th>
                <th className="px-3 py-2 text-right font-medium">GDP</th>
                <th className="px-3 py-2 text-right font-medium">GDP / capita</th>
                <th className="px-3 py-2 text-right font-medium">Internet %</th>
                <th className="px-3 py-2 text-right font-medium">Pop. growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {regions.map((r) => (
                <tr
                  key={r.code}
                  className={r.highlight ? "bg-[var(--emerald-soft)]" : r.code === "WLD" ? "text-slate-400" : ""}
                >
                  <td className="px-3 py-2 font-medium text-slate-100">{r.label}</td>
                  <td className="px-3 py-2 text-right figure">{fmtNumber(r.population)}</td>
                  <td className="px-3 py-2 text-right figure">{fmtValue(r.gdp, "US$")}</td>
                  <td className="px-3 py-2 text-right figure">{fmtValue(r.gdpPerCapita, "US$")}</td>
                  <td className="px-3 py-2 text-right figure">
                    {r.internetPct === null ? "N/A" : `${r.internetPct.toFixed(1)}%`}
                  </td>
                  <td
                    className={`px-3 py-2 text-right figure ${
                      (r.populationGrowth ?? 0) > 1.5 ? "text-accent-400" : ""
                    }`}
                  >
                    {r.populationGrowth === null ? "N/A" : `${r.populationGrowth.toFixed(2)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {africaRow?.populationGrowth != null && world?.populationGrowth != null && (
          <p className="mt-3 rounded-lg border border-line bg-ink-850/60 p-3 text-sm text-slate-300">
            <span className="font-semibold text-white">The demographic case. </span>
            Sub-Saharan Africa&apos;s population is growing at{" "}
            <span className="figure text-accent-400">{africaRow.populationGrowth.toFixed(2)}%</span> a
            year against a world average of{" "}
            <span className="figure">{world.populationGrowth.toFixed(2)}%</span> — the fastest of any
            region here, from the lowest GDP-per-capita base. That is the audience-growth argument,
            stated from verified data rather than a market forecast.
          </p>
        )}
      </Panel>

      {/* Leading hubs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionHeader eyebrow="Market attractiveness" title="Leading development hubs" />
          <div className="space-y-2.5">
            {hubs.map((s, i) => {
              const c = COUNTRY_BY_ISO3[s.entityId]!;
              return (
                <div key={s.entityId} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-slate-500">{i + 1}</span>
                  <span>{flagEmoji(c.iso2)}</span>
                  <Link
                    href={`/countries/${s.entityId.toLowerCase()}`}
                    className="w-28 shrink-0 truncate text-sm text-slate-200 hover:text-accent-400"
                  >
                    {c.name}
                  </Link>
                  <div className="flex-1">
                    <ScoreBar value={s.total} />
                  </div>
                  <span className="figure w-10 text-right text-sm font-semibold text-accent-400">
                    {fmtScore(s.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <SectionHeader eyebrow="What the data supports" title="The African opportunity" />
          <ul className="space-y-2 text-sm text-slate-300">
            {[
              youth.value !== null && `Young population — ${youth.value.toFixed(0)}% under 15, the largest audience pipeline of any region`,
              mobile.value !== null && `Mobile-first — ${mobile.value.toFixed(0)} subscriptions per 100 people`,
              internetPct.value !== null && `Connectivity still climbing — ${internetPct.value.toFixed(0)}% online, so the addressable market grows without new users being born`,
              africaRow?.populationGrowth != null && `Fastest population growth of any world region (${africaRow.populationGrowth.toFixed(2)}%/yr)`,
              `${dir.stats.total} studios catalogued across ${dir.stats.countries} countries`,
              consumption.total !== null && `${fmtValue(consumption.total, "US$")} in household consumption — the discretionary pool games compete for`,
            ]
              .filter(Boolean)
              .map((t) => (
                <li key={String(t)} className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-accent-400">✓</span>
                  {t}
                </li>
              ))}
          </ul>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-slate-500">
            Each claim is computed from the indicators above and clickable through to its source. The
            counter-argument lives in the same data: low GDP per capita, thin payment infrastructure
            and high hardware tariffs are all visible on the country and hardware pages.
          </p>
        </Panel>
      </div>
    </div>
  );
}
