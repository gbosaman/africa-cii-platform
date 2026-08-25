"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  MARKET_FORECAST,
  FORECAST_PROVENANCE,
  type ForecastStat,
} from "@/lib/data/market-forecast";

/**
 * Rotating hero forecast figures, in the heavy condensed poster style.
 *
 * Each stat fades in, holds, then fades out before the next — so one figure at
 * a time gets the full width and can be set genuinely large, rather than three
 * competing for the same column.
 *
 * Accessibility: under `prefers-reduced-motion` the rotation stops entirely and
 * all three are rendered stacked and static. A cycling headline is exactly the
 * kind of motion that setting exists to suppress, and the information must not
 * be lost when it is honoured — so the reduced path shows more, not less.
 */

const HOLD_MS = 3600;
const FADE_MS = 620;

const ACCENT: Record<ForecastStat["accent"], { text: string; glow: string; rule: string }> = {
  orange: { text: "#f59e0b", glow: "rgba(245,158,11,0.35)", rule: "rgba(245,158,11,0.55)" },
  blue: { text: "#38bdf8", glow: "rgba(56,189,248,0.35)", rule: "rgba(56,189,248,0.55)" },
  violet: { text: "#a855f7", glow: "rgba(168,85,247,0.35)", rule: "rgba(168,85,247,0.55)" },
};

export function HeroForecast() {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
    // Fade out, swap, fade back in.
    const out = setTimeout(() => setShown(false), HOLD_MS);
    const swap = setTimeout(() => {
      setIndex((i) => (i + 1) % MARKET_FORECAST.length);
      setShown(true);
    }, HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(out);
      clearTimeout(swap);
    };
  }, [index, reduced]);

  if (reduced) {
    return (
      <Frame>
        <div className="space-y-6">
          {MARKET_FORECAST.map((s) => (
            <Figure key={s.id} stat={s} compact />
          ))}
        </div>
      </Frame>
    );
  }

  const stat = MARKET_FORECAST[index]!;

  return (
    <Frame>
      <div
        // Height is reserved for the tallest stat so the swap does not shift
        // the page — the whole hero would jump every 4 seconds otherwise.
        className="min-h-[172px] transition-opacity ease-out xs:min-h-[196px] sm:min-h-[240px]"
        style={{ opacity: shown ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
        aria-live="polite"
      >
        <Figure stat={stat} />
      </div>

      {/* Position within the rotation */}
      <div className="mt-4 flex items-center gap-1.5">
        {MARKET_FORECAST.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              setIndex(i);
              setShown(true);
            }}
            aria-label={`Show ${s.value}`}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === index ? 26 : 12,
              background: i === index ? ACCENT[s.accent].text : "rgba(148,163,184,0.28)",
            }}
          />
        ))}
      </div>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="pill border-warn-500/40 bg-warn-500/10 text-warn-400">
          {FORECAST_PROVENANCE.kind}
        </span>
        <span
          className="text-[10.5px] leading-tight text-slate-500"
          title={FORECAST_PROVENANCE.note}
        >
          {FORECAST_PROVENANCE.sourceLabel ?? "Projection · source pending verification"}
        </span>
      </div>
      {children}
    </div>
  );
}

function Figure({ stat, compact = false }: { stat: ForecastStat; compact?: boolean }) {
  const a = ACCENT[stat.accent];
  return (
    <div>
      <span
        className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: a.rule, color: a.text, background: a.glow.replace("0.35", "0.10") }}
      >
        <Icon name={stat.icon} className="h-[18px] w-[18px]" />
      </span>

      <p
        className={`font-poster leading-[0.86] tracking-[-0.01em] ${
          compact ? "text-[3.2rem]" : "text-[3.6rem] xs:text-[4.6rem] sm:text-[5.4rem]"
        }`}
        style={{ color: a.text, textShadow: `0 6px 30px ${a.glow}` }}
      >
        {stat.value}
      </p>

      <div
        className="mt-2 h-[3px] w-14 rounded-full"
        style={{ background: a.rule }}
        aria-hidden
      />

      <p className="font-poster-label mt-3 text-[15px] font-semibold uppercase leading-tight tracking-[0.055em] text-slate-200 sm:text-[17px]">
        {stat.caption}
      </p>
      {stat.sub && (
        <p
          className="font-poster-label mt-0.5 text-[15px] font-semibold uppercase tracking-[0.055em] sm:text-[17px]"
          style={{ color: a.text }}
        >
          {stat.sub}
        </p>
      )}
    </div>
  );
}
