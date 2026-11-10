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

JS-only changes can ship to iOS and Android without a new store build via `eas update`. The update runtime must match the native binary on users' devices.

iOS uses `runtimeVersion: { policy: "appVersion" }`, so its runtime equals `expo.version` in `app.json` (currently `1.0.4`). **Do not bump `app.json` version until you are ready to ship a new iOS binary** — otherwise iOS OTA updates will target a runtime that installed apps cannot receive.

Android production is ahead of that. The latest finished Play build (`versionCode` 7, completed 2026-09-10) is on channel `production` with runtime `1.0.6`, so `expo.android.runtimeVersion` is pinned to `1.0.6`. That build already includes EAS Update, and the next `update:prod` can reach it without a new store release. Older Android builds on `1.0.4` and `1.0.5` will not receive it. When a new Android binary changes the native runtime, set `expo.android.runtimeVersion` to that build's runtime before publishing.

The production profile in `eas.json` assigns `channel: production` to both platforms. A binary only receives an update when it was built with the `updates` URL in `app.json`, the `production` channel, and the matching runtime above.

```bash
# Ship JS changes to production iOS (runtime 1.0.4) and Android (runtime 1.0.6)
npm run update:prod -- --message "describe the change"

# iOS only, if an Android publish should wait
npm run update:ios:prod -- --message "describe the change"
```

After publishing, users see an **Update ready** prompt in the app — tap **Restart now** to apply immediately. If they choose **Later**, the update applies on the next cold start.

Check the active runtime on a device: **More → Settings → App Info**.

If you ship a new native release:

1. For iOS, bump `expo.version` before the build so the runtime matches that binary. For Android, set `expo.android.runtimeVersion` to the runtime that binary should keep. Bump it when the native runtime changes.
2. `eas build --profile production --platform ios` or `--platform android`
3. `eas submit --profile production --platform ios` or `--platform android`
4. Wait for TestFlight, App Store, or Play install
5. Run `npm run update:prod`

## Android push

Message, channel, and activity notifications already save an Expo push token through the `save-push-token` edge function and send it with the Expo push API. Android cannot register that token until Firebase Cloud Messaging is configured.

Client configuration is already in place: `apps/mobile/google-services.json` is tracked in the repo, and `expo.android.googleServicesFile` is set to `./google-services.json` in `app.json` (package `co.sagefield.mobile`).

To finish enabling push on device:

1. Upload the Firebase Admin private key with `eas credentials` (Android, production, Google Service Account, FCM V1). Do not commit that key. `*-firebase-adminsdk-*.json` and `fcm-service-account.json` are gitignored. It is a different file from `google-service-account.json`, which is only for Play submit.
2. Ship a new production Android binary. FCM is native, so an OTA cannot turn push on for the current Play build. After install, login saves the token and the existing Supabase functions deliver it.

`admin.users` stores one `push_token` per user. A later login on the other platform replaces it.

## Related paths

| Path | Purpose |
|------|---------|
| `src/` | App screens and components |
| `supabase/functions/` | Edge functions (deploy separately) |
| `../../supabase/rpcs/` | Web SQL RPCs (repo root) |
| `../../app/` | Next.js web app and API routes |
