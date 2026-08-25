# Architecture

## Data flow

```
External sources (World Bank now; Steam/IGDB/OpenAlex/Liquipedia later)
      │
      ▼
Source adapters            src/lib/data-sources/*.ts   (fetch · validate · normalise · provenance)
      │
      ▼
Snapshot provider          src/lib/data/snapshot.ts    (React cache + fetch revalidate; Supabase-swappable)
      │
      ▼
Scoring engine             src/lib/scoring/*           (normalise → dimensions → weighted composite)
      │
      ▼
Intelligence layer         src/lib/data/intelligence.ts (scores, rankings, map layers, counts)
      │
      ▼
Server Components (pages) ──renders──► Client leaves (map, drawer, tables, compare, explorer)
```

The dashboard is **not** coupled to a single API. Each source is an isolated adapter that outputs
the shared `MetricValue` shape.

**Read priority (implemented in `snapshot.ts`):**
`1. Supabase persisted rows → 2. live World Bank → 3. empty (N/A)`. When Supabase is configured and
populated, `repository.ts` serves persisted `metric_values`; otherwise the live adapter runs;
otherwise pages render N/A. Nothing downstream (scoring, pages) knows which source served the data —
the shapes are identical. `GET /api/health` reports the active `dataSource`. The pure row→snapshot
transform lives in `repository-transform.ts` and is unit-tested.

## Layering

- **`src/lib/types.ts`** — framework-agnostic domain types shared by DB, adapters, scoring, UI.
- **`src/lib/data/`** — seeds (countries, metrics, studios, centroids) + snapshot/intelligence providers.
- **`src/lib/data-sources/`** — one adapter per external source + the source registry.
- **`src/lib/scoring/`** — `normalize` (pure math), `weights` (config), `market`/`studio` (engines).
- **`src/components/`** — `layout`, `ui` primitives, `metric` (drawer + clickable number),
  `map`, `charts`, and per-feature views (`rankings`, `compare`, `explorer`, `investors`).
- **`src/app/`** — App Router pages + `/api` routes.

## Rendering strategy

- Country pages: `generateStaticParams` → SSG + `revalidate` (ISR, daily).
- Dashboard / explorer / markets: static with daily revalidate.
- Rankings / compare: dynamic (read search params) but data is cache-deduped per request.
- Metric drawer history: `/api/metric/[metricId]` server route, `fetch` revalidated daily.

## Responsive / mobile

Verified with no horizontal page overflow at **320px, 375px, 768px and 1280px**.

- **Panels are `min-w-0`.** Grid/flex children default to `min-width:auto`, which stops them
  shrinking below their content's `min-content` width — the single most common cause of mobile
  overflow. `Panel` sets `min-w-0` so internal `truncate`/wrapping takes over instead.
- **Tables:** directory tables (`/countries`, `/games`) render as **cards below `md`**; comparison
  tables (`/compare`, `/studios/compare`, funding) keep a horizontal scroller inside their own
  `overflow-x-auto` container, since comparing columns is the point.
- **Map:** always fits the viewport width (horizontal panning inside a vertically-scrolling page is
  awkward on touch). Each node carries an oversized transparent hit circle, and a tap **selects**
  the node — showing a readout with an explicit "Open →" link — rather than navigating immediately,
  so mis-taps are harmless. The adjacent ranked list is the precise interaction path.
- **Tap targets:** nav rows are ≥44px on touch (relaxed on `lg` pointers); the drawer toggle is 44px.
- **Type scale:** an `xs` breakpoint (420px) steps the hero and section headings down on narrow
  phones.

## Resilience

`getSnapshot()` catches adapter failures and degrades to an empty snapshot (UI shows N/A + a
banner) rather than crashing. Individual World Bank indicator failures are isolated so one bad
series never blanks the board. Cached/persisted values are never overwritten on fetch failure.

## Extending to Phases 2–4

1. Add an adapter in `src/lib/data-sources/` returning `MetricValue[]` or entity rows.
2. Register the source in `registry.ts`.
3. For scored metrics: add the metric def + map it into a dimension in `scoring/weights.ts`.
4. Persist via an ingestion script + a scheduled workflow (mirror `ingest-worldbank`).
The scoring engine, provenance drawer and UI slots already handle the new data.
