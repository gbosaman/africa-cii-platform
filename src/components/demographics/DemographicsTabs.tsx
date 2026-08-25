"use client";

import { useState } from "react";
import { GamerDemographics } from "@/components/demographics/GamerDemographics";
import type { GamerCategory } from "@/lib/data/gamer-demographics";
import { DemographicsView, type DemoCountry } from "@/components/demographics/DemographicsView";

/**
 * Two genuinely different datasets, kept apart on purpose.
 *
 * "Gamers" is third-party survey research about players, attributed to whoever
 * ran it. "Population" is official statistics about everyone, per country.
 * Blending them would let a survey of 2,500 people in four markets masquerade
 * as a continental fact, so they get separate tabs and separate provenance.
 */
export function DemographicsTabs({
  countries,
  occupation,
  settlement,
  education,
}: {
  countries: DemoCountry[];
  occupation?: GamerCategory;
  settlement?: GamerCategory;
  education?: GamerCategory;
}) {
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
            Every figure below comes from a named publisher — GeoPoll, PAGG, Newzoo and Carry1st for
            the player surveys; the World Bank, ILO and UNESCO for the official statistics — and is
            reported here with its sample, markets, date and a link back. This platform has run no
            player survey of its own, so nothing here is presented as our primary research. Cards
            marked <span className="text-warn-400">partial</span> carry real data that describes the{" "}
            <span className="text-slate-200">population</span> rather than gamers specifically; each
            one says so, and names the source that would close the gap, rather than being estimated
            into existence.
          </div>
          <GamerDemographics occupation={occupation} settlement={settlement} education={education} />
        </>
      ) : (
        <DemographicsView countries={countries} />
      )}
    </div>
  );
}
