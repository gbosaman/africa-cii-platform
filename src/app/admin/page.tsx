import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin, canPersist } from "@/lib/admin/auth";
import { logoutAction as logoutServerAction } from "@/app/admin/actions";
import { getSnapshot } from "@/lib/data/snapshot";
import { getStudios, getGames, supabaseConfigured } from "@/lib/data/repository";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";
import { COUNTRIES, COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import { LINK_HEALTH_ISSUES, LINK_HEALTH_CHECKED, LINK_HEALTH_SWEPT_AT, HEALTH_LABEL } from "@/lib/data/link-health";
import { DATA_SOURCES } from "@/lib/data-sources/registry";
import { createServiceClient } from "@/lib/supabase/server";
import { Panel, SectionHeader, Pill, DataUnavailable } from "@/components/ui/primitives";
import { VerifyToggle, SourceToggle, IngestButton, MergeForm, LogoutButton } from "@/components/admin/AdminControls";

export const metadata: Metadata = { title: "Admin console", robots: { index: false } };
export const dynamic = "force-dynamic";

interface AuditRow {
  id: string;
  actor: string | null;
  action: string;
  entity: string | null;
  reason: string | null;
  created_at: string;
}

async function readAuditLog(): Promise<AuditRow[] | null> {
  const db = createServiceClient();
  if (!db) return null;
  const { data, error } = await db
    .from("audit_logs")
    .select("id,actor,action,entity,reason,created_at")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) return null;
  return (data as AuditRow[]) ?? [];
}

