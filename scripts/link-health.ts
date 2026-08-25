/**
 * Automated link-health sweep — full pipeline, safe to run in CI.
 *
 *   phase 1  fast wide sweep (12s timeout, concurrency 10)
 *   phase 2  patient re-check of failures only (30s timeout, one retry)
 *   phase 3  regenerate src/lib/data/link-health.ts
 *
 * Phase 2 is not optional. In the first production run, 8 of 19 apparent
 * failures were transient false positives — including studios verified working
 * by hand minutes earlier. Only failures that survive phase 2 are recorded.
 *
 * Exit codes:
 *   0  sweep completed. Broken links are DATA, not a build failure: a studio
 *      letting its domain lapse is not a regression in this repository.
 *   1  the CHECKER looks broken. An implausible share of sites failed, which in
 *      CI almost always means restricted egress rather than a dead web. The
 *      generated file is left untouched so bad data can never be committed.
 *
 * Usage:
 *   npm run health:links               sweep and rewrite the module
 *   npm run health:links -- --check    report only, never write (CI dry-run)
 */
import { writeFileSync } from "node:fs";
import { buildStudioDirectory, normaliseUrl } from "../src/lib/data/studio-directory";

const UA = "AfricaCII/0.1 (link health check)";
const FAST_TIMEOUT = 12_000;
const SLOW_TIMEOUT = 30_000;
const CONCURRENCY = 10;
/** Above this failure share we assume the checker/network is broken, not the web. */
const SANITY_FAIL_RATIO = 0.4;
const OUT_PATH = "src/lib/data/link-health.ts";

const WRITE = !process.argv.includes("--check");

export type HealthStatus =
  | "ok"
  | "redirect"
  | "client_error"
  | "server_error"
  | "dns_error"
  | "tls_error"
  | "timeout"
  | "unknown";

interface Probe {
  status: HealthStatus;
  httpStatus: number | null;
  detail: string | null;
}

interface Row extends Probe {
  id: string;
  name: string;
  countryIso3: string;
  tier: string;
  url: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const healthy = (s: HealthStatus) => s === "ok" || s === "redirect";

function classify(err: unknown): { status: HealthStatus; detail: string } {
  const e = err as { name?: string; message?: string; cause?: { code?: string; message?: string } };
  const code = e?.cause?.code ?? "";
  const msg = `${e?.message ?? ""} ${e?.cause?.message ?? ""}`.toLowerCase();
  if (e?.name === "AbortError" || msg.includes("timeout")) {
    return { status: "timeout", detail: "timed out" };
  }
  if (code === "ENOTFOUND" || msg.includes("getaddrinfo")) {
    return { status: "dns_error", detail: code || "ENOTFOUND" };
  }
  if (code.startsWith("CERT_") || code.includes("TLS") || msg.includes("certificate")) {
    return { status: "tls_error", detail: code || "certificate" };
  }
  if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "EHOSTUNREACH") {
    return { status: "server_error", detail: code };
  }
  return { status: "unknown", detail: code || (e?.message ?? "").slice(0, 60) };
}

async function probe(url: string, timeout: number): Promise<Probe> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
    });
    const finalUrl = res.url || url;
    let status: HealthStatus = "unknown";
    if (res.status >= 200 && res.status < 300) {
      const a = new URL(url).hostname.replace(new RegExp("^www[.]", "i"), "");
      const b = new URL(finalUrl).hostname.replace(new RegExp("^www[.]", "i"), "");
      status = a === b ? "ok" : "redirect";
    } else if (res.status >= 400 && res.status < 500) {
      status = "client_error";
    } else if (res.status >= 500) {
      status = "server_error";
    }
    return { status, httpStatus: res.status, detail: null };
  } catch (err) {
    const { status, detail } = classify(err);
    return { status, httpStatus: null, detail };
  } finally {
    clearTimeout(timer);
  }
}

