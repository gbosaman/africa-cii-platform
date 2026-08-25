"use client";

import { useState, useTransition } from "react";
import {
  setEntityVerified,
  setSourceVerified,
  mergeStudios,
  triggerIngestion,
  type ActionResult,
} from "@/app/admin/actions";
import { Icon } from "@/components/ui/Icon";

function useAction() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => setResult(await fn()));
  return { pending, result, run, setResult };
}

function Toast({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <span className={`text-[11px] ${result.ok ? "text-emerald2-400" : "text-orange-400"}`}>
      {result.message}
    </span>
  );
}

export function VerifyToggle({
  kind,
  id,
  verified,
  disabled,
}: {
  kind: "studios" | "games";
  id: string;
  verified: boolean;
  disabled: boolean;
}) {
  const { pending, result, run } = useAction();
  const [state, setState] = useState(verified);
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={disabled || pending}
        onClick={() =>
          run(async () => {
            const r = await setEntityVerified(kind, id, !state);
            if (r.ok) setState(!state);
            return r;
          })
        }
        className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
          state
            ? "border-emerald2-500/40 bg-emerald2-500/10 text-emerald2-400"
            : "border-line bg-ink-800 text-slate-400 hover:text-slate-200"
        }`}
      >
        {pending ? "…" : state ? "✓ Verified" : "Unverified"}
      </button>
      <Toast result={result} />
    </div>
  );
}

export function SourceToggle({
  id,
  status,
  disabled,
}: {
  id: string;
  status: "verified" | "needs_verification";
  disabled: boolean;
}) {
  const { pending, result, run } = useAction();
  const [state, setState] = useState(status);
  const next = state === "verified" ? "needs_verification" : "verified";
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={disabled || pending}
        onClick={() =>
          run(async () => {
            const r = await setSourceVerified(id, next);
            if (r.ok) setState(next);
            return r;
          })
        }
        className="rounded-md border border-line bg-ink-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white disabled:opacity-40"
      >
        {pending ? "…" : state === "verified" ? "✓ Verified" : "⚠ Needs verification"}
      </button>
      <Toast result={result} />
    </div>
  );
}

export function IngestButton({ disabled }: { disabled: boolean }) {
  const { pending, result, run } = useAction();
  return (
    <div className="flex items-center gap-3">
      <button
        disabled={disabled || pending}
        onClick={() => run(() => triggerIngestion())}
        className="inline-flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-ink-900 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Icon name="download" className="h-4 w-4" />
        {pending ? "Ingesting…" : "Run World Bank ingestion"}
      </button>
      <Toast result={result} />
    </div>
  );
}

export function MergeForm({ studios, disabled }: { studios: { id: string; name: string }[]; disabled: boolean }) {
  const { pending, result, run } = useAction();
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">Merge</span>
      <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-md border border-line bg-ink-850 px-2 py-1 text-xs text-slate-200">
        <option value="">source…</option>
        {studios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <span className="text-xs text-slate-500">into</span>
      <select value={target} onChange={(e) => setTarget(e.target.value)} className="rounded-md border border-line bg-ink-850 px-2 py-1 text-xs text-slate-200">
        <option value="">target…</option>
        {studios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <button
        disabled={disabled || pending || !source || !target}
        onClick={() => run(() => mergeStudios(source, target))}
        className="rounded-md border border-line bg-ink-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-gold-500/40 disabled:opacity-40"
      >
        {pending ? "…" : "Merge"}
      </button>
      <Toast result={result} />
    </div>
  );
}

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white">
        Sign out
      </button>
    </form>
  );
}
