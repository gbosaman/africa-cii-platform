import { monthsOfIncome } from "@/lib/scoring/hardware";
import type { OpportunityFocus } from "@/lib/data/funding-opportunities";
import {
  softwareAnnualCost,
  freeAlternativeSaving,
  HARDWARE_BY_ID,
  SOFTWARE_BY_ID,
} from "@/lib/advisor/software";
// `import type` on the other side keeps this cycle type-only, so there is no
// runtime circular import.
import {
  DISTRIBUTION_BY_ID,
  distributionEntryCost,
  distributionAnnualCost,
  worstCutPct,
  commissionedOnly,
  mismatchedChannels,
} from "@/lib/advisor/distribution";

// ---------------------------------------------------------------------------
// Studio / project advisor.
//
// This is a TRANSPARENT MODEL, not an oracle. Every figure it produces is
// arithmetic on inputs the user can see and change, combined with verified
// platform data (GDP per capita, tariffs). It deliberately does NOT use a
// language model to invent budget numbers: a plausible-sounding fabricated
// figure is exactly the failure mode this platform exists to avoid. Where a
// number rests on an assumption, the assumption is returned alongside it so the
// UI can show its work.
//
// Salary and cost assumptions are expressed as MULTIPLES OF LOCAL GDP PER
// CAPITA rather than hard-coded dollar salaries, so they scale to the country
// the user picks and stay honest about being a model.
// ---------------------------------------------------------------------------

export type TeamSize = "0-2" | "2-5" | "5-10" | "10+";
export type ProjectType = "Game" | "Animation" | "Comic" | "Gamer/Creator";
export type Dimension = "2D" | "3D";

export interface AdvisorInput {
  title: string;
  genre: string;
  teamSize: TeamSize;
  projectType: ProjectType;
  description: string;
  dimension: Dimension;
  /** ISO3 of where the studio will be based. */
  countryIso3: string;
  /** Selected software tool ids (see advisor/software.ts). */
  software: string[];
  /** Selected hardware tier id. */
  hardwareTier: string;
  /** Selected distribution channel ids (see advisor/distribution.ts). */
  distribution: string[];
  /** Whether the studio qualifies for cheaper indie licence tiers. */
  indieEligible: boolean;
}

export interface BudgetLine {
  label: string;
  amountUsd: number;
  basis: string;
}

export interface Milestone {
  phase: string;
  months: string;
  focus: string;
  outputs: string[];
}

export interface AdvisorResult {
  headcount: { min: number; max: number; typical: number };
  durationMonths: number;
  budget: {
    lines: BudgetLine[];
    totalUsd: number;
    lowUsd: number;
    highUsd: number;
  };
  milestones: Milestone[];
  fundingFocus: OpportunityFocus;
  risks: string[];
  nextSteps: string[];
  assumptions: string[];
  /** Affordability of one dev machine locally — real data, for context. */
  machineMonthsOfIncome: number | null;
  /** Licence savings available by switching to free-tool equivalents. */
  toolSaving: { savingUsd: number; swaps: { from: string; to: string; saves: number }[] };
  /** Per-seat annual licence cost for the chosen stack. */
  softwarePerSeatUsd: number;
  /** What the chosen distribution channels cost and take. */
  distributionPlan: {
    entryUsd: number;
    annualUsd: number;
    worstCutPct: number | null;
    /** Channels selected that cannot be planned for — Netflix and the like. */
    commissioned: { name: string; note: string }[];
    /** Channels that do not suit the project type. */
    mismatched: { name: string; fits: string }[];
    selfServe: string[];
  };
}

const TEAM_RANGE: Record<TeamSize, { min: number; max: number; typical: number }> = {
  "0-2": { min: 1, max: 2, typical: 2 },
  "2-5": { min: 2, max: 5, typical: 4 },
  "5-10": { min: 5, max: 10, typical: 7 },
  "10+": { min: 10, max: 20, typical: 12 },
};

/** Baseline production months before type/dimension adjustment. */
const BASE_MONTHS: Record<TeamSize, number> = {
  "0-2": 9,
  "2-5": 12,
  "5-10": 15,
  "10+": 18,
};

/** 3D is materially heavier than 2D in asset production time. */
const DIMENSION_MULTIPLIER: Record<Dimension, number> = { "2D": 1, "3D": 1.35 };

const TYPE_MULTIPLIER: Record<ProjectType, number> = {
  Game: 1,
  Animation: 1.15,
  Comic: 0.55,
  "Gamer/Creator": 0.4,
};

const FOCUS_BY_TYPE: Record<ProjectType, OpportunityFocus> = {
  Game: "games",
  Animation: "animation",
  Comic: "creative",
  "Gamer/Creator": "creative",
};

