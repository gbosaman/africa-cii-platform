# Methodology

The rendered, always-current version lives at **`/methodology`**. This file is the durable summary.

## Definitions

- **African studio** — a game/animation studio headquartered or primarily operating in an African
  country, sourced to its official web presence.
- **African game** — a game whose primary developer is an African studio (or substantially
  developed in Africa).
- **Verified** — traceable to an official API, a government/international dataset, or an entity's own
  official site.
- **Estimate** — a modelled value, always labelled ESTIMATE with methodology, source, date and
  confidence. Never shown as fact.
- **ZERO ≠ UNKNOWN** — missing data is `NULL` → rendered **N/A**. Zero appears only when a source
  reports zero.
- **Coverage** — share of a score's inputs that have verified data; low coverage lowers confidence,
  never silently zeroes a score.

## What counts as an achievement / event

Structured, source-linked facts only: studio founded, game released, funding announced, publisher
deal, award won, tournament held, acquisition, partnership. Each links back to its source and
carries a verification flag. The platform is **not** a news site — it stores structured events.

## Update cadence

- Macro / demographic (World Bank): annual publication; ingested monthly, revalidated daily.
- Games / esports (Phase 2–3): weekly/daily per source volatility.
- History is preserved with `effective_date` + `retrieved_at`; values are never overwritten.

## Scoring

See [SCORING.md](SCORING.md). Weights are configurable per ranking mode and renormalise over
available data. Highest is **not** automatically "best" — each mode optimises for a different
decision, and the UI states this.

## Studio Advisor (`/advisor`)

Takes a project brief — title, genre, team size, project type, description, 2D/3D and country — and
returns a phased production plan, a costed budget, risks, next steps and matched funding calls.

### Why it is a model, not a language model

The advisor is deliberately **deterministic**. A language model asked for a game budget will produce
a confident, plausible, unsourced number — precisely the failure mode this platform exists to
prevent. Instead every figure is arithmetic on assumptions the user can see and change, anchored to
verified data:

| Input | Source |
|---|---|
| Salary basis | `NY.GDP.PCAP.CD` × a stated multiplier, with a floor |
| Hardware duty | the country's real applied tariff (`TM.TAX.MRCH.WM.AR.ZS`) |
| Affordability context | months-of-income maths from the hardware module |
| Duration | team size × 2D/3D multiplier × project-type multiplier |

Assumptions are **returned with the result** and rendered on the page, so the user can see and
override the model rather than trust it. The range is asymmetric (−30% / +60%) because creative
projects overrun far more often than they underrun.

Sanity check across scenarios: solo 2D comic in Nigeria ≈ $9.3k / 5 months; 4-person 2D game in
Kenya ≈ $38k / 12 months; 7-person 3D game in South Africa ≈ $276k / 20 months; 12-person 3D
animation series in Egypt ≈ $350k / 28 months.

### Funding opportunities — verified, and status is computed

Every programme in `src/lib/data/funding-opportunities.ts` was researched and its **official URL
verified to resolve**. Two URLs assumed at first draft (`play.google.com/console/about/indiegamesfund/`
and `supercell.com/en/developer-grants/`) returned **404** and were replaced with the real
announcement pages — the same guess-versus-verify lesson as the store IDs.

**Open/closed is COMPUTED from the published deadline, never stored.** A stored `open: true` flag
rots silently; a computed one cannot. Programmes with no published deadline are `rolling` or
`unknown` rather than assigned a guessed date, and every entry carries its source label and the date
we checked. As of 2026-08-25 both flagship game funds (Google Play Indie Games Fund Africa, deadline
2026-07-31; Supercell Developer Grants, deadline 2026-08-09) compute as **closed** — which is itself
useful, since both are worth preparing for next cycle.

Closed entries are kept deliberately: a recurring fund that shut last month tells a founder what to
build toward. The UI always instructs users to confirm on the official page before relying on dates.
