#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const CATEGORY = 'Teacher Pay'
const PAYMENT_METHOD = 'Mercury'
const BATCH_SIZE = 32

/** Mercury counterpartyName → budget expense_name */
const TEACHER_ALLOWLIST = [
  { counterparty: 'Zelinda Melo', expenseName: 'Zelinda Pay' },
  { counterparty: 'Joy Paige', expenseName: 'Joy Pay' },
  { counterparty: 'Edith DeLuna', expenseName: 'Edith Pay' },
]

function parseArgs(argv) {
  const args = {
    inputPath: null,
    month: null,
    dryRun: false,
    json: false,
  }

  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--json') args.json = true
    else if (arg.startsWith('--input=')) {
      args.inputPath = arg.slice('--input='.length)
    } else if (arg.startsWith('--month=')) {
      args.month = arg.slice('--month='.length)
    } else if (arg.startsWith('--input') && arg === '--input') {
      // next arg handled below — use --input= form preferred
    } else if (!arg.startsWith('-') && !args.inputPath && arg.endsWith('.json')) {
      args.inputPath = arg
    }
  }

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--input' && argv[i + 1]) {
      args.inputPath = argv[i + 1]
    }
    if (argv[i] === '--month' && argv[i + 1]) {
      args.month = argv[i + 1]
    }
  }

  if (!args.inputPath || !args.month) {
    console.error(
      'Usage: node scripts/teacher-pay-mercury-to-expenses-sql.mjs --input <mercury.json> --month YYYY-MM [--dry-run] [--json]',
    )
    process.exit(1)
  }

  if (!/^\d{4}-\d{2}$/.test(args.month)) {
    console.error(`Invalid --month (expected YYYY-MM): ${args.month}`)
    process.exit(1)
  }

  return args
}

function escSql(value) {
  return String(value).replace(/'/g, "''")
}

function firstDayAfterMonth(yyyyMm) {
  const [year, month] = yyyyMm.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
}

function monthBounds(yyyyMm) {
  const monthStart = `${yyyyMm}-01`
  const monthEndExclusive = firstDayAfterMonth(yyyyMm)
  return { monthStart, monthEndExclusive }
}

function expenseNameForCounterparty(name) {
  const normalized = String(name ?? '').trim().toLowerCase()
  for (const row of TEACHER_ALLOWLIST) {
    if (row.counterparty.toLowerCase() === normalized) {
      return row.expenseName
    }
  }
  return null
}

function parseMercuryJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = JSON.parse(raw)
  if (Array.isArray(parsed)) return parsed
  if (Array.isArray(parsed.transactions)) return parsed.transactions
  throw new Error('JSON must be an array or { transactions: [...] }')
}

function postedDateUtc(iso) {
  if (!iso) return null
  return String(iso).slice(0, 10)
}

function buildNotes(tx) {
  const tracking = tx.trackingNumber || tx.id || 'unknown'
  const detail = (tx.externalMemo || tx.bankDescription || '').trim()
  return detail
    ? `Mercury tracking: ${tracking}\n${detail}`
    : `Mercury tracking: ${tracking}`
}

function trackingKey(notes) {
  const m = String(notes).match(/^Mercury tracking: (\S+)/)
  return m ? m[1] : null
}

function filterTransactions(transactions, month) {
  const { monthStart, monthEndExclusive } = monthBounds(month)
  const rows = []
  const skipped = []

  for (const tx of transactions) {
    const reason = []
    if (tx.kind !== 'outgoingPayment') reason.push(`kind=${tx.kind ?? 'n/a'}`)
    if (tx.status !== 'sent') reason.push(`status=${tx.status ?? 'n/a'}`)

    const expenseName = expenseNameForCounterparty(tx.counterpartyName)
    if (!expenseName) {
      reason.push(`counterparty=${tx.counterpartyName ?? 'n/a'}`)
    }

    const expenseDate = postedDateUtc(tx.postedAt)
    if (
      !expenseDate ||
      expenseDate < monthStart ||
      expenseDate >= monthEndExclusive
    ) {
      reason.push(`postedAt=${tx.postedAt ?? 'n/a'}`)
    }

    if (reason.length > 0) {
      skipped.push({
        id: tx.id,
        counterpartyName: tx.counterpartyName,
        postedAt: tx.postedAt,
        amount: tx.amount,
        reasons: reason,
      })
      continue
    }

    const amount = Math.abs(Number(tx.amount))
    if (Number.isNaN(amount) || amount <= 0) {
      skipped.push({
        id: tx.id,
        counterpartyName: tx.counterpartyName,
        reasons: ['invalid amount'],
      })
      continue
    }

    const notes = buildNotes(tx)
    rows.push({
      mercury_id: tx.id,
      mercury_tracking: trackingKey(notes),
      expense_name: expenseName,
      category: CATEGORY,
      amount,
      payment_method: PAYMENT_METHOD,
      expense_date: expenseDate,
      notes,
    })
  }

  rows.sort((a, b) => {
    const byDate = a.expense_date.localeCompare(b.expense_date)
    return byDate !== 0
      ? byDate
      : a.expense_name.localeCompare(b.expense_name)
  })

  return { rows, skipped, monthStart, monthEndExclusive }
}

