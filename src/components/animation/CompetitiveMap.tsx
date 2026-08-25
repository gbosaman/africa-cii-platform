"use client";

import { useMemo, useState, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { COUNTRY_BY_ISO3, flagEmoji } from "@/lib/data/countries";
import {
  CAPABILITY_LABELS,
  DISTRIBUTION_LABELS,
  TIER_META,
  capabilityCount,
  distributionCount,
  type AnimationCapability,
  type AnimationStudioProfile,
  type CompetitiveTier,
  type Distribution,
} from "@/lib/data/animation-types";

type CapKey = keyof AnimationCapability;
type DistKey = keyof Distribution;

const PROV_STYLE: Record<string, string> = {
  official: "border-accent-500/40 bg-accent-500/10 text-accent-400",
  verified: "border-info-500/40 bg-info-500/10 text-info-400",
  community: "border-slate-500/30 bg-slate-500/10 text-slate-400",
};

const PROV_LABEL: Record<string, string> = {
  official: "Official source",
  verified: "Third-party verified",
  community: "Community / press",
};

export function CompetitiveMap({ studios }: { studios: AnimationStudioProfile[] }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [tiers, setTiers] = useState<Set<CompetitiveTier>>(new Set());
  const [caps, setCaps] = useState<Set<CapKey>>(new Set());
  const [dists, setDists] = useState<Set<DistKey>>(new Set());
  const [ipOnly, setIpOnly] = useState(false);
  const [open, setOpen] = useState<AnimationStudioProfile | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const countries = useMemo(() => {
    const set = new Map<string, number>();
    for (const s of studios) set.set(s.countryIso3, (set.get(s.countryIso3) ?? 0) + 1);
    return [...set.entries()]
      .map(([iso3, n]) => ({ iso3, n, name: COUNTRY_BY_ISO3[iso3]?.name ?? iso3 }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [studios]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return studios.filter((s) => {
      if (country !== "all" && s.countryIso3 !== country) return false;
      if (tiers.size > 0 && !tiers.has(s.tier)) return false;
      if (ipOnly && s.originalIp.length === 0) return false;
      for (const c of caps) if (s.capability[c] !== true) return false;
      for (const d of dists) if (s.distribution[d] !== true) return false;
      if (needle) {
        const hay = [
          s.name,
          s.city ?? "",
          s.founderCeo ?? "",
          ...s.originalIp,
          ...s.majorClients,
          ...s.internationalPartnerships,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [studios, q, country, tiers, caps, dists, ipOnly]);

  const grouped = useMemo(() => {
    const order: CompetitiveTier[] = ["big", "scaleup", "established_indie", "emerging_indie"];
    return order
      .map((t) => ({ tier: t, rows: filtered.filter((s) => s.tier === t) }))
      .filter((g) => g.rows.length > 0);
  }, [filtered]);

  const toggle = <T,>(set: Set<T>, v: T, apply: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    apply(next);
  };

  const activeFilters = tiers.size + caps.size + dists.size + (ipOnly ? 1 : 0) + (country !== "all" ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Tier legend — criteria stated so the classification can be argued with */}
      <div className="panel-tight p-4">
        <p className="eyebrow mb-3">Competitive tiers — editorial classification, criteria below</p>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {(Object.keys(TIER_META) as CompetitiveTier[]).map((t) => {
            const m = TIER_META[t];
            const n = studios.filter((s) => s.tier === t).length;
            return (
              <button
                key={t}
                onClick={() => toggle(tiers, t, setTiers)}
                className={`min-w-0 rounded-lg border p-3 text-left transition ${
                  tiers.has(t) ? "border-accent-500/50 bg-accent-500/5" : "border-line bg-ink-850/40"
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <span aria-hidden>{m.dot}</span>
                  <span className="text-sm font-semibold text-white">{m.label}</span>
                  <span className="figure ml-auto text-sm font-bold" style={{ color: m.hex }}>
                    {n}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{m.criteria}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="panel-tight space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1" style={{ minWidth: 200 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search studio, founder, IP, client…"
              className="w-full rounded-lg border border-line bg-ink-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-accent-500/50 focus:outline-none"
            />
          </div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-line bg-ink-900 px-3 py-2 text-sm text-slate-200 focus:border-accent-500/50 focus:outline-none"
          >
            <option value="all">All countries ({countries.length})</option>
            {countries.map((c) => (
              <option key={c.iso3} value={c.iso3}>
                {c.name} ({c.n})
              </option>
            ))}
          </select>
          <button
            onClick={() => setIpOnly((v) => !v)}
            className={`pill ${ipOnly ? "border-accent-500/50 bg-accent-500/10 text-accent-400" : "border-line bg-ink-800 text-slate-400"}`}
          >
            Has original IP
          </button>
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setTiers(new Set());
                setCaps(new Set());
                setDists(new Set());
                setIpOnly(false);
                setCountry("all");
              }}
              className="pill border-line bg-ink-800 text-slate-400 hover:text-white"
            >
              Clear {activeFilters}
            </button>
          )}
        </div>

        <FilterRow
          label="Capability"
          entries={Object.entries(CAPABILITY_LABELS) as [CapKey, string][]}
          active={caps}
          count={(k) => studios.filter((s) => s.capability[k] === true).length}
          onToggle={(k) => toggle(caps, k, setCaps)}
        />
        <FilterRow
          label="Distribution"
          entries={Object.entries(DISTRIBUTION_LABELS) as [DistKey, string][]}
          active={dists}
          count={(k) => studios.filter((s) => s.distribution[k] === true).length}
          onToggle={(k) => toggle(dists, k, setDists)}
        />
      </div>

      <p className="text-xs text-slate-500">
        Showing <span className="text-slate-300">{filtered.length}</span> of {studios.length} studios.
        A blank cell means <span className="text-slate-400">not documented</span> — never
        &ldquo;no&rdquo;. Absence of a Netflix credit here is absence of evidence, not evidence the
        studio has no deal.
      </p>

      {/* Results, grouped by tier */}
      {grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-ink-850/50 p-8 text-center text-sm text-slate-400">
          No studio matches those filters.
        </div>
      ) : (
        grouped.map((g) => (
          <div key={g.tier} className="space-y-3">
            <div className="flex items-center gap-2">
              <span aria-hidden>{TIER_META[g.tier].dot}</span>
              <h3 className="text-sm font-semibold text-white">{TIER_META[g.tier].label}</h3>
              <span className="text-xs text-slate-500">{g.rows.length}</span>
              <span className="ml-2 h-px flex-1 bg-line" />
            </div>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {g.rows.map((s) => (
                <StudioCard key={s.id} studio={s} onOpen={() => setOpen(s)} />
              ))}
            </div>
          </div>
        ))
      )}

      {open && <StudioDrawer studio={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function FilterRow<K extends string>({
  label,
  entries,
  active,
  count,
  onToggle,
}: {
  label: string;
  entries: [K, string][];
  active: Set<K>;
  count: (k: K) => number;
  onToggle: (k: K) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </span>
      {entries.map(([k, lbl]) => {
        const n = count(k);
        const on = active.has(k);
        return (
          <button
            key={k}
            onClick={() => onToggle(k)}
            disabled={n === 0}
            className={`pill ${
              on
                ? "border-accent-500/50 bg-accent-500/10 text-accent-400"
                : n === 0
                  ? "border-line bg-ink-850 text-slate-700"
                  : "border-line bg-ink-800 text-slate-400 hover:text-white"
            }`}
          >
            {lbl} <span className="opacity-60">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

function StudioCard({ studio: s, onOpen }: { studio: AnimationStudioProfile; onOpen: () => void }) {
  const country = COUNTRY_BY_ISO3[s.countryIso3];
  const caps = (Object.keys(CAPABILITY_LABELS) as CapKey[]).filter((k) => s.capability[k] === true);
  const dists = (Object.keys(DISTRIBUTION_LABELS) as DistKey[]).filter(
    (k) => s.distribution[k] === true,
  );

  return (
    <button onClick={onOpen} className="panel kpi p-4 text-left" data-accent="emerald">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{s.name}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {flagEmoji(country?.iso2 ?? "")} {country?.name ?? s.countryIso3}
            {s.city ? ` · ${s.city}` : ""}
            {s.founded ? ` · ${s.founded}` : ""}
          </p>
        </div>
        <span aria-hidden className="shrink-0 text-xs">
          {TIER_META[s.tier].dot}
        </span>
      </div>

      {s.status === "closed" && (
        <span className="pill mt-2 border-warn-500/40 bg-warn-500/10 text-warn-400">Closed</span>
      )}

      {s.originalIp.length > 0 && (
        <p className="mt-2 truncate text-[11px] text-slate-400">
          <span className="text-slate-600">IP: </span>
          {s.originalIp.join(", ")}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1">
        {caps.slice(0, 4).map((k) => (
          <span key={k} className="pill border-line bg-ink-800 text-[10px] text-slate-400">
            {CAPABILITY_LABELS[k]}
          </span>
        ))}
        {caps.length > 4 && (
          <span className="pill border-line bg-ink-800 text-[10px] text-slate-600">
            +{caps.length - 4}
          </span>
        )}
      </div>

      {dists.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {dists.map((k) => (
            <span
              key={k}
              className="pill border-info-500/30 bg-info-500/10 text-[10px] text-info-400"
            >
              {DISTRIBUTION_LABELS[k]}
            </span>
          ))}
        </div>
      )}

      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-accent-400">
        Profile <Icon name="arrow" className="h-3 w-3" />
      </span>
    </button>
  );
}

function StudioDrawer({
  studio: s,
  onClose,
}: {
  studio: AnimationStudioProfile;
  onClose: () => void;
}) {
  const country = COUNTRY_BY_ISO3[s.countryIso3];
  const capKeys = Object.keys(CAPABILITY_LABELS) as CapKey[];
  const distKeys = Object.keys(DISTRIBUTION_LABELS) as DistKey[];

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl flex-col border-l border-line bg-ink-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <p className="eyebrow">
              {TIER_META[s.tier].dot} {TIER_META[s.tier].label}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">{s.name}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {flagEmoji(country?.iso2 ?? "")} {country?.name ?? s.countryIso3}
              {s.city ? ` · ${s.city}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-line p-2 text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <span className={`pill ${PROV_STYLE[s.provenance]}`}>{PROV_LABEL[s.provenance]}</span>
            {s.status === "closed" && (
              <span className="pill border-warn-500/40 bg-warn-500/10 text-warn-400">Closed</span>
            )}
            {s.status === "unknown" && (
              <span className="pill border-line bg-ink-800 text-slate-500">Status unconfirmed</span>
            )}
          </div>

          {/* Business intelligence */}
          <Section title="Business intelligence">
            <Field k="Founded" v={s.founded ? String(s.founded) : null} />
            <Field k="City" v={s.city} />
            <Field k="Founder / CEO" v={s.founderCeo} />
            <Field k="Estimated size" v={s.sizeBand ? `${s.sizeBand} people` : null} />
            <Field k="Funding / investment" v={s.funding} />
            <Field k="Major clients" v={s.majorClients.length ? s.majorClients.join(", ") : null} />
            <Field
              k="International partnerships"
              v={s.internationalPartnerships.length ? s.internationalPartnerships.join(", ") : null}
            />
          </Section>

          {/* Links */}
          {(s.website || s.youtube || s.instagram || s.linkedin) && (
            <div className="flex flex-wrap gap-2">
              {[
                ["Website", s.website],
                ["YouTube", s.youtube],
                ["Instagram", s.instagram],
                ["LinkedIn", s.linkedin],
              ]
                .filter(([, url]) => url)
                .map(([label, url]) => (
                  <a
                    key={label as string}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pill border-line bg-ink-800 text-slate-300 hover:text-white"
                  >
                    {label as string} ↗
                  </a>
                ))}
            </div>
          )}

          {/* Capability */}
          <div>
            <p className="eyebrow mb-2">
              Animation capability
              <span className="ml-2 text-slate-600">
                {capabilityCount(s.capability)} of {capKeys.length} documented
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {capKeys.map((k) => (
                <span
                  key={k}
                  className={`pill ${
                    s.capability[k] === true
                      ? "border-accent-500/40 bg-accent-500/10 text-accent-400"
                      : "border-line bg-ink-850 text-slate-700"
                  }`}
                >
                  {CAPABILITY_LABELS[k]}
                </span>
              ))}
            </div>
          </div>

          {/* Original IP */}
          <Section title="Original IP">
            {s.originalIp.length > 0 ? (
              <ul className="space-y-1">
                {s.originalIp.map((ip) => (
                  <li key={ip} className="text-sm text-slate-300">
                    · {ip}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-600">No studio-owned IP documented.</p>
            )}
          </Section>

          {/* Distribution */}
          <div>
            <p className="eyebrow mb-2">
              Distribution
              <span className="ml-2 text-slate-600">
                {distributionCount(s.distribution)} of {distKeys.length} documented
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {distKeys.map((k) => (
                <span
                  key={k}
                  className={`pill ${
                    s.distribution[k] === true
                      ? "border-info-500/40 bg-info-500/10 text-info-400"
                      : "border-line bg-ink-850 text-slate-700"
                  }`}
                >
                  {DISTRIBUTION_LABELS[k]}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Dimmed means <span className="text-slate-400">not documented</span>, not
              &ldquo;no&rdquo;. This map can show that a studio has a credit; it can never show that
              one does not exist.
            </p>
          </div>

          {s.notes && (
            <div className="rounded-lg border border-line bg-ink-850/60 p-4">
              <p className="eyebrow mb-1.5">Notes</p>
              <p className="text-sm leading-relaxed text-slate-300">{s.notes}</p>
            </div>
          )}

          {/* Sources */}
          <div>
            <p className="eyebrow mb-2 flex items-center gap-2">
              <Icon name="shield" className="h-3.5 w-3.5 text-accent-400" /> Sources
            </p>
            <ul className="space-y-2">
              {s.sources.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-line bg-ink-850/60 p-3 hover:border-accent-500/40"
                  >
                    <p className="text-xs font-medium text-slate-200">{src.label}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{src.url}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/50 pb-1.5">
      <span className="shrink-0 text-xs text-slate-500">{k}</span>
      <span className={`text-right text-sm ${v ? "text-slate-200" : "text-slate-700"}`}>
        {v ?? "Not documented"}
      </span>
    </div>
  );
}
