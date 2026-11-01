#!/usr/bin/env node
/**
 * Normalize AMEX expense_name to readable labels; preserve raw Description in notes.
 */
import fs from 'node:fs'
import {
  formatAmexDisplayName,
  prependAmexDescription,
  resolveRawAmexDescription,
} from './lib/format-amex-expense-name.mjs'

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
      'Usage: node scripts/normalize-amex-expense-names.mjs --from YYYY-MM-DD --to YYYY-MM-DD --input expenses.json [--dry-run] [--json]',
    )
    process.exit(1)
  }
  return args
}

function isAmexRow(row) {
  return String(row.payment_method ?? '').startsWith('AMEX')
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const raw = fs.readFileSync(args.inputPath, 'utf8')
  const parsed = JSON.parse(raw)
  const expenses = Array.isArray(parsed) ? parsed : parsed.expenses ?? []

  const changes = []

  for (const row of expenses) {
    if (row.is_deleted) continue
    if (!isAmexRow(row)) continue
    const date = row.expense_date
    if (date < args.from || date >= args.to) continue

    const rawDescription = resolveRawAmexDescription(
      row.expense_name,
      row.notes,
    )
    const newNotes = prependAmexDescription(rawDescription, row.notes)
    const newName = formatAmexDisplayName(rawDescription, newNotes)

    if (newName === row.expense_name && newNotes === (row.notes ?? '')) {
      continue
    }

    changes.push({
      id: row.id,
      expense_date: row.expense_date,
      oldName: row.expense_name,
      newName,
      notesChanged: newNotes !== (row.notes ?? ''),
    })
  }

  const updateSql =
    changes.length === 0
      ? '-- No expense name updates needed'
      : changes
          .map((c) => {
            const row = expenses.find((e) => e.id === c.id)
            const rawDescription = resolveRawAmexDescription(
              row.expense_name,
              row.notes,
            )
            const newNotes = prependAmexDescription(rawDescription, row.notes)
            return `UPDATE budget.expenses SET expense_name = '${escSql(c.newName)}', notes = '${escSql(newNotes)}' WHERE id = '${escSql(c.id)}';`
          })
          .join('\n')

  const distinctNewNames = [...new Set(changes.map((c) => c.newName))].sort()

  const payload = {
    from: args.from,
    to: args.to,
    changeCount: changes.length,
    distinctNewNames,
    changes: changes.slice(0, 30),
    updateSql,
  }

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  console.log(`Changes: ${changes.length}`)
  console.log('Sample renames:')
  for (const c of changes.slice(0, 15)) {
    console.log(`  ${c.oldName.slice(0, 50)} → ${c.newName}`)
  }
  if (!args.dryRun && changes.length > 0) {
    console.log(updateSql)
  }
}

main()
