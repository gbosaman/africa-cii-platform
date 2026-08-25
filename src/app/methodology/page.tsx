import type { Metadata } from "next";
import { SectionHeader, Panel, Pill } from "@/components/ui/primitives";
import { DIMENSIONS, MODE_WEIGHTS, MODE_LABELS, ALL_MODES } from "@/lib/scoring/weights";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";

export const metadata: Metadata = {
  title: "Methodology — definitions, scoring & data availability",
  description: "How scores are calculated, what counts as verified, and the data availability matrix.",
};

const DEFINITIONS: [string, string][] = [
  ["African studio", "A game/animation studio headquartered or primarily operating in an African country, sourced to its official web presence."],
  ["African game", "A game whose primary developer is an African studio, or that is substantially developed in Africa."],
  ["Verified", "A value traceable to an official API, government/international dataset, or an entity's own official site."],
  ["Estimate", "A modelled value — always labelled ESTIMATE with methodology, source, date and confidence. Never shown as fact."],
  ["ZERO ≠ UNKNOWN", "Missing data is stored as NULL and rendered N/A. Zero is only shown when a source reports zero."],
  ["Coverage", "Share of a score's input metrics that have verified data. Low coverage lowers confidence, never silently zeroes a score."],
];

export default function MethodologyPage() {
  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Trust layer" title="Methodology" />
      <p className="max-w-2xl text-sm text-slate-400">
        The platform&apos;s edge is not volume of data — it is turning fragmented African
        creative-industry data into comparable, verified, decision-ready intelligence. That only
        works if the method is fully transparent. Here it is.
      </p>

      {/* Definitions */}
      <Panel>
        <SectionHeader eyebrow="What things mean" title="Definitions" />
        <dl className="divide-y divide-line">
          {DEFINITIONS.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
              <dt className="font-semibold text-slate-200">{k}</dt>
              <dd className="text-sm text-slate-400">{v}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      {/* Scoring */}
      <Panel>
        <SectionHeader eyebrow="How scores are built" title="Scoring engine" />
        <div className="space-y-3 text-sm text-slate-300">
          <p><span className="font-semibold text-white">1. Normalise.</span> Each raw metric is normalised to 0–100 across all 54 countries. Magnitude series (population, GDP, consumption) are log-transformed first so large countries don&apos;t automatically dominate every ranking.</p>
          <p><span className="font-semibold text-white">2. Compose dimensions.</span> Normalised metrics are averaged into eight dimensions (below).</p>
          <p><span className="font-semibold text-white">3. Weight per mode.</span> Dimensions are weighted differently for each question (invest vs build vs hire…). Weights renormalise over dimensions that actually have data.</p>
          <p><span className="font-semibold text-white">4. Report coverage & confidence.</span> Every score ships with its data coverage and a HIGH/MEDIUM/LOW confidence tier.</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Object.entries(DIMENSIONS).map(([key, spec]) => {
            const metrics = Object.keys(spec.metrics);
            return (
              <div key={key} className="rounded-lg border border-line bg-ink-850/60 p-3">
                <p className="text-sm font-semibold text-slate-100">{spec.label}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {metrics.length ? metrics.join(", ") : "Populated in a later phase (currently N/A)"}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Mode weights */}
      <Panel>
        <SectionHeader eyebrow="Configurable" title="Mode weightings" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="px-2 py-2 text-left">Dimension</th>
                {ALL_MODES.map((m) => (
                  <th key={m} className="px-2 py-2 text-right">{MODE_LABELS[m].replace("Best for ", "")}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {Object.keys(DIMENSIONS).map((dim) => (
                <tr key={dim}>
                  <td className="px-2 py-2 text-slate-300">{DIMENSIONS[dim as keyof typeof DIMENSIONS].label}</td>
                  {ALL_MODES.map((m) => {
                    const w = (MODE_WEIGHTS[m] as Record<string, number>)[dim];
                    return (
                      <td key={m} className={`px-2 py-2 text-right figure ${w ? "text-slate-200" : "text-slate-600"}`}>
                        {w ? `${Math.round(w * 100)}%` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Data availability matrix */}
      <Panel>
        <SectionHeader eyebrow="What's actually available for free" title="Data availability matrix" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-850 text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Metric</th>
                <th className="px-3 py-2 text-left">Source</th>
                <th className="px-3 py-2 text-left">Indicator</th>
                <th className="px-3 py-2 text-center">Free</th>
                <th className="px-3 py-2 text-left">Cadence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {WORLD_BANK_METRICS.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-slate-200">{m.label}</td>
                  <td className="px-3 py-2 text-slate-400">World Bank WDI</td>
                  <td className="px-3 py-2 figure text-slate-400">{m.wbIndicator}</td>
                  <td className="px-3 py-2 text-center"><span className="text-emerald2-400">✓</span></td>
                  <td className="px-3 py-2 text-slate-400">Annual</td>
                </tr>
              ))}
              {([
                ["Gaming revenue / gamer counts", "Newzoo (paid)", "—"],
                ["Steam availability", "Steam Web API (free)", "Phase 2"],
                ["Game metadata", "IGDB / RAWG (free tier)", "Phase 2"],
                ["Esports tournaments", "Liquipedia (community)", "Phase 3"],
                ["Research / talent output", "OpenAlex (CC0)", "Phase 3"],
              ] as [string, string, string][]).map(([metric, source, note]) => (
                <tr key={metric} className="text-slate-500">
                  <td className="px-3 py-2">{metric}</td>
                  <td className="px-3 py-2">{source}</td>
                  <td className="px-3 py-2">—</td>
                  <td className="px-3 py-2 text-center">{source.includes("paid") ? "✗" : "◑"}</td>
                  <td className="px-3 py-2">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="emerald">✓ Live free source</Pill>
          <Pill tone="gold">◑ Free, planned</Pill>
          <Pill>✗ Paid — excluded from facts</Pill>
        </div>
      </Panel>
    </div>
  );
}
