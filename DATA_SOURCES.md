# Data sources & availability

The live source registry is in `src/lib/data-sources/registry.ts` and rendered at `/sources`.

## Live now (Phase 1 + 2)

| Source | Data | Key? | License | Cadence |
|---|---|---|---|---|
| **World Bank WDI** | Population, age structure, urbanisation, GDP (+per-capita, growth), household consumption, internet %, mobile subs, broadband, electricity, secure servers | No | CC BY-4.0 | Annual |
| **Steam (Valve)** | Game metadata (name, release, developers, genres, platforms, price) + **live aggregate review score & counts** | No | Steamworks terms | Daily |

World Bank: 14 indicators × 54 countries, most-recent-non-empty; full history via
`/api/metric/[metricId]`. Steam: fetched per game from the public `appdetails` + `appreviews`
endpoints (`src/lib/data-sources/steam.ts`), cached daily, attributed to Valve; unreachable →
`available:false` → N/A (never fabricated).

## GameDevMap — community studio directory

**Source:** [GameDevMap](https://www.gamedevmap.com/) · **Tier:** COMMUNITY · **Retrieved:** 2026-08-24

A long-running community-maintained directory of game-development organisations worldwide.
**189 listings across 19 African countries** were harvested, resolving to **182 unique entities**
(after name- AND URL-based entity resolution).

**Attribution & compliance**
- Facts only — organisation name, type, city, region, country, own website. No editorial text copied.
- Harvested via the site's **public query interface** (`index.php?country=…`), which robots.txt
  permits. The underlying CSV under `/cmsdata/` is **Disallowed and was not accessed**, despite
  being far more convenient.
- One throttled request per country with a descriptive User-Agent.
- Credited on `/studios`, on every record, and in the source registry (`/sources`).

**Tier discipline.** These records are labelled COMMUNITY and are *not* independently verified.
They never silently merge with VERIFIED records: where a community entry matches one of ours it
**enriches** it (adding an alias and an extra source) rather than creating a duplicate.

**Entity resolution.** Names are normalised (case, accents, apostrophes, punctuation, corporate
suffixes, parenthetical qualifiers) and matched both within the directory and against our verified
set. This caught real duplicates *inside the source*: "NewGen Studio" / "NewGen Studios" (same
domain) and "Sea Monster" / "Sea Monster Entertainment". Alternate websites are retained as
evidence rather than discarded. `tests/studio-directory.test.ts` fails the build if any duplicate
entity reappears.

**A correction it gave us.** GameDevMap lists Kiro'o Games at `kirooworld.com`, which resolves —
while the `kiroogames.com` we held has an expired certificate. Third-party directories are useful
precisely for catching this kind of drift.

## Registered, planned (Phase 2–4)

| Source | Data | Key? | Tier | Phase |
|---|---|---|---|---|
| Steam Web API / Store | Game availability & metadata | No | Official | 2 |
| IGDB | Game metadata | Yes (Twitch OAuth, free) | Third-party | 2 |
| RAWG | Game metadata | Yes (free tier) | Third-party | 2 |
| OpenAlex | Research / talent output | No (CC0) | Verified | 3 |
| Liquipedia (MediaWiki) | Esports tournaments/teams | No (attribution + rate limits) | **Community** | 3 |
| Official studio / org sites | Studio & entity facts | No | Verified | 2–3 |
| IMF, UN WPP, ITU | Macro / population / connectivity cross-checks | No | Verified | 1–2 |

## Store IDs must be verified, never asserted

`scripts/discover-steam.ts` resolves a candidate title to a Steam appid via the keyless
`storesearch` endpoint, then **confirms Steam's own `developers`/`publishers` field names the
expected African studio** before anything enters the dataset. It prints rejected candidates too.

This is not ceremony. An earlier revision carried two appids written from memory, and both were
wrong — `378810` is *Steamroll* (Anticto) and `700990` is *Gunship Battle2 VR* (JOYCITY) — so the
platform rendered unrelated games' review scores under African titles. The harness caught it. Of 24
candidates checked in the last run, **11 were rejected**; guessed Play package ids failed the same
way (3 of 5 returned 404). Always verify against the source.

Note the harness verifies the *studio name*, not the studio's country — African-ness is an editorial
claim recorded in the seed with its own source. Timespinner was dropped for exactly this reason
(Lunar Ray Games is Seattle-based).

## Google Play / Android — no free catalogue API

| Route | Status |
|---|---|
| Google Play Developer API | Only apps **you own** (OAuth + service account) |
| Play Catalog API (2026) | Restricted to registered third-party app stores; returns only *changed* entries |
| 42matters / Similarweb / SerpApi / Netrows | **Paid** — excluded by the free-tier rule |
| Scraping listing HTML | Breaches Play ToS — not done |

So `src/lib/data-sources/googleplay.ts` verifies **presence only**: one cached request confirming
the official listing resolves (200) vs does not exist (404). `play.google.com/robots.txt` permits
`/store/apps/details`; no metadata is parsed. **Installs, ratings and review counts remain N/A** —
displayed with the reason, never estimated.

### Harvest, don't guess

Package ids are **harvested from each studio's own published games page**, then verified. The
difference is stark: guessed package ids hit **2 of 5**; harvested ids hit **5 of 5**. A studio
publishes those links precisely so they'll be followed, which makes it both the accurate route and
the polite one.

Sweep of Aug 2026 (Maliyo, Leti Arts, Usiku, Qene, Carry1st, Kiro'o, Masseka):

| Studio | Play links | Outcome |
|---|---|---|
| Maliyo Games | 5 published | **5 verified (200)** — incl. the Disney *Iwájú* tie-in |
| Leti Arts | none | 4 titles recorded, no store ids |
| Usiku Games | none | 5 titles recorded, no store ids |
| Qene Games | none | 2 titles + 2 AppsAfrica awards recorded |
| Carry1st | none direct | 5 published titles recorded |
| Kiro'o Games | — | ⚠ **SSL certificate expired** — site unverifiable |
| Masseka Game Studio | — | ⚠ **domain no longer resolves** — status downgraded |

Source-health failures are recorded on the studio record rather than quietly ignored: a dead
primary source is itself intelligence about an ecosystem.

## Explicitly excluded from *facts*

Paid-only market data (e.g. Newzoo gaming revenue / gamer counts). Per the free-tier constraint,
these are **not** presented as factual numbers. Where useful, a clearly-labelled free **proxy**
(digital-readiness) is shown instead — see `/markets`.

## Provenance tiers

Every esports/animation/community figure is labelled **OFFICIAL**, **VERIFIED**, or **COMMUNITY**
and never silently mixed. Reliability scores in the registry are transparent editorial judgements
of source authority and are shown in the UI.

## Rate-limit & failure policy

Adapters use `fetch` with daily revalidation (never hammering free APIs), isolate per-series
failures, and on failure retain the last verified value while flagging the source as temporarily
unavailable. History is preserved (`year` + `source` in the unique key) and never overwritten.

## Automated link-health sweep

`npm run health:links` checks every studio website in the directory and records only failures.

**Method matters.** First pass: GET, follow redirects, 12s timeout, concurrency 10 (every URL is a
different host). Every failure is then **re-checked** with a 30s timeout, one retry, and a scheme
fix for malformed URLs. That second pass is not optional — in the 2026-08-24 run **8 of 19 apparent
failures were transient false positives**, including Free Lives, Maliyo Games and Qene Games, all of
which I had verified working by hand. Recording the first pass would have branded live studios dead.

**Result: 182 sites checked · 171 healthy (94%) · 11 confirmed unhealthy.**

| Failure | Count | Examples |
|---|---|---|
| Domain does not resolve | 4 | Masseka Game Studio 🇨🇫, Blackhards 🇳🇬, Logic Dev 🇳🇬, Elder3 🇪🇬 |
| Certificate invalid | 2 | Kiro'o Games 🇨🇲 (expired), Envast 🇹🇳 (altname) |
| Server error | 2 | Leti Arts 🇬🇭, Six Path Studios 🇳🇬 |
| Page gone (4xx) | 2 | AN Games 🇪🇬, CrazyLabs 🇿🇦 |
| Unreachable | 1 | Imisi3D 🇳🇬 (TLS alert) |

Failures surface as ⚠ badges in the directory and as a review table in the admin console. Two of the
eleven are **verified-tier** records of ours, not community entries — decay is not just a
third-party problem.

**Two data-quality fixes the sweep forced:**
- **URL normalisation** — the source contained a bare hostname (`disputedpeoplegames.com`, no
  scheme) that failed as `ERR_INVALID_URL`. URLs are now normalised on the way in.
- **Same-URL entity resolution** — "Lantern Studios" and "Lanterns Studio" have different names but
  an identical website. Name matching missed it; URL matching catches it. Identical site === same
  organisation.

## Development hardware access (`/hardware`)

Hardware is a real constraint on African game production: a studio cannot ship a PC title on
machines it cannot buy, afford, or get repaired. Sourced honestly, that splits three ways.

### Delivered from verified sources

| Metric | Source | Status |
|---|---|---|
| ICT goods imports (% of goods imports) | World Bank `TM.VAL.ICTG.ZS.UN` | Live, 54 countries |
| ICT goods exports (% of goods exports) | World Bank `TX.VAL.ICTG.ZS.UN` | Live — near-zero almost everywhere, which *is* the finding |
| Applied tariff rate (weighted mean) | World Bank `TM.TAX.MRCH.WM.AR.ZS` | Live — directly inflates landed cost |
| Imports of goods & services (% of GDP) | World Bank `NE.IMP.GNFS.ZS` | Live |
| Affordability (months of average income) | Arithmetic on `NY.GDP.PCAP.CD` | Live, price is user input |

The spread is large and decision-relevant: a $1,500 workstation is ~0.9 months of average income in
Seychelles and ~77 months in Burundi, and applied tariffs range from ~1.2% (Mauritius) to ~18%
(Equatorial Guinea).

### Pending — harvester written, run blocked

Retailer density and named hardware stores come from **OpenStreetMap via Overpass** (ODbL, © OSM
contributors). The harvester is written, slot-aware and verified against live data (sample runs
returned 51 mapped computer shops in Kenya and named stores with branch counts in South Africa), but
the 54-country run could not complete from the build environment — the primary endpoint rate-limited
us and public mirrors are unreachable there. **The dataset ships empty rather than invented.** Run
`npm run harvest:hardware` from an environment with Overpass access.

When populated, read it as a *presence signal, not a census*: OSM counts MAPPED retailers, African
retail mapping is uneven, so counts are a lower bound and cross-country comparison is confounded by
mapping intensity.

### Refused — no free licensable source

GPU prices · GPU availability/stock · gaming-PC prices · laptop prices · RAM/SSD prices ·
used-PC availability · warranty availability.

Regional retailers publish no price API and scraping their listings would breach their terms — the
same line held for Google Play pricing. These render **N/A with the reason shown** on the page.

Instead of inventing a price, the affordability model takes the price as a **user input** from their
own quote and does the part that can be done rigorously: months of average income, and a
tariff-adjusted landed cost. That landed cost is explicitly **modelled, not observed** — it applies
an all-products weighted-mean tariff and excludes VAT, freight, clearing and currency spread, so the
UI labels it a directional floor rather than a quote.

## Map geometry & regional aggregates

**Boundaries** — `src/lib/data/africa-geo.ts` is generated from
[johan/world.geo.json](https://github.com/johan/world.geo.json), itself derived from **Natural Earth
(public domain)**. Filtered to the 54 states in our country seed, coordinates rounded to 3dp
(~110 m), and **bundled** rather than fetched at runtime — no CDN dependency, no CSP surprises, and
the map still draws offline. 40KB.

49 of 54 countries have boundary geometry; the source omits five small island states (Cabo Verde,
Comoros, Mauritius, Seychelles, São Tomé and Príncipe). Rather than let them vanish from the map
they are drawn as circle markers from their centroids, and `MISSING_GEOMETRY` records which ones.

**Basemap tiles** — CARTO dark basemaps, attributed in-map to OpenStreetMap contributors and CARTO
as their terms require. The choropleth renders independently, so a tile outage degrades the
backdrop, not the data.

**Regional aggregates** — `worldbank-regions.ts` pulls World Bank region codes (SSF, MEA, EAS, ECS,
LCN, NAC, WLD) for population, GDP, GDP/capita, internet penetration and population growth.

This is a deliberate substitution. The reference dashboard compares regions on *gamers* and *gaming
revenue*; those come from paid market research, so this platform does not reproduce them as fact.
The comparison answers a narrower question using indicators anyone can verify — and it still
carries the core argument: Sub-Saharan Africa's population grows at ~2.4%/yr against a world
average of ~0.9%, the fastest of any region, from the lowest GDP-per-capita base.

## Steam intelligence

`/steam` aggregates live Steam signals across every verified African-developed title, and
`npm run ingest:steam` persists them as **snapshots** (`steam_snapshots`, migration `0003`).

Snapshots accumulate rather than overwrite — `observed_at` is part of the key — because review
scores drift, and keeping the history is what later answers "is this title gaining or losing
goodwill". Same discipline as `metric_values`.

**Catalogue growth.** Discovery run of Aug 2026 added **The Brotherhood** (Cape Town) with four
titles — STASIS, CAYNE, BEAUTIFUL DESOLATION and STASIS: BONE TOTEM — plus Cricket Through the Ages
(Free Lives). Every appid was confirmed against Steam's own `developers` field before entering the
database; four candidates were rejected in the same run and are not present.

**Current state:** 18 verified titles · 6 studios · 2 countries · **114,063 player reviews** ·
93.9% mean positive rating weighted by review volume.

**Two things the page is careful about:**
- The mean rating is **weighted by review volume**. A plain average would let a 90% score on 76
  reviews count as heavily as 96.9% on 60,959, flattering the catalogue.
- Review counts are labelled a **proxy for audience, not sales** — only a fraction of players leave
  one, so they support relative comparison and not revenue estimation.

Data © Valve Corporation via the public Steam Web API, cached daily. Prices are US-region list
prices and differ in local storefronts. An unreachable title records nothing rather than writing a
zero.

## Demographics

`/demographics` adds 12 World Bank series covering age structure, gender, income, education,
employment, connectivity and urbanisation — verified, per country, across all 54.

**What was deliberately not copied.** The reference platform's demographics page is a *gamer survey*
("weighted survey · n=24,800 across 15 markets") covering age, gender, income, education,
occupation, daily play hours, device ownership and urban/rural. Those numbers were not reproduced.
We did not run that survey, and republishing someone else's research under our own provenance is
the same failure as printing a Newzoo revenue figure or an invented GPU price. "n=24,800" would be a
lie coming from us.

**What replaced it.** Seven of the reference's eight categories have a genuine official equivalent:

| Category | Verified source |
|---|---|
| Age distribution | `SP.POP.0014.TO.ZS`, `SP.POP.1564.TO.ZS`, `SP.POP.65UP.TO.ZS` |
| Gender | `SP.POP.TOTL.FE.ZS`, `SL.TLF.CACT.FE.ZS` |
| Income | `NY.GNP.PCAP.CD`, `SI.POV.GINI` |
| Education | `SE.ADT.LITR.ZS`, `SE.SEC.ENRR`, `SE.TER.ENRR` |
| Occupation / employment | `SL.TLF.CACT.ZS`, `SL.UEM.TOTL.ZS`, `SL.UEM.1524.ZS` |
| Device ownership | `IT.NET.USER.ZS`, `IT.CEL.SETS.P2`, `EG.ELC.ACCS.ZS` |
| Urban vs rural | `SP.URB.TOTL.IN.ZS`, `SP.RUR.TOTL.ZS` |

The eighth — **daily play hours, genre preference and gamer gender split** — genuinely requires
primary research, so the page carries an explicit N/A panel saying so instead of estimating.

This is arguably the more useful artefact anyway: per-country across all 54 states rather than a
single continent-wide survey aggregate, with each observation's publication year on screen and
every figure clickable through to its source.

## Gamer demographics — attributed survey research

`/demographics` now leads with **gamer demographics**: the eight categories requested (age, gender,
income, education, occupation, daily hours, device ownership, urban/rural), each clickable through
to a drill-down carrying the figures and their source.

**The rule applied here.** Every number is one PUBLISHED BY A NAMED RESEARCHER, reported with their
sample size, markets, date, methodology and a link — presented as *"GeoPoll found X"*, never *"we
found X"*. This platform has run no player survey and does not imply otherwise. That is the
difference between citing research and appropriating it.

| Source | Sample | Markets |
|---|---|---|
| **GeoPoll**, Gaming in Africa 2024 | 2,500+ gamers | Egypt, Kenya, Nigeria, South Africa |
| **GeoPoll & PAGG**, Gaming in Africa 2025 | 6,000+ players | + Senegal, Tanzania |
| **Newzoo × Carry1st**, Africa Games Market | Newzoo panel: 73,000+ across 36+ markets | Continental estimate |

**Coverage is honest about itself:** 3 categories carry published figures (income/spending, daily
hours, device ownership), 2 are partial (age — only a qualitative "16–35" band; gender — only a
reported direction of skew), and 3 have **no free published figure at all** (education, occupation,
urban/rural of gamers). The unpublished three say so and name what would close the gap, rather than
being estimated into existence.

The continental totals (349M gamers, 304M mobile, $1.8B revenue) are Newzoo × Carry1st's **modelled
estimates**, labelled as such — they are not a census and not ours.

Population demographics moved to a second tab. Blending the two would let a 2,500-person survey in
four markets masquerade as a continental fact, so they stay separate with separate provenance.
