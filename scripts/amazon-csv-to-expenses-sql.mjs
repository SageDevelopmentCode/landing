#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const RECEIPT_URL_PREFIX =
  'https://www.amazon.com/b2b/aba/order-summary/'
const DEFAULT_CATEGORY = 'Supplies & Materials'

function parseArgs(argv) {
  const args = {
    csvPath: null,
    category: DEFAULT_CATEGORY,
    dryRun: false,
    json: false,
  }

  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--json') args.json = true
    else if (arg.startsWith('--category=')) {
      args.category = arg.slice('--category='.length)
    } else if (!arg.startsWith('-') && !args.csvPath) {
      args.csvPath = arg
    }
  }

  if (!args.csvPath) {
    console.error(
      'Usage: node scripts/amazon-csv-to-expenses-sql.mjs <orders.csv> [--dry-run] [--json] [--category="Supplies & Materials"]',
    )
    process.exit(1)
  }

  return args
}

function parseCSVLine(line) {
  const result = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }

  result.push(cur)
  return result
}

function parseOrderDate(mmDdYyyy) {
  const [mm, dd, yyyy] = mmDdYyyy.split('/')
  if (!mm || !dd || !yyyy) {
    throw new Error(`Invalid order date: ${mmDdYyyy}`)
  }
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function parseAmount(value) {
  const cleaned = String(value ?? '')
    .replace(/"/g, '')
    .trim()
  const amount = Number.parseFloat(cleaned)
  if (Number.isNaN(amount)) {
    throw new Error(`Invalid amount: ${value}`)
  }
  return amount
}

function escSql(value) {
  return String(value).replace(/'/g, "''")
}

function receiptUrl(orderId) {
  return `${RECEIPT_URL_PREFIX}${orderId}.html`
}

function receiptNotes(orderId) {
  return `RECEIPT: ${receiptUrl(orderId)}`
}

function parseAmazonOrdersCsv(csvPath, category) {
  const csv = fs.readFileSync(csvPath, 'utf8')
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) {
    throw new Error('CSV has no data rows')
  }

  const headers = parseCSVLine(lines[0])
  const idx = (name) => {
    const index = headers.indexOf(name)
    if (index === -1) {
      throw new Error(`Missing required CSV column: ${name}`)
    }
    return index
  }

  const orderDateIdx = idx('Order Date')
  const orderIdIdx = idx('Order ID')
  const orderNetTotalIdx = idx('Order Net Total')
  const orderStatusIdx = idx('Order Status')
  const titleIdx = idx('Title')

  const orders = new Map()

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    if (cols[orderStatusIdx] === 'Cancelled') continue

    const orderId = cols[orderIdIdx]
    if (!orderId || orders.has(orderId)) continue

    orders.set(orderId, {
      orderId,
      expense_name: cols[titleIdx],
      amount: parseAmount(cols[orderNetTotalIdx]),
      expense_date: parseOrderDate(cols[orderDateIdx]),
      category,
      notes: receiptNotes(orderId),
    })
  }

  const rows = [...orders.values()].sort((a, b) => {
    const byDate = a.expense_date.localeCompare(b.expense_date)
    return byDate !== 0 ? byDate : a.orderId.localeCompare(b.orderId)
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

function buildInsertSql(rows) {
  if (rows.length === 0) {
    return '-- No rows to insert (all cancelled or empty CSV)'
  }

  const values = rows
    .map((row, index) => {
      const suffix = index < rows.length - 1 ? ',' : ';'
      return `  ('${escSql(row.expense_name)}', '${escSql(row.category)}', ${row.amount.toFixed(2)}, '${row.expense_date}', '${escSql(row.notes)}')${suffix}`
    })
    .join('\n')

  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  return [
    '-- Amazon Business orders -> budget.expenses',
    `-- ${rows.length} unique orders (Cancelled skipped; one row per Order ID)`,
    `-- Total: $${total.toFixed(2)}`,
    '',
    'INSERT INTO budget.expenses (expense_name, category, amount, expense_date, notes)',
    'VALUES',
    values,
  ].join('\n')
}

function buildDuplicateCheckSql(minDate, maxDate) {
  const maxExclusive = addOneMonth(minDate)
  return [
    'SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total',
    'FROM budget.expenses',
    "WHERE notes LIKE 'RECEIPT: https://www.amazon.com/b2b/aba/order-summary/%'",
    `  AND expense_date >= '${minDate}'`,
    `  AND expense_date < '${maxExclusive}'`,
    '  AND is_deleted = false;',
  ].join('\n')
}

function addOneMonth(yyyyMmDd) {
  const [year, month] = yyyyMmDd.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const csvPath = path.resolve(args.csvPath)

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const rows = parseAmazonOrdersCsv(csvPath, args.category)
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const { minDate, maxDate, month } = summarizeDateRange(rows)
  const sql = buildInsertSql(rows)
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
      rows,
      sql,
      duplicateCheckSql,
      verifySql: duplicateCheckSql,
    }
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  if (args.dryRun) {
    console.log(`Source: ${csvPath}`)
    console.log(`Orders: ${rows.length}`)
    console.log(`Total: $${total.toFixed(2)}`)
    console.log(`Month: ${month ?? 'n/a'}`)
    console.log(`Date range: ${minDate ?? 'n/a'} to ${maxDate ?? 'n/a'}`)
    return
  }

  console.log(sql)
}

main()
