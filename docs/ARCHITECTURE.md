# Architecture

## Overview

Atlas uses a mobile-first architecture with a versioned community dataset, local profile/visit storage, and GitHub issues for submissions.

```text
Expo mobile app
  -> AsyncStorage for local profile, theme, and visits
  -> GitHub Issues for corrections, new stores, and photo review requests
  -> Versioned data package for seed/import/export
```

## Mobile App

Use Expo and React Native because it gives fast iteration, iOS/Android delivery, TypeScript, OTA updates, and a realistic student-friendly path to the App Store and Play Store.

Key modules:

- `app/`: Expo Router screens.
- `src/features/stores`: store list, cards, map, detail.
- `src/i18n`: English/French localization.
- `src/lib`: GitHub issue submission, telemetry-free utilities, sharing, source formatting.
- `src/theme`: design tokens.

## Local State

Atlas does not use a hosted backend. The app stores the local profile, theme choice, and visited stores on-device with AsyncStorage. Contributions are sent to GitHub issues and reviewed by maintainers before the JSON dataset changes.

## Data Source of Truth

During early development, `packages/data/stores` is the reviewed seed dataset and app source of truth.

Accepted changes should create a GitHub pull request that updates the data package.

## Maps

Start with a map abstraction in the app. The initial mobile app can use `react-native-maps` for speed. The architecture should allow a later migration to MapLibre plus OSM/vector tiles if cost, attribution, or provider terms require it.

Do not store proprietary map-provider data in the canonical dataset.

## Moderation

All user edits are proposed changes, not direct writes to published records.

Flow:

1. User submits a correction, new store, or photo.
2. App creates a GitHub issue with the proposed change and source.
3. Maintainer checks sources, approves or rejects.
4. Approved changes update the versioned JSON dataset through a pull request.

## Privacy

The app should be useful without accounts or social features. Location should be processed locally for nearby search.
