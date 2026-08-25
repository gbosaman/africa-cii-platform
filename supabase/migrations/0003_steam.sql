-- ===========================================================================
-- Steam intelligence: one row per observation, so history accumulates.
--
-- Review scores move. Snapshotting them with `observed_at` in the key means a
-- re-run adds a new point rather than overwriting the last one, which is what
-- makes trend analysis possible later. Same discipline as metric_values.
-- ===========================================================================

create table if not exists steam_snapshots (
  id              uuid primary key default uuid_generate_v4(),
  game_id         text references games(id) on delete cascade,
  app_id          bigint not null,
  name            text,
  release_date    text,
  developers      text[],
  publishers      text[],
  genres          text[],
  platforms       text[],
  is_free         boolean,
  price           text,
  review_desc     text,
  review_score    int,
  total_positive  int,
  total_negative  int,
  total_reviews   int,
  positive_pct    numeric,
  observed_at     timestamptz not null default now(),
  unique (app_id, observed_at)
);

create index if not exists idx_steam_game on steam_snapshots(game_id);
create index if not exists idx_steam_app on steam_snapshots(app_id);
create index if not exists idx_steam_observed on steam_snapshots(observed_at desc);

-- Latest observation per app, for the UI to read cheaply.
create or replace view steam_latest as
select distinct on (app_id) *
from steam_snapshots
order by app_id, observed_at desc;

alter table steam_snapshots enable row level security;
create policy "public_read_steam_snapshots" on steam_snapshots for select using (true);
