# Contributing

Thanks for helping build Atlas.

## Contribution Types

- Store corrections: status, address, coordinates, opening date, closure date, store number, official links.
- Architectural metadata: era, design type, boardroom, green wall, forum, plaza, staircase, facade material, notable remodels.
- Photos: original photos you own and can license for reuse.
- Translations: English and French copy.
- Code: mobile app, backend, moderation tools, validation, accessibility, tests.

## Data Rules

- Do not copy data from other proprietary apps or any proprietary app.
- Do not scrape Apple websites or use hidden/private Apple APIs.
- Do not paste Apple marketing copy.
- Do not upload Apple-owned press images unless redistribution is explicitly permitted.
- Provide a source for every factual claim.
- Prefer primary sources, Wikimedia Commons with compatible licenses, local observation, and community verification.

## Data Record Format

Store records live in `packages/data/stores`. Every record must pass `packages/data/schema/store.schema.json` and include source provenance.

Run:

```bash
npm run data:validate
```

## Photos

Only upload photos you took yourself or files with a clear compatible license. Keep people, faces, license plates, and private information out of photos where possible.

## Pull Requests

- Keep changes focused.
- Include screenshots for UI changes.
- Include source links for data changes.
- Add or update tests/validation when changing schemas.

## Community Standard

Be precise, kind, and patient. This project depends on careful research and respectful review.
