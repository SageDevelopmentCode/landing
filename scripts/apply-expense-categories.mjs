#!/usr/bin/env node
/**
 * Re-categorize budget.expenses using scripts/lib/categorize-expense.mjs
 * (same rules as app/lib/budget/categorize-expense.ts).
 */
import fs from 'node:fs'
import {
  categorizeExpense,
  summarizeByCategory,
} from './lib/categorize-expense.mjs'

function escSql(value) {
  return String(value).replace(/'/g, "''")
}

function parseArgs(argv) {
  const args = {
    from: null,
    to: null,
    inputPath: null,
    dryRun: false,
    json: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--json') args.json = true
    else if (arg === '--from' && argv[i + 1]) args.from = argv[++i]
    else if (arg === '--to' && argv[i + 1]) args.to = argv[++i]
    else if (arg === '--input' && argv[i + 1]) args.inputPath = argv[++i]
  }
  if (!args.from || !args.to || !args.inputPath) {
    console.error(
      'Usage: node scripts/apply-expense-categories.mjs --from YYYY-MM-DD --to YYYY-MM-DD --input expenses.json [--dry-run] [--json]',
    )
    process.exit(1)
  }
  return args
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const raw = fs.readFileSync(args.inputPath, 'utf8')
  const parsed = JSON.parse(raw)
  const expenses = Array.isArray(parsed) ? parsed : parsed.expenses ?? []

  const changes = []
  for (const row of expenses) {
    if (row.is_deleted) continue
    const date = row.expense_date
    if (date < args.from || date >= args.to) continue
    const next = categorizeExpense(row.expense_name, row.notes)
    if (next !== row.category) {
      changes.push({
        id: row.id,
        expense_name: row.expense_name,
        amount: Number(row.amount),
        expense_date: row.expense_date,
        oldCategory: row.category,
        newCategory: next,
      })
    }
  }

  const projected = expenses
    .filter(
      (row) =>
        !row.is_deleted &&
        row.expense_date >= args.from &&
        row.expense_date < args.to,
    )
    .map((row) => ({
      ...row,
      category:
        changes.find((c) => c.id === row.id)?.newCategory ?? row.category,
    }))

  const summary = summarizeByCategory(projected)
  const updateSql =
    changes.length === 0
      ? '-- No category updates needed'
      : changes
          .map(
            (c) =>
              `UPDATE budget.expenses SET category = '${escSql(c.newCategory)}' WHERE id = '${escSql(c.id)}';`,
          )
          .join('\n')

  const payload = {
    from: args.from,
    to: args.to,
    changeCount: changes.length,
    changes,
    summary,
    updateSql,
  }

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  console.log(`Changes: ${changes.length}`)
  console.log('Summary after apply:', summary)
  if (!args.dryRun && changes.length > 0) {
    console.log(updateSql)
  }
}

main()
