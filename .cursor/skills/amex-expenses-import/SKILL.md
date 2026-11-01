---
name: amex-expenses-import
description: Import Amex activity.csv exports into budget.expenses via Supabase. Use when the user attaches an Amex activity CSV, asks to import Amex expenses, or mentions monthly Amex card spending for the budget admin page.
---

# Amex Expenses Import

Import Amex monthly `activity.csv` exports into `budget.expenses` for the Admin Budget → Expenses tab.

## When to use

- User attaches an Amex `activity.csv` export
- User asks to import Amex card transactions into budget expenses
- User references `@amex-expenses-import` with a CSV path

## Prerequisites

- Attached CSV is an Amex activity export in one of two formats:
  - **Full**: `Date`, `Description`, `Account #`, `Amount`, `Extended Details`, `Category`
  - **Simplified**: `Date`, `Description`, `Account #`, `Amount` (extra columns like `Receipt`, `Card Member` are ignored)
- Supabase MCP available (`user-supabase`)
- Sage Field project ID: `vonuwpzepwrbdlectspd`

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Parse CSV with script (auto-categorize)
- [ ] Step 2: Analyze categorySummary — confirm with user before insert
- [ ] Step 3: Check for existing imports (idempotency)
- [ ] Step 4: Execute INSERT via Supabase MCP
- [ ] Step 5: Verify count, total, and categories
- [ ] Step 6: Report results and caveats
```

### Step 1: Parse CSV

Run the generator script on the attached CSV path:

```bash
node scripts/amex-csv-to-expenses-sql.mjs /path/to/activity.csv --json
```

For a quick preview without SQL:

```bash
node scripts/amex-csv-to-expenses-sql.mjs /path/to/activity.csv --dry-run
```

The script:

- Uses a multiline CSV parser (Amex `Extended Details` spans quoted newlines)
- Skips payment/credit rows (`amount <= 0`) unless `--include-payments` is passed
- **Auto-categorizes each row** from raw CSV `Description` (+ extended notes) using [`scripts/lib/categorize-expense.mjs`](../../../scripts/lib/categorize-expense.mjs)
- **Formats readable `expense_name`** from the raw description via [`scripts/lib/format-amex-expense-name.mjs`](../../../scripts/lib/format-amex-expense-name.mjs); prepends `Amex: {Description}` to `notes`
- Legacy: pass `--no-auto-categorize` to assign one `--category=` to every row (default category name: Supplies & Materials)

Maps to `budget.expenses` columns:

| DB column | Source |
|-----------|--------|
| `expense_name` | Formatted display name from CSV `Description` (e.g. `Amazon`, `H-E-B Curbside`) |
| `amount` | CSV `Amount` (positive charges only by default) |
| `expense_date` | CSV `Date` → `YYYY-MM-DD` |
| `payment_method` | `AMEX {Account #}` (e.g. `AMEX -31009`) |
| `category` | Rule engine on **raw** description unless `--no-auto-categorize` |
| `notes` | `Amex: {raw Description}` + blank lines + `{Extended Details}` + `Category: {Category}` when present |

Each JSON row includes `rawDescription` and formatted `expense_name` for review.

Capture from `--json` output: `count`, `total`, `minDate`, `maxDate`, **`categorySummary`**, `rows`, `sql`, `batches`, and `duplicateCheckSql`.

### Step 2: Analyze categories (before insert)

Present **`categorySummary`** to the user: for each category, show `count` and `total` (dollars).

- Sort by `total` descending so the largest buckets are obvious
- If **Supplies & Materials** is unusually large, scan unmatched merchants in `rows` and propose new regex rules (see [reference.md](reference.md))
- Do **not** insert until the user confirms the breakdown looks reasonable (same analyze-then-import pattern as `@teacher-pay-import`)

If rules need changing before import, edit **both**:

- [`app/lib/budget/categorize-expense.ts`](../../../app/lib/budget/categorize-expense.ts)
- [`scripts/lib/categorize-expense.mjs`](../../../scripts/lib/categorize-expense.mjs)

Re-run Step 1 after rule changes.

For **already-imported** rows, re-categorize in bulk:

```bash
node scripts/apply-expense-categories.mjs \
  --from YYYY-MM-DD --to YYYY-MM-DD \
  --input /path/to/expenses-export.json \
  --json
```

### Step 3: Idempotency check

Before inserting, run `duplicateCheckSql` from the script output via Supabase MCP `execute_sql`:

```sql
SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
FROM budget.expenses
WHERE payment_method LIKE 'AMEX%'
  AND expense_date >= '{minDate}'
  AND expense_date < '{first day of month after maxDate}'
  AND is_deleted = false;
```

If `count > 0`, warn the user that re-importing will create duplicates. Ask whether to proceed or stop.

### Step 4: Execute INSERT

Use Supabase MCP `execute_sql` on project `vonuwpzepwrbdlectspd`.

- Prefer the `batches` array from script output (32 rows per batch) when the full `sql` is large
- Run each batch sequentially via `execute_sql`
- Target table: `budget.expenses` in the `budget` schema

```sql
INSERT INTO budget.expenses (expense_name, category, amount, payment_method, expense_date, notes)
VALUES (...);
```

### Step 5: Verify

Re-run the duplicate-check query from Step 3. The result must match the script's `count` and `total`.

Optional: group by category in Supabase and compare to `categorySummary`:

```sql
SELECT category, COUNT(*) AS count, SUM(amount) AS total
FROM budget.expenses
WHERE payment_method LIKE 'AMEX%'
  AND expense_date >= '{minDate}'
  AND expense_date < '{first day of month after maxDate}'
  AND is_deleted = false
GROUP BY category
ORDER BY total DESC;
```

If counts or totals differ, investigate before reporting success.

### Step 6: Report

Tell the user:

- Number of expenses imported
- Total dollar amount
- Month/date range covered
- **Category breakdown** (from `categorySummary` or verify query)
- Reminders:
  - Payment/credit rows (`MOBILE PAYMENT - THANK YOU`, negative amounts) are excluded by default
  - Amex's own `Category` column is preserved in `notes` when the full export includes it; budget `category` comes from the rule engine on the raw description
  - Raw Amex `Description` is always stored at the top of `notes` as `Amex: …`
  - Category names use `&` to match `CATEGORIES` in `app/admin/budget/page.tsx`
  - Expenses tab shows a spending breakdown donut after import

## Flags

| Flag | Effect |
|------|--------|
| `--json` | Full payload including `categorySummary` and `rows` |
| `--dry-run` | Count, total, date range, category summary — no SQL |
| `--no-auto-categorize` | Single `--category=` for all rows |
| `--category="..."` | Used only with `--no-auto-categorize` |
| `--include-payments` | Include zero/negative amounts |

## Example usage

User message:

> @amex-expenses-import import July  
> @/Users/me/Downloads/activity.csv

Agent actions:

1. Read this skill
2. `node scripts/amex-csv-to-expenses-sql.mjs <csv> --json`
3. Show `categorySummary` → user confirms
4. Duplicate check → insert batches → verify
5. Report count, total, and category breakdown

## Reference

- [reference.md](reference.md) — rule categories, `categorySummary` format, UI validation
- Script: [`scripts/amex-csv-to-expenses-sql.mjs`](../../../scripts/amex-csv-to-expenses-sql.mjs)
- Display names: [`scripts/lib/format-amex-expense-name.mjs`](../../../scripts/lib/format-amex-expense-name.mjs)
- Backfill readable names on existing rows: [`scripts/normalize-amex-expense-names.mjs`](../../../scripts/normalize-amex-expense-names.mjs)
- Rules: [`scripts/lib/categorize-expense.mjs`](../../../scripts/lib/categorize-expense.mjs), [`app/lib/budget/categorize-expense.ts`](../../../app/lib/budget/categorize-expense.ts)
- Post-import recategorize: [`scripts/apply-expense-categories.mjs`](../../../scripts/apply-expense-categories.mjs)
- Schema: `migrations/add-budget.sql` (`budget.expenses`)
- UI: [`app/admin/budget/page.tsx`](../../../app/admin/budget/page.tsx) (Expenses tab + spending breakdown)
