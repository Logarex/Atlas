# Adding Stores, Photos, and Markers

Atlas keeps the public dataset conservative on purpose. Do not copy Facades data, do not scrape Apple pages, and do not upload Apple-owned photos.

## Safe Store Sources

Use these sources first:

- Wikidata structured data for starter facts, because main-namespace structured data is CC0.
- Apple official store pages as human verification links only.
- Apple Newsroom articles for opening, reopening, and architecture facts, paraphrased with source URLs.
- Original community observations and photos submitted under CC0 or CC BY 4.0.
- Wikimedia Commons only after checking the exact file license and attribution requirements.

Apple's current store list is useful to know what exists, but Apple's Website Terms prohibit automated page scraping. Treat Apple pages as references you open and verify manually.

## Import Candidate Stores from Wikidata

Run:

```bash
npm run data:import:wikidata
```

This writes:

```text
packages/data/imports/wikidata-apple-stores.json
```

Those records are candidates, not automatically published data. Review each candidate, fix address/city/opening date/architecture, add sources, then create a real store JSON file in `packages/data/stores`.

## Add a Store Manually

1. Copy `packages/data/stores/apple-fifth-avenue.json`.
2. Rename it to a stable slug, for example `apple-champs-elysees.json`.
3. Fill every field you can verify.
4. Use `"unknown"` when an architectural attribute is not verified.
5. Put volatile hours behind `hours.policy: "official-link-only"` unless you have a fresh community verification.
6. Run:

```bash
npm run data:validate
```

## Add Photos

Use the app store detail page:

1. Open a store.
2. Tap "Add photo".
3. Choose an original photo you own.
4. Pick CC BY 4.0 or CC0.
5. Submit it for review.

The app uploads to the private `photo-submissions` bucket and creates a pending `photo_submissions` row. A reviewer must approve it before it moves into the public `photos` table.

## Add Marker and Architecture Indicators

Markers are generated from store data:

- `status` controls the default marker emoji.
- `architecture.attributes.glassCube = "yes"` shows the cube marker.
- `architecture.attributes.greenWall = "yes"` shows the green wall marker.
- `architecture.attributes.historicFacade = "yes"` shows the historic marker.

To add a new indicator:

1. Add the key to `ArchitectureAttribute` in `apps/mobile/src/features/stores/store.types.ts`.
2. Add the emoji in `apps/mobile/src/features/stores/storeUtils.ts`.
3. Add English/French labels in `apps/mobile/src/i18n/en.json` and `apps/mobile/src/i18n/fr.json`.
4. Add the attribute to store JSON records with `"yes"`, `"no"`, or `"unknown"`.
