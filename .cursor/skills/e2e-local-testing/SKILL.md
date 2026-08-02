---
name: e2e-local-testing
description: Run Playwright E2E tests against local Docker Supabase. Use when running e2e tests, debugging Playwright failures, seeding test users, or working on e2e/ specs — never use production database or keys.
---

# E2E local testing (Playwright + local Supabase)

E2E tests run against **local Docker Supabase** (`supabase start`). Production keys and hosted databases are never used.

## Prerequisites

- Docker Desktop running
- Supabase CLI installed (`supabase --version`; CI pins 2.75.0)
- Node.js 24+
- First time: `npx playwright install chromium`

## Standard commands

```bash
npm run db:start                    # supabase start (local Docker)
npm run db:reset                    # migrate + seed e2e users
npm run test:e2e                    # build with local keys + Playwright
E2E_SKIP_BUILD=1 npm run test:e2e   # skip rebuild if .next already built via build:e2e
npm run test:e2e:ui                 # Playwright UI mode
npm run db:stop                     # stop local stack
```

Typical full run:

```bash
npm run db:reset && npm run test:e2e
```

Keys come from `supabase status` automatically — do not copy production keys from `.env.local`.

## Test users (seeded by `npm run db:reset`)

Password for all users: `E2eTestPassword123!` (see `e2e/helpers/constants.ts`).

| Email | Role | Notes |
|-------|------|-------|
| `parent-apply@e2e.sagefield.test` | parent | In-progress application |
| `parent-enrolled@e2e.sagefield.test` | parent | Enrolled application + student |
| `teacher@e2e.sagefield.test` | teacher | |
| `admin@e2e.sagefield.test` | super_admin | |

Use `TEST_USERS`, `E2E_PASSWORD`, and ID constants from `e2e/helpers/constants.ts` in new specs.

## Key scripts

| Script | Purpose |
|--------|---------|
| `scripts/load-local-supabase-env.sh` | Export keys from `supabase status`; hard-blocks non-local URLs |
| `scripts/build-e2e.sh` | `npm run build` with local Supabase env |
| `scripts/start-e2e.sh` | `next start` for Playwright `webServer` |
| `scripts/run-e2e.sh` | Build (optional) + `npx playwright test` |
| `scripts/seed-e2e-users.mjs` | Signup + upsert admin/parent_app rows (local only) |

## Playwright layout

- Config: `playwright.config.ts` — `webServer` uses `start-e2e.sh`, `reuseExistingServer: false`
- Auth setup: `e2e/auth.setup.ts` writes storage state to `e2e/.auth/`
- Projects: `setup`, `chromium`, `parent-apply`, `parent-apply-auth`, `parent-enrolled`, `teacher`, `admin`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 54322 in use | `supabase stop` or stop another Supabase project |
| Vector container unhealthy | `supabase start -x studio,imgproxy,edge-runtime,logflare,vector` |
| Invalid login credentials | Re-run `db:reset`; ensure app not started with `.env.local` prod keys |
| Missing schemas / API errors | Check `[api].schemas` in `supabase/config.toml`, then `db:reset` |
| Stale seed data | `npm run db:reset` |

## CI

`.github/workflows/e2e.yml`: `npm ci` before `db:reset`, excludes `vector`, pins CLI 2.75.0, uses same local-only env pattern.

## Schema updates

1. `supabase link --project-ref <ref>` (if needed, for pull only)
2. `supabase db pull` → commit under `supabase/migrations/`
3. `npm run db:reset` locally to verify

Do not use legacy `migrations/` folder for test DB schema.

## Canonical docs

Full coverage list and human-oriented workflow: `e2e/README.md`

Safety constraints: `.cursor/rules/e2e-local-only.mdc`
