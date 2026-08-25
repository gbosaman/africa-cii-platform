# Africa Creative Industries Intelligence Platform

**Verified, decision-ready intelligence on Africa's games, esports and animation economy.**

Not another African-statistics website. This platform turns fragmented, hard-to-compare data
into a single scored framework that answers the questions that actually drive decisions:

> Where should I **build**, **invest**, **hire**, **publish**? Which **studios** are strongest?
> Where is the **audience**, the **talent**, the **money**, the **infrastructure**?

Think Bloomberg Terminal × Statista × PitchBook — but purpose-built for African games, esports and
animation.

---

## Guiding principles (enforced in code, not just docs)

| Principle | How it's enforced |
|---|---|
| **No fabricated data** | Phase-1 figures are live from the World Bank Open Data API. Studio/game facts are cited to official sites. Unknowns are `null`. |
| **ZERO ≠ UNKNOWN** | Missing data renders **N/A**, never `0`. Enforced by the type system (`value: number \| null`) and `MetricNumber`. |
| **Every number is traceable** | Any figure on the site is clickable → a lineage drawer with source, dataset, indicator code, license, methodology, full history, and CSV/JSON export. |
| **Estimates are labelled** | The one proxy view (gaming-market readiness) is explicitly labelled and explains why. Paid-only data (e.g. gamer counts) is excluded from facts. |
| **Transparent scoring** | Every score exposes its weighted breakdown, data coverage %, and a confidence tier. |
| **Runs with zero setup** | No API keys required. Supabase is optional and only adds persistence/auth/admin. |

---

## What's built (Phase 1 MVP)

- **54 African countries** seeded with ISO 3166-1 codes, regions, capitals.
- **Live World Bank ingestion** — 14 macro / demographic / connectivity indicators, keyless.
- **Market Attractiveness score** + 6 alternate ranking modes (distribution, production, hiring,
  investment, esports, animation) with configurable, renormalising weights.
- **Interactive dashboard** with a schematic Africa network map (choose the scored layer).
- **Country intelligence pages** (all 54, statically generated + ISR) with transparent breakdowns.
- **Rankings**, **Compare** (up to 4 countries), **Data Explorer** (filter/sort/chart/export),
  **Investor Mode** (objective → shortlist with rationale).
- **Signature interaction:** click any figure → source-lineage drawer with history + downloads.
- **Studios & games** directory (verified, source-cited seed) with a transparent Studio Strength
  scorecard that scores only what's measurable and lists honest data gaps.
- **Sources** registry and **Methodology** (definitions, scoring engine, mode-weight matrix,
  data-availability matrix).
- Supabase schema + RLS, ingestion job, GitHub Actions (CI + scheduled ingest), tests.

## Built (Phase 2 — shipped)

- **Live Steam integration** (keyless): real game metadata + aggregate review score & counts,
  attributed to Valve, cached daily. Example: Broforce (Free Lives, 🇿🇦) renders live as
  "Overwhelmingly Positive", 96%+, 60k+ reviews.
- Expanded **source-cited studio & game seed** with Steam-verified South African studios
  (Free Lives, QCF Design) alongside Kiro'o Games, Nyamakop, Leti Arts and more.
- **Game detail pages** with a live Steam panel; **games list** ranked with live review signals.
- **Studio comparison engine** (`/studios/compare`) — side-by-side strength dimensions with
  data-derived advantages and honest gaps.
- **Achievement layer** on games (verified milestones + data-derived platform facts).
- **IGDB adapter interface** (`src/lib/data-sources/igdb.ts`) — gated on free Twitch OAuth keys;
  no-ops rather than fabricating when unconfigured.

## Built (Phase 3 — shipped)

- **Animation intelligence** — source-cited studios (Triggerfish 🇿🇦, Kugali 🇳🇬, Buni Media 🇰🇪, …)
  with **IP-crossover** flags (animation↔game), international partners, detail pages, and an
  animation-market country ranking.
- **Esports intelligence** — org directory with the **OFFICIAL / VERIFIED / COMMUNITY** provenance
  tiers enforced, an esports-**readiness** country ranking (clearly labelled — not activity), and
  detail pages. Prize pools stay N/A (never estimated).
- **Industry signal wired into scoring** — verified studio, animation-studio and esports-org counts
  now feed the `industry_maturity` and `esports` scoring dimensions, so the production / animation /
  investment / esports ranking modes carry real signal. Absence of a record is treated as
  **unknown (null), never a false zero**.
- **Liquipedia adapter interface** (`src/lib/data-sources/liquipedia.ts`) — opt-in (`ENABLE_LIQUIPEDIA=1`),
  respects the required User-Agent + rate limits, labels everything COMMUNITY, and returns nothing
  rather than fabricating.

## Built (Phase 4 — shipped)

- **Trends & momentum** (`/trends`) — real momentum scoring from verified World Bank GDP &
  population growth, **emerging-market** detection (high momentum from a below-median base), and a
  **source-linked industry-events feed** derived from verified records (foundings, releases,
  disclosed funding, milestones, partnerships).
- **Automated insights** — plain-language statements generated only when the data supports them
  (top market, largest-audience-vs-best-infrastructure, most studios, fastest growth), shown on the
  dashboard and trends page, each click-through to its source.
- **Investment layer** (`/investors`) — **disclosed-only** funding rounds (never estimated;
  undisclosed = N/A), lead investors, source links, plus a pan-African accelerator directory.
- **Watchlist & alerts** — a real ★ Follow feature (localStorage today; syncs to the
  `user_watchlists` table when Supabase Auth is added) with a `/watchlist` page, plus the alert-rule
  model wired to the events feed as its signal source.

**All four phases are now implemented.** The platform spans macro → market → studio → game →
animation → esports → investment → trends, with persistence and a gated admin console.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 — works immediately, no keys
```

```bash
npm run build      # production build (prerenders 54 country pages from live data)
npm run typecheck  # strict TypeScript
npm run test       # scoring / normalization / missing-data tests
```

No `.env` is required for local dev. To enable persistence, auth and the admin console, copy
`.env.example` → `.env.local` and fill in Supabase values.

---

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS · Supabase (Postgres +
Auth + RLS) · GitHub Actions · Vercel. Charts are dependency-free inline SVG. All free-tier.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design & data flow
- [DATA_SOURCES.md](DATA_SOURCES.md) — sources, licenses, the data-availability matrix
- [SCORING.md](SCORING.md) — the scoring & normalization method
- [METHODOLOGY.md](METHODOLOGY.md) — definitions & what "verified" means
- [DATABASE.md](DATABASE.md) — schema & RLS
- [API.md](API.md) — internal API routes
- [DEPLOYMENT.md](DEPLOYMENT.md) — GitHub → Supabase → Vercel, step by step
- [ADMIN.md](ADMIN.md) — the gated admin console (auth, moderation, audit)
- [CONTRIBUTING.md](CONTRIBUTING.md) — adding sources, studios, games (with provenance)

## License & attribution

Code: MIT. Data: each source retains its own license (see `/sources`). World Bank data is
CC BY-4.0. Always attribute sources when redistributing figures.
