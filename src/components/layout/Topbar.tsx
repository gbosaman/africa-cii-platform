import { getSnapshot } from "@/lib/data/snapshot";
import { relativeTime } from "@/lib/format";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function Topbar() {
  const snap = await getSnapshot();
  const liveOk = snap.live && snap.failed.length < 3;
  const statusLabel =
    snap.source === "db" ? "Supabase · Persisted" : snap.source === "live" ? "World Bank · Live" : "Degraded";

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink-900/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 pl-16 sm:px-6 lg:px-8 lg:pl-8">
        <div className="min-w-0 flex-1">
          <GlobalSearch />
        </div>

        {/* Live data status strip */}
        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-800/70 px-3 py-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                liveOk ? (snap.source === "db" ? "bg-gold-500" : "bg-emerald2-500") + " animate-pulse" : "bg-orange-500"
              }`}
            />
            <span className="text-[11px] font-medium text-slate-300">{statusLabel}</span>
            <span className="figure text-[11px] text-slate-500">
              upd {relativeTime(snap.fetchedAt)}
            </span>
          </div>
          <div
            className={`pill ${
              isSupabaseConfigured()
                ? "border-gold-500/30 bg-gold-500/10 text-gold-400"
                : "border-line bg-ink-700 text-slate-400"
            }`}
          >
            {isSupabaseConfigured() ? "DB Connected" : "Seed Mode"}
          </div>
        </div>
      </div>
    </header>
  );
}
