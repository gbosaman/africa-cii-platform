"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { MetricNumber } from "@/components/metric/MetricNumber";
import { ScoreBar, Panel, SectionHeader, Pill } from "@/components/ui/primitives";
import { fmtScore, fmtValue } from "@/lib/format";
import { monthsOfIncome, landedCost, type HardwareRow } from "@/lib/scoring/hardware";

/** Reference configurations. These are PRICE ASSUMPTIONS the user edits — the
 *  platform does not claim these are observed African retail prices. */
const PRESETS = [
  { label: "Entry dev laptop", price: 700 },
  { label: "Mid GPU workstation", price: 1500 },
  { label: "High-end workstation", price: 3000 },
];

type SortKey = "importAccessScore" | "months" | "tariffPct" | "ictImportsPct" | "name";

export function HardwareView({ rows }: { rows: HardwareRow[] }) {
  const [price, setPrice] = useState(1500);
  const [sort, setSort] = useState<SortKey>("months");

  const enriched = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        months: monthsOfIncome(price, r.gdpPerCapita),
        landed: landedCost(price, r.tariffPct),
      })),
    [rows, price],
  );

  const sorted = useMemo(() => {
    const list = [...enriched];
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "months") {
        // Fewer months of income = more affordable = better. Nulls last.
        if (a.months === null) return 1;
        if (b.months === null) return -1;
        return a.months - b.months;
      }
      if (sort === "tariffPct") {
        if (a.tariffPct === null) return 1;
        if (b.tariffPct === null) return -1;
        return a.tariffPct - b.tariffPct;
      }
      const av = a[sort] ?? -Infinity;
      const bv = b[sort] ?? -Infinity;
      return (bv as number) - (av as number);
    });
    return list;
  }, [enriched, sort]);

  const withMonths = sorted.filter((r) => r.months !== null);
  const mostAffordable = withMonths[0];
  const leastAffordable = withMonths[withMonths.length - 1];

  return (
    <div className="space-y-6">
      {/* Affordability calculator */}
      <Panel>
        <SectionHeader
          eyebrow="Your price assumption · not our data"
          title="Hardware affordability"
        />
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Machine price (USD)</span>
            <input
              type="number"
              min={50}
              step={50}
              value={price}
              onChange={(e) => setPrice(Math.max(1, Number(e.target.value) || 0))}
              className="figure w-36 rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100 focus:border-gold-500/40 focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPrice(p.price)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  price === p.price
                    ? "border-gold-500/50 bg-gold-500/15 text-gold-400"
                    : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {p.label} · ${p.price}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          Enter a real quote and the table below converts it into months of average income per
          country, using verified GDP per capita. GDP per capita is a national average, not
          take-home pay for a developer — treat it as a comparative scale, not a payslip.
        </p>

        {mostAffordable && leastAffordable && mostAffordable.iso3 !== leastAffordable.iso3 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald2-500/25 bg-emerald2-500/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-emerald2-300">
                Most affordable
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {flagEmoji(COUNTRY_BY_ISO3[mostAffordable.iso3]?.iso2 ?? "")} {mostAffordable.name}
              </p>
              <p className="figure text-xs text-emerald2-300">
                {mostAffordable.months} months of average income
              </p>
            </div>
            <div className="rounded-lg border border-orange-500/25 bg-orange-500/10 p-3">
              <p className="text-[10px] uppercase tracking-wider text-orange-300">
                Least affordable
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {flagEmoji(COUNTRY_BY_ISO3[leastAffordable.iso3]?.iso2 ?? "")} {leastAffordable.name}
              </p>
              <p className="figure text-xs text-orange-300">
                {leastAffordable.months} months of average income
              </p>
            </div>
          </div>
        )}
      </Panel>

      {/* Country table */}
      <Panel>
        <SectionHeader
          eyebrow="World Bank verified · click any figure for its source"
          title="By country"
          action={
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-line bg-ink-850 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="months">Sort: most affordable</option>
              <option value="importAccessScore">Sort: import access</option>
              <option value="tariffPct">Sort: lowest tariff</option>
              <option value="ictImportsPct">Sort: ICT import share</option>
              <option value="name">Sort: name</option>
            </select>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-ink-850 text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Country</th>
                <th className="px-3 py-2 text-right font-medium">Import access</th>
                <th className="px-3 py-2 text-right font-medium">ICT imports</th>
                <th className="px-3 py-2 text-right font-medium">Tariff</th>
                <th className="px-3 py-2 text-right font-medium">Landed cost*</th>
                <th className="px-3 py-2 text-right font-medium">Months of income</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((r) => {
                const c = COUNTRY_BY_ISO3[r.iso3]!;
                return (
                  <tr key={r.iso3} className="hover:bg-ink-800/40">
                    <td className="px-3 py-2">
                      <Link
                        href={`/countries/${r.iso3.toLowerCase()}`}
                        className="flex items-center gap-2 font-medium text-slate-100 hover:text-gold-400"
                      >
                        <span>{flagEmoji(c.iso2)}</span>
                        <span className="truncate">{r.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <span className="w-14">
                          <ScoreBar value={r.importAccessScore} color="#38bdf8" />
                        </span>
                        <span className="figure w-9 text-right text-emerald2-400">
                          {fmtScore(r.importAccessScore)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <MetricNumber
                        metricId="ict_goods_imports_pct"
                        iso3={r.iso3}
                        value={r.ictImportsPct}
                        unit="%"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <MetricNumber
                        metricId="tariff_rate_pct"
                        iso3={r.iso3}
                        value={r.tariffPct}
                        unit="%"
                      />
                    </td>
                    <td className="px-3 py-2 text-right figure text-slate-300">
                      {r.landed === null ? (
                        <span className="text-slate-500">N/A</span>
                      ) : (
                        `$${r.landed.toLocaleString("en-US")}`
                      )}
                    </td>
                    <td
                      className={`px-3 py-2 text-right figure font-semibold ${
                        r.months === null
                          ? "text-slate-500"
                          : r.months <= 2
                            ? "text-emerald2-400"
                            : r.months <= 8
                              ? "text-gold-400"
                              : "text-orange-400"
                      }`}
                    >
                      {r.months === null ? "N/A" : r.months}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-400">* Landed cost is MODELLED, not observed. </span>
          It applies each country&apos;s weighted-mean applied tariff across all products to your
          entered price. The specific tariff line for computers may differ, and it excludes VAT,
          freight, clearing fees and currency spread — so read it as a directional floor, not a
          quote. Import access blends ICT import share, tariff level and import intensity over
          whatever data exists; countries with no trade data score N/A rather than zero.
        </p>
      </Panel>
    </div>
  );
}
