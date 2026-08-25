"use client";

import { useState } from "react";
import { GamerDemographics } from "@/components/demographics/GamerDemographics";
import { DemographicsView, type DemoCountry } from "@/components/demographics/DemographicsView";

/**
 * Two genuinely different datasets, kept apart on purpose.
 *
 * "Gamers" is third-party survey research about players, attributed to whoever
 * ran it. "Population" is official statistics about everyone, per country.
 * Blending them would let a survey of 2,500 people in four markets masquerade
 * as a continental fact, so they get separate tabs and separate provenance.
 */
export function DemographicsTabs({ countries }: { countries: DemoCountry[] }) {
  const [tab, setTab] = useState<"gamers" | "population">("gamers");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["gamers", "Gamer demographics", "Survey research · attributed"],
            ["population", "Population demographics", "World Bank · 54 countries"],
          ] as const
        ).map(([key, label, sub]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-[12px] border px-4 py-2.5 text-left transition-colors ${
              tab === key
                ? "border-accent-500/50 bg-accent-500/15"
                : "border-line bg-ink-800 hover:border-line-strong"
            }`}
          >
            <span
              className={`block text-sm font-semibold ${
                tab === key ? "text-accent-300" : "text-slate-300"
              }`}
            >
              {label}
            </span>
            <span className="block text-[11px] text-slate-500">{sub}</span>
          </button>
        ))}
      </div>

      {tab === "gamers" ? (
        <>
          <div className="rounded-lg border border-line bg-ink-850/60 p-4 text-sm text-slate-300">
            <span className="font-semibold text-white">Whose numbers these are. </span>
            Every figure below was published by a named researcher — GeoPoll, PAGG, Newzoo or
            Carry1st — and is reported here with their sample size, markets, date and a link back.
            This platform has run no player survey of its own, so nothing here is presented as our
            primary research. Where a category has no published free figure, it says{" "}
            <span className="text-slate-400">not published</span> and names the kind of source that
            would fill it, rather than being estimated into existence.
          </div>
          <GamerDemographics />
        </>
      ) : (
        <DemographicsView countries={countries} />
      )}
    </div>
  );
}
