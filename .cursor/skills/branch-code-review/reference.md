# Branch code review — reference

## Invocation examples

| You say | Scope |
|---------|--------|
| “Review this branch” / “branch-code-review” | Current checkout (`HEAD`) vs `origin/main` |
| “branch-code-review vs develop” | `HEAD` vs `develop` |
| “Review branch `feature/foo`” | That branch vs `origin/main` (fetch/checkout if needed) |
| “Review commit `abc1234` only” | Single commit |
| “Include uncommitted changes” | Also review working tree diff vs `HEAD` |

Always name the skill or path: read [SKILL.md](SKILL.md) or say `branch-code-review` (`disable-model-invocation: true`).

---

## Full report template

```markdown
# Branch review: `<branch>` vs `<base>`

**Scope:** N commits, M files (+ uncommitted if requested). Merge-base: `<sha>`.

## Cross-cutting patterns

(Bullet the recurring defects that span multiple features — fix once, win everywhere.)

## Findings

### CRITICAL / HIGH / MEDIUM / LOW

For each issue:
- **Severity**
- **File/function/line**
- What is wrong
- Why it matters
- Concrete recommendation (code snippet when helpful)

Group by theme when helpful: Security, Correctness, Performance, Architecture, Testing, Product logic.

## Things done well

(2–4 bullets — only what is genuinely good.)

## Worth investigating further

## Executive summary

## Priority fixes

1. …
2. …

## Overall rating (1–10)

| Dimension | Score |
|-----------|-------|
| Correctness | |
| Security | |
| Performance | |
| Maintainability | |
| Scalability | |
| Overall | |

## Recommended next steps

(Phased: ship blockers first, then hardening, then refactors.)
```

---

## Review dimensions checklist

Use as a lens; skip categories with no findings.

**Correctness:** logic errors, edge cases, race conditions, null/undefined, wrong assumptions, runtime failures.

**Security:** authn/authz, injection, data exposure across parents/households/students, insecure API usage, secrets in code, OWASP-style issues, unsafe input.

**Performance:** unnecessary DB/API calls, N+1, unbounded queries, hot paths (layouts, feeds, unread counts), large uploads without limits.

**Architecture:** separation of concerns, duplication, over-complexity, naming, patterns that won’t scale with the codebase.

**Testing:** E2E coverage for risky paths (`e2e/**`); CI only runs lint + build — call out gaps honestly, don’t invent unit-test issues.

**Product logic:** technically works but wrong for real users (copy vs behavior, impersonate/preview parity, money paths).

**Scalability:** behavior at 10x / 100x users, data, or request rate.

Do not invent problems. Say when something is fine.

---

## Sage Field file routing

| Change type | Where to look |
|-------------|----------------|
| Server actions | `app/actions/**` |
| Parent portal UI | `app/parent/**` |
| Parent auth helpers | `app/lib/parent-access.ts` |
| Admin UI | `app/admin/**` |
| Admin impersonate / preview | `app/admin/impersonate/**`, `resolveEffectiveParentId.ts` |
| Teacher portal | `app/teacher/**` |
| Apply / quick apply | `app/apply/**`, `app/quick-apply/**` |
| Parent APIs | `app/api/parent/**` |
| Admin APIs | `app/api/admin/**` |
| Mobile APIs | `app/api/mobile/**` |
| Stripe / payments | `app/api/stripe/**`, `app/lib/stripe-customer.ts`, `app/lib/is-mobile-payment-intent.ts` |
| Feed (shared) | `shared/feed/**`, `app/parent/feed/**`, `apps/mobile/src/components/feed/**` |
| Calendar (shared) | `shared/parent/calendar.ts`, `app/parent/calendar/**`, mobile calendar screens/libs |
| Messaging | `app/messages/**`, `app/parent/messages/**`, mobile `(tabs)/messages/**` |
| Supabase server clients | `app/lib/supabase-server.ts`, `app/lib/supabase-browser.ts` |
| Generated DB types | `app/types/database.types.ts` |
| Schema (CI/local) | `supabase/migrations/`, `supabase/rpcs/` |
| Legacy SQL (do not add new) | `migrations/` (historical only) |
| Web ↔ mobile shared | `shared/**` |
| Mobile app | `apps/mobile/**`, edge functions under `apps/mobile/supabase/functions/**` |
| E2E | `e2e/**`, `playwright.config.ts`, `scripts/run-e2e.sh` |
| CI | `.github/workflows/ci.yml`, `.github/workflows/e2e.yml` |
| Newsletter / highlights pages | `app/highlights/**`, related skills under `.cursor/skills/newsletter-*` |

---

## Subagent prompt template

Copy and adapt when a feature bucket is large (~500+ lines or 10+ files):

```
You are a senior code reviewer. Repo: <path>. READ-ONLY — do not edit files.

Review the <feature name> portion of branch <branch> vs <base> (commits: <range or list>).

Files in scope:
<file list>

Read current files and `git show` / `git diff <base>...HEAD -- <paths>` for context.

Look for: bugs, auth/authz (especially createAdminClient without role/parent/student scoping),
missing parent-access helpers on mutations, data leakage across households,
N+1 and unbounded queries, impersonate/preview parity (web admin/impersonate vs app/parent;
mobile AdminPreviewBanner — disable destructive actions, don't only hide UI),
shared/ changes consumed by both Next and apps/mobile, migration RLS and idempotency,
Stripe webhook idempotency and money paths, product logic.

Project rules when relevant:
- supabase-migrations-manual (.cursor/rules/supabase-migrations-manual.mdc)
- e2e-local-only (.cursor/rules/e2e-local-only.mdc)

Return:
- Findings: CRITICAL/HIGH/MEDIUM/LOW, file+line, what's wrong, why, recommendation
- 2–4 things done well
- Do not invent issues
```

Parent agent must **spot-verify every CRITICAL/HIGH** against source before including in the final report.

---

## Patterns to hunt (Sage Field)

| Pattern | What to check |
|---------|----------------|
| `createAdminClient()` bypass | Service role without role check or without scoping to target parent/student |
| Parent auth helpers | Mutations should use `resolveActingParentId`, `assertCanActAsParent`, `assertStudentBelongsToParent` in `app/lib/parent-access.ts` |
| Impersonate / preview parity | Web: `app/admin/impersonate/**` vs live `app/parent/**`; Mobile: `impersonate-parent` + `AdminPreviewBanner` |
| Web ↔ mobile shared code | Changes in `shared/**` — verify Next and `apps/mobile` consumers |
| Legacy SQL folder | New schema in `supabase/migrations/` only — not `migrations/` |
| RLS policies | Parents see only own household; staff/admin paths intentional; policy names match intent |
| Stripe / money | Webhook idempotency, checkout metadata, mobile payment intents |
| Server actions vs API routes | Auth at entry; avoid raw `error.message` on 500 responses |
| Production Supabase | Agents must not apply migrations via MCP on hosted project — user runs SQL in dashboard |
| CI gap | `.github/workflows/ci.yml` is lint + build only — note missing E2E for risky paths when relevant |
