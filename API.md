# Internal API

Server routes under `src/app/api/`. The site itself renders via Server Components; these routes
back client interactions and external consumers.

## `GET /api/metric/:metricId?iso3=NGA`

Full available time series for one metric + country, with provenance. Backs the metric-lineage
drawer.

**Response**
```json
{
  "metric":   { "id": "internet_pct", "label": "...", "unit": "%", "category": "digital_access" },
  "country":  { "iso3": "NGA", "name": "Nigeria", "region": "Western Africa" },
  "series":   [ { "year": 1995, "value": 0.0 }, ..., { "year": 2024, "value": 41.2 } ],
  "provenance": {
    "source": "World Development Indicators", "organization": "World Bank",
    "datasetName": "World Development Indicators", "indicatorCode": "IT.NET.USER.ZS",
    "license": "CC BY-4.0", "sourceUrl": "https://data.worldbank.org/indicator/...",
    "retrievedAt": "…", "methodology": "…"
  }
}
```
Unknown metric/country → `404`. Source failure → `200` with `series: []` and an `error` note
(callers keep the last verified value; nothing is overwritten).

## Planned (mirror the same provenance shape)

```
GET /api/countries            GET /api/countries/:iso3
GET /api/studios              GET /api/studios/:id
GET /api/games                GET /api/rankings?mode=...
GET /api/compare?ids=...      GET /api/sources
```
These read from Supabase when configured, else from the built-in providers — identical response
shapes either way.
