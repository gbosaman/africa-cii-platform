"use client";

import { useMetricDrawer } from "@/components/metric/MetricDrawerProvider";
import { fmtValue } from "@/lib/format";

// The signature interaction: any figure on the platform is a clickable object
// that opens its full source lineage. ZERO ≠ UNKNOWN — null renders "N/A" and
// stays inert (nothing to trace).
export function MetricNumber({
  metricId,
  iso3,
  value,
  unit,
  className = "",
}: {
  metricId: string;
  iso3: string;
  value: number | null;
  unit: string;
  className?: string;
}) {
  const { open } = useMetricDrawer();

  if (value === null || value === undefined) {
    return <span className={`figure text-slate-500 ${className}`}>N/A</span>;
  }

  return (
    <button
      type="button"
      onClick={() => open({ metricId, iso3, value, unit })}
      className={`metric-link ${className}`}
      title="View source & history"
    >
      {fmtValue(value, unit)}
    </button>
  );
}
