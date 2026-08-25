# Admin console

A gated operations console at **`/admin`** for moderation, source management, data-quality review,
ingestion and governance.

## Access & security

- **Gate:** a single server-side passphrase, `ADMIN_ACCESS_KEY`. When unset, the console is
  **locked** — no write action is ever exposed.
- The session cookie stores a **SHA-256-derived token**, never the raw key. Verification is
  constant-time (`src/lib/admin/token.ts`, unit-tested).
- **Writes require the Supabase service role** and are performed **server-side only**. Without it,
  the console runs in **read-only mode** (reviews work; moderation/merges/ingestion are disabled).
- Every mutation writes an **`audit_logs`** row (actor, action, entity, previous/next, reason).

Enable locally:

```bash
# .env.local (gitignored)
ADMIN_ACCESS_KEY=choose-a-long-random-string
```

Then visit `/admin`, sign in, and (for writes) add the Supabase env from `.env.example`.

## What it does

| Section | Works without DB? | Action |
|---|---|---|
| **Data health** | ✅ | Serving source, failed metrics, entity counts |
| **Data quality** | ✅ | Per-metric missing (N/A) & low-confidence counts, coverage |
| **Ingestion** | needs DB | Trigger a live World Bank upsert (history preserved) |
| **Studios / Games** | needs DB | Verify / unverify; **merge** duplicate studios (repoints games, records alias) |
| **Sources** | needs DB | Toggle verification status |
| **Audit log** | needs DB | Last 12 changes |

## Production upgrade path

Swap the passphrase gate for **Supabase Auth + an admin-role RLS policy**. The schema already
supports it: reference tables are public-read, writes go through the service role, and `audit_logs`
has no public read policy. Replace `isAdmin()`/`guardAdmin()` in `src/lib/admin/auth.ts` with a
Supabase session + role check; nothing else changes.
