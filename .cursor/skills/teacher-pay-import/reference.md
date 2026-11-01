# Teacher pay import reference

## Mercury MCP tools

- `getCurrentDate` — anchor relative months
- `listTransactions` — use **postedStart** / **postedEnd**, not `start` / `end`
- Debits are negative; script stores positive amounts in `budget.expenses`

## Allowlist

| Counterparty | Expense name | Notes |
| ------------ | ------------ | ----- |
| Zelinda Melo | Zelinda Pay | |
| Joy Paige | Joy Pay | May appear with nickname `Joy` |
| Edith DeLuna | Edith Pay | First expected **October 2026** |

## September 2026 example (posted in calendar September)

| Posted | Name | Amount |
| ------ | ---- | ------ |
| 2026-09-01 | Zelinda Pay | $2,047.92 |
| 2026-09-15 | Joy Pay | $1,793.75 |
| 2026-09-16 | Zelinda Pay | $1,967.50 |
| 2026-09-30 | Joy Pay | $1,742.08 |

**Total:** 4 payments, **$7,551.25**

## Idempotency key

`notes` begins with `Mercury tracking: {trackingNumber}` (Mercury `trackingNumber` or transaction `id`). Re-importing the same wire should match existing rows via `trackingCheckSql`.

## Overlap caveat

Manual budget rows on **2026-08-31** may cover similar pay periods as a **2026-09-01** Mercury wire (late-August hours). Review P&amp;L when both exist; this skill does not dedupe against non-Mercury-tracking manual rows.
