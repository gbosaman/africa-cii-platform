"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { MetricDrawer } from "@/components/metric/MetricDrawer";

interface DrawerTarget {
  metricId: string;
  iso3: string;
  /** Optional pre-known current value/unit to render instantly before fetch. */
  value?: number | null;
  unit?: string;
}

interface Ctx {
  open: (t: DrawerTarget) => void;
}

const MetricDrawerContext = createContext<Ctx | null>(null);

export function useMetricDrawer(): Ctx {
  const ctx = useContext(MetricDrawerContext);
  if (!ctx) throw new Error("useMetricDrawer must be used within MetricDrawerProvider");
  return ctx;
}

export function MetricDrawerProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<DrawerTarget | null>(null);

  const open = useCallback((t: DrawerTarget) => setTarget(t), []);
  const close = useCallback(() => setTarget(null), []);

  return (
    <MetricDrawerContext.Provider value={{ open }}>
      {children}
      <MetricDrawer target={target} onClose={close} />
    </MetricDrawerContext.Provider>
  );
}
