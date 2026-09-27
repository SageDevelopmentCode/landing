---
name: branch-code-review
description: >-
  Perform a thorough branch code review against origin/main on the current checkout:
  git scoping, feature-area parallel review, cross-cutting pattern synthesis, and a
  structured report with severity ratings and priority fixes. Use when the user asks
  to review a branch, PR, all commits on the current branch, or mentions
  branch-code-review.
disable-model-invocation: true
---

# Branch code review

Thorough, read-only review of **the branch you have checked out** (`HEAD`) compared to a base branch (default **`origin/main`**). Produces a structured report with severities, ratings, and a prioritized fix list.

## Quick start

1. **Read this skill** when the user names `branch-code-review` or asks for a full branch review.

2. **Determine scope** (ask only if ambiguous):

   | Case | Scope |
   |------|--------|
   | Default | All commits: `origin/main..HEAD` on **current checkout** |
   | User names another base | `HEAD` vs their base instead of `origin/main` |
   | User names another branch | That branch vs base (checkout or `git log base..branch`) |
   | Single commit | `git show <sha>` only; say so in the report |
   | Uncommitted | Also `git diff` / `git diff --cached` when user asks |

   **Edge cases — state explicitly, do not guess:**
   - On `main` with 0 commits ahead of base → no commit scope; offer uncommitted-only or a different base.
   - Uncommitted changes are **not** included unless requested.

3. **Run triage** (read-only):

   ```bash
   bash .cursor/skills/branch-code-review/scripts/branch-scope.sh [base-ref]
   ```

   Also note: file count, largest commits, which feature areas appear.

4. **Execute the workflow** below and deliver the report from [reference.md](reference.md).

## Workflow

```mermaid
flowchart TD
  scope[Scope_HEAD_vs_base] --> triage[Run_branch_scope_sh]
  triage --> split[Bucket_by_feature_area]
  split --> parallel[Parallel_readonly_subagents]
  parallel --> small[Inline_review_small_changes]
  parallel --> verify[Spot_verify_CRITICAL_HIGH]
  small --> synth[Cross_cutting_synthesis]
  verify --> synth
  synth --> report[Structured_report]
```

### Phase A — Triage and split

- Bucket changed files **by feature**, not by commit (one commit may span buckets).
- Review **current file state** in each bucket (later commits may supersede earlier ones).
- Typical buckets in this repo:
  - Parent portal — `app/parent/**`, parent-facing server actions
  - Apply / enrollment — `app/apply/**`, `app/quick-apply/**`, enrollment actions
  - Admin — `app/admin/**` (pipeline, payroll, marketing, impersonate)
  - Teacher — `app/teacher/**`
  - Public / marketing — landing pages, `app/highlights/**`
  - Stripe / tuition — `app/api/stripe/**`, `app/lib/*stripe*`, tuition pages, `apps/mobile/src/components/billing/**`
  - Feed & messaging — `app/parent/feed/**`, `app/messages/**`, `shared/feed/**`
  - Calendar — `app/parent/calendar/**`, `shared/parent/calendar.ts`, `apps/mobile/**/calendar*`, `supabase/migrations/*calendar*`
  - Mobile app — `apps/mobile/**` (especially when `shared/**` changed too)
  - Email blast actions — `app/actions/send*Email.ts` (when touched)
  - DB / RLS — `supabase/migrations/**`, `supabase/rpcs/**`
  - E2E / CI — `e2e/**`, `.github/workflows/**`, `scripts/*e2e*`
  - Build / config — `next.config.ts`, root `package.json`, `apps/mobile/app.json`

**When to launch parallel subagents:** a bucket is ~500+ lines or 10+ files. Use the prompt in [reference.md — Subagent prompt template](reference.md#subagent-prompt-template). Subagents are **read-only**.

### Phase B — Direct review

- Small commits (lint, one-line fixes, config-only): read diff inline; no subagent.
- Parent agent **spot-verifies every CRITICAL and HIGH** from subagents against source before reporting.

### Phase C — Cross-cutting synthesis

After per-area findings, roll up recurring patterns (see [reference.md — Patterns to hunt](reference.md#patterns-to-hunt-sage-field)). Fix-the-pattern-once beats listing the same bug five times.

### Phase D — Project rules

Read and apply when the diff touches these areas:

| Rule | Path |
|------|------|
| Supabase: manual SQL on production | [`.cursor/rules/supabase-migrations-manual.mdc`](../../rules/supabase-migrations-manual.mdc) |
| E2E: local Supabase only | [`.cursor/rules/e2e-local-only.mdc`](../../rules/e2e-local-only.mdc) |
| E2E workflow | [`.cursor/skills/e2e-local-testing/SKILL.md`](../e2e-local-testing/SKILL.md) |

### Phase E — Constraints

- **Read-only** during review: no edits, commits, migrations applied, or DB writes.
- Do not invent findings; say when code is fine.
- Prioritize by user impact, not formatting.
- Do not nitpick for length; the user asked for substance.

## Report deliverable

Use the template in [reference.md](reference.md). Required sections:

1. **Scope statement** — branch name, base, commit count, files; what was skipped
2. **Cross-cutting patterns** (if any)
3. **Findings** — CRITICAL / HIGH / MEDIUM / LOW with file, why, fix
4. **Things done well**
5. **Worth investigating further**
6. **Executive summary**
7. **Priority fixes** (numbered, ordered)
8. **Overall rating** (1–10): Correctness, Security, Performance, Maintainability, Scalability, Overall
9. **Recommended next steps** (phased)

Match the user’s original review dimensions when they provided a checklist (bugs, security, performance, architecture, code quality, scalability, product logic).

## File routing

See [reference.md — Sage Field file routing](reference.md#sage-field-file-routing) for where to look by change type.

## Invocation

```
Read .cursor/skills/branch-code-review/SKILL.md and review this branch
```

```
branch-code-review
```

```
branch-code-review — single commit abc1234 only
```

```
branch-code-review vs develop — include uncommitted changes
```

Because `disable-model-invocation: true`, the user must name the skill or path.

## Related skills

- Local E2E after fixes: [`.cursor/skills/e2e-local-testing/SKILL.md`](../e2e-local-testing/SKILL.md)
