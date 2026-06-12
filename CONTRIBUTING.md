# Contributing to Atlas Places

Thanks for wanting to help. This document covers everything you need to add or update store data and photos.

---

## Store data

All stores live as individual JSON files in `packages/data/stores/`. Each file is named `apple-[store-id].json`.

### Adding or editing a store

1. Find the existing file, or create a new one using an existing file as a reference.
2. Fill in the fields. Required ones are `id`, `name`, `status`, `city`, `countryCode`, and `address`.
3. Run the validation script from the repo root to catch any mistakes:

```bash
npm run data:validate
```

4. Regenerate the mobile bundle so the app picks up your changes:

```bash
npm run mobile:generate-stores
```

5. Open a pull request. A short description of what you changed is enough.

---

## Photos

### Where photos are stored

Public store photos live in `apps/mobile/assets/stores/`. They are served to users via **GitHub Releases** — upload the file as a release asset, then reference its URL in the store JSON. This keeps the app bundle light while still using GitHub's CDN (Fastly) for fast delivery.

### Adding a photo

1. Take or source a photo you own or that is under a Creative Commons or equivalent license.
2. Export it as **WebP**, sized around 1200 px on the longest side. Keep the file under 500 KB where possible.
3. For a thumbnail (shown in the store card before tapping into the detail), export a second version at around 400 px wide and name it with a `-thumb` suffix.
4. Upload both files to the [`store-photos` GitHub Release](https://github.com/Logarex/Atlas/releases).
5. Copy the download URL for each file from the release assets list.
6. Add a photo entry to the store's JSON file:

```json
{
  "id": "apple-store-name-1",
  "url": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1.webp",
  "thumbUrl": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1-thumb.webp",
  "credit": "Your name",
  "license": "CC-BY-4.0",
  "caption": "Short description of the photo",
  "takenOn": "YYYY-MM-DD"
}
```

7. Run `npm run mobile:generate-stores` and open a pull request.

### Photo guidelines

- Only submit photos you took yourself or that are clearly free to use.
- Always fill in `credit` and `license`.
- Avoid photos with recognisable people unless you have their consent — and set `"peopleVisible": true` in the app's contribution form if submitting via the app.

---

## Contributions via the app

The app has built-in forms for suggesting corrections and submitting photos. These create GitHub issues that maintainers review before merging anything into the dataset.

---

## Questions

Open a GitHub issue if something is unclear or if you run into a problem.
