import { describe, it, expect, vi, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Regression: some World Bank indicators SILENTLY IGNORE `mrnev=1` and return
// the entire time series. With a fixed `per_page=500` the response is then
// truncated at page one, which never reaches most African ISO3 codes, and the
// indicator resolves to N/A for all 54 countries even though the data exists.
//
// SP.POP.TOTL.FE.ZS did exactly this in production: 0/54 coverage against a
// 17,490-row series. The failure is invisible — it looks identical to a
// genuine "not published" gap — so it gets a test of its own.
// ---------------------------------------------------------------------------

const ORIGINAL_FETCH = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.resetModules();
});

function row(iso3: string, date: string, value: number | null) {
  return { countryiso3code: iso3, date, value, indicator: { id: "X", value: "X" } };
}

/** Loads the adapter fresh so module-level state cannot leak between tests. */
async function loadAdapter() {
  vi.resetModules();
  return await import("@/lib/data-sources/worldbank");
}

describe("World Bank adapter — mrnev truncation fallback", () => {
  it("re-requests the full series when the response is paginated", async () => {
    const urls: string[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);
      // First call: mrnev ignored, 35 pages, page one holds no African rows.
      if (url.includes("mrnev=1")) {
        return new Response(
          JSON.stringify([{ page: 1, pages: 35, total: 17490 }, [row("AFE", "2025", 50.4)]]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      // Fallback: whole series in one page, several years per country.
      return new Response(
        JSON.stringify([
          { page: 1, pages: 1, total: 3 },
          [row("NGA", "2020", 49.1), row("NGA", "2025", 49.4), row("ZAF", "2024", 51.3)],
        ]),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const { fetchWorldBankSnapshot } = await loadAdapter();
    const snap = await fetchWorldBankSnapshot();

    // It must have retried without mrnev rather than accepting the empty result.
    expect(urls.some((u) => u.includes("mrnev=1"))).toBe(true);
    expect(urls.some((u) => !u.includes("mrnev=1") && u.includes("per_page=25000"))).toBe(true);

    // And the most recent observation must win, not the first row seen.
    const pop = snap.values.population ?? {};
    expect(pop.NGA?.value).toBeCloseTo(49.4, 3);
    expect(pop.NGA?.year).toBe(2025);
    expect(pop.ZAF?.value).toBeCloseTo(51.3, 3);
  });

  it("does not make a second request when mrnev is honoured", async () => {
    const urls: string[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return new Response(
        JSON.stringify([{ page: 1, pages: 1, total: 264 }, [row("NGA", "2025", 10)]]),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const { fetchWorldBankSnapshot } = await loadAdapter();
    await fetchWorldBankSnapshot();

    // One request per indicator, no fallback.
    expect(urls.every((u) => u.includes("mrnev=1"))).toBe(true);
    expect(urls.some((u) => u.includes("per_page=25000"))).toBe(false);
  });

  it("yields no value rather than zero when a country is genuinely absent", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify([{ page: 1, pages: 1, total: 1 }, [row("NGA", "2025", null)]]),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const { fetchWorldBankSnapshot } = await loadAdapter();
    const snap = await fetchWorldBankSnapshot();
    expect(snap.values.population?.NGA?.value ?? null).toBeNull();
    expect(snap.values.population?.NGA?.value).not.toBe(0);
  });
});
