---
name: school-year-tuition-status
description: >-
  Query Supabase for school-year enrolled students (supply fee paid) and report
  who has or has not paid tuition for a given school-year month. Use when the
  user asks who paid or has not paid monthly tuition, needs outreach lists
  before tuition reminder emails, or references @school-year-tuition-status.
---

# School Year Tuition Status

Report which enrolled school-year students have paid (or not paid) tuition for a given month. Data comes from Supabase — not manual lists. Payment logic mirrors `buildStudentMonthEnrollment` in `apps/mobile/src/lib/student-month-enrollment.ts`.

## When to use

- User asks who has / has not paid tuition for a school-year month
- User needs outreach lists before sending tuition reminder emails
- User references `@school-year-tuition-status` or provides a month name (e.g. "september")

## Prerequisites

- Supabase MCP available (`user-supabase`)
- Sage Field project ID: `vonuwpzepwrbdlectspd`
- **Read-only SELECT only** — never use `apply_migration` or write DDL on production. See `.cursor/rules/supabase-migrations-manual.mdc`.

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Resolve school-year month → month_index (1–10)
- [ ] Step 2: Query Supabase MCP (read-only)
- [ ] Step 3: Split paid vs not_paid
- [ ] Step 4: Format tables + deduped parent emails
- [ ] Step 5: Map billing_type to reminder template
```

### Step 1: Resolve month input

Map user input to **tuition month index 1–10** (same as `dateToSchoolYearMonthIndex` in `shared/billing/school-year-attendance.ts`).

| Index | Calendar month | Aliases |
| ----- | -------------- | ------- |
| 1 | August 2026 | `aug`, `august`, `aug_26`, `1` |
| 2 | September 2026 | `sep`, `sept`, `september`, `sep_26`, `2` |
| 3 | October 2026 | `oct`, `october`, `oct_26`, `3` |
| 4 | November 2026 | `nov`, `november`, `nov_26`, `4` |
| 5 | December 2026 | `dec`, `december`, `dec_26`, `5` |
| 6 | January 2027 | `jan`, `january`, `jan_27`, `6` |
| 7 | February 2027 | `feb`, `february`, `feb_27`, `7` |
| 8 | March 2027 | `mar`, `march`, `mar_27`, `8` |
| 9 | April 2027 | `apr`, `april`, `apr_27`, `9` |
| 10 | May 2027 | `may`, `may_27`, `10` |

If ambiguous, default to the **2026–27 school year**. If still unclear, ask once.

Derive for output header:

- **Due date:** 1st of the calendar month (August is an exception in billing copy — due Aug 10 — but month index 1 still maps to August)
- **Late fee date:** 4th of the calendar month (August late fee: Aug 13)

Full month table and due dates: [reference.md](reference.md).

### Step 2: Query Supabase (read-only)

Use `execute_sql` on project `vonuwpzepwrbdlectspd`. Replace `{month_index}` in the main query from [reference.md](reference.md).

**Default filters (always apply unless user says otherwise):**

1. **Enrolled for school year** — `status = 'enrolled'` and program matches `isSchoolYearApp` in `app/lib/school-year-attending-students.ts`
2. **Supply fee paid** — completed `supply_fee` transaction for the student
3. **Exclude** students tagged `Don't Include` in `admin_tags`

**Month paid detection** mirrors `buildStudentMonthEnrollment`:

- `school_year_tuition` → `metadata.selected_months` contains `{month_index}`
- `homeschool_dropin` + `program = school_year_26_27` → `selected_weeks` contains index OR `week_selections` JSON has `"week":{month_index}`
- `supply_fee` bundle → `bundle_month_index = {month_index}` with `bundle_type` in `school_year_tuition` or `homeschool`

**Billing type** (which reminder email to send):

| `billing_type` | Condition | Reminder template |
| -------------- | --------- | ----------------- |
| `school_year` | `program` is `school_year_26_27` or `both` | School Year tuition reminder |
| `homeschool_drop_in` | `program = homeschool_drop_in` and `drop_in_program` in `school_year_26_27`, `both` | Homeschool Drop-In reminder |

For month-specific builders in `app/lib/zoho.ts`, prefer e.g. `buildSchoolYearSeptemberTuitionReminderEmail` when it exists; otherwise use `buildSchoolYearTuitionReminderEmail` (school year) or `buildHomeschoolDropInTuitionReminderEmail` (drop-in).

### Step 3: Format output

Present **two sections**:

1. **Not paid** — send reminders
2. **Paid** — no reminder needed

Per student row: name, grade, `billing_type`, parent name, `g1_email`.

Then a **deduped parent email table** (unpaid only):

| Email | Students | Reminder template |
| ----- | -------- | ----------------- |
| … | … | School Year / Drop-In |

End with summary counts:

`N not paid · M paid · K parent emails to send`

### Step 4: Optional follow-ups

Only if the user asks:

- Re-run for a different month
- CSV-style pipe table export
- Enrolled students **missing supply fee** — use optional query in [reference.md](reference.md)

## Example usage

User message:

> Who hasn't paid September tuition?

Agent actions:

1. Read this skill
2. Resolve `september` → `month_index = 2`
3. MCP `execute_sql` with main query (`month_index = 2`)
4. Report not paid / paid tables + 8 deduped parent emails

## Out of scope

- Sending emails (admin Outreach tab or server actions)
- DDL or migrations on production via MCP
- Students not enrolled for school year
- Students who have not paid supply fee (unless user explicitly requests that list)

## Reference

- Month index table, SQL queries, payment logic: [reference.md](reference.md)
- Enrollment filter: `app/lib/school-year-attending-students.ts` → `isSchoolYearApp`
- Payment logic: `apps/mobile/src/lib/student-month-enrollment.ts` → `buildStudentMonthEnrollment`
- Reminder emails: `app/lib/zoho.ts`
