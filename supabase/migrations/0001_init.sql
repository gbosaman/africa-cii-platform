-- ===========================================================================
-- Africa Creative Industries Intelligence Platform — initial schema
-- Postgres / Supabase. Designed so Phases 2–4 add rows, never restructure.
--
-- Principles enforced at the schema level:
--   • Every metric value carries provenance (data_provenance).
--   • ZERO ≠ UNKNOWN: metric_values.value is nullable; NULL means unknown.
--   • ISO 3166-1 alpha-3 country codes everywhere.
--   • History is preserved (effective_date, retrieved_at) — never overwritten.
-- ===========================================================================

create extension if not exists "uuid-ossp";

-- ── Geography ──────────────────────────────────────────────────────────────
create table if not exists countries (
  iso3            char(3) primary key,
  iso2            char(2) not null,
  name            text not null,
  region          text not null,
  capital         text,
  created_at      timestamptz not null default now()
);

-- ── Source registry & provenance ───────────────────────────────────────────
create table if not exists data_sources (
  id                    text primary key,
  source_name           text not null,
  organization          text not null,
  source_type           text not null,
  api_url               text,
  website_url           text,
  documentation_url     text,
  license               text not null,
  update_frequency      text not null,
  reliability_score     int  not null check (reliability_score between 0 and 100),
  verification_status   text not null default 'needs_verification',
  last_successful_fetch timestamptz,
  last_failed_fetch     timestamptz,
  notes                 text
);

create table if not exists metrics (
  id                text primary key,
  label             text not null,
  unit              text not null,
  category          text not null,
  higher_is_better  boolean not null default true,
  description       text,
  primary_source_id text references data_sources(id)
);

-- One observation. NULL value === genuinely unknown (never store 0 for unknown).
create table if not exists metric_values (
  id            uuid primary key default uuid_generate_v4(),
  metric_id     text not null references metrics(id),
  country_iso3  char(3) not null references countries(iso3),
  value         double precision,               -- nullable on purpose
  unit          text not null,
  year          int,
  kind          text not null default 'verified', -- verified | estimate | modeled
  confidence    text not null default 'UNVERIFIED',
  source_id     text references data_sources(id),
  effective_date date,
  retrieved_at  timestamptz not null default now(),
  source_version text,
  unique (metric_id, country_iso3, year, source_id)
);
create index if not exists idx_mv_metric on metric_values(metric_id);
create index if not exists idx_mv_country on metric_values(country_iso3);
create index if not exists idx_mv_year on metric_values(year);

create table if not exists data_provenance (
  id               uuid primary key default uuid_generate_v4(),
  metric_value_id  uuid references metric_values(id) on delete cascade,
  source_id        text references data_sources(id),
  source_url       text,
  retrieved_at     timestamptz,
  publication_date date,
  dataset_name     text,
  dataset_version  text,
  original_value   text,
  normalized_value double precision,
  methodology      text,
  confidence_score numeric
);

-- ── Studios & games (Phase 2) ──────────────────────────────────────────────
create table if not exists studios (
  id            text primary key,
  name          text not null,
  country_iso3  char(3) references countries(iso3),
  city          text,
  founded_year  int,
  website       text,
  team_size     int,
  status        text not null default 'unknown',
  verified      boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_studios_country on studios(country_iso3);

create table if not exists studio_aliases (
  studio_id text references studios(id) on delete cascade,
  alias     text not null,
  primary key (studio_id, alias)
);

create table if not exists studio_sources (
  studio_id text references studios(id) on delete cascade,
  url       text not null,
  label     text,
  primary key (studio_id, url)
);

create table if not exists games (
  id            text primary key,
  title         text not null,
  studio_id     text references studios(id),
  country_iso3  char(3) references countries(iso3),
  release_year  int,
  engine        text,
  ip_type       text,
  status        text not null default 'unknown',
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_games_country on games(country_iso3);
create index if not exists idx_games_studio on games(studio_id);

create table if not exists game_platforms (
  game_id  text references games(id) on delete cascade,
  platform text not null,
  store_url text,
  primary key (game_id, platform)
);

-- ── Animation & esports (Phase 3) ──────────────────────────────────────────
create table if not exists animation_studios (
  id           text primary key,
  name         text not null,
  country_iso3 char(3) references countries(iso3),
  city         text,
  website      text,
  verified     boolean not null default false
);

create table if not exists esports_teams (
  id           text primary key,
  name         text not null,
  country_iso3 char(3) references countries(iso3),
  verified     boolean not null default false
);

create table if not exists esports_tournaments (
  id           text primary key,
  name         text not null,
  game         text,
  country_iso3 char(3) references countries(iso3),
  prize_pool_usd numeric,
  start_date   date,
  data_tier    text not null default 'community', -- official | verified | community
  source_url   text
);

-- ── Events, scores, watchlists, audit ──────────────────────────────────────
create table if not exists industry_events (
  id           uuid primary key default uuid_generate_v4(),
  event_type   text not null,
  entity       text not null,
  country_iso3 char(3) references countries(iso3),
  event_date   date not null,
  description  text,
  source_url   text,
  importance   text not null default 'low',
  verified     boolean not null default false
);

create table if not exists scores (
  id            uuid primary key default uuid_generate_v4(),
  entity_type   text not null,           -- country | studio
  entity_id     text not null,
  mode          text not null,
  total         numeric not null,
  coverage      numeric not null,
  confidence    text not null,
  computed_at   timestamptz not null default now(),
  unique (entity_type, entity_id, mode, computed_at)
);

create table if not exists score_components (
  score_id  uuid references scores(id) on delete cascade,
  dimension text not null,
  score     numeric,
  weight    numeric not null,
  coverage  numeric not null,
  primary key (score_id, dimension)
);

create table if not exists user_watchlists (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null,
  entity_type text not null,
  entity_id  text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);

create table if not exists audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  actor       text,
  action      text not null,
  entity      text,
  previous    jsonb,
  next        jsonb,
  reason      text,
  created_at  timestamptz not null default now()
);
