import { NextResponse } from "next/server";
import { getMetric } from "@/lib/data/metrics";
import { WORLD_BANK_METRICS } from "@/lib/data/metrics";
import { getCountry } from "@/lib/data/countries";
import { wbSourceUrl } from "@/lib/data-sources/worldbank";
import { getSource } from "@/lib/data-sources/registry";
import { readMetricSeriesFromDb } from "@/lib/data/repository";

// GET /api/metric/:metricId?iso3=NGA
// Returns the full available time series for one metric + country, with
// provenance. Backs the interactive metric-lineage drawer.
export async function GET(
  req: Request,
  { params }: { params: { metricId: string } },
) {
  const { searchParams } = new URL(req.url);
  const iso3 = (searchParams.get("iso3") ?? "").toUpperCase();

  const metric = getMetric(params.metricId);
  const country = getCountry(iso3);
  if (!metric || !country) {
    return NextResponse.json({ error: "Unknown metric or country" }, { status: 404 });
  }

  const wb = WORLD_BANK_METRICS.find((m) => m.id === metric.id);
  if (!wb) {
    return NextResponse.json({ error: "Metric has no live series yet", series: [] }, { status: 200 });
  }

  const url = `https://api.worldbank.org/v2/country/${iso3}/indicator/${wb.wbIndicator}?format=json&per_page=200`;
  try {
    // Prefer persisted history from Supabase; fall back to the live series.
    let series = (await readMetricSeriesFromDb(metric.id, iso3)) ?? [];
    let served: "db" | "live" = "db";
    if (series.length < 2) {
      const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as [unknown, Array<{ date: string; value: number | null }> | null];
      const rows = json[1] ?? [];
      series = rows
        .filter((r) => r.value !== null)
        .map((r) => ({ year: Number(r.date), value: r.value as number }))
        .sort((a, b) => a.year - b.year);
      served = "live";
    }

    const source = getSource("worldbank");
    return NextResponse.json({
      metric: {
        id: metric.id,
        label: metric.label,
        unit: metric.unit,
        description: metric.description,
        category: metric.category,
      },
      country: { iso3: country.iso3, name: country.name, region: country.region },
      series,
      provenance: {
        source: source?.sourceName,
        organization: source?.organization,
        datasetName: "World Development Indicators",
        indicatorCode: wb.wbIndicator,
        license: source?.license,
        sourceUrl: wbSourceUrl(wb.wbIndicator, iso3),
        retrievedAt: new Date().toISOString(),
        servedFrom: served,
        methodology: `Most recent non-empty annual observation from World Bank WDI series ${wb.wbIndicator}. Values are as published by the World Bank; no transformation is applied to the displayed figure.`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Source temporarily unavailable", series: [] },
      { status: 200 },
    );
  }
}
