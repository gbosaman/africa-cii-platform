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
| Education | `SE.ADT.LITR.ZS`, `SE.SEC.ENRR`, `SE.TER.ENRR`, `SE.PRM.CUAT.ZS`, `SE.SEC.CUAT.LO.ZS`, `SE.SEC.CUAT.UP.ZS`, `SE.TER.CUAT.BA.ZS`, `SE.ADT.1524.LT.ZS`, `SE.XPD.TOTL.GD.ZS` |
| Occupation / employment | `SL.TLF.CACT.ZS`, `SL.UEM.TOTL.ZS`, `SL.UEM.1524.ZS` |
| Device ownership | `IT.NET.USER.ZS`, `IT.CEL.SETS.P2`, `EG.ELC.ACCS.ZS` |
| Urban vs rural | `SP.URB.TOTL.IN.ZS`, `SP.RUR.TOTL.ZS`, `SP.URB.TOTL`, `SP.URB.GROW`, `EG.ELC.ACCS.UR.ZS`, `EG.ELC.ACCS.RU.ZS` |

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

### Occupation — the denominator trap

The occupation card fills the four requested buckets (employed, self-employed, unemployed, student)
from **ILO modelled estimates via the World Bank**, for all 54 countries.

The care this needed: the three obvious indicators are measured against **three different
denominators**, and stacking them naively produces a chart that looks fine and means nothing.

| Indicator | Native denominator |
|---|---|
| `SL.EMP.TOTL.SP.ZS` employment-to-population | % of the **15+ population** |
| `SL.UEM.TOTL.ZS` unemployment rate | % of the **labour force** |
| `SL.EMP.SELF.ZS` self-employed | % of **total employment** |

Everything is therefore re-expressed as a share of the 15+ population — the only base on which the
buckets can be compared or summed — using the identity `participation = employed + unemployed`.
The four buckets then sum to 100% by construction, which `tests/occupation.test.ts` asserts.

**Africa, population-weighted:** wage-employed 16.5% · **self-employed 45.2%** · unemployed 3.8% ·
not in labour force 34.4%. The country spread is the finding: Nigeria is 68.9% self-employed against
South Africa's 6.5%, while South Africa carries 18.0% unemployment against Nigeria's 2.5% — the
informal/formal economy split, not a prosperity gap.

**Two limits stated on the card:** "student" cannot be isolated from *not in the labour force*
(which also holds homemakers, retired and discouraged workers) with free data, so the bucket is
labelled honestly and youth NEET is shown alongside as the closest read on disconnected youth. And
these are **working-age population figures, not gamers** — African gamers skew 16–35 and urban, so
their mix almost certainly differs.

### Urban vs rural — the weighting trap, and why electrification is the real story

The urban/rural card is built from four World Bank series, all keyless, all CC BY-4.0, all with
complete African coverage (verified against the live API before use):

| Indicator | What it gives |
|---|---|
| `SP.URB.TOTL` urban population | Absolute urban headcount, used to derive rural as the residual |
| `SP.URB.GROW` urban population growth | Annual % — how fast cities are absorbing people |
| `EG.ELC.ACCS.UR.ZS` access to electricity, urban | % of the **urban** population |
| `EG.ELC.ACCS.RU.ZS` access to electricity, rural | % of the **rural** population |

**The population split is the easy half.** The half that matters for this platform is
electrification: a rural population with 1% grid access cannot play games regardless of how young,
connected or numerous it is. Power is the gate before device, before data, before content — so the
card leads with the gap, not with the urban share.

**The weighting trap.** Urban electrification must be weighted by **urban** population and rural
electrification by **rural** population. Weighting both by total population lets a heavily-urban
country drag the rural average toward a figure no rural person experiences.
`tests/settlement.test.ts` asserts this directly, including a case that computes the wrong,
total-population-weighted number and requires the output not to equal it.

**Africa, correctly weighted:** urban 46.4% (717M) · rural 53.6% (829M) · urban electrification
85.8% against rural **43.1%** — a **42.8 percentage-point gap**. Cities grow 3.2% a year, so the
reachable audience expands through migration as well as birth.

The country spread is again the finding, and it is severe: **Libya** runs 100% urban access against
0.8% rural (99.2pp), **Mauritania** 94.2% against 0.8%, **Equatorial Guinea** 89.3% against 5.1%,
**Angola** 78.0% against 1.3%. In those four markets the rural population is, for gaming purposes,
almost entirely unreachable — and a national "electricity access" average conceals that completely.

