import type { Metadata } from "next";
import { getSnapshot } from "@/lib/data/snapshot";
import { buildHardwareRows, HARDWARE_UNAVAILABLE } from "@/lib/scoring/hardware";
import { RETAIL_PENDING, RETAIL_SOURCE, RETAIL_BY_COUNTRY } from "@/lib/data/hardware-retail";
import { HardwareView } from "@/components/hardware/HardwareView";
import { SectionHeader, Panel, Pill, DataUnavailable } from "@/components/ui/primitives";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Hardware — development hardware access across Africa",
  description:
    "Import dependence, tariffs and hardware affordability for game development across all 54 African countries, from verified World Bank trade data.",
};

export default async function HardwarePage() {
  const snap = await getSnapshot();
  const rows = buildHardwareRows(snap.metrics);
  const withData = rows.filter((r) => r.importAccessScore !== null).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Production constraint · verified trade data"
        title="Development hardware access"
      />

      <p className="max-w-3xl text-sm text-slate-400">
        A studio cannot ship a PC title on machines it cannot buy, afford, or get repaired. This
        page models the part of that constraint we can source honestly: how hardware enters each
        country, what tariffs add to its cost, and what a machine costs relative to local income.
      </p>

      <div className="flex flex-wrap gap-2">
        <Pill tone="emerald">{withData} countries with trade data</Pill>
        <Pill tone="gold">Prices: user-supplied</Pill>
        <Pill>Retail density: pending</Pill>
      </div>

      {/* The honest disclosure, stated up front rather than buried. */}
      <div className="rounded-lg border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-gold-200">
        <span className="font-semibold text-white">What this page does not claim. </span>
        There is no free, licensable source for African retail pricing of GPUs, gaming PCs, laptops,
        RAM or SSDs — regional retailers publish no price API, and scraping their listings would
        breach their terms. So this platform does not print a GPU price and call it data. Instead
        the affordability model takes the price as <span className="font-semibold">your input</span>,
        from your own quote, and does the part that can be done rigorously: converting it into
        months of average income and tariff-adjusted landed cost, per country, from verified World
        Bank figures.
      </div>

      <HardwareView rows={rows} />

      {/* Retailer density — pending, not faked */}
      <Panel>
        <SectionHeader
          eyebrow="OpenStreetMap · ODbL"
          title="Retailer density & named stores"
          action={<Pill tone="gold">Pending harvest</Pill>}
        />
        {RETAIL_PENDING ? (
          <>
            <DataUnavailable label="Not yet harvested — no retailer counts are shown rather than invented ones." />
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              The harvester is written and verified against live data (sample queries returned 51
              mapped computer shops in Kenya, and named stores with branch counts in South Africa),
              but the full 54-country run could not complete from this environment: the primary
              Overpass endpoint rate-limited us and the public mirrors are unreachable here. Run{" "}
              <code className="figure">npm run harvest:hardware</code> from an environment with
              Overpass access to populate it.
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-400">When it lands, read it carefully. </span>
              OpenStreetMap counts <em>mapped</em> retailers, not all retailers. African retail
              mapping is incomplete and uneven, so counts are a lower bound and cross-country
              comparison is confounded by differing mapping intensity — a presence signal, never a
              census. Attribution: {RETAIL_SOURCE.licence}.
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-300">{RETAIL_BY_COUNTRY.length} countries harvested.</p>
        )}
      </Panel>

      {/* Explicit unavailability matrix */}
      <Panel>
        <SectionHeader eyebrow="Requested but unsourceable" title="Metrics we will not estimate" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Metric</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {HARDWARE_UNAVAILABLE.map((u) => (
                <tr key={u.metric}>
                  <td className="px-3 py-2 font-medium text-slate-200">{u.metric}</td>
                  <td className="px-3 py-2">
                    <span className="figure text-slate-500">N/A</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{u.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          These stay N/A until a verified free source exists. If you have a licensed pricing feed,
          it drops in as an adapter without changing anything else on this page.
        </p>
      </Panel>
    </div>
  );
}
