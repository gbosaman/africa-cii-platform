/**
 * Hardware-retail harvest from OpenStreetMap via the Overpass API.
 *
 * Source: OpenStreetMap contributors, ODbL 1.0 — attribution REQUIRED.
 *         https://www.openstreetmap.org/copyright
 *
 * Overpass is a donated community service, so this script is deliberately
 * gentle: ONE query per country, sequential, with a delay between them, a
 * descriptive User-Agent, and results cached into a generated module so the
 * running app never queries Overpass at request time.
 *
 * IMPORTANT INTERPRETATION NOTE (carried into the UI):
 * This measures MAPPED retailers, not actual retailers. OSM retail coverage in
 * Africa is incomplete and uneven, so counts are a LOWER BOUND and cross-country
 * comparison is confounded by mapping intensity. It is never presented as a
 * complete census.
 *
 * Run: npx tsx scripts/harvest-hardware-retail.ts > hardware.json
 */
import { COUNTRIES } from "../src/lib/data/countries";

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const UA = "AfricaCII/0.1 (Africa Creative Industries Intelligence; research; contact via repository)";
const STATUS_ENDPOINT = "https://overpass-api.de/api/status";
const DELAY_MS = 4000;
const TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 4;

export interface RetailStore {
  name: string;
  branches: number;
  website: string | null;
}

export interface CountryRetail {
  iso3: string;
  iso2: string;
  computerShops: number;
  electronicsShops: number;
  total: number;
  namedStores: RetailStore[];
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildQuery(iso2: string): string {
  // One query returns both the counts and the named elements we need.
  return `[out:json][timeout:80];
area["ISO3166-1"="${iso2}"][admin_level=2]->.a;
(node["shop"="computer"](area.a);way["shop"="computer"](area.a););out count;
(node["shop"="electronics"](area.a);way["shop"="electronics"](area.a););out count;
(node["shop"~"^(computer|electronics)$"]["name"](area.a);
 way["shop"~"^(computer|electronics)$"]["name"](area.a););out tags;`;
}

interface OverpassElement {
  type: string;
  tags?: Record<string, string>;
}

/**
 * Overpass enforces slot-based rate limiting (see /api/status: "Rate limit: N").
 * Rather than firing blindly and collecting 429s, we ASK the server when a slot
 * is free and wait for it. This is the difference between using a donated
 * community service and abusing it.
 */
async function waitForSlot(): Promise<void> {
  try {
    const res = await fetch(STATUS_ENDPOINT, { headers: { "User-Agent": UA } });
    if (!res.ok) return;
    const text = await res.text();
    const m = text.match(/in ([0-9]+) seconds/);
    const running = (text.match(/^[0-9]+[^a-zA-Z]/gm) ?? []).length;
    const limitMatch = text.match(/Rate limit: ([0-9]+)/);
    const limit = limitMatch ? Number(limitMatch[1]) : 2;
    if (m && running >= limit) {
      const wait = Math.min(Number(m[1]) + 2, 90);
      console.error(`  … no slot free, waiting ${wait}s`);
      await sleep(wait * 1000);
    }
  } catch {
    // status unavailable — fall through to the normal delay
  }
}
async function harvestOnce(iso3: string, iso2: string): Promise<CountryRetail> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: buildQuery(iso2) }).toString(),
    });
    if (!res.ok) {
      return { iso3, iso2, computerShops: 0, electronicsShops: 0, total: 0, namedStores: [], error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { elements: OverpassElement[] };
    const els = json.elements ?? [];

    // The two `out count;` results arrive first, in query order.
    const counts = els.filter((e) => e.type === "count");
    const computerShops = Number(counts[0]?.tags?.total ?? 0);
    const electronicsShops = Number(counts[1]?.tags?.total ?? 0);

    // Named shops: collapse branches of the same name.
    const byName = new Map<string, RetailStore>();
    for (const e of els) {
      if (e.type === "count") continue;
      const name = e.tags?.name?.trim();
      if (!name) continue;
      const hit = byName.get(name);
      if (hit) {
        hit.branches += 1;
        if (!hit.website && e.tags?.website) hit.website = e.tags.website;
      } else {
        byName.set(name, { name, branches: 1, website: e.tags?.website ?? null });
      }
    }
    const namedStores = [...byName.values()].sort(
      (a, b) => b.branches - a.branches || a.name.localeCompare(b.name),
    );

    return {
      iso3,
      iso2,
      computerShops,
      electronicsShops,
      total: computerShops + electronicsShops,
      namedStores,
    };
  } catch (err) {
    return {
      iso3, iso2, computerShops: 0, electronicsShops: 0, total: 0, namedStores: [],
      error: (err as Error).name === "AbortError" ? "timeout" : (err as Error).message.slice(0, 60),
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Retry wrapper: exponential backoff on 429 (rate limit) and 504 (too heavy). */
async function harvestCountry(iso3: string, iso2: string): Promise<CountryRetail> {
  let last: CountryRetail | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await waitForSlot();
    const r = await harvestOnce(iso3, iso2);
    if (!r.error) return r;
    last = r;
    const retryable = /429|504|timeout|ECONNRESET/.test(r.error);
    if (!retryable || attempt === MAX_ATTEMPTS) break;
    const backoff = Math.min(15_000 * 2 ** (attempt - 1), 90_000);
    console.error(`  … ${r.error}, retrying in ${backoff / 1000}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
    await sleep(backoff);
  }
  return last!;
}

async function main() {
  const out: CountryRetail[] = [];
  for (const c of COUNTRIES) {
    const r = await harvestCountry(c.iso3, c.iso2);
    out.push(r);
    console.error(
      `${c.name.padEnd(26)} computer=${String(r.computerShops).padStart(4)} ` +
        `electronics=${String(r.electronicsShops).padStart(5)} named=${String(r.namedStores.length).padStart(4)}` +
        (r.error ? `  ERROR ${r.error}` : ""),
    );
    await sleep(DELAY_MS);
  }
  const failed = out.filter((o) => o.error);
  console.error(`\nDone. ${out.length - failed.length}/${out.length} countries harvested; ${failed.length} errored.`);
  console.error(`Total mapped hardware/electronics retailers: ${out.reduce((s, o) => s + o.total, 0)}`);
  console.log(JSON.stringify({ harvestedAt: new Date().toISOString(), countries: out }, null, 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