**The limit stated on the card:** these are **population** figures, not gamers. No free survey
splits African gamers by settlement type, and mobile-survey recruitment systematically under-reaches
rural respondents — so even a commissioned study would need careful rural weighting before its
urban/rural split could be trusted. The card is marked *partial* for that reason, not *published*.

### Education level — a cumulative ladder and the wrong denominator

The education card is built from the UNESCO/World Bank attainment series for the population aged
25+, all keyless and CC BY-4.0, verified against the live API before use (51/54 coverage on the
secondary rungs, 49/54 on the degree rung, median observation year 2022):

| Indicator | Rung |
|---|---|
| `SE.PRM.CUAT.ZS` | At least completed primary |
| `SE.SEC.CUAT.LO.ZS` | At least completed lower secondary |
| `SE.SEC.CUAT.UP.ZS` | At least completed upper secondary |
| `SE.TER.CUAT.BA.ZS` | At least a bachelor's degree |
| `SE.ADT.1524.LT.ZS` | Youth literacy, 15–24 |
| `SE.XPD.TOTL.GD.ZS` | Government education spending, % of GDP |

**Trap one: the ladder is cumulative.** Every series reads *"at least completed X"*, so the rungs
are nested — `primary+ ⊇ lower secondary+ ⊇ upper secondary+ ⊇ bachelor+`. Charting them side by
side counts every graduate again at every rung below their own; on Nigeria the raw series total
160%. They are therefore differenced into mutually exclusive buckets, clamped at zero because rungs
drawn from different survey years are not guaranteed locally monotone.

**Trap two: the denominator is the 25+ population, not everyone.** Africa's 25+ share runs from
33% (Niger) to 63% (Tunisia), so a continental average weighted by *total* population systematically
over-weights the youngest — and lowest-attainment — countries. Measured on live data that shifts
"at least primary" by 1.4pp. We derive the 25+ headcount from the age bands (`SP.POP.1519.*.5Y`,
`SP.POP.2024.*.5Y`, `SP.POP.0014.TO.ZS`, `SP.POP.TOTL.FE.ZS`) and weight by that instead.

A third, subtler issue: averaging each bucket over whichever countries happen to report it produces
five averages over five different denominators, which then sum to 100.5 rather than 100. The
continental split therefore uses **complete cases only** — the 49 countries with a full ladder — and
reports that count on the card. `tests/education.test.ts` asserts the differencing, the clamping,
the 25+ weighting and the sum.

**Africa, weighted by the 25+ population:** did not complete primary **44.1%** · primary only 16.1%
· lower secondary only 12.5% · upper secondary but no degree 19.4% · **degree 7.9%**. Sum: 100.0%.

Two findings worth naming. **Youth literacy (82.5%) runs 13.6pp ahead of adult literacy (68.9%)** —
schooling expansion showing up in the data, and the youth figure is the relevant one for an audience
that skews young. And attainment is **polarised, not uniformly low**: Egypt 18.1% degree-holding
against 30.8% who did not finish primary; Comoros 14.1% against 53.0%.

**The limit stated on the card:** these are population figures for the 25+, while African gamers
skew 16–35 — a younger, better-schooled cohort — so their mix is almost certainly higher than shown.
Marked *partial*, not *published*.

### A silent-truncation bug in the World Bank adapter

Found while verifying the education indicators, and worth recording because the failure mode is
invisible.

A handful of WDI indicators **silently ignore `mrnev=1`** (most-recent-non-empty) and return their
entire time series instead of one row per country. The adapter requested a fixed `per_page=500`, so
the response was truncated at page one — which, for a 17,490-row series sorted by economy, never
reaches most African ISO3 codes. The indicator then resolved to N/A for all 54 countries.

`SP.POP.TOTL.FE.ZS` was doing exactly this in production: **0/54 coverage against data that exists**,
meaning the Gender card in population demographics had been rendering N/A for every country. That is
the worst failure this platform can have — it is indistinguishable from a genuine "not published"
gap unless you check the row count.

The fix: a multi-page response is the tell, so the adapter now re-requests the full series in a
single page and reduces to the most-recent non-empty observation per country itself. An audit of all
37 indicators found this one affected; coverage went 0/54 → 54/54.
`tests/worldbank-pagination.test.ts` covers the fallback, the no-op fast path, and the rule that a
genuinely absent value stays null rather than becoming zero.

### Charts — when a pie is a lie

The demographics cards render as bar and pie charts. Which one is not a styling choice.

