---
name: teacher-pay-import
description: Import Mercury outgoing teacher payroll into budget.expenses (Teacher Pay). Use when the user asks to import teacher pay, Mercury payroll for Zelinda/Joy/Edith, or references @teacher-pay-import for a month.
---

# Teacher Pay Import (Mercury)

Import Mercury **Send Money** (`outgoingPayment`) to listed teachers into `budget.expenses` for Admin Budget → Expenses tab.

## When to use

- User asks to import **teacher pay** for a month from Mercury
- User references `@teacher-pay-import` with a month (e.g. September 2026)
- Monthly payroll reconciliation for budget P&amp;L

## Prerequisites

- Mercury MCP (`plugin-mercury-mercury`) connected
- Supabase MCP (`user-supabase`) for INSERT
- Sage Field project ID: `vonuwpzepwrbdlectspd`

## Teachers (Mercury counterparty → expense name)

| Mercury `counterpartyName` | `expense_name` |
| -------------------------- | -------------- |
| Zelinda Melo | Zelinda Pay |
| Joy Paige | Joy Pay |
| Edith DeLuna | Edith Pay |

**Edith DeLuna** started in **October 2026**; September imports typically have 0 rows for her. Always include her in Mercury searches for later months.

See [reference.md](reference.md) for details.

## Workflow

```
- [ ] Step 1: Anchor date (Mercury getCurrentDate)
- [ ] Step 2: Fetch outgoing payments (Mercury listTransactions)
- [ ] Step 3: Save JSON + run script
- [ ] Step 4: Idempotency check (Supabase)
- [ ] Step 5: INSERT batches
- [ ] Step 6: Verify count/total
- [ ] Step 7: Report (skipped rows, Edith, August overlap caveat)
```

### Step 1: Anchor date

Call Mercury `getCurrentDate`. Derive `--month YYYY-MM` from the user request relative to today.

### Step 2: Fetch transactions

For each teacher counterparty, call `listTransactions` with:

- `postedStart`: `{month}-01`
- `postedEnd`: last day of month (e.g. `2026-09-30`)
- `status`: `['sent']`
- `search`: teacher name (e.g. `Zelinda Melo`, `Joy Paige`, `Edith DeLuna`)

Paginate with `start_after` until `page.nextPage` is absent if needed.

Merge results into one JSON array (dedupe by transaction `id`). Include fields: `id`, `amount`, `postedAt`, `counterpartyName`, `externalMemo`, `bankDescription`, `kind`, `status`, `trackingNumber`.

Only **outgoingPayment** rows in the target month are imported; the script filters the rest.

### Step 3: Run script

```bash
node scripts/teacher-pay-mercury-to-expenses-sql.mjs \
  --input /path/to/mercury-teacher-txs.json \
  --month 2026-09 \
  --json
```

Capture `count`, `total`, `rows`, `sql`, `batches`, `duplicateCheckSql`, `trackingCheckSql`, and `skipped`.

Mapping:

| DB column | Value |
| --------- | ----- |
| `expense_name` | Short pay name (table above) |
| `category` | `Teacher Pay` |
| `amount` | `abs(amount)` |
| `payment_method` | `Mercury` |
| `expense_date` | UTC date from `postedAt` |
| `notes` | `Mercury tracking: {trackingNumber}\n{externalMemo}` |

### Step 4: Idempotency

Run `trackingCheckSql` from script output. If any tracking id already exists in `notes`, warn and skip re-inserting those rows.

Run `duplicateCheckSql`:

```sql
SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
FROM budget.expenses
WHERE is_deleted = false
  AND category = 'Teacher Pay'
  AND payment_method = 'Mercury'
  AND notes LIKE 'Mercury tracking: %'
  AND expense_date >= '{monthStart}'
  AND expense_date < '{monthEndExclusive}';
```

If `count > 0` for a fresh import month, investigate duplicates before proceeding.

### Step 5: INSERT

Use Supabase MCP `execute_sql` on project `vonuwpzepwrbdlectspd`. Run each `batches` entry sequentially.

### Step 6: Verify

Re-run `duplicateCheckSql`. Totals must match script `count` and `total`.

### Step 7: Report

- Payments imported and total dollars
- Per-teacher breakdown
- `skipped` count (wrong kind, wrong counterparty, outside month)
- Reminder: early-month wires may cover **prior** pay period (e.g. Aug hours posted Sep 1)
- Category must match `Teacher Pay` in `app/admin/budget/page.tsx`

## Example

> @teacher-pay-import import teacher pay for September 2026

1. Read this skill
2. Mercury fetch → JSON file
3. `node scripts/teacher-pay-mercury-to-expenses-sql.mjs --input ... --month 2026-09 --json`
4. Idempotency → insert → verify

## Reference

- Script: `scripts/teacher-pay-mercury-to-expenses-sql.mjs`
- Schema: `migrations/add-budget.sql` (`budget.expenses`)
- UI: `app/admin/budget/page.tsx` (Expenses tab, `Teacher Pay` category)
