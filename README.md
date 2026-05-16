# Atlas

Atlas is a community-built, open source mobile atlas of Apple retail stores around the world, including open stores, relocated stores, and permanently closed stores.

The project is not affiliated with, endorsed by, or sponsored by Apple Inc. It is inspired by the care given to retail architecture, not by copying any app, dataset, photos, branding, or visual identity.

## Goals

- Build a serious iOS and Android app for exploring every Apple retail store worldwide.
- Preserve store history: openings, relocations, closures, remodels, architectural eras, and notable features.
- Make stores discoverable through search, filters, and a map.
- Support English and French from day one.
- Let the community submit corrections, new records, and photos from inside the app.
- Keep moderation simple for maintainers through a review queue and Discord notifications.
- Let users track stores they have visited, add visit dates, follow friends, and share visits.
- Publish the code and curated factual dataset openly, with clear provenance and privacy rules.

## Name

The project uses Atlas as its working product and repository name. The exact App Store and Google Play listing name must still be reserved in the developer consoles. See [docs/NAMING.md](docs/NAMING.md).

## Stack

- Mobile app: Expo, React Native, TypeScript, Expo Router.
- Backend: Supabase Postgres, Auth, Storage, Row Level Security, Edge Functions.
- Maps: an app-level map abstraction, starting with native maps in the Expo app and leaving room for MapLibre/vector tiles later.
- Data: versioned JSON records with field-level source provenance and validation.
- Moderation: in-app submissions to Supabase, Discord webhook notifications, maintainer review before publication.

## Repository Layout

```text
apps/mobile        Expo React Native app
packages/data      Store schemas, sample data, validation scripts
supabase           Database schema and Edge Function starter
docs               Product, architecture, data, moderation, and roadmap docs
```

## Getting Started

```bash
npm install
npm run mobile:start
```

Create `apps/mobile/.env` from `apps/mobile/.env.example` before connecting Supabase or map providers.

## Data Principles

Atlas does not scrape apple.com, does not copy Facades data, and does not reuse Apple-owned photos or marketing copy. The canonical dataset should be built from compatible open data, manual research, field-level citations, and user contributions licensed for reuse.

See [docs/DATA_STRATEGY.md](docs/DATA_STRATEGY.md) for the detailed source policy.

## License

Code is licensed under MIT. Curated factual metadata is intended to be CC0 where possible. User photos are accepted only with an explicit reusable license. See [DATA_LICENSE.md](DATA_LICENSE.md).

Apple, Apple Store, and other Apple marks are trademarks of Apple Inc. This project uses them only descriptively.