**A pie asserts a partition.** Its slices claim to be mutually exclusive and to sum to one whole.
Drawing overlapping survey percentages as a pie claims a relationship the data does not have — a
respondent who has bought a game can also prefer free games and still name cost as a barrier, so
those slices would overlap and the circle would be false. The income figures sum to **256%**.

So the rule applied across the page:

| Category | Chart | Why |
|---|---|---|
| Age distribution | Pie | Population age bands partition to 100% |
| Gender | Pie | Female/male partition to 100% |
| Income bracket | **Bar** | Overlapping survey responses, sum 256% |
| Education level | Pie + bar | Attainment partitions; literacy and spending do not |
| Occupation | Pie + bar | Four buckets partition; youth NEET has another denominator |
| Daily gaming hours | **Bar** | Nested thresholds — everyone in "3+ hours" is inside "1+ hour" |
| Urban vs rural | Bar | Includes percentage-point gaps, which are not shares |
| Device ownership | Bar | Overlapping platform ownership |

This is enforced in three places: `PieChart` refuses to draw and explains itself if its values miss
100% by more than 1.5pp; every pie carries a caption stating what the shape does and does not claim;
and `tests/demographics-charts.test.ts` asserts the partitions sum, that the overlapping series are
declared as bars, and that the income series really does exceed 100%.

**Age and gender needed data before they could be charted at all.** Both cards previously held only
qualitative statements — "mostly 16–35", "largely male" — with no numeric split published anywhere
free. Those cannot be charted without inventing the numbers. What is charted instead is the
**population** structure they are drawn from (`SP.POP.0014.TO.ZS`, the 15–24 bands, `SP.POP.65UP.TO.ZS`,
`SP.POP.TOTL.FE.ZS`), weighted by country population, with the 25–64 band taken as the residual so
the four bands always partition exactly. Both captions say in as many words that this is the pool of
people, not a measured split of players — and the qualitative rows remain on the card as **N/A**
rather than being dissolved into slices. Africa: under-15 38.8% · 15–24 19.7% · 25–64 37.8% · 65+
3.7%. Population sex split 50.1% female — near-even, while the gamer split is reported male-skewed
by an unpublished margin, which is exactly why the two must not be read as one.

**A follow-up fix to the truncation fallback.** Scoping it to `country/all` pulled 5.6MB, which
exceeds the Next data-cache ceiling of 2MB — so the response was never cached and refetched on every
single request, which is both slow and rude to a free API. The fallback now scopes to the 54 African
ISO3 codes: 0.81MB, one page, still 54/54 coverage, and no date bound, so an indicator whose most
recent observation is old is still found.

## African animation — competitive map

`/animation` carries a 48-studio competitive map across 17 countries: Algeria, Cameroon, Côte
d'Ivoire, Egypt, Ethiopia, Ghana, Kenya, Morocco, Nigeria, Rwanda, Senegal, South Africa, Tanzania,
Tunisia, Uganda, Zambia and Zimbabwe. Every row carries its sources.

### The rule that governs the whole table: no field asserts absence

Capability and distribution flags are typed `true | null`. **There is no `false`.**

"We found no evidence of a Netflix deal" is not "this studio has no Netflix deal". Writing `false`
would convert absence of evidence into a positive claim about a real, named company — the boolean
form of the ZERO ≠ UNKNOWN rule, and more damaging here because it would understate a real business
on a page that reads as a competitive assessment. A dimmed cell means *not documented*, and the
drawer says so in as many words. `tests/animation-studios.test.ts` asserts no flag is ever `false`.

### What was excluded, and why the count is 48 rather than 100

Several widely-syndicated "top African animation studios" listicles name studios with no founder, no
founding year, no website and no production anyone can check — some read as generated filler. Those
names are not reproduced here. Padding the count with unverifiable companies would make every other
row suspect, so the map is shorter than it could be and every row is checkable.

**One error caught and corrected in passing:** a listicle credits *Iwájú* to Anthill Studios. It is
not theirs. *Iwájú* was Walt Disney Animation Studios with Kugali Media, animated at Cinesite, and
premiered on Disney+ on 28 February 2024. Anthill's record stands on its own work, and a test pins
the correction so the error cannot creep back in.

Provenance splits 8 official / 19 third-party verified / 21 community-or-press. Closed studios are
labelled rather than dropped — Clockwork Zoo was South Africa's largest animation studio until it
closed in 2011, and a competitive map that silently omits failures misrepresents sector risk.

### Tiers are editorial, and say so

