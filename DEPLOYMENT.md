# Deployment — GitHub → Supabase → Vercel

The app deploys with **zero external data setup** (World Bank is keyless). Supabase is optional but
recommended for persistence, auth, watchlists and the admin console.

## 1. GitHub

```bash
git init && git add . && git commit -m "Initial platform"
gh repo create africa-cii-platform --public --source=. --push
```

## 2. Supabase (optional but recommended)

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. In the SQL editor, run migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
3. Copy **Project URL**, **anon key**, **service-role key** from Project Settings → API.

## 3. Environment variables

Copy `.env.example` → `.env.local` (local) and add the same in Vercel (Project → Settings → Env):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-only — never expose to the client
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

## 4. GitHub Actions (scheduled ingestion)

Add repo secrets `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The workflows are:
- `.github/workflows/ci.yml` — typecheck, test, build on every push/PR.
- `.github/workflows/ingest-worldbank.yml` — monthly (and manual) World Bank ingestion.

Populate a fresh database and run ingestion locally any time:

```bash
node --env-file=.env.local --import tsx scripts/seed-entities.ts    # studios, games, animation
node --env-file=.env.local --import tsx scripts/ingest-worldbank.ts # metrics + computed scores
```

(Without Supabase env both do a dry run and print what they *would* upsert.) Once populated, the
app reads **DB-first** — `GET /api/health` reports `"dataSource":"db"` and the Topbar shows
"Supabase · Persisted". If the DB is empty or unreachable, it transparently falls back to live
World Bank, then to N/A — never crashing.

## 5. Vercel

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (auto-detected). Add the env vars from step 3.
3. Deploy.

## 6. Verify

- Dashboard loads with live scores and the "World Bank · Live" status pill is green.
- A country page (e.g. `/countries/nga`) shows source-traced metrics.
- Clicking any figure opens the lineage drawer with history + CSV/JSON export.
- `npm run test` passes; CI is green.

## Scheduled workflows

| Workflow | Trigger | What it does | Can it fail the build? |
|---|---|---|---|
| `ci.yml` | every push / PR | typecheck, test, build | **Yes** — it guards the code |
| `ingest-worldbank.yml` | monthly (1st, 03:00 UTC) + manual | refreshes `metric_values` and computed scores in Supabase | Yes, on ingestion error |
| `link-health.yml` | monthly (15th, 04:00 UTC) + manual | sweeps all ~180 studio websites, regenerates `link-health.ts`, **opens a PR** | **No** — see below |

### Why the link-health sweep is deliberately non-blocking

A studio letting its domain lapse is not a regression in this repository, so the sweep never fails
CI on broken links — it records them as data. It also **does not run on pushes or PRs**: 180+
external requests per commit would be rude to those sites and hopelessly flaky.

Three safeguards make the automation trustworthy:

1. **Patient re-check.** Every failure is retried with a longer timeout before being recorded.
   In the first production run this filtered out **8 of 19** apparent failures — including studios
   verified working by hand minutes earlier.
2. **Sanity gate.** If more than 40% of sites fail, the script assumes the *runner* is broken
   (restricted egress) rather than the web, exits non-zero, and **refuses to write** the file — so
   a network blip can never commit garbage.
3. **Human in the loop.** Changes arrive as a **pull request**, not a push to `main`. Recording a
   failure puts a visible "unreachable" badge on that studio, and asserting an organisation is dead
   deserves a glance. Typecheck and tests run on the regenerated data *before* the PR is opened.

Run it locally any time:

```bash
npm run health:links            # sweep and rewrite the module
npm run health:links -- --check # report only, never write
```

Reading the results: **DNS failure** usually means the record should be retired or re-sourced; an
**expired certificate** usually means the studio still exists but needs a new URL (GameDevMap gave
us exactly that correction for Kiro'o Games).