/**
 * Annual cost of one creative/technical role, modelled as a multiple of GDP per
 * capita. Skilled studio roles pay well above the national average, so the
 * multiplier is >1; it is stated openly as an assumption rather than hidden.
 */
const SALARY_MULTIPLE = 2.5;
const MIN_ANNUAL_SALARY_USD = 4_800; // floor so very low GDP/capita doesn't imply implausible pay
/** Fallback when no tier is selected. Tier prices live in advisor/software.ts. */
const DEFAULT_MACHINE_PRICE_USD = 1_500;

export function runAdvisor(
  input: AdvisorInput,
  ctx: { gdpPerCapita: number | null; tariffPct: number | null; countryName: string },
): AdvisorResult {
  const team = TEAM_RANGE[input.teamSize];
  const durationMonths = Math.round(
    BASE_MONTHS[input.teamSize] * DIMENSION_MULTIPLIER[input.dimension] * TYPE_MULTIPLIER[input.projectType],
  );

  // --- Labour ---
  const annualSalary = Math.max(
    MIN_ANNUAL_SALARY_USD,
    Math.round((ctx.gdpPerCapita ?? 0) * SALARY_MULTIPLE),
  );
  const monthlySalary = annualSalary / 12;
  const labour = Math.round(monthlySalary * team.typical * durationMonths);

  // --- Hardware (chosen spec tier, tariff-adjusted where we have a real tariff) ---
  const tier = HARDWARE_BY_ID[input.hardwareTier];
  const machineBase = tier?.priceUsd ?? DEFAULT_MACHINE_PRICE_USD;
  const perMachine = Math.round(machineBase * (1 + (ctx.tariffPct ?? 0) / 100));
  const hardware = perMachine * team.typical;

  // --- Software: computed from the ACTUAL tools selected, at published list
  // prices, pro-rated over the project duration. No placeholder guess. ---
  const softwarePerSeatUsd = softwareAnnualCost(input.software, input.indieEligible);
  const software = Math.round(softwarePerSeatUsd * team.typical * (durationMonths / 12));
  const toolSaving = freeAlternativeSaving(input.software, input.indieEligible);

  // --- Operations ---
  const operations = Math.round(labour * 0.15);

  // --- Marketing / launch ---
  const marketingRate = input.projectType === "Game" ? 0.18 : 0.12;
  const marketing = Math.round((labour + hardware) * marketingRate);

  // --- Distribution ---
  const distEntry = distributionEntryCost(input.distribution);
  const distAnnual = distributionAnnualCost(input.distribution);
  const years = Math.max(1, durationMonths / 12);
  const distTotal = Math.round(distEntry + distAnnual * years);
  const distNames = input.distribution.map((id) => DISTRIBUTION_BY_ID[id]?.name ?? id);

  const lines: BudgetLine[] = [
    {
      label: "Team",
      amountUsd: labour,
      basis: `${team.typical} people × ${durationMonths} months at a modelled $${Math.round(monthlySalary).toLocaleString()}/month`,
    },
    {
      label: "Hardware",
      amountUsd: hardware,
      basis:
        `${team.typical} × ${tier?.label ?? "workstation"} at $${machineBase.toLocaleString()}` +
        (ctx.tariffPct !== null
          ? ` +${ctx.tariffPct.toFixed(1)}% applied tariff = $${perMachine.toLocaleString()} each`
          : " (no tariff data for this country — duty not applied)"),
    },
    {
      label: "Software & tools",
      amountUsd: software,
      basis:
        input.software.length === 0
          ? "No tools selected — licence cost not modelled"
          : `$${softwarePerSeatUsd.toLocaleString()}/seat/yr for ${input.software
              .map((id) => SOFTWARE_BY_ID[id]?.name ?? id)
              .join(", ")}${input.indieEligible ? " (indie tiers applied)" : ""}`,
    },
    {
      label: "Operations",
      amountUsd: operations,
      basis: "15% of team cost — workspace, power, connectivity, admin",
    },
    {
      label: input.projectType === "Game" ? "Launch & marketing" : "Distribution & festivals",
      amountUsd: marketing,
      basis: `${Math.round(marketingRate * 100)}% of team + hardware cost`,
    },
    {
      label: "Platform access fees",
      amountUsd: distTotal,
      basis:
        input.distribution.length === 0
          ? "No distribution channels selected"
          : `${distNames.join(", ")} — $${distEntry.toLocaleString()} one-off` +
            (distAnnual > 0
              ? ` + $${distAnnual.toLocaleString()}/yr over ${years.toFixed(1)} yr`
              : "") +
            ". Published list fees only; festival submissions and console dev kits are not included because no rate is published.",
    },
  ];

  const totalUsd = lines.reduce((s, l) => s + l.amountUsd, 0);

  const milestones = buildMilestones(input, durationMonths);

  return {
    headcount: team,
    durationMonths,
    budget: {
      lines,
      totalUsd,
      // A single point estimate would imply false precision.
      lowUsd: Math.round(totalUsd * 0.7),
      highUsd: Math.round(totalUsd * 1.6),
    },
    milestones,
    fundingFocus: FOCUS_BY_TYPE[input.projectType],
    risks: buildRisks(input, ctx),
    nextSteps: buildNextSteps(input),
    assumptions: [
      `Salaries modelled at ${SALARY_MULTIPLE}× ${ctx.countryName}'s GDP per capita (floor $${MIN_ANNUAL_SALARY_USD.toLocaleString()}/yr). GDP per capita is a national average, not studio pay — replace with real local salary data when you have it.`,
      `Hardware modelled as ${tier?.label ?? "a workstation"} at $${machineBase.toLocaleString()} before duty (${tier?.spec ?? "unspecified spec"}). The platform holds no African retail hardware prices — no free licensable source publishes them — so this is a starting assumption to replace with a real quote.`,
      ctx.tariffPct !== null
        ? `Hardware duty applied using ${ctx.countryName}'s weighted-mean applied tariff (${ctx.tariffPct.toFixed(1)}%) across all products — the specific computer tariff line may differ, and VAT, freight and clearing are excluded.`
        : `No tariff data available for ${ctx.countryName}, so no import duty was applied — the real landed cost is likely higher.`,
      `Duration derives from team size, adjusted ×${DIMENSION_MULTIPLIER[input.dimension]} for ${input.dimension} and ×${TYPE_MULTIPLIER[input.projectType]} for ${input.projectType}.`,
      `The range shown is −30% / +60% around the model. Creative projects overrun far more often than they underrun, which is why the range is asymmetric.`,
    ],
    distributionPlan: {
      entryUsd: distEntry,
      annualUsd: distAnnual,
      worstCutPct: worstCutPct(input.distribution),
      commissioned: commissionedOnly(input.distribution).map((c) => ({
        name: c.name,
        note: c.note,
      })),
      mismatched: mismatchedChannels(input.distribution, input.projectType).map((c) => ({
        name: c.name,
        fits: c.fitsTypes.join(", "),
      })),
      selfServe: input.distribution
        .map((id) => DISTRIBUTION_BY_ID[id])
        .filter((c) => c?.access === "self_serve")
        .map((c) => c!.name),
    },
    machineMonthsOfIncome: monthsOfIncome(perMachine, ctx.gdpPerCapita),
    toolSaving,
    softwarePerSeatUsd,
  };
}