🔵 Big · 🟣 Scale-up · 🟢 Established indie · 🟡 Emerging indie. The criteria are printed on the page
beside the tier filter so a reader can disagree with a call rather than mistake it for a published
fact. A test enforces that the top tier requires both a documented platform credit and original IP.

### Why the studio count does NOT feed the "best for animation" ranking

The obvious move — use the 48 rows as the industry-maturity input — was tried and reverted.

A raw row count measures how well a country is **documented**, not how much industry it has. The map
holds 19 Nigerian studios against 6 South African ones, because Nigerian animation is covered in
depth by English-language trade press while South Africa is not enumerated the same way — despite
hosting Triggerfish and Sunrise Productions, the two deepest international slates on the continent.
Wiring it in normalised Nigeria to 100 and South Africa to 32, and dropped South Africa's animation
score from 75.7 to 73.9. That is a research artefact presented as an industry finding.

The ranking therefore still uses the original curated seed, and `animationProfileCountByCountry()`
carries the reasoning at the call site. A defensible replacement would weight by documented
international credits or tier rather than by row count; that measure does not exist yet, and
inventing one to justify the wiring would be the same mistake in a different costume.

### Studio advisor — distribution channels

The advisor takes a distribution selection (YouTube, Netflix, Prime Video, film festivals, Google
Play, Apple App Store, PC/Steam, console) and folds it into the budget, the risks and the next
steps. Fees are published list prices, dated `2026-08-25`, each carrying its source.

**These are not the same kind of thing, and the form says so.** Channels are classed by how you
actually get in:

| Access | Meaning | Channels |
|---|---|---|
| Self-serve | Publish yourself today for a published fee | YouTube, Google Play, App Store, Steam |
| Gated | Open in principle, approval or curation in front | Prime Video Direct, film festivals, console |
| Commissioned only | You cannot choose it; someone chooses you | Netflix |

**Netflix is the case that matters.** It does not accept unsolicited self-submissions, so "we'll
release on Netflix" is an outcome of being commissioned, not a step in a plan. Listing it beside
Google Play — where $25 and a build genuinely gets you listed — would flatter the plan and mislead
the person writing it. Selecting it raises a risk explaining that the realistic route is a
co-production with a studio that already holds the relationship, as Supa Team 4 reached Netflix
through Triggerfish with Cake Entertainment.

Prime Video is deliberately *not* grouped with Netflix: Prime Video Direct is a real self-submission
route — it is how AnimaxFYB reached the platform from Accra — though Amazon no longer accepts
unsolicited non-fiction or short-form through it, and pays per hour streamed rather than a
percentage, so revenue cannot be projected the way a store cut can.

**Verified fees:** Google Play $25 one-time; Apple Developer Program $99/year; Steam Direct $100 per
title, recoupable at $1,000 of adjusted gross revenue; YouTube free to upload. **Cuts:** Play and
App Store 15% under $1M then 30%; Steam 30/25/20 by lifetime revenue; YouTube keeps 45% of long-form
ad revenue. Console dev-kit costs and festival submission fees are **null, not zero** — the first is
under NDA, the second is set per festival — and the UI renders those as *"fee not published"* rather
than *"free"*. That distinction was a live bug caught during verification: rendering an unpublished
fee as free understates a real cost to someone budgeting against it.

One forward-looking note the advisor surfaces: the YouTube Partner Program threshold rises on
1 February 2027 to 8,000 watch hours for new applicants, so a studio starting now should plan
against the higher bar rather than today's 4,000.

### Animation studios in the studio directory

The 48-row animation competitive map is folded into `/studios`, and **Animation** is a selectable
type in the directory's type filter.

**Deduplication, not concatenation.** Several studios appear in both datasets, so animation records
resolve against the existing directory by normalised name and by normalised URL — the same matching
the GameDevMap fold-in uses. A match enriches the existing record (adds the `Animation` category,
the alias and the animation sources) instead of creating a second row. Sea Monster is the live case:
it is a GameDevMap-listed game developer *and* an animation house, so it appears once, findable
under both `Developer` and `Animation`. `tests/directory-animation.test.ts` asserts no
name-plus-country pair ever appears twice.

Because a studio can legitimately hold more than one type, the filter matches against a **list** of
type labels rather than a single one. Relabelling Sea Monster as "Animation" would have hidden it
from the game-developer filter it also belongs in.