function renderModule(rows: Row[], issues: Row[], summary: Record<string, number>): string {
  const esc = (v: string | null) => (v === null ? "null" : JSON.stringify(v));
  const body = issues
    .sort((a, b) => a.countryIso3.localeCompare(b.countryIso3) || a.name.localeCompare(b.name))
    .map(
      (r) =>
        `  { id: ${esc(r.id)}, name: ${esc(r.name)}, countryIso3: ${esc(r.countryIso3)}, ` +
        `tier: ${esc(r.tier)}, url: ${esc(r.url)}, status: ${esc(r.status)}, ` +
        `httpStatus: ${r.httpStatus ?? "null"}, detail: ${esc(r.detail)} },`,
    )
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);
  const header = [
    "// ---------------------------------------------------------------------------",
    "// GENERATED FILE - do not hand-edit.  npm run health:links",
    "//",
    "// Automated link-health sweep of every studio website in the directory.",
    "// A dead primary source is itself intelligence: it says an organisation may be",
    "// defunct, or that our record needs re-sourcing.",
    "//",
    "// Method: a fast wide pass, then a PATIENT RE-CHECK of every failure (30s",
    "// timeout, one retry). Only failures surviving the re-check are recorded - in",
    "// the first production run 8 of 19 apparent failures were transient.",
    "//",
    `// Swept ${today} - ${rows.length} sites checked - ${issues.length} confirmed unhealthy.`,
    "// ---------------------------------------------------------------------------",
  ].join("\n");

  return `${header}

export type LinkHealthStatus =
  | "ok"
  | "redirect"
  | "client_error"
  | "server_error"
  | "dns_error"
  | "tls_error"
  | "timeout"
  | "unknown";

export interface LinkHealthRecord {
  id: string;
  name: string;
  countryIso3: string;
  tier: string;
  url: string;
  status: LinkHealthStatus;
  httpStatus: number | null;
  detail: string | null;
}

export const LINK_HEALTH_SWEPT_AT = ${JSON.stringify(today)};
export const LINK_HEALTH_CHECKED = ${rows.length};
export const LINK_HEALTH_SUMMARY: Record<string, number> = ${JSON.stringify(summary)};

/** Only records that FAILED the patient re-check. Healthy sites are omitted. */
export const LINK_HEALTH_ISSUES: LinkHealthRecord[] = [
${body}
];

export const LINK_HEALTH_BY_ID: Record<string, LinkHealthRecord> = Object.fromEntries(
  LINK_HEALTH_ISSUES.map((r) => [r.id, r]),
);

export const HEALTH_LABEL: Record<LinkHealthStatus, string> = {
  ok: "Reachable",
  redirect: "Moved",
  client_error: "Page gone (4xx)",
  server_error: "Server error",
  dns_error: "Domain does not resolve",
  tls_error: "Certificate invalid",
  timeout: "No response",
  unknown: "Unreachable",
};

export function healthFor(id: string): LinkHealthRecord | undefined {
  return LINK_HEALTH_BY_ID[id];
}
`;
}

async function main() {
  const { studios } = buildStudioDirectory();
  const targets = studios
    .map((s) => ({ ...s, url: normaliseUrl(s.website) }))
    .filter((s): s is typeof s & { url: string } => Boolean(s.url));

  console.error(`Phase 1 - sweeping ${targets.length} sites ...`);
  const rows: Row[] = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < targets.length) {
        const s = targets[cursor++]!;
        const p = await probe(s.url, FAST_TIMEOUT);
        rows.push({
          id: s.id,
          name: s.name,
          countryIso3: s.countryIso3,
          tier: s.tier,
          url: s.url,
          ...p,
        });
      }
    }),
  );

  const suspects = rows.filter((r) => !healthy(r.status));
  console.error(`Phase 2 - re-checking ${suspects.length} failures (patient pass) ...`);
  let recovered = 0;
  for (const r of suspects) {
    let p = await probe(r.url, SLOW_TIMEOUT);
    if (!healthy(p.status)) {
      await sleep(1500);
      p = await probe(r.url, SLOW_TIMEOUT);
    }
    if (healthy(p.status)) {
      recovered++;
      Object.assign(r, p);
    }
  }
  console.error(`  recovered ${recovered} of ${suspects.length} (transient)`);

  const issues = rows.filter((r) => !healthy(r.status));
  const summary = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const failRatio = issues.length / (rows.length || 1);

  console.error("\n=== SUMMARY ===");
  for (const [k, v] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    console.error(`${k.padEnd(14)} ${String(v).padStart(3)}  ${((v / rows.length) * 100).toFixed(1)}%`);
  }
  if (issues.length) {
    console.error(`\n=== UNHEALTHY (${issues.length}) ===`);
    for (const r of issues.sort((a, b) => a.countryIso3.localeCompare(b.countryIso3))) {
      console.error(`${r.countryIso3} ${r.tier.padEnd(9)} ${r.status.padEnd(13)} ${r.name} - ${r.url}`);
    }
  }

  // GitHub Actions job summary (no-op locally).
  const ghSummary = process.env.GITHUB_STEP_SUMMARY;
  if (ghSummary) {
    const lines = [
      "### Link-health sweep",
      "",
      `**${rows.length}** sites checked - **${rows.length - issues.length}** healthy - ` +
        `**${issues.length}** unhealthy. ${recovered} transient failure(s) filtered out by the patient re-check.`,
      "",
    ];
    if (issues.length) {
      lines.push(
        "| Studio | Country | Tier | Problem | URL |",
        "|---|---|---|---|---|",
        ...issues.map(
          (r) =>
            `| ${r.name} | ${r.countryIso3} | ${r.tier} | ${r.status}${r.detail ? ` (${r.detail})` : ""} | ${r.url} |`,
        ),
      );
    } else {
      lines.push("All studio websites are reachable.");
    }
    writeFileSync(ghSummary, lines.join("\n") + "\n", { flag: "a" });
  }

  if (failRatio > SANITY_FAIL_RATIO) {
    console.error(
      `\nFAILED: ${(failRatio * 100).toFixed(0)}% of sites failed. That is implausible for the open ` +
        `web and almost certainly means this runner has restricted egress. Refusing to write ${OUT_PATH}.`,
    );
    process.exit(1);
  }

  if (!WRITE) {
    console.error(`\n--check: not writing. ${issues.length} unhealthy.`);
    return;
  }

  writeFileSync(OUT_PATH, renderModule(rows, issues, summary));
  console.error(`\nWrote ${OUT_PATH} - ${issues.length} unhealthy of ${rows.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
