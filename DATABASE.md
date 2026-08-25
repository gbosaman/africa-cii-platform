# Database

Supabase Postgres. Migrations in `supabase/migrations/`. The app runs without a database (built-in
providers); the schema adds persistence, history, auth-scoped watchlists and the admin console.

## Core tables

- **countries** — ISO3 PK, ISO2, name, region, capital.
- **data_sources** — the provenance registry (reliability, license, verification, fetch timestamps).
- **metrics** — metric catalogue (category, unit, direction, primary source).
- **metric_values** — one observation. `value` is **nullable** (NULL = unknown; never store 0 for
  unknown). Unique on `(metric_id, country_iso3, year, source_id)` so re-runs preserve history.
- **data_provenance** — per-value lineage (source URL, dataset version, original vs normalized
  value, methodology, confidence).

## Entities (Phase 2–4)

`studios`, `studio_aliases`, `studio_sources`, `games`, `game_platforms`, `animation_studios`,
`esports_teams`, `esports_tournaments` (with a `data_tier`: official/verified/community).

## Analytics & governance

`scores` + `score_components` (persisted computed scores), `industry_events`, `user_watchlists`
(RLS: owner-only), `audit_logs` (who changed what, previous/next JSON, reason — service-role read
only).

## RLS (`0002_rls.sql`)

Reference/analytics tables are **public read**; all writes go through the **service role**
(ingestion/admin), which bypasses RLS. Watchlists are private to `auth.uid()`. Audit logs have no
public select policy. The service-role key is server-only and never shipped to the client.

## Indexes

`metric_values(metric_id)`, `(country_iso3)`, `(year)`; `studios(country_iso3)`;
`games(country_iso3)`, `(studio_id)`.
