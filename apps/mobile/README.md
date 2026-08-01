# Sagefield Mobile

Expo / React Native app for Sagefield parents and staff.

## Setup

```bash
npm install
cp .env.example .env   # fill in EXPO_PUBLIC_* values
npm start
```

From the monorepo root you can also run `npm run mobile`, `npm run mobile:ios`, or `npm run mobile:android`.

## EAS builds

Run all EAS commands from this directory (`apps/mobile/`):

```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios
```

Project ID: `a1d3ec63-a7cf-422e-8a9a-dd54a49a7f5f`

## Related paths

| Path | Purpose |
|------|---------|
| `src/` | App screens and components |
| `supabase/functions/` | Edge functions (deploy separately) |
| `../../supabase/rpcs/` | Web SQL RPCs (repo root) |
| `../../app/` | Next.js web app and API routes |
