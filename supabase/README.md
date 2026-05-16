# Supabase Setup

This folder contains the first database shape for Atlas.

## Local Setup

Install the Supabase CLI, create a project, then apply:

```bash
supabase db reset
```

For hosted Supabase, run the SQL in `schema.sql` from the SQL editor or through migrations once the project is converted to Supabase migrations.

## Required Secrets

- `DISCORD_WEBHOOK_URL`: Discord webhook for moderation notifications.

The mobile app needs:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
