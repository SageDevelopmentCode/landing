/**
 * Map merchant / expense names to budget expense categories (first match wins).
 * Keep in sync with app/lib/budget/categorize-expense.ts when adding or changing rules.
 */

export const DEFAULT_EXPENSE_CATEGORY = 'Supplies & Materials'

/** Order matters — first matching rule wins. */
export const EXPENSE_CATEGORY_RULES = [
  {
    category: 'Teacher Pay',
    patterns: [/zelinda pay/i, /joy pay/i, /edith pay/i],
  },
  {
    category: 'Rent',
    patterns: [/\brent\b/i],
  },
  {
    category: 'Utilities',
    patterns: [/green mountain/i, /\benerg\b/i],
  },
  {
    category: 'Technology & Software',
    patterns: [/supabase/i, /spotify/i],
  },
  {
    category: 'Marketing',
    patterns: [/facebk/i, /\bindede\b/i],
  },
  {
    category: 'Professional Services',
    patterns: [/checkr/i],
  },
  {
    category: 'Fuel & Transportation',
    patterns: [
      /gas\/car wash/i,
      /\bchevron\b/i,
      /parking/i,
      /platinumpark/i,
      /\blimegreen\b/i,
      /\blime\b/i,
      /91280 - aust/i,
      /dam-a/i,
      /transportation-fuel/i,
    ],
  },
  {
    category: 'Food & Meals',
    patterns: [
      /doordash/i,
      /bt\*dd/i,
      /dd \*doordash/i,
      /panda express/i,
      /chipotle/i,
      /starbucks/i,
      /taco bell/i,
      /in-n-out/i,
      /olive garden/i,
      /\btst\*/i,
      /salt lick/i,
      /burroste/i,
      /sharetea/i,
      /subway/i,
      /little caesar/i,
      /mcdonald/i,
      /chili'?s/i,
      /cheesecake/i,
      /spicy house/i,
      /instill coffee/i,
      /grey orc/i,
      /rush bowl/i,
      /jollibee|chickenjoy/i,
      /restaurant/i,
      /fast food/i,
    ],
  },
  {
    category: 'Other',
    patterns: [
      /dr adj redist/i,
      /adj redist/i,
      /vanillagift/i,
      /mobile payment/i,
      /organic nails/i,
    ],
  },
  {
    category: 'Supplies & Materials',
    patterns: [
      /amazon/i,
      /amzn\.com/i,
      /\btarget\b/i,
      /dollar tree/i,
      /home depor/i,
      /home depot/i,
      /\bheb\b/i,
      /heb curbside/i,
      /h-e-b/i,
      /sprouts/i,
      /petsmart/i,
      /walmart/i,
      /wal-mart/i,
    ],
  },
]

export function categorizeExpense(expenseName, notes) {
  const haystack = `${expenseName ?? ''}\n${notes ?? ''}`

  for (const rule of EXPENSE_CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(haystack))) {
      return rule.category
    }
  }

  return DEFAULT_EXPENSE_CATEGORY
}

/**
 * @param {Array<{ category: string, amount: number }>} rows
 * @returns {Record<string, { count: number, total: number }>}
 */
export function summarizeByCategory(rows) {
  return rows.reduce((acc, row) => {
    const category = row.category ?? DEFAULT_EXPENSE_CATEGORY
    const amount = Number(row.amount)
    if (!acc[category]) {
      acc[category] = { count: 0, total: 0 }
    }
    acc[category].count += 1
    acc[category].total = Number((acc[category].total + amount).toFixed(2))
    return acc
  }, {})
}
