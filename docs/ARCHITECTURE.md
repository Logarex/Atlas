# Architecture

## Overview

Atlas uses a mobile-first architecture with a versioned open dataset and a hosted backend for accounts, social features, submissions, and moderation.

```text
Expo mobile app
  -> Supabase Auth for accounts
  -> Supabase Postgres for profiles, visits, friendships, submissions
  -> Supabase Storage for pending and approved photos
  -> Edge Functions for Discord notifications and review automation
  -> Versioned data package for seed/import/export
```

## Mobile App

Use Expo and React Native because it gives fast iteration, iOS/Android delivery, TypeScript, OTA updates, and a realistic student-friendly path to the App Store and Play Store.

Key modules:

- `app/`: Expo Router screens.
- `src/features/stores`: store list, cards, map, detail.
- `src/i18n`: English/French localization.
- `src/lib`: Supabase, telemetry-free utilities, sharing, source formatting.
- `src/theme`: design tokens.

## Backend

Supabase is the default backend because it provides open source infrastructure, Postgres, row-level security, auth, storage, and Edge Functions without building a custom backend too early.

Core tables:

- `stores`: canonical published records.
- `store_sources`: field-level provenance.
- `profiles`: usernames and public profile settings.
- `visits`: user store visits.
- `friendships`: friend requests and accepted friendships.
- `change_requests`: proposed store edits and new store submissions.
- `photo_submissions`: pending and approved photos.
- `reviews`: moderator decisions.

## Data Source of Truth

During early development, `packages/data/stores` is the reviewed seed dataset. Supabase imports this dataset for app use.

As community submissions grow, accepted changes should either:

1. update Supabase and be exported back to JSON, or
2. create a GitHub pull request that updates the data package.

The second option is better for long-term open source transparency.

## Maps

Start with a map abstraction in the app. The initial mobile app can use `react-native-maps` for speed. The architecture should allow a later migration to MapLibre plus OSM/vector tiles if cost, attribution, or provider terms require it.

Do not store proprietary map-provider data in the canonical dataset.

## Moderation

All user edits are proposed changes, not direct writes to published records.

Flow:

1. User submits a correction, new store, or photo.
2. App writes to `change_requests` or `photo_submissions`.
3. Edge Function sends a Discord message to maintainers.
4. Maintainer opens the review UI, checks sources, approves or rejects.
5. Approved changes update published data and create an audit record.

## Privacy

The app should be useful without social features. Account-based features are opt-in. Location should be processed locally for nearby search unless a feature explicitly needs server-side data.
