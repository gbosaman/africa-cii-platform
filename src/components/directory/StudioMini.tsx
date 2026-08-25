import Link from "next/link";
import type { Studio } from "@/lib/types";
import { flagEmoji, COUNTRY_BY_ISO3 } from "@/lib/data/countries";

export function StudioMini({ studio }: { studio: Studio }) {
  const country = COUNTRY_BY_ISO3[studio.countryIso3];
  return (
    <Link
      href={`/studios/${studio.id}`}
      className="block rounded-lg border border-line bg-ink-850/60 p-4 transition-colors hover:border-gold-500/30"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-100">{studio.name}</p>
        {studio.verified && (
          <span className="pill shrink-0 border-emerald2-500/30 bg-emerald2-500/10 text-emerald2-400">
            ✓
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {flagEmoji(country?.iso2 ?? "")} {studio.city ?? "—"}
        {studio.foundedYear ? ` · est. ${studio.foundedYear}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {studio.categories.slice(0, 3).map((cat) => (
          <span
            key={cat}
            className="rounded border border-line bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-400"
          >
            {cat}
          </span>
        ))}
      </div>
    </Link>
  );
}
