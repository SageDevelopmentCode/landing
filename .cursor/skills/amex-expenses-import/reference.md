# Amex import — categorization reference

## Rule source (keep in sync)

| File | Used by |
|------|---------|
| [`app/lib/budget/categorize-expense.ts`](../../../app/lib/budget/categorize-expense.ts) | App / future server use |
| [`scripts/lib/categorize-expense.mjs`](../../../scripts/lib/categorize-expense.mjs) | Amex import script, `apply-expense-categories.mjs` |

First matching regex wins. Unmatched merchants default to **Supplies & Materials**.

## Categories and example merchants

| Category | Example patterns / merchants |
|----------|------------------------------|
| Teacher Pay | `Zelinda Pay`, `Joy Pay`, `Edith Pay` (rare on Amex) |
| Rent | word `rent` |
| Utilities | Green Mountain, ENERG |
| Technology & Software | Supabase, Spotify |
| Marketing | Facebk, Indeed |
| Professional Services | Checkr |
| Fuel & Transportation | Chevron, parking, Lime, gas/car wash, transportation-fuel |
| Food & Meals | DoorDash, Chipotle, Starbucks, TST*, restaurants, fast food, many named chains |
| Other | Amex adj redist, VanillaGift, mobile payment, organic nails |
| Supplies & Materials | Amazon, Target, H-E-B, Walmart, Home Depot, Dollar Tree, Sprouts, PetSmart |

H-E-B and grocery runs are intentionally **Supplies & Materials** (school supplies / operations), not Food & Meals.

## `categorySummary` format

From `node scripts/amex-csv-to-expenses-sql.mjs ... --json`:

```json
{
  "categorySummary": {
    "Supplies & Materials": { "count": 42, "total": 3120.55 },
    "Food & Meals": { "count": 8, "total": 412.30 },
    "Fuel & Transportation": { "count": 3, "total": 98.12 }
  }
}
```

- **`count`**: number of charge rows in that category
- **`total`**: sum of `amount` (USD, two decimal places)
- Totals across categories should equal top-level `total` in the JSON payload

When presenting to the user, format as a short table sorted by `total` descending. Call out anything still sitting in Supplies & Materials that looks like food, fuel, or software.

## After import validation

1. Admin → **Budget** → **Expenses** tab: use the spending breakdown (donut + ranked bars) for the imported month filter.
2. Supabase spot-check:

```sql
SELECT category, COUNT(*) AS count, ROUND(SUM(amount)::numeric, 2) AS total
FROM budget.expenses
WHERE payment_method LIKE 'AMEX%'
  AND expense_date >= '2026-10-01'
  AND expense_date < '2026-11-01'
  AND is_deleted = false
GROUP BY category
ORDER BY total DESC;
```

Replace dates with the import month's `[minDate, first day of next month)`.

## Notes format after import

```
Amex: AplPay CHIPOTLE 2634PFLUGERVILLE TX

{Extended Details from CSV, if any}

Category: {Amex category column, if any}
```

## Fixing past imports (readable names)

Export expenses JSON for the date range, then:

```bash
node scripts/normalize-amex-expense-names.mjs \
  --from 2026-09-01 --to 2026-11-01 \
  --input ./expenses.json \
  --dry-run
```

Review `changes`, then run generated `updateSql` via Supabase.

## Fixing past imports (categories only)

Export expenses JSON for the date range, then:

```bash
node scripts/apply-expense-categories.mjs \
  --from 2026-09-01 --to 2026-11-01 \
  --input ./expenses.json \
  --dry-run
```

Review `changes` and `summary`, then run generated `updateSql` via Supabase MCP (or `--json` and execute updates in batches).
