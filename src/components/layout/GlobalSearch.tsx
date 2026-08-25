"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, flagEmoji } from "@/lib/data/countries";
import { STUDIOS } from "@/lib/data/studios";
import { Icon } from "@/components/ui/Icon";

interface Result {
  href: string;
  label: string;
  kind: "Country" | "Studio";
  hint?: string;
}

const INDEX: Result[] = [
  ...COUNTRIES.map((c) => ({
    href: `/countries/${c.iso3.toLowerCase()}`,
    label: c.name,
    kind: "Country" as const,
    hint: `${flagEmoji(c.iso2)} ${c.region}`,
  })),
  ...STUDIOS.map((s) => ({
    href: `/studios/${s.id}`,
    label: s.name,
    kind: "Studio" as const,
    hint: s.city ?? undefined,
  })),
];

export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return INDEX.filter((r) => r.label.toLowerCase().includes(term)).slice(0, 8);
  }, [q]);

  const go = (r?: Result) => {
    const target = r ?? results[active];
    if (target) {
      router.push(target.href);
      setQ("");
      setOpen(false);
      ref.current?.blur();
    }
  };

  return (
    <div className="relative max-w-md">
      <div className="flex items-center gap-2 rounded-lg border border-line bg-ink-850 px-3 py-2 focus-within:border-gold-500/40">
        <Icon name="search" className="h-4 w-4 text-slate-500" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            if (e.key === "Enter") go();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search countries, studios, metrics…"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          aria-label="Global search"
        />
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-slate-500 sm:block">
          /
        </kbd>
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-line bg-ink-850 shadow-panel">
          {results.map((r, i) => (
            <button
              key={r.href}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(r)}
              onMouseEnter={() => setActive(i)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                i === active ? "bg-ink-700 text-white" : "text-slate-300"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs">{r.hint}</span>
                <span className="font-medium">{r.label}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                {r.kind}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
