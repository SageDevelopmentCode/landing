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

- Attached CSV is an Amex activity report export (columns: `Date`, `Description`, `Account #`, `Amount`, `Extended Details`, `Category`)
- Supabase MCP available (`user-supabase`)
- Sage Field project ID: `vonuwpzepwrbdlectspd`

## Workflow

Copy this checklist and track progress:

```
- [ ] Step 1: Parse CSV with script
- [ ] Step 2: Check for existing imports (idempotency)
- [ ] Step 3: Execute INSERT via Supabase MCP
- [ ] Step 4: Verify count and total
- [ ] Step 5: Report results and caveats
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
- Maps to `budget.expenses` columns:

| DB column | Source |
|-----------|--------|
| `expense_name` | CSV `Description` |
| `amount` | CSV `Amount` (positive charges only by default) |
| `expense_date` | CSV `Date` → `YYYY-MM-DD` |
| `payment_method` | `AMEX {Account #}` (e.g. `AMEX -31009`) |
| `category` | `Supplies & Materials` (default) |
| `notes` | `{Extended Details}` + blank line + `Category: {Category}` |

Capture `count`, `total`, `minDate`, `maxDate`, `sql`, `batches`, and `duplicateCheckSql` from `--json` output.

### Step 2: Idempotency check

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

### Step 3: Execute INSERT

Use Supabase MCP `execute_sql` on project `vonuwpzepwrbdlectspd`.

- Prefer the `batches` array from script output (32 rows per batch) when the full `sql` is large
- Run each batch sequentially via `execute_sql`
- Target table: `budget.expenses` in the `budget` schema

```sql
INSERT INTO budget.expenses (expense_name, category, amount, payment_method, expense_date, notes)
VALUES (...);
```

### Step 4: Verify

Re-run the duplicate-check query from Step 2. The result must match the script's `count` and `total`.

If counts differ, investigate before reporting success.

### Step 5: Report

Tell the user:

- Number of expenses imported
- Total dollar amount
- Month/date range covered
- Reminders:
  - Payment/credit rows (`MOBILE PAYMENT - THANK YOU`, negative amounts) are excluded by default
  - All rows use `Supplies & Materials`; Amex category is preserved in `notes` for manual recategorization
  - Category uses `&` to match `CATEGORIES` in `app/admin/budget/page.tsx`

## Example usage

User message:

> @amex-expenses-import import July  
> @/Users/me/Downloads/activity.csv

Agent actions:

1. Read this skill
2. `node scripts/amex-csv-to-expenses-sql.mjs <csv> --json`
3. Duplicate check → insert batches → verify
4. Report count + total

## Reference

- Script: `scripts/amex-csv-to-expenses-sql.mjs`
- Schema: `migrations/add-budget.sql` (`budget.expenses`)
- UI: `app/admin/budget/page.tsx` (Expenses tab)
