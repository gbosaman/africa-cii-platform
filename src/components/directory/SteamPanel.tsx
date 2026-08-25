import type { SteamData } from "@/lib/types";
import { steamStoreUrl } from "@/lib/data-sources/steam";
import { Panel, SectionHeader, DataUnavailable, Pill } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { fmtNumber } from "@/lib/format";

// Review score → tone. Steam's 0-9 scale + our derived positive %.
function reviewTone(pct: number | null): string {
  if (pct === null) return "text-slate-400";
  if (pct >= 80) return "text-emerald2-400";
  if (pct >= 60) return "text-gold-400";
  return "text-orange-400";
}

export function SteamPanel({ steam }: { steam: SteamData }) {
  if (!steam.available) {
    return (
      <Panel>
        <SectionHeader eyebrow="Live · Steam" title="Steam data" />
        <DataUnavailable label="Steam data temporarily unavailable — last verified value retained; nothing overwritten." />
      </Panel>
    );
  }

  return (
    <Panel>
      <SectionHeader
        eyebrow="Live · Steam Web API"
        title="Steam data"
        action={
          <a
            href={steamStoreUrl(steam.appId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 hover:text-gold-500"
          >
            Store page <Icon name="external" className="h-3.5 w-3.5" />
          </a>
        }
      />

      {steam.headerImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={steam.headerImage}
          alt={steam.name ?? "Steam header"}
          className="mb-4 w-full rounded-lg border border-line"
        />
      )}

      {/* Review score — the marquee live number */}
      <div className="mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line">
        <div className="bg-ink-850 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Rating</p>
          <p className={`mt-1 text-sm font-semibold ${reviewTone(steam.positivePct)}`}>
            {steam.reviewDesc ?? "N/A"}
          </p>
        </div>
        <div className="bg-ink-850 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Positive</p>
          <p className={`figure mt-1 text-lg font-bold ${reviewTone(steam.positivePct)}`}>
            {steam.positivePct === null ? "N/A" : `${steam.positivePct}%`}
          </p>
        </div>
        <div className="bg-ink-850 p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Reviews</p>
          <p className="figure mt-1 text-lg font-bold text-slate-100">
            {fmtNumber(steam.totalReviews)}
          </p>
        </div>
      </div>

      <dl className="divide-y divide-line text-sm">
        <SteamRow k="Name (Steam)" v={steam.name} />
        <SteamRow k="Release date" v={steam.releaseDate} />
        <SteamRow k="Developers" v={steam.developers?.join(", ") ?? null} />
        <SteamRow k="Publishers" v={steam.publishers?.join(", ") ?? null} />
        <SteamRow k="Genres" v={steam.genres?.join(", ") ?? null} />
        <SteamRow k="Price" v={steam.price} />
      </dl>

      {steam.platforms && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {steam.platforms.map((p) => (
            <Pill key={p}>{p}</Pill>
          ))}
        </div>
      )}

      <p className="mt-3 border-t border-line pt-3 text-[11px] text-slate-500">
        Source: Steam (Valve) · appid {steam.appId} · retrieved{" "}
        {new Date(steam.fetchedAt).toLocaleDateString()}. Review counts are all-language, all
        purchase types.
      </p>
    </Panel>
  );
}

function SteamRow({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-slate-500">{k}</dt>
      <dd className={v ? "text-right text-slate-200" : "figure text-slate-500"}>{v ?? "N/A"}</dd>
    </div>
  );
}
