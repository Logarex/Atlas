# Data Strategy

This is the most important part of the project.

Atlas should be complete, but not by copying proprietary compilations. The dataset must be built slowly and defensibly.

## Hard Rules

- Do not copy other proprietary apps data, photos, structure, or visual identity.
- Do not scrape apple.com.
- Do not use hidden Apple APIs.
- Do not copy Apple marketing text.
- Do not redistribute Apple press photos unless the license explicitly allows it.
- Store facts with source URLs and verification dates.
- Keep volatile facts like opening hours clearly marked with freshness and source.

## Why Not Scrape Apple

Apple has an official store list at `https://www.apple.com/retail/storelist/`, and individual store pages exist on apple.com. However, Apple's Website Terms of Use prohibit page scraping, robots, spiders, and similar automatic methods for acquiring or monitoring site content.

Practical policy:

- Link to official Apple store pages.
- Use official pages for human verification.
- Do not run automated Apple crawlers.
- Do not copy page content into the app.

Reference: https://www.apple.com/legal/internet-services/terms/site.html

## Preferred Sources

Use sources in this order:

1. Community observation with contributor license and reviewer approval.
2. Published CC0 factual datasets with exact run/source provenance, such as All the Places snapshots.
3. Wikimedia Commons photos with compatible licenses and attribution.
4. Official Apple pages as human-verification links, not scraped content.
5. Apple Newsroom articles for historical facts, cited and paraphrased.
6. Local public records or architecture press, only when licenses permit factual reuse.

All the Places imports must use their published CC0 output. Do not run the Apple spider from Atlas, do not copy Apple page text, and do not treat volatile fields like hours as community verified.



## OpenStreetMap

OpenStreetMap is excellent for map display and may help research. Its data is ODbL, which has share-alike obligations.

Policy:

- Use OSM tiles/data with attribution when displaying maps.
- Do not mix OSM-derived store records into the CC0 canonical dataset unless we isolate and distribute them under ODbL.
- If coordinates are derived from OSM, mark the source and license clearly.

Reference: https://wiki.openstreetmap.org/wiki/Open_Database_License

## Opening Hours

Opening hours are volatile and high-maintenance.

V1 policy:

- Store an official hours URL.
- Allow manually verified regular hours only with `lastVerifiedAt`.
- Show stale warnings after a configurable threshold.
- Prefer "Verify on official page" for store visits.

V2 policy:

- Add community corrections for hours.
- Add regional reviewer rules.
- Consider displaying "reported hours" rather than definitive hours.

## Closed Stores

Closed stores are where the project can go beyond official Apple pages.

Accepted source types:

- Archived official pages.
- Newsroom announcements.
- Reliable local reporting.
- Mall/property announcements.
- Contributor photos and field observation.

## Field-level Provenance

Each important field should eventually support source provenance:

```json
{
  "field": "openedOn",
  "value": "2006-05-19",
  "sourceUrl": "https://www.apple.com/newsroom/2006/05/18The-Apple-Store-Fifth-Avenue-to-Open-on-Friday-May-19/",
  "sourceType": "apple_newsroom",
  "license": "all_rights_reserved_reference_only",
  "verifiedAt": "2026-05-16"
}
```

The source can justify a fact without copying protected expression.

## Photo Policy

Photos must be original user uploads or compatible third-party files.

Required metadata:

- Photographer or uploader.
- License.
- Store id.
- Capture date if known.
- Whether people/faces are visible.
- Reviewer id and approval date.

The app should strip EXIF location metadata unless the contributor explicitly opts in.