**Provenance is not widened in transit.** This directory defines *verified* as sourced to the
organisation's own site and checked by us. Only the animation map's `official` tier meets that bar,
so only those 8 records enter as verified; the map's `verified` tier is third-party (trade press,
reference works) — real evidence, but not the organisation speaking for itself — and lands in
*community* here. Moving a record between datasets must never upgrade its provenance, and a test
enforces it in both directions.

**The game-studio count stays a game count.** `directoryCountByCountry()` feeds `studio_count`,
which is the GAME-industry maturity input for scoring, so animation-only records are excluded from
it — folding 48 animation houses into the game count would inflate game-industry maturity with
companies that make no games. A studio that does both (Sea Monster) still counts, because it really
is a game developer. The total stayed at 182 after the merge, which is the check that this worked.

One consequence worth stating on the page, and stated there: the link-health sweep covered the 181
game-studio websites at its run date. The animation records were added afterwards and have **not**
been link-checked, so they carry no health flag either way rather than an implied pass.

### Hero headline figures — provenance is per-figure

The home hero carries three supplied figures: **$1.98B** market size (2026), **406.25M** players and
**81.8% mobile ($1.62B)**.

**These are not measurements and are not presented as such.** A search for a free, checkable source
carrying this exact set found none. Published 2026 forecasts elsewhere span roughly **$2.29B to
$4.8B**, and mobile share is reported anywhere between **61% and 87%** depending on whether the
figure measures revenue or players. No free source corroborates this particular combination.

They are therefore rendered behind a **FORECAST** badge reading *"Projection · source pending
verification"*, kept visually and structurally apart from the World Bank series the rest of the page
runs on, and stored in `src/lib/data/market-forecast.ts` with a `sourceLabel` field left explicitly
`null` and a note recording the spread above. Filling in that one field is all that is needed once
the originating report is known — the UI already renders it in place of the pending line.

This follows the platform's founding rule: an estimate may be displayed, but it must be labelled as
one, and it must never be mixed in with measured data.

**Typography.** Only the font style was taken from the supplied reference: Anton for the numerals
and Barlow Condensed for the uppercase labels, both self-hosted through `next/font` with no external
stylesheet. Colours stay on the platform's own orange/blue/violet accents rather than the
reference's palette.

**Motion.** The three figures rotate — each fades in, holds, fades out — so a single figure gets the
full column and can be set large. Under `prefers-reduced-motion` the rotation stops and all three
render stacked and static: the reduced path shows more, not less, because suppressing the animation
must not cost the reader the information. Height is reserved for the tallest stat so the hero does
not shift on each swap.

#### Three further figures added, with three different pedigrees

The hero rotation now carries six figures, and they do **not** share a provenance — so they no
longer share a badge. Collapsing them under one label would have understated the sourced ones and
flattered the unsourced ones.

| Figure | Tag | Source |
|---|---|---|
| $1.98B games market (2026) | FORECAST | none found |
| 406.25M players | FORECAST | none found |
| 81.8% mobile ($1.62B) | FORECAST | none found |
| **$5B** film & audiovisual contribution to GDP | ESTIMATE | UNESCO (2021) |
| **5M** people employed by the sector | ESTIMATE | UNESCO (2021) |
| **$15.71B** Africa animation market | RESEARCH | Market Data Forecast |

**The UNESCO pair is genuinely sourced.** Both come from *The African Film Industry: Trends,
Challenges and Opportunities for Growth* (2021), the first continent-wide mapping of the sector,
which puts the industry at roughly 5 million jobs and $5B of GDP — against an untapped potential
UNESCO estimates at 20 million jobs and $20B. The same report finds piracy takes 50–75% of the
sector's revenue and that only 19 of 54 African countries offer any financial support to filmmakers.
These are labelled ESTIMATE because UNESCO labels them so, and they link to the report PDF.

**Two corrections were needed on the animation figure.** It was supplied as "the animation Market
Data Forecast: $15.71B", which reads as a forecast. It is not: $15.71B is Market Data Forecast's
**2025 valuation** of the Africa animation market — the same publisher puts 2026 at $17B and 2034 at
$31.93B. The card therefore reads *"valued at … in 2025"* rather than implying a forecast year.

It also carries a caution in its note, because the figure sits oddly against its neighbours: other
research houses size **Middle East *and* Africa** animation at $1.8B–$8.76B, well below this figure
for Africa alone, and $15.71B for animation would exceed UNESCO's $5B for the entire African film
and audiovisual sector. One of those framings is measuring something quite different from the other.
The number is displayed as supplied and attributed to its publisher, with the tension stated rather
than smoothed over — methodology behind the commercial figure is not public, so it cannot be
reconciled here.
