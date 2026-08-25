import { STUDIOS, GAMES } from "@/lib/data/studios";
import { ANIMATION_STUDIOS } from "@/lib/data/creative";
import { FUNDING_ROUNDS } from "@/lib/data/funding";
import { fmtNumber } from "@/lib/format";
import type { IndustryEvent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Structured industry-events feed. NOT a news scraper — events are DERIVED
// from the verified data the platform already holds (studio foundings, game
// releases, disclosed funding, milestones, partnerships), each linking back to
// its source. Only dated, source-backed facts become events.
// ---------------------------------------------------------------------------

export function buildIndustryEvents(): IndustryEvent[] {
  const events: IndustryEvent[] = [];
  /** ISO date for a year, or null when the year is unknown. The events feed is
   *  a timeline: an undated fact is omitted here (it still shows on the entity
   *  page) rather than being given an invented date. */
  const iso = (y: number | null | undefined): string | null =>
    y && y > 1000 ? `${y}-01-01` : null;

  for (const s of STUDIOS) {
    const founded = iso(s.foundedYear);
    if (founded) {
      events.push({
        id: `founded-${s.id}`,
        eventType: "studio_founded",
        entity: s.name,
        countryIso3: s.countryIso3,
        date: founded,
        description: `${s.name} founded in ${s.city ?? "—"}.`,
        sourceUrl: s.website ?? undefined,
        importance: "low",
        verified: s.verified,
      });
    }
  }

  for (const g of GAMES) {
    const released = iso(g.releaseYear);
    if (released) {
      events.push({
        id: `released-${g.id}`,
        eventType: "game_released",
        entity: g.title,
        countryIso3: g.countryIso3,
        date: released,
        description: `${g.title} released${g.platforms?.length ? ` on ${g.platforms.join(", ")}` : ""}.`,
        sourceUrl: g.storeLinks?.steam ?? g.sources[0]?.url,
        importance: "medium",
        verified: g.verified,
      });
      // Milestones are dated to the title's release year; undated titles keep
      // their milestones on the game page instead of the timeline.
      for (const a of g.achievements ?? []) {
        events.push({
          id: `milestone-${g.id}-${a.slice(0, 12)}`,
          eventType: "award",
          entity: g.title,
          countryIso3: g.countryIso3,
          date: released,
          description: a,
          sourceUrl: g.sources[0]?.url,
          importance: "high",
          verified: g.verified,
        });
      }
    }
  }

  for (const r of FUNDING_ROUNDS) {
    const dated = iso(r.year);
    if (!dated) continue;
    events.push({
      id: `funding-${r.id}`,
      eventType: "funding",
      entity: r.entityName,
      countryIso3: r.countryIso3,
      date: dated,
      description:
        `${r.entityName} raised ${r.amountUsd ? `$${fmtNumber(r.amountUsd).replace("$", "")}` : "an undisclosed amount"}` +
        ` (${r.round})${r.leadInvestors?.length ? `, led by ${r.leadInvestors.join(", ")}` : ""}.`,
      sourceUrl: r.sourceUrl,
      importance: "high",
      verified: r.disclosed,
    });
  }

  for (const a of ANIMATION_STUDIOS) {
    const founded = iso(a.foundedYear);
    if (a.internationalPartners?.length && founded) {
      events.push({
        id: `partnership-${a.id}`,
        eventType: "partnership",
        entity: a.name,
        countryIso3: a.countryIso3,
        date: founded,
        description: `${a.name} international partnership: ${a.internationalPartners.join(", ")}.`,
        sourceUrl: a.website,
        importance: "medium",
        verified: a.verified,
      });
    }
  }

  // Most recent first; undated (year 0) sink to the bottom.
  return events.sort((x, y) => (y.date > x.date ? 1 : y.date < x.date ? -1 : 0));
}

export const EVENT_META: Record<string, { label: string; tone: "gold" | "emerald" | "slate" }> = {
  studio_founded: { label: "Studio founded", tone: "slate" },
  game_released: { label: "Game released", tone: "emerald" },
  funding: { label: "Funding", tone: "gold" },
  award: { label: "Milestone", tone: "gold" },
  partnership: { label: "Partnership", tone: "emerald" },
  publisher_deal: { label: "Publisher deal", tone: "emerald" },
  tournament: { label: "Tournament", tone: "slate" },
  acquisition: { label: "Acquisition", tone: "gold" },
};