function buildMilestones(input: AdvisorInput, total: number): Milestone[] {
  const pct = (p: number) => Math.max(1, Math.round(total * p));
  const isGame = input.projectType === "Game";
  const preProdEnd = pct(0.2);
  const vertEnd = preProdEnd + pct(0.15);
  const prodEnd = vertEnd + pct(0.45);

  return [
    {
      phase: "Pre-production",
      months: `1–${preProdEnd}`,
      focus: "Lock the concept, scope and pipeline before spending on production.",
      outputs: [
        `Design document for "${input.title || "the project"}"`,
        `${input.dimension} art direction and style test`,
        "Tools/engine decision and pipeline setup",
        "Budget and schedule signed off",
      ],
    },
    {
      phase: isGame ? "Vertical slice" : "Pilot / teaser",
      months: `${preProdEnd + 1}–${vertEnd}`,
      focus: "Build one polished, representative section — this is your fundraising artefact.",
      outputs: isGame
        ? ["Playable vertical slice", "Capture footage & GIFs", "Steam/store page draft", "Pitch deck"]
        : ["Pilot or teaser sequence", "Character & world bible", "Pitch deck for markets"],
    },
    {
      phase: "Production",
      months: `${vertEnd + 1}–${prodEnd}`,
      focus: "Scale asset and content production against the locked pipeline.",
      outputs: ["Full content build", "Milestone reviews", "Playtests / screenings", "Community building"],
    },
    {
      phase: isGame ? "Polish & launch" : "Post & distribution",
      months: `${prodEnd + 1}–${total}`,
      focus: isGame
        ? "Stabilise, localise, and run the launch beat."
        : "Finish post, then work festivals, broadcasters and platforms.",
      outputs: isGame
        ? ["Bug-fix and optimisation pass", "Localisation", "Store launch", "Post-launch support plan"]
        : ["Final picture and sound", "Festival submissions", "Distribution conversations"],
    },
  ];
}

