"use client";

import { useMemo, useState } from "react";
import { flagEmoji } from "@/lib/data/countries";
import { Panel, SectionHeader, Pill } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { runAdvisor, type AdvisorInput, type TeamSize, type ProjectType, type Dimension } from "@/lib/advisor/engine";
import {
  SOFTWARE_TOOLS,
  HARDWARE_TIERS,
  HARDWARE_BY_ID,
  softwareAnnualCost,
  type SoftwareCategory,
} from "@/lib/advisor/software";
import {
  DISTRIBUTION_CHANNELS,
  ACCESS_META,
  distributionEntryCost,
  distributionAnnualCost,
  type DistributionKind,
} from "@/lib/advisor/distribution";
import {
  opportunityStatus,
  daysUntil,
  type FundingOpportunity,
  type OpportunityStatus,
} from "@/lib/data/funding-opportunities";

interface CountryOpt {
  iso3: string;
  iso2: string;
  name: string;
  gdpPerCapita: number | null;
  tariffPct: number | null;
}

const TEAM_SIZES: TeamSize[] = ["0-2", "2-5", "5-10", "10+"];
const PROJECT_TYPES: ProjectType[] = ["Game", "Animation", "Comic", "Gamer/Creator"];
const DIMENSIONS: Dimension[] = ["2D", "3D"];

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const SOFTWARE_CATEGORIES: SoftwareCategory[] = [
  "Engine",
  "3D",
  "Texturing",
  "2D/Art",
  "Animation",
  "Video",
];

const STATUS_STYLE: Record<OpportunityStatus, string> = {
  open: "border-emerald2-500/40 bg-emerald2-500/10 text-emerald2-300",
  rolling: "border-gold-500/40 bg-gold-500/10 text-gold-300",
  closed: "border-slate-500/30 bg-slate-500/10 text-slate-400",
  unknown: "border-slate-500/30 bg-slate-500/10 text-slate-400",
};

