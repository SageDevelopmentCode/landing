#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_CATEGORY = 'Supplies & Materials'
const BATCH_SIZE = 32

function parseArgs(argv) {
  const args = {
    csvPath: null,
    category: DEFAULT_CATEGORY,
    dryRun: false,
    json: false,
    includePayments: false,
  }

  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--json') args.json = true
    else if (arg === '--include-payments') args.includePayments = true
    else if (arg.startsWith('--category=')) {
      args.category = arg.slice('--category='.length)
    } else if (!arg.startsWith('-') && !args.csvPath) {
      args.csvPath = arg
    }
  }

  if (!args.csvPath) {
    console.error(
      'Usage: node scripts/amex-csv-to-expenses-sql.mjs <activity.csv> [--dry-run] [--json] [--category="Supplies & Materials"] [--include-payments]',
    )
    process.exit(1)
  }

  return args
}

/** Parse CSV with multiline quoted fields (Amex Extended Details). */
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      field += ch
    }
  }

  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function parseExpenseDate(mmDdYyyy) {
  const [mm, dd, yyyy] = mmDdYyyy.split('/')
  if (!mm || !dd || !yyyy) {
    throw new Error(`Invalid date: ${mmDdYyyy}`)
  }
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function parseAmount(value) {
  const amount = Number.parseFloat(String(value ?? '').trim())
  if (Number.isNaN(amount)) {
    throw new Error(`Invalid amount: ${value}`)
  }
  return amount
}

function escSql(value) {
  return String(value).replace(/'/g, "''")
}

function buildNotes(extended, category) {
  const parts = []
  if (extended?.trim()) parts.push(extended.trim())
  if (category?.trim()) parts.push(`Category: ${category.trim()}`)
  return parts.join('\n\n')
}

function parseAmexActivityCsv(csvPath, category, includePayments) {
  const csv = fs.readFileSync(csvPath, 'utf8')
  const all = parseCSV(csv.trim())
  if (all.length < 2) {
    throw new Error('CSV has no data rows')
  }

  const headers = all[0]
  const idx = (name) => {
    const index = headers.indexOf(name)
    if (index === -1) {
      throw new Error(`Missing required CSV column: ${name}`)
    }
    return index
  }

  const dateIdx = idx('Date')
  const descriptionIdx = idx('Description')
  const accountIdx = idx('Account #')
  const amountIdx = idx('Amount')
  const extendedIdx = idx('Extended Details')
  const categoryIdx = idx('Category')

  const rows = []

  for (let i = 1; i < all.length; i++) {
    const cols = all[i]
    const amount = parseAmount(cols[amountIdx])
    if (!includePayments && amount <= 0) continue

    rows.push({
      expense_name: cols[descriptionIdx],
      amount,
      expense_date: parseExpenseDate(cols[dateIdx]),
      payment_method: `AMEX ${cols[accountIdx]}`,
      category,
      notes: buildNotes(cols[extendedIdx], cols[categoryIdx]),
    })
  }

  rows.sort((a, b) => {
    const byDate = a.expense_date.localeCompare(b.expense_date)
    return byDate !== 0
      ? byDate
      : a.expense_name.localeCompare(b.expense_name)
  })

  return rows
}

function summarizeDateRange(rows) {
  if (rows.length === 0) {
    return { minDate: null, maxDate: null, month: null }
  }

  const dates = rows.map((row) => row.expense_date).sort()
  const minDate = dates[0]
  const maxDate = dates[dates.length - 1]
  const month = minDate.slice(0, 7)

  return { minDate, maxDate, month }
}

function firstDayAfterMonth(yyyyMmDd) {
  const [year, month] = yyyyMmDd.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
}

function buildInsertValues(rows) {
  return rows
    .map((row, index) => {
      const suffix = index < rows.length - 1 ? ',' : ';'
      return `  ('${escSql(row.expense_name)}', '${escSql(row.category)}', ${row.amount.toFixed(2)}, '${escSql(row.payment_method)}', '${row.expense_date}', '${escSql(row.notes)}')${suffix}`
    })
    .join('\n')
}

function buildInsertSql(rows, { header = true } = {}) {
  if (rows.length === 0) {
    return '-- No rows to insert (all payments excluded or empty CSV)'
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const values = buildInsertValues(rows)
  const lines = []

  if (header) {
    lines.push(
      '-- Amex activity.csv -> budget.expenses',
      `-- ${rows.length} charge rows (payments excluded unless --include-payments)`,
      `-- Total: $${total.toFixed(2)}`,
      '',
    )
  }

  lines.push(
    'INSERT INTO budget.expenses (expense_name, category, amount, payment_method, expense_date, notes)',
    'VALUES',
    values,
  )

  return lines.join('\n')
}

function buildBatches(rows) {
  if (rows.length === 0) return []

  const batches = []
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE)
    batches.push(buildInsertSql(chunk, { header: i === 0 }))
  }
  return batches
}

function buildDuplicateCheckSql(minDate, maxDate) {
  const maxExclusive = firstDayAfterMonth(maxDate)
  return [
    'SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total',
    'FROM budget.expenses',
    "WHERE payment_method LIKE 'AMEX%'",
    `  AND expense_date >= '${minDate}'`,
    `  AND expense_date < '${maxExclusive}'`,
    '  AND is_deleted = false;',
  ].join('\n')
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const csvPath = path.resolve(args.csvPath)

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const rows = parseAmexActivityCsv(
    csvPath,
    args.category,
    args.includePayments,
  )
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const { minDate, maxDate, month } = summarizeDateRange(rows)
  const sql = buildInsertSql(rows)
  const batches = buildBatches(rows)
  const duplicateCheckSql =
    minDate && maxDate ? buildDuplicateCheckSql(minDate, maxDate) : null

  if (args.json) {
    const payload = {
      sourceCsv: csvPath,
      count: rows.length,
      total: Number(total.toFixed(2)),
      month,
      minDate,
      maxDate,
      category: args.category,
      includePayments: args.includePayments,
      rows,
      sql,
      batches,
      duplicateCheckSql,
      verifySql: duplicateCheckSql,
    }
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  if (args.dryRun) {
    console.log(`Source: ${csvPath}`)
    console.log(`Charges: ${rows.length}`)
    console.log(`Total: $${total.toFixed(2)}`)
    console.log(`Month: ${month ?? 'n/a'}`)
    console.log(`Date range: ${minDate ?? 'n/a'} to ${maxDate ?? 'n/a'}`)
    console.log(`Batches: ${batches.length}`)
    return
  }

  console.log(sql)
}

main()
