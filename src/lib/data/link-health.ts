// ---------------------------------------------------------------------------
// GENERATED FILE - do not hand-edit.  npm run health:links
//
// Automated link-health sweep of every studio website in the directory.
// A dead primary source is itself intelligence: it says an organisation may be
// defunct, or that our record needs re-sourcing.
//
// Method: a fast wide pass, then a PATIENT RE-CHECK of every failure (30s
// timeout, one retry). Only failures surviving the re-check are recorded - in
// the first production run 8 of 19 apparent failures were transient.
//
// Swept 2026-08-24 - 181 sites checked - 14 confirmed unhealthy.
// ---------------------------------------------------------------------------

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

export const LINK_HEALTH_SWEPT_AT = "2026-08-24";
export const LINK_HEALTH_CHECKED = 181;
export const LINK_HEALTH_SUMMARY: Record<string, number> = {"dns_error":5,"tls_error":2,"ok":162,"server_error":2,"redirect":5,"client_error":2,"timeout":3};

/** Only records that FAILED the patient re-check. Healthy sites are omitted. */
export const LINK_HEALTH_ISSUES: LinkHealthRecord[] = [
  { id: "masseka-game-studio", name: "Masseka Game Studio", countryIso3: "CAF", tier: "verified", url: "https://massekagamestudio.com", status: "dns_error", httpStatus: null, detail: "ENOTFOUND" },
  { id: "kiroo-games", name: "Kiro'o Games", countryIso3: "CMR", tier: "verified", url: "https://kiroogames.com", status: "tls_error", httpStatus: null, detail: "CERT_HAS_EXPIRED" },
  { id: "gdm-an-games", name: "AN Games", countryIso3: "EGY", tier: "community", url: "https://angamesstudio.com", status: "client_error", httpStatus: 403, detail: null },
  { id: "gdm-elder3-studio", name: "Elder3 Studio", countryIso3: "EGY", tier: "community", url: "https://elder-3-studio.games", status: "dns_error", httpStatus: null, detail: "ENOTFOUND" },
  { id: "gdm-gmind", name: "GMind", countryIso3: "EGY", tier: "community", url: "https://gmind-edu.com", status: "dns_error", httpStatus: null, detail: "ENOTFOUND" },
  { id: "gdm-rumbling-games", name: "Rumbling Games", countryIso3: "EGY", tier: "community", url: "https://rumbling-games.com", status: "timeout", httpStatus: null, detail: "timed out" },
  { id: "leti-arts", name: "Leti Arts", countryIso3: "GHA", tier: "verified", url: "https://letiarts.com", status: "server_error", httpStatus: 500, detail: null },
  { id: "gdm-ogames", name: "Ogames", countryIso3: "GHA", tier: "community", url: "https://ogamesstudio.com", status: "timeout", httpStatus: null, detail: "timed out" },
  { id: "gdm-blackhards", name: "Blackhards", countryIso3: "NGA", tier: "community", url: "https://blackhards.com", status: "dns_error", httpStatus: null, detail: "ENOTFOUND" },
  { id: "gdm-imisi3d", name: "Imisi3D", countryIso3: "NGA", tier: "community", url: "https://imisi3d.com", status: "tls_error", httpStatus: null, detail: "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR" },
  { id: "gdm-logic-dev", name: "Logic Dev", countryIso3: "NGA", tier: "community", url: "https://logicdevstudios.com", status: "dns_error", httpStatus: null, detail: "ENOTFOUND" },
  { id: "gdm-six-path-studios", name: "Six Path Studios", countryIso3: "NGA", tier: "community", url: "https://studio.gameverseafrica.org", status: "server_error", httpStatus: null, detail: "ECONNRESET" },
  { id: "gdm-digital-realm", name: "Digital Realm", countryIso3: "RWA", tier: "community", url: "https://digitalrealm-entertainment.com", status: "timeout", httpStatus: null, detail: "timed out" },
  { id: "gdm-crazylabs-embracer-group", name: "CrazyLabs (Embracer Group)", countryIso3: "ZAF", tier: "community", url: "https://crazylabs.com", status: "client_error", httpStatus: 403, detail: null },
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
