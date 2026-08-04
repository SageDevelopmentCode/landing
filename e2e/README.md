# E2E tests (Playwright + local Supabase)

End-to-end tests run against a **local Supabase stack** (Docker via `supabase start`). **Production Supabase keys are never used** — not from `.env.local`, not from the dashboard.

## Agent / Cursor

Agents: see `.cursor/skills/e2e-local-testing/SKILL.md` and rule `.cursor/rules/e2e-local-only.mdc`.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Node.js 24+

## First-time setup

```bash
# Start local Supabase (Docker)
npm run db:start

# Apply migrations + seed test users (local Docker DB only)
npm run db:reset

# Install Playwright browsers
npx playwright install chromium
```

Keys are loaded automatically from `supabase status` when you run tests. You do **not** need to copy production keys into `.env.e2e.local`.

## Test users (created by `scripts/seed-e2e-users.mjs` after `db:reset`)

| Email | Role | Password |
|-------|------|----------|
| `parent-apply@e2e.sagefield.test` | parent (in-progress application) | `E2eTestPassword123!` |
| `parent-enrolled@e2e.sagefield.test` | parent (approved + `status: enrolled`) | `E2eTestPassword123!` |
| `teacher@e2e.sagefield.test` | teacher | `E2eTestPassword123!` |
| `admin@e2e.sagefield.test` | super_admin | `E2eTestPassword123!` |

The enrolled parent seed uses `status: "enrolled"` so routes like `/parent/billing` and `/parent/children` are accessible (those pages redirect to `/parent/dashboard` when no enrolled application exists).

## Run tests

```bash
# Reset DB and run all e2e tests (builds with local keys, not .env.local)
npm run db:reset && npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

Export env vars before running (or use `.env.e2e.local` with `dotenv`):

```bash
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY="<from supabase status>"
export SUPABASE_SERVICE_ROLE_KEY="<from supabase status>"
npm run test:e2e
```

## What is covered (v1)

- Public page smoke tests (home, programs, contact, apply)
- Auth boundaries (redirects, role-based admin access)
- Password login flows (parent, teacher, admin)
- **Enrollment smoke tests** (`e2e/enrollment-smoke.spec.ts`):
  - **Apply** — dashboard shows in-progress app, step 1 form loads, start page loads
  - **Parent billing** — billing page shows enrolled child + tuition section (no Stripe checkout)
  - **Parent children** — enrolled student appears on children page
  - **Admin applications** — seeded apps visible, table/board/pipeline view switching
- **Parent-teacher conference** (`e2e/parent-teacher-conference.spec.ts`):
  - **Parent home** — conference banner and drawer UI
  - **Parent booking** — enrolled parent books a Mon–Thu slot (local DB only)
  - **Admin PTC Schedule** — `/admin/parent-teacher-conferences` loads and lists booked child after parent test

## Schema updates

When production/staging schema changes:

1. Link once (if needed): `supabase link --project-ref <ref>`
2. Pull diff: `supabase db pull`
3. Commit the new file in `supabase/migrations/`
4. Run `npm run db:reset` locally to verify

Going forward, add new schema changes only under `supabase/migrations/` (not the legacy `migrations/` folder).

## CI

- **`.github/workflows/ci.yml`** — lint + build on every PR
- **`.github/workflows/e2e.yml`** — full e2e suite with `supabase start` + Playwright

CI excludes the Vector analytics container (`-x vector`) because it is not needed for tests and often fails health checks on GitHub Actions runners. Local dev can keep analytics enabled in `supabase/config.toml` if Vector starts successfully on your machine.

## Troubleshooting

**Port 54322 already in use** — another Supabase project is running. Stop it:

```bash
supabase stop --project-id <other-project-id>
```

Or stop all: `docker ps` and identify Supabase containers.

**Login tests fail** — ensure `supabase/config.toml` exposes app schemas under `[api].schemas` and re-run `supabase stop && supabase start`.

**Stale seed data** — `npm run db:reset`
