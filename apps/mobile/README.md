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

## EAS updates (OTA)

JS-only changes can ship without a new App Store build via `eas update`. The update runtime must match the native binary on users' devices.

This project uses `runtimeVersion: { policy: "appVersion" }`, so the runtime equals `expo.version` in `app.json`. **Do not bump `app.json` version until you are ready to ship a new native build** — otherwise OTA updates will target a runtime that installed apps cannot receive.

```bash
# Ship JS changes to TestFlight/App Store users on the current native build
npm run update:ios:prod -- --message "describe the change"
```

After publishing, users need to force-quit and reopen the app twice (first launch downloads, second applies).

Check the active runtime on a device: **More → Settings → App Info**.

If you do bump the version for a new native release:

1. `eas build --profile production --platform ios`
2. `eas submit --profile production --platform ios`
3. Wait for TestFlight/App Store install
4. Then run `eas update` (will target the new version automatically)

## Related paths

| Path | Purpose |
|------|---------|
| `src/` | App screens and components |
| `supabase/functions/` | Edge functions (deploy separately) |
| `../../supabase/rpcs/` | Web SQL RPCs (repo root) |
| `../../app/` | Next.js web app and API routes |