export function AdvisorForm({
  countries,
  opportunities,
}: {
  countries: CountryOpt[];
  opportunities: FundingOpportunity[];
}) {
  const [form, setForm] = useState<AdvisorInput>({
    title: "",
    genre: "",
    teamSize: "2-5",
    projectType: "Game",
    description: "",
    dimension: "2D",
    countryIso3: "NGA",
    software: ["unity", "blender", "krita"],
    hardwareTier: "mid-3d",
    distribution: ["google_play", "youtube"],
    indieEligible: true,
  });
  const [submitted, setSubmitted] = useState(false);

  const country = countries.find((c) => c.iso3 === form.countryIso3) ?? countries[0]!;

  const result = useMemo(
    () =>
      runAdvisor(form, {
        gdpPerCapita: country.gdpPerCapita,
        tariffPct: country.tariffPct,
        countryName: country.name,
      }),
    [form, country],
  );

  const matched = useMemo(() => {
    const rank = (s: OpportunityStatus) => (s === "open" ? 0 : s === "rolling" ? 1 : s === "unknown" ? 2 : 3);
    return opportunities
      .filter((o) => o.focus.includes(result.fundingFocus) || o.focus.includes("creative"))
      .map((o) => ({ ...o, status: opportunityStatus(o) }))
      .sort((a, b) => rank(a.status) - rank(b.status) || a.name.localeCompare(b.name));
  }, [opportunities, result.fundingFocus]);

  const set = <K extends keyof AdvisorInput>(k: K, v: AdvisorInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleDistribution = (id: string) =>
    setForm((f) => ({
      ...f,
      distribution: f.distribution.includes(id)
        ? f.distribution.filter((x) => x !== id)
        : [...f.distribution, id],
    }));

  const toggleSoftware = (id: string) =>
    setForm((f) => ({
      ...f,
      software: f.software.includes(id) ? f.software.filter((x) => x !== id) : [...f.software, id],
    }));

  const softwarePerSeat = softwareAnnualCost(form.software, form.indieEligible);
  const selectedTier = HARDWARE_BY_ID[form.hardwareTier];
  const distEntry = distributionEntryCost(form.distribution);
  const distAnnual = distributionAnnualCost(form.distribution);

  const maxLine = Math.max(...result.budget.lines.map((l) => l.amountUsd), 1);

  return (
    <div className="space-y-6">
      {/* ---------------- Form ---------------- */}
      <Panel>
        <SectionHeader eyebrow="Your brief" title="Tell us about the project" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Project title</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Sahel Runner"
              className="w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-gold-500/40 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Genre</span>
            <input
              value={form.genre}
              onChange={(e) => set("genre", e.target.value)}
              placeholder="e.g. Action-platformer"
              className="w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-gold-500/40 focus:outline-none"
            />
          </label>

          <div>
            <span className="mb-1 block text-xs text-slate-400">Project type</span>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => set("projectType", t)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.projectType === t
                      ? "border-gold-500/50 bg-gold-500/15 text-gold-300"
                      : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs text-slate-400">Team size</span>
            <div className="flex flex-wrap gap-1.5">
              {TEAM_SIZES.map((t) => (
                <button
                  key={t}
                  onClick={() => set("teamSize", t)}
                  className={`figure rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.teamSize === t
                      ? "border-gold-500/50 bg-gold-500/15 text-gold-300"
                      : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs text-slate-400">2D or 3D</span>
            <div className="flex gap-1.5">
              {DIMENSIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => set("dimension", d)}
                  className={`rounded-lg border px-4 py-1.5 text-xs font-semibold transition-colors ${
                    form.dimension === d
                      ? "border-gold-500/50 bg-gold-500/15 text-gold-300"
                      : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-400">Based in</span>
            <select
              value={form.countryIso3}
              onChange={(e) => set("countryIso3", e.target.value)}
              className="w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100"
            >
              {countries.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-slate-400">Short description</span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="One or two sentences on what the project is and who it is for."
              className="w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-gold-500/40 focus:outline-none"
            />
          </label>

          {/* Software — multiple selection */}
          <div className="sm:col-span-2">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs text-slate-400">
                Software used <span className="text-slate-600">· select all that apply</span>
              </span>
              <span className="figure text-[11px] text-slate-500">
                {form.software.length} selected · ${softwarePerSeat.toLocaleString()}/seat/yr
              </span>
            </div>
            <div className="space-y-2">
              {SOFTWARE_CATEGORIES.map((cat) => (
                <div key={cat} className="flex flex-wrap items-center gap-1.5">
                  <span className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-slate-600">
                    {cat}
                  </span>
                  {SOFTWARE_TOOLS.filter((t) => t.category === cat).map((t) => {
                    const on = form.software.includes(t.id);
                    const price = form.indieEligible && t.indieAnnualUsd !== undefined ? t.indieAnnualUsd : t.annualUsd;
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleSoftware(t.id)}
                        title={`${t.priceNote}${t.indieNote ? ` — ${t.indieNote}` : ""}`}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          on
                            ? "border-gold-500/50 bg-gold-500/15 text-gold-300"
                            : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {t.name}
                        <span className={`ml-1.5 figure text-[10px] ${price === 0 ? "text-emerald2-400" : "text-slate-500"}`}>
                          {price === 0 ? "free" : `${price}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={form.indieEligible}
                onChange={(e) => set("indieEligible", e.target.checked)}
                className="h-3.5 w-3.5 accent-[#F5C518]"
              />
              Apply indie / small-studio licence tiers where they exist
              <span className="text-slate-600">(check eligibility with each vendor)</span>
            </label>
          </div>

          {/* Hardware tier — dropdown */}
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-slate-400">
              Hardware specification <span className="text-slate-600">· per seat</span>
            </span>
            <select
              value={form.hardwareTier}
              onChange={(e) => set("hardwareTier", e.target.value)}
              className="w-full rounded-lg border border-line bg-ink-850 px-3 py-2 text-sm text-slate-100"
            >
              {HARDWARE_TIERS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label} — {h.spec} (~${h.priceUsd.toLocaleString()})
                </option>
              ))}
            </select>
            {selectedTier && (
              <span className="mt-1 block text-[11px] text-slate-500">
                {selectedTier.suitedTo} Price is an assumption you should replace with a local quote —
                the platform holds no African retail hardware prices.
              </span>
            )}
          </label>

          {/* Distribution — multiple selection, grouped by how you actually get in */}
          <div className="sm:col-span-2">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs text-slate-400">
                Distribution method <span className="text-slate-600">· select all that apply</span>
              </span>
              <span className="figure text-[11px] text-slate-500">
                {form.distribution.length} selected · ${distEntry.toLocaleString()} one-off
                {distAnnual > 0 ? ` + $${distAnnual.toLocaleString()}/yr` : ""}
              </span>
            </div>
            <div className="space-y-2">
              {(["mobile", "pc", "console", "video", "festival"] as DistributionKind[]).map((kind) => {
                const rows = DISTRIBUTION_CHANNELS.filter((c) => c.kind === kind);
                if (rows.length === 0) return null;
                return (
                  <div key={kind} className="flex flex-wrap items-center gap-1.5">
                    <span className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-slate-600">
                      {kind}
                    </span>
                    {rows.map((c) => {
                      const on = form.distribution.includes(c.id);
                      // entryUsd === 0 means genuinely free. entryUsd === null
                      // means NO PUBLISHED FEE — console dev kits are under NDA
                      // and festival fees are set per festival. Rendering those
                      // as "free" would be the zero-vs-unknown error, and here
                      // it would understate a real cost to someone budgeting.
                      const cost =
                        c.entryUsd !== null
                          ? c.entryUsd === 0
                            ? "free"
                            : `$${c.entryUsd}`
                          : c.annualUsd !== null
                            ? `$${c.annualUsd}/yr`
                            : "fee not published";
                      const costTone =
                        cost === "free"
                          ? "text-emerald2-400"
                          : cost === "fee not published"
                            ? "text-slate-600"
                            : "text-slate-500";
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleDistribution(c.id)}
                          title={`${ACCESS_META[c.access].blurb} ${c.entryBasis} ${c.cutNote}`}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            on
                              ? "border-gold-500/50 bg-gold-500/15 text-gold-300"
                              : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {c.name}
                          {c.access === "commissioned" && (
                            <span className="ml-1.5 text-[10px] text-violet2-400">not self-serve</span>
                          )}
                          {c.access !== "commissioned" && (
                            <span className={`figure ml-1.5 text-[10px] ${costTone}`}>{cost}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              These are not the same kind of thing.{" "}
              <span className="text-accent-400">Self-serve</span> means you can publish yourself
              today for a published fee. <span className="text-warn-400">Gated</span> means approval
              or curation stands in front. <span className="text-violet2-400">Commissioned only</span>{" "}
              means you cannot choose it at all — Netflix does not accept unsolicited submissions, so
              it is an outcome to work towards, never a release plan.
            </p>
          </div>

        </div>

        <button
          onClick={() => setSubmitted(true)}
          className="clip-slant mt-4 bg-gold-500 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink-900 hover:bg-gold-400"
        >
          Generate plan
        </button>
        {submitted && (
          <p className="mt-2 text-[11px] text-slate-500">
            The plan updates live as you change any field above.
          </p>
        )}
      </Panel>

      {submitted && (
        <>
          {/* ---------------- Summary ---------------- */}
          <Panel>
            <SectionHeader
              eyebrow={`${flagEmoji(country.iso2)} ${country.name} · ${form.projectType} · ${form.dimension}`}
              title={form.title.trim() || "Your project"}
            />
            {form.description.trim() && (
              <p className="mb-4 text-sm italic text-slate-400">&ldquo;{form.description.trim()}&rdquo;</p>
            )}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
              <Stat label="Team" value={`${result.headcount.typical}`} sub={`${result.headcount.min}–${result.headcount.max} people`} />
              <Stat label="Duration" value={`${result.durationMonths}`} sub="months" />
              <Stat label="Budget (model)" value={usd(result.budget.totalUsd)} sub="mid estimate" tone="gold" />
              <Stat
                label="Range"
                value={`${usd(result.budget.lowUsd)}–${usd(result.budget.highUsd)}`}
                sub="−30% / +60%"
              />
            </div>
          </Panel>

          {/* ---------------- Budget ---------------- */}
          <Panel>
            <SectionHeader eyebrow="Every line shows its basis" title="Budget model" />
            <div className="space-y-3">
              {result.budget.lines.map((l) => (
                <div key={l.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-slate-200">{l.label}</span>
                    <span className="figure text-sm font-semibold text-gold-400">{usd(l.amountUsd)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                      style={{ width: `${(l.amountUsd / maxLine) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{l.basis}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm font-semibold text-white">Total (mid)</span>
              <span className="figure text-lg font-bold text-gold-400">{usd(result.budget.totalUsd)}</span>
            </div>
            {result.toolSaving.savingUsd > 0 && (
              <div className="mt-3 rounded-lg border border-emerald2-500/25 bg-emerald2-500/10 p-3">
                <p className="text-xs font-semibold text-emerald2-300">
                  Licence saving available: {usd(result.toolSaving.savingUsd)}/seat/yr
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Swapping to free equivalents —{" "}
                  {result.toolSaving.swaps.map((s) => `${s.from} → ${s.to}`).join(", ")} — removes{" "}
                  {usd(result.toolSaving.savingUsd * result.headcount.typical)}/yr across a team of{" "}
                  {result.headcount.typical}. These tools are capable, not identical: budget learning
                  time, and check pipeline compatibility with any collaborators or outsourcers before
                  switching.
                </p>
              </div>
            )}
            {result.machineMonthsOfIncome !== null && (
              <p className="mt-3 rounded-lg border border-line bg-ink-850/60 p-3 text-[11px] text-slate-400">
                Context from verified data: one workstation costs about{" "}
                <span className="figure text-gold-400">{result.machineMonthsOfIncome}</span> months of{" "}
                {country.name}&apos;s average income. Equipment is a capital problem here, not a line item —
                look for grants that explicitly cover hardware.
              </p>
            )}
          </Panel>

          {/* ---------------- Assumptions ---------------- */}
          <Panel>
            <SectionHeader eyebrow="Change these and the numbers change" title="Assumptions" />
            <ul className="space-y-2 text-sm text-slate-400">
              {result.assumptions.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-slate-600">▸</span>
                  {a}
                </li>
              ))}
            </ul>
          </Panel>

          {/* ---------------- Plan ---------------- */}
          <Panel>
            <SectionHeader eyebrow="Phased" title="Production plan" />
            <ol className="relative space-y-4 border-l border-line pl-5">
              {result.milestones.map((m) => (
                <li key={m.phase} className="relative">
                  <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-gold-500" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{m.phase}</span>
                    <span className="figure text-[11px] text-slate-500">months {m.months}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{m.focus}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.outputs.map((o) => (
                      <span key={o} className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {o}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          {/* ---------------- Distribution reality ---------------- */}
          {form.distribution.length > 0 && (
            <Panel>
              <SectionHeader eyebrow="How the work reaches people" title="Distribution plan" />

              {result.distributionPlan.selfServe.length > 0 && (
                <p className="mb-3 text-sm text-slate-300">
                  <span className="text-accent-400">Publishable yourself:</span>{" "}
                  {result.distributionPlan.selfServe.join(", ")} —{" "}
                  {usd(result.distributionPlan.entryUsd)} one-off
                  {result.distributionPlan.annualUsd > 0
                    ? ` plus ${usd(result.distributionPlan.annualUsd)}/yr`
                    : ""}
                  .
                </p>
              )}

              {result.distributionPlan.worstCutPct !== null && (
                <div className="mb-3 rounded-lg border border-line bg-ink-850/60 p-3">
                  <p className="text-sm text-slate-300">
                    Steepest platform cut:{" "}
                    <span className="figure font-bold text-gold-400">
                      {result.distributionPlan.worstCutPct}%
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    You keep ${100 - result.distributionPlan.worstCutPct} of every $100 gross before
                    tax, refunds, payment fees and user acquisition. Model revenue net of this — a
                    plan budgeted against gross overstates runway by roughly a third.
                  </p>
                </div>
              )}

              {result.distributionPlan.commissioned.map((c) => (
                <div
                  key={c.name}
                  className="mb-2 rounded-lg border border-violet2-500/30 bg-violet2-500/10 p-3"
                >
                  <p className="text-sm font-semibold text-violet2-300">
                    {c.name} — not something you can choose
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{c.note}</p>
                </div>
              ))}

              {result.distributionPlan.mismatched.map((c) => (
                <div key={c.name} className="mb-2 rounded-lg border border-warn-500/30 bg-warn-500/10 p-3">
                  <p className="text-sm font-semibold text-warn-400">
                    {c.name} does not fit a {form.projectType} project
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">It suits {c.fits}.</p>
                </div>
              ))}

              <p className="mt-3 border-t border-line pt-2 text-[11px] leading-relaxed text-slate-500">
                Fees are published list prices, dated and sourced in the distribution catalogue.
                Festival submission fees and console dev-kit costs are excluded because no rate is
                published — get those per festival and per platform.
              </p>
            </Panel>
          )}

          {/* ---------------- Risks & next steps ---------------- */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel>
              <SectionHeader eyebrow="Plan for these" title="Risks" />
              <ul className="space-y-2 text-sm text-slate-300">
                {result.risks.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-orange-400">▸</span>
                    {r}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <SectionHeader eyebrow="Start here" title="Next steps" />
              <ol className="space-y-2 text-sm text-slate-300">
                {result.nextSteps.map((s, i) => (
                  <li key={s} className="flex gap-2">
                    <span className="figure mt-0.5 shrink-0 text-gold-400">{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
            </Panel>
          </div>

          {/* ---------------- Funding ---------------- */}
          <Panel>
            <SectionHeader
              eyebrow="Matched to your project type · status computed from published deadlines"
              title="Funding & grant opportunities"
              action={
                <Pill tone="emerald">
                  {matched.filter((m) => m.status === "open" || m.status === "rolling").length} currently open
                </Pill>
              }
            />
            <div className="space-y-3">
              {matched.map((o) => (
                <div
                  key={o.id}
                  className={`rounded-lg border p-4 ${
                    o.status === "closed" ? "border-line bg-ink-850/30 opacity-75" : "border-line bg-ink-850/60"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{o.name}</p>
                      <p className="text-xs text-slate-500">{o.organisation}</p>
                    </div>
                    <span className={`pill ${STATUS_STYLE[o.status]}`}>
                      {o.status === "open" && o.deadline
                        ? `Open · ${daysUntil(o.deadline)}d left`
                        : o.status === "rolling"
                          ? "Rolling"
                          : o.status === "closed"
                            ? "Closed"
                            : "Check site"}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {o.amountMaxUsd !== null && (
                      <span className="rounded border border-emerald2-500/25 bg-emerald2-500/10 px-1.5 py-0.5 text-[10px] text-emerald2-300">
                        {o.amountMinUsd ? `${usd(o.amountMinUsd)}–` : "up to "}
                        {usd(o.amountMaxUsd)}
                      </span>
                    )}
                    {o.equityFree && (
                      <span className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        Equity-free
                      </span>
                    )}
                    {o.recurring && (
                      <span className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        Recurring
                      </span>
                    )}
                    <span className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] capitalize text-slate-400">
                      {o.kind.replace("_", " ")}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">{o.eligibility}</p>
                  {o.notes && <p className="mt-1 text-[11px] text-slate-500">{o.notes}</p>}

                  <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-line pt-2">
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300"
                    >
                      Official page <Icon name="external" className="h-3 w-3" />
                    </a>
                    <span className="text-[10px] text-slate-500">
                      {o.deadline ? `Deadline as published: ${o.deadline}` : "No published deadline"} · source:{" "}
                      {o.sourceLabel} · checked {o.checkedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-400">Verify before you rely on this. </span>
              Open/closed is computed from the deadline published at the time we checked, so it cannot
              silently go stale — but programmes move dates, reopen and add cohorts without notice.
              Always confirm on the official page. Closed entries are kept deliberately: a recurring
              fund that closed last month tells you what to prepare for next cycle.
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "gold";
}) {
  return (
    <div className="bg-ink-850 p-4">
      <p className={`figure text-lg font-bold ${tone === "gold" ? "text-gold-400" : "text-white"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-[10px] text-slate-600">{sub}</p>
    </div>
  );
}