export default async function AdminPage() {
  if (!isAdmin()) redirect("/admin/login");

  const persist = canPersist();
  const [snap, studios, games, audit] = await Promise.all([
    getSnapshot(),
    getStudios(),
    getGames(),
    readAuditLog(),
  ]);

  // Data-quality review — computed from the live snapshot (works without DB).
  const quality = WORLD_BANK_METRICS.map((m) => {
    let missing = 0;
    let low = 0;
    for (const c of COUNTRIES) {
      const mv = snap.metrics[m.id]?.[c.iso3];
      if (!mv || mv.value === null) missing++;
      else if (mv.confidence === "LOW" || mv.confidence === "UNVERIFIED") low++;
    }
    return { id: m.id, label: m.shortLabel ?? m.label, missing, low };
  }).sort((a, b) => b.missing + b.low - (a.missing + a.low));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Restricted · audited</p>
          <h1 className="display text-3xl text-white">Admin console</h1>
        </div>
        <LogoutButton action={logoutServerAction} />
      </div>

      {!persist && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-4 text-sm text-gold-200">
          <span className="font-semibold">Read-only mode. </span>
          You are authenticated, but{" "}
          {supabaseConfigured() ? "the service-role key is missing" : "Supabase is not configured"} —
          so moderation, merges and ingestion are disabled. Reviews below still work against live
          data. Configure Supabase to enable writes (all changes are audited).
        </div>
      )}

      {/* Data health */}
      <Panel>
        <SectionHeader eyebrow="System" title="Data health" />
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          <Stat label="Serving from" value={snap.source === "db" ? "Supabase" : snap.source === "live" ? "World Bank" : "Degraded"} tone={snap.source === "empty" ? "warn" : "ok"} />
          <Stat label="Failed metrics" value={String(snap.failed.length)} tone={snap.failed.length ? "warn" : "ok"} />
          <Stat label="Studios" value={String(studios.length)} />
          <Stat label="Games" value={String(games.length)} />
        </div>
      </Panel>

      {/* Ingestion */}
      <Panel>
        <SectionHeader eyebrow="Pipeline" title="Ingestion" />
        <p className="mb-4 text-sm text-slate-400">
          Fetches the live World Bank snapshot and upserts observations (history preserved).
          Recomputed scores follow on the scheduled job.
        </p>
        <IngestButton disabled={!persist} />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {DATA_SOURCES.filter((s) => s.apiUrl).slice(0, 4).map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-line bg-ink-850/60 px-3 py-2 text-xs">
              <span className="text-slate-300">{s.organization}</span>
              <span className="text-slate-500">
                {s.lastSuccessfulFetch ? `last ok ${new Date(s.lastSuccessfulFetch).toLocaleDateString()}` : "no run recorded"}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Data quality review */}
      <Panel>
        <SectionHeader eyebrow="Review · low confidence & gaps" title="Data quality" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Metric</th>
                <th className="px-3 py-2 text-right">Missing (N/A)</th>
                <th className="px-3 py-2 text-right">Low confidence</th>
                <th className="px-3 py-2 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {quality.map((q) => {
                const cov = Math.round(((COUNTRIES.length - q.missing) / COUNTRIES.length) * 100);
                return (
                  <tr key={q.id}>
                    <td className="px-3 py-2 text-slate-200">{q.label}</td>
                    <td className={`px-3 py-2 text-right figure ${q.missing ? "text-orange-400" : "text-slate-500"}`}>{q.missing}</td>
                    <td className={`px-3 py-2 text-right figure ${q.low ? "text-gold-400" : "text-slate-500"}`}>{q.low}</td>
                    <td className="px-3 py-2 text-right figure text-slate-300">{cov}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Entity moderation */}
      <Panel>
        <SectionHeader
          eyebrow="Moderation"
          title="Studios"
          action={<MergeForm studios={studios.map((s) => ({ id: s.id, name: s.name }))} disabled={!persist} />}
        />
        <div className="divide-y divide-line">
          {studios.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <Link href={`/studios/${s.id}`} className="text-sm text-slate-200 hover:text-gold-400">
                {flagEmoji(COUNTRY_BY_ISO3[s.countryIso3]?.iso2 ?? "")} {s.name}
              </Link>
              <VerifyToggle kind="studios" id={s.id} verified={s.verified} disabled={!persist} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <SectionHeader eyebrow="Moderation" title="Games" />
        <div className="divide-y divide-line">
          {games.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-3 py-2.5">
              <Link href={`/games/${g.id}`} className="text-sm text-slate-200 hover:text-gold-400">{g.title}</Link>
              <VerifyToggle kind="games" id={g.id} verified={g.verified} disabled={!persist} />
            </div>
          ))}
        </div>
      </Panel>

      {/* Source management */}
      <Panel>
        <SectionHeader eyebrow="Provenance" title="Sources" />
        <div className="divide-y divide-line">
          {DATA_SOURCES.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-sm text-slate-200">{s.organization} · <span className="text-slate-500">{s.sourceName}</span></span>
              <SourceToggle id={s.id} status={s.verificationStatus} disabled={!persist} />
            </div>
          ))}
        </div>
      </Panel>


      {/* Link health */}
      <Panel>
        <SectionHeader
          eyebrow={`Swept ${LINK_HEALTH_SWEPT_AT} · ${LINK_HEALTH_CHECKED} sites`}
          title="Broken studio links"
          action={<Pill tone="gold">{LINK_HEALTH_ISSUES.length} to review</Pill>}
        />
        <p className="mb-4 text-sm text-slate-400">
          Websites that failed the sweep <span className="font-semibold text-slate-300">and</span> a
          second re-check with a longer timeout and a retry. Transient failures are filtered out, so
          these need re-sourcing or the record retiring. Run again with{" "}
          <code className="figure">npm run health:links</code>.
        </p>
        {LINK_HEALTH_ISSUES.length === 0 ? (
          <DataUnavailable label="No broken links recorded." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Studio</th>
                  <th className="px-3 py-2 text-left">Country</th>
                  <th className="px-3 py-2 text-left">Tier</th>
                  <th className="px-3 py-2 text-left">Problem</th>
                  <th className="px-3 py-2 text-left">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {LINK_HEALTH_ISSUES.map((h) => (
                  <tr key={h.id}>
                    <td className="px-3 py-2 text-slate-200">{h.name}</td>
                    <td className="px-3 py-2 text-slate-400">
                      {flagEmoji(COUNTRY_BY_ISO3[h.countryIso3]?.iso2 ?? "")} {h.countryIso3}
                    </td>
                    <td className="px-3 py-2">
                      <span className={h.tier === "verified" ? "text-emerald2-400" : "text-slate-400"}>
                        {h.tier}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-orange-400">
                      {HEALTH_LABEL[h.status]}
                      {h.detail ? <span className="ml-1 text-[11px] text-slate-500">({h.detail})</span> : null}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2">
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="figure text-xs text-slate-400 hover:text-gold-400"
                      >
                        {h.url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Audit log */}
      <Panel>
        <SectionHeader eyebrow="Governance" title="Audit log" />
        {audit === null ? (
          <DataUnavailable label="Audit log lives in Supabase — configure the service role to record and read changes." />
        ) : audit.length === 0 ? (
          <DataUnavailable label="No audit entries yet. Actions you take here will appear immediately." />
        ) : (
          <div className="divide-y divide-line">
            {audit.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                <span className="text-slate-300">
                  <Pill>{a.action}</Pill> <span className="ml-2 figure text-slate-400">{a.entity}</span>
                </span>
                <span className="text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="bg-ink-850 p-4">
      <p className={`figure text-lg font-bold ${tone === "warn" ? "text-orange-400" : tone === "ok" ? "text-emerald2-400" : "text-slate-100"}`}>{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}
