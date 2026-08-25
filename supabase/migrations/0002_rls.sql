-- ===========================================================================
-- Row Level Security. Public reference data is world-readable; writes are
-- restricted to the service role (ingestion / admin). User rows are private.
-- ===========================================================================

-- Public read-only reference tables
do $$
declare t text;
begin
  foreach t in array array[
    'countries','data_sources','metrics','metric_values','data_provenance',
    'studios','studio_aliases','studio_sources','games','game_platforms',
    'animation_studios','esports_teams','esports_tournaments','industry_events',
    'scores','score_components'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy "public_read_%1$s" on %1$I for select using (true);
    $f$, t);
    -- Writes: service role only (service role bypasses RLS; anon/auth denied).
  end loop;
end $$;

-- Per-user private watchlists
alter table user_watchlists enable row level security;
create policy "watchlist_owner_all" on user_watchlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Audit log: no public read
alter table audit_logs enable row level security;
-- (no select policy → only service role can read)