function buildRisks(input: AdvisorInput, ctx: { gdpPerCapita: number | null; tariffPct: number | null; countryName: string }): string[] {
  const risks: string[] = [];

  // Distribution risks first — a plan that assumes an unreachable channel is
  // wrong at the foundation, not at the margin.
  for (const c of commissionedOnly(input.distribution)) {
    risks.push(
      `${c.name} is not a channel you can choose. It commissions or licenses and does not accept unsolicited submissions, so treating it as a release plan will leave you with no route to an audience. ${c.note}`,
    );
  }
  for (const c of mismatchedChannels(input.distribution, input.projectType)) {
    risks.push(
      `${c.name} is a poor fit for a ${input.projectType} project — it suits ${c.fitsTypes.join(", ")}. Either the channel or the project framing needs to change.`,
    );
  }
  const cut = worstCutPct(input.distribution);
  if (cut !== null && cut >= 30) {
    risks.push(
      `Your steepest platform cut is ${cut}%. Model revenue net of it: at ${cut}% you keep $${(100 - cut).toFixed(0)} of every $100 of gross, before tax, refunds, payment fees or user acquisition. Plans that budget against gross revenue overstate runway by roughly a third.`,
    );
  }
  if (input.distribution.length === 0) {
    risks.push(
      "No distribution channel selected. How the work reaches an audience decides the budget, the build targets and the schedule — decide it now rather than after production, when changing it is expensive.",
    );
  }
  if (input.distribution.includes("console") && input.teamSize === "0-2") {
    risks.push(
      "Console platforms gate on approval and generally favour a shipped track record. At 1–2 people with no released title, plan console as a second release after you have shipped somewhere self-serve.",
    );
  }

  if (input.dimension === "3D") {
    risks.push(
      "3D asset production is the most common source of overrun. Lock the art pipeline in pre-production and consider outsourcing overflow rather than hiring for a peak you cannot sustain.",
    );
  }
  if (input.teamSize === "0-2") {
    risks.push(
      "At 1–2 people the schedule is one illness away from slipping. Scope to something you could finish at half your planned velocity.",
    );
  }
  if (input.teamSize === "10+") {
    risks.push(
      "Above ten people, coordination cost is real: expect to spend meaningful time on production management, and budget for it explicitly.",
    );
  }
  if ((ctx.tariffPct ?? 0) > 10) {
    risks.push(
      `${ctx.countryName}'s applied tariff (${ctx.tariffPct!.toFixed(1)}%) materially inflates hardware cost. Price landed cost, not sticker price, and get written customs quotes before committing.`,
    );
  }
  if (ctx.gdpPerCapita !== null && ctx.gdpPerCapita < 2000) {
    risks.push(
      "Hardware costs many months of average local income here, so equipment is a genuine barrier — budget for it as capital expenditure and consider grant funding that explicitly covers equipment.",
    );
  }
  risks.push(
    "Currency movement against the dollar affects both hardware and any dollar-denominated tooling. Hold a buffer rather than assuming today's rate.",
  );
  if (input.projectType === "Game") {
    risks.push(
      "Discovery, not development, is where most indie games fail commercially. Start audience building at vertical-slice stage, not at launch.",
    );
  }
  return risks;
}

function buildNextSteps(input: AdvisorInput): string[] {
  const isGame = input.projectType === "Game";
  const selfServe = input.distribution
    .map((id) => DISTRIBUTION_BY_ID[id])
    .filter((c) => c?.access === "self_serve");
  const gated = input.distribution
    .map((id) => DISTRIBUTION_BY_ID[id])
    .filter((c) => c?.access === "gated");

  const distSteps: string[] = [];
  if (selfServe.length > 0) {
    distSteps.push(
      `Open your ${selfServe.map((c) => c!.name).join(" and ")} developer account${selfServe.length > 1 ? "s" : ""} now, before you need ${selfServe.length > 1 ? "them" : "it"}. Verification and payout setup take longer than the fee suggests, and a store page you can point funders at is worth more than the listing itself.`,
    );
  }
  if (gated.length > 0) {
    distSteps.push(
      `${gated.map((c) => c!.name).join(" and ")} gate on approval or curation. Find the current submission window and requirements before you build to them — categories open and close, and the terms change.`,
    );
  }
  if (commissionedOnly(input.distribution).length > 0) {
    distSteps.push(
      "For the commissioned platforms you selected, the realistic route is a co-production with a studio that already holds the relationship. Identify three such studios on the animation competitive map and approach them with a finished pilot, not a pitch.",
    );
  }

  return [
    ...distSteps,
    "Write a one-page scope statement: what is in, what is explicitly out, and what you would cut first under pressure.",
    isGame
      ? "Build the vertical slice before raising. Nearly every fund below asks to see something playable."
      : "Build the pilot or teaser before pitching. Markets and broadcasters buy on the strength of the reel.",
    "Register the entity and separate business banking early — most grants require a registered studio to disburse funds.",
    "Track your actual hours for one month, then re-run this model with your real numbers instead of its assumptions.",
    "Prepare the standard funding artefacts once and reuse them: pitch deck, budget, schedule, team bios, and a 90-second trailer.",
  ];
}