function buildInsertValues(rows) {
  return rows
    .map((row, index) => {
      const suffix = index < rows.length - 1 ? ',' : ';'
      return `  ('${escSql(row.expense_name)}', '${escSql(row.category)}', ${row.amount.toFixed(2)}, '${escSql(row.payment_method)}', '${row.expense_date}', '${escSql(row.notes)}')${suffix}`
    })
    .join('\n')
}

function buildInsertSql(rows, { header = true, month } = {}) {
  if (rows.length === 0) {
    return '-- No teacher pay rows to insert for this month/input'
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const lines = []

  if (header) {
    lines.push(
      '-- Mercury teacher outgoingPayment -> budget.expenses',
      `-- Month: ${month}`,
      `-- ${rows.length} payment(s)`,
      `-- Total: $${total.toFixed(2)}`,
      '',
    )
  }

  lines.push(
    'INSERT INTO budget.expenses (expense_name, category, amount, payment_method, expense_date, notes)',
    'VALUES',
    buildInsertValues(rows),
  )

  return lines.join('\n')
}

function buildBatches(rows, month) {
  if (rows.length === 0) return []

  const batches = []
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE)
    batches.push(buildInsertSql(chunk, { header: i === 0, month }))
  }
  return batches
}

function buildDuplicateCheckSql(monthStart, monthEndExclusive) {
  return [
    'SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total',
    'FROM budget.expenses',
    'WHERE is_deleted = false',
    `  AND category = '${CATEGORY}'`,
    `  AND payment_method = '${PAYMENT_METHOD}'`,
    "  AND notes LIKE 'Mercury tracking: %'",
    `  AND expense_date >= '${monthStart}'`,
    `  AND expense_date < '${monthEndExclusive}';`,
  ].join('\n')
}

function buildTrackingCheckSql(trackingIds) {
  if (trackingIds.length === 0) return null
  const likes = trackingIds
    .map((id) => `notes LIKE 'Mercury tracking: ${escSql(id)}%'`)
    .join('\n   OR ')
  return [
    'SELECT notes, amount, expense_date',
    'FROM budget.expenses',
    'WHERE is_deleted = false',
    `  AND (${likes});`,
  ].join('\n')
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const inputPath = path.resolve(args.inputPath)

  if (!fs.existsSync(inputPath)) {
    console.error(`Input not found: ${inputPath}`)
    process.exit(1)
  }

  const transactions = parseMercuryJson(inputPath)
  const { rows, skipped, monthStart, monthEndExclusive } = filterTransactions(
    transactions,
    args.month,
  )
  const total = rows.reduce((sum, row) => sum + row.amount, 0)
  const sql = buildInsertSql(rows, { month: args.month })
  const batches = buildBatches(rows, args.month)
  const duplicateCheckSql = buildDuplicateCheckSql(
    monthStart,
    monthEndExclusive,
  )
  const trackingIds = rows
    .map((r) => r.mercury_tracking)
    .filter(Boolean)
  const trackingCheckSql = buildTrackingCheckSql(trackingIds)

  if (args.json) {
    const payload = {
      sourceInput: inputPath,
      month: args.month,
      monthStart,
      monthEndExclusive,
      count: rows.length,
      total: Number(total.toFixed(2)),
      category: CATEGORY,
      payment_method: PAYMENT_METHOD,
      teachers: TEACHER_ALLOWLIST.map((t) => t.counterparty),
      rows,
      skipped,
      sql,
      batches,
      duplicateCheckSql,
      trackingCheckSql,
      verifySql: duplicateCheckSql,
    }
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  if (args.dryRun) {
    console.log(`Source: ${inputPath}`)
    console.log(`Month: ${args.month}`)
    console.log(`Payments: ${rows.length}`)
    console.log(`Total: $${total.toFixed(2)}`)
    console.log(`Skipped: ${skipped.length}`)
    console.log(`Batches: ${batches.length}`)
    return
  }

  console.log(sql)
}

main()
