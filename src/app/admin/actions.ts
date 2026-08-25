"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  canPersist,
  guardAdmin,
  sessionToken,
  verifyPassphrase,
} from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchWorldBankSnapshot } from "@/lib/data-sources/worldbank";
import { COUNTRIES } from "@/lib/data/countries";

export interface ActionResult {
  ok: boolean;
  message: string;
}

// --- Auth --------------------------------------------------------------------

export async function loginAction(formData: FormData): Promise<void> {
  const key = String(formData.get("key") ?? "");
  if (verifyPassphrase(key)) {
    const token = sessionToken();
    if (token) {
      cookies().set(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8h
      });
    }
    redirect("/admin");
  }
  redirect("/admin/login?e=1");
}

export async function logoutAction(): Promise<void> {
  cookies().delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

// --- Audit helper ------------------------------------------------------------

async function audit(
  db: NonNullable<ReturnType<typeof createServiceClient>>,
  action: string,
  entity: string,
  previous: unknown,
  next: unknown,
  reason?: string,
) {
  await db.from("audit_logs").insert({
    actor: "admin",
    action,
    entity,
    previous: previous ?? null,
    next: next ?? null,
    reason: reason ?? null,
  });
}

// --- Moderation --------------------------------------------------------------

export async function setEntityVerified(
  kind: "studios" | "games",
  id: string,
  verified: boolean,
): Promise<ActionResult> {
  const guard = guardAdmin();
  if (!guard.ok) return { ok: false, message: guard.reason };
  if (!canPersist()) return { ok: false, message: "Supabase not configured — cannot persist." };
  const db = createServiceClient()!;
  const { error } = await db.from(kind).update({ verified }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await audit(db, verified ? "verify" : "unverify", `${kind}:${id}`, { verified: !verified }, { verified });
  revalidatePath("/admin");
  revalidatePath(`/${kind}`);
  return { ok: true, message: `${kind.slice(0, -1)} ${verified ? "verified" : "unverified"}.` };
}

export async function setSourceVerified(id: string, status: "verified" | "needs_verification"): Promise<ActionResult> {
  const guard = guardAdmin();
  if (!guard.ok) return { ok: false, message: guard.reason };
  if (!canPersist()) return { ok: false, message: "Supabase not configured — cannot persist." };
  const db = createServiceClient()!;
  const { error } = await db.from("data_sources").update({ verification_status: status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await audit(db, "source_verification", `data_sources:${id}`, null, { status });
  revalidatePath("/admin");
  revalidatePath("/sources");
  return { ok: true, message: `Source marked ${status.replace("_", " ")}.` };
}

/** Merge duplicate studios: repoint games, record an alias, delete the source. */
export async function mergeStudios(sourceId: string, targetId: string): Promise<ActionResult> {
  const guard = guardAdmin();
  if (!guard.ok) return { ok: false, message: guard.reason };
  if (!canPersist()) return { ok: false, message: "Supabase not configured — cannot persist." };
  if (!sourceId || !targetId || sourceId === targetId) return { ok: false, message: "Pick two different studios." };
  const db = createServiceClient()!;

  const { data: src } = await db.from("studios").select("id,name").eq("id", sourceId).single();
  if (!src) return { ok: false, message: "Source studio not found." };

  await db.from("games").update({ studio_id: targetId }).eq("studio_id", sourceId);
  await db.from("studio_aliases").upsert({ studio_id: targetId, alias: src.name });
  const { error } = await db.from("studios").delete().eq("id", sourceId);
  if (error) return { ok: false, message: error.message };
  await audit(db, "merge_studios", `studios:${sourceId}→${targetId}`, { sourceId }, { targetId }, `Merged "${src.name}"`);
  revalidatePath("/admin");
  revalidatePath("/studios");
  return { ok: true, message: `Merged "${src.name}" into ${targetId}.` };
}

// --- Ingestion ---------------------------------------------------------------

export async function triggerIngestion(): Promise<ActionResult> {
  const guard = guardAdmin();
  if (!guard.ok) return { ok: false, message: guard.reason };
  if (!canPersist()) return { ok: false, message: "Supabase not configured — cannot persist." };
  const db = createServiceClient()!;

  try {
    const snap = await fetchWorldBankSnapshot();
    const batch: Record<string, unknown>[] = [];
    for (const [metricId, perCountry] of Object.entries(snap.values)) {
      for (const [iso3, mv] of Object.entries(perCountry)) {
        if (mv.value === null) continue;
        batch.push({
          metric_id: metricId, country_iso3: iso3, value: mv.value, unit: mv.unit,
          year: mv.year, kind: mv.kind, confidence: mv.confidence, source_id: mv.sourceId,
          effective_date: mv.year ? `${mv.year}-01-01` : null, retrieved_at: mv.retrievedAt,
        });
      }
    }
    const { error } = await db
      .from("metric_values")
      .upsert(batch, { onConflict: "metric_id,country_iso3,year,source_id" });
    if (error) return { ok: false, message: error.message };
    await db.from("data_sources").update({ last_successful_fetch: new Date().toISOString() }).eq("id", "worldbank");
    await audit(db, "ingest_worldbank", "metric_values", null, { rows: batch.length, failed: snap.failed });
    revalidatePath("/admin");
    revalidatePath("/");
    return { ok: true, message: `Ingested ${batch.length} observations from ${COUNTRIES.length} countries.` };
  } catch (err) {
    return { ok: false, message: `Ingestion failed: ${(err as Error).message}` };
  }
}
