# Contributing

The platform's value is trust. **Every contribution must carry provenance.** Unsourced data is not
accepted — leave a field `null` (renders N/A) rather than guessing.

## Add a data source

1. Create an adapter in `src/lib/data-sources/<source>.ts` that outputs the shared `MetricValue`
   shape (with `sourceId`, `sourceUrl`, `confidence`, `year`).
2. Register it in `src/lib/data-sources/registry.ts` (license, reliability, cadence, verification).
3. Respect `robots.txt`, API terms, rate limits, and licenses. No aggressive scraping.

## Add a scored metric

1. Add the metric definition (with its source-specific indicator) to `src/lib/data/metrics.ts`.
2. Map it into a dimension in `src/lib/scoring/weights.ts`.
3. Add/extend a test in `tests/scoring.test.ts`. **Changing scoring must not silently break
   rankings** — tests guard this.

## Add a studio / game / animation studio

Edit the seed in `src/lib/data/studios.ts` **only with facts you can cite to an official source**
(add the URL to `sources`). Unknown fields stay `null`. Prefer the admin console (Phase 2) which
records provenance and writes to Supabase with an audit-log entry.

## Country codes

Always ISO 3166-1 alpha-3. Never invent country names or geographic granularity beyond what the
source supports.

## Before opening a PR

```bash
npm run typecheck && npm run test && npm run build
```
All three must pass. Describe the source and license of any new data in the PR.
