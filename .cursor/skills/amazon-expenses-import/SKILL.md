---
name: amazon-expenses-import
description: Import Amazon Business order CSV exports into budget.expenses via Supabase. Use when the user attaches an Amazon orders CSV, asks to import Amazon expenses, or mentions monthly Amazon spending for the budget admin page.
---

# Amazon Expenses Import

Import Amazon Business monthly order CSV exports into `budget.expenses` for the Admin Budget → Expenses tab.

## When to use

- User attaches an `orders_from_*.csv` Amazon Business export
- User asks to import Amazon orders into budget expenses
- User references `@amazon-expenses-import` with a CSV path

## Prerequisites

- Attached CSV is an Amazon Business order report export
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
node scripts/amazon-csv-to-expenses-sql.mjs /path/to/orders.csv --json
```

For a quick preview without SQL:

```bash
node scripts/amazon-csv-to-expenses-sql.mjs /path/to/orders.csv --dry-run
```

The script:

- Skips rows where `Order Status = 'Cancelled'`
- Deduplicates by `Order ID` (one expense per order; first row wins)
- Maps to `budget.expenses` columns:

| DB column | Source |
|-----------|--------|
| `expense_name` | CSV `Title` |
| `amount` | CSV `Order Net Total` |
| `expense_date` | CSV `Order Date` → `YYYY-MM-DD` |
| `category` | `Supplies & Materials` (default) |
| `notes` | `RECEIPT: https://www.amazon.com/b2b/aba/order-summary/{Order ID}.html` |

Capture `count`, `total`, `minDate`, `maxDate`, `sql`, and `duplicateCheckSql` from `--json` output.

### Step 2: Idempotency check

Before inserting, run `duplicateCheckSql` from the script output via Supabase MCP `execute_sql`:

```sql
SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
FROM budget.expenses
WHERE notes LIKE 'RECEIPT: https://www.amazon.com/b2b/aba/order-summary/%'
  AND expense_date >= '{minDate}'
  AND expense_date < '{first day of next month}'
  AND is_deleted = false;
```

If `count > 0`, warn the user that re-importing will create duplicates. Ask whether to proceed or stop.

### Step 3: Execute INSERT

Use Supabase MCP `execute_sql` on project `vonuwpzepwrbdlectspd` with the `sql` field from the script output.

Target table: `budget.expenses` in the `budget` schema. RLS requires super admin access.

```sql
INSERT INTO budget.expenses (expense_name, category, amount, expense_date, notes)
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
  - Amazon eGift Card orders may need manual recategorization
  - Multi-item orders use the first line item's title only
  - Category is `Supplies & Materials` (with `&`) to match `CATEGORIES` in `app/admin/budget/page.tsx`

## Example usage

User message:

> @amazon-expenses-import import July orders  
> @/Users/me/Downloads/orders_from_20260701_to_20260731_....csv

Agent actions:

1. Read this skill
2. `node scripts/amazon-csv-to-expenses-sql.mjs <csv> --json`
3. Duplicate check → insert → verify
4. Report count + total

## Reference

- Script: `scripts/amazon-csv-to-expenses-sql.mjs`
- Schema: `migrations/add-budget.sql` (`budget.expenses`)
- UI: `app/admin/budget/page.tsx` (Expenses tab)
