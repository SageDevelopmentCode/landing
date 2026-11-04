/**
 * Format Amex CSV Description into readable expense_name; preserve raw in notes.
 */

export const AMEX_NOTE_PREFIX = 'Amex:'

function normalizeWhitespace(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripAplPay(value) {
  return value.replace(/^AplPay\s+/i, '')
}

function titleCaseWords(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^#?\d+$/.test(word)) return word
      if (word.length <= 2 && word === word.toUpperCase()) return word
      const lower = word.toLowerCase()
      if (['h-e-b', 'mcdonald\'s', 'in-n-out'].includes(lower)) {
        if (lower === 'mcdonald\'s') return "McDonald's"
        if (lower === 'in-n-out') return 'In-N-Out'
        return 'H-E-B'
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function truncate(value, max = 48) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trim()}…`
}

function stripTrailingLocation(value) {
  let s = value
  s = s.replace(/\s+\d{3}-\d{3}-\d{4}.*$/i, '')
  s = s.replace(/\s+AMZN\.COM\/BILL\s+WA$/i, '')
  s = s.replace(/\s+[A-Z]{2}$/i, '')
  s = s.replace(
    /\s{2,}[A-Z][A-Za-z.' ]{2,30}\s{2,}[A-Z]{2}$/,
    '',
  )
  return normalizeWhitespace(s)
}

function extractDoorDashSubmerchant(notes, raw) {
  const hay = `${notes ?? ''}\n${raw ?? ''}`
  const match = hay.match(
    /(?:DOORDASH|BT\*DD|DD \*DOORDASH)\s*([A-Z0-9][A-Z0-9 '&./-]{2,48})/i,
  )
  if (!match) return null
  let sub = normalizeWhitespace(match[1])
  sub = sub.replace(/\s+(SAN FRANCISCO|CEDAR PARK|ROUND ROCK).*$/i, '')
  sub = sub.replace(/\s+\d{3}-\d{3}-\d{4}.*$/i, '')
  if (!sub || /^DOORDASH$/i.test(sub)) return null
  return titleCaseWords(sub)
}

function extractStoreNumber(raw) {
  const m = raw.match(/#\s*(\d+)/)
  return m ? `#${m[1]}` : null
}

/** @type {Array<{ test: RegExp, format: (raw: string, notes?: string | null) => string }>} */
const MERCHANT_FORMATTERS = [
  {
    test: /dr adj redist|adj redist/i,
    format: () => 'Amex adjustment',
  },
  {
    test: /amazon|amzn\.com/i,
    format: () => 'Amazon',
  },
  {
    test: /heb curbside|h-e-b curbside/i,
    format: () => 'H-E-B Curbside',
  },
  {
    test: /gas\/car wash|h-e-b gas/i,
    format: () => 'H-E-B Gas',
  },
  {
    test: /\bh-e-b\b|\bheb\b/i,
    format: (raw) => {
      const num = extractStoreNumber(raw)
      return num ? `H-E-B ${num}` : 'H-E-B'
    },
  },
  {
    test: /doordash|bt\*dd|dd \*doordash/i,
    format: (raw, notes) => {
      const sub = extractDoorDashSubmerchant(notes, raw)
      return sub ? `DoorDash — ${sub}` : 'DoorDash'
    },
  },
  {
    test: /\btarget\.com\b|\btarget\b/i,
    format: () => 'Target',
  },
  {
    test: /walmart|wal-mart/i,
    format: () => 'Walmart',
  },
  {
    test: /home depor|home depot/i,
    format: () => 'Home Depot',
  },
  {
    test: /dollar tree/i,
    format: () => 'Dollar Tree',
  },
  {
    test: /sprouts/i,
    format: () => 'Sprouts',
  },
  {
    test: /petsmart/i,
    format: () => 'PetSmart',
  },
  {
    test: /chipotle/i,
    format: () => 'Chipotle',
  },
  {
    test: /starbucks/i,
    format: () => 'Starbucks',
  },
  {
    test: /mcdonald/i,
    format: () => "McDonald's",
  },
  {
    test: /taco bell/i,
    format: () => 'Taco Bell',
  },
  {
    test: /panda express/i,
    format: () => 'Panda Express',
  },
  {
    test: /in-n-out/i,
    format: () => 'In-N-Out',
  },
  {
    test: /olive garden/i,
    format: () => 'Olive Garden',
  },
  {
    test: /little caesar/i,
    format: () => 'Little Caesars',
  },
  {
    test: /chili'?s/i,
    format: () => "Chili's",
  },
  {
    test: /cheesecake/i,
    format: () => 'Cheesecake Factory',
  },
  {
    test: /subway/i,
    format: () => 'Subway',
  },
  {
    test: /salt lick/i,
    format: () => 'Salt Lick',
  },
  {
    test: /sharetea/i,
    format: () => 'Sharetea',
  },
  {
    test: /\btst\*/i,
    format: (raw) => {
      const m = raw.match(/TST\*\s*([A-Z0-9][A-Z0-9 ]{2,30})/i)
      if (m) return titleCaseWords(normalizeWhitespace(m[1]))
      return 'Restaurant'
    },
  },
  {
    test: /burroste|spo\*burroste/i,
    format: () => 'Burrotes',
  },
  {
    test: /cava\b/i,
    format: () => 'Cava',
  },
  {
    test: /supabase/i,
    format: () => 'Supabase',
  },
  {
    test: /spotify/i,
    format: () => 'Spotify',
  },
  {
    test: /chevron/i,
    format: () => 'Chevron',
  },
  {
    test: /checkr/i,
    format: () => 'Checkr',
  },
  {
    test: /green mountain/i,
    format: () => 'Green Mountain Energy',
  },
  {
    test: /\benerg\b/i,
    format: () => 'Energy utility',
  },
  {
    test: /facebk/i,
    format: () => 'Facebook Ads',
  },
  {
    test: /\bindede\b/i,
    format: () => 'Indeed',
  },
  {
    test: /rush bowl/i,
    format: () => 'Rush Bowls',
  },
  {
    test: /salt lick/i,
    format: () => 'Salt Lick',
  },
  {
    test: /wholefds|whole foods/i,
    format: () => 'Whole Foods',
  },
  {
    test: /chick-fil-a/i,
    format: () => 'Chick-fil-A',
  },
  {
    test: /dutch bros/i,
    format: () => 'Dutch Bros',
  },
  {
    test: /first watch/i,
    format: () => 'First Watch',
  },
  {
    test: /p\. terry|terry's bu/i,
    format: () => "P. Terry's",
  },
  {
    test: /wendy'?s/i,
    format: () => "Wendy's",
  },
  {
    test: /usps/i,
    format: () => 'USPS',
  },
  {
    test: /dam-a|91280 - aust/i,
    format: () => 'Parking',
  },
  {
    test: /parking|platinumpark/i,
    format: () => 'Parking',
  },
  {
    test: /\blimegreen\b|\blime\b/i,
    format: () => 'Lime',
  },
  {
    test: /walgreen/i,
    format: () => 'Walgreens',
  },
  {
    test: /organic nails/i,
    format: () => 'Organic Nails',
  },
  {
    test: /vanillagift/i,
    format: () => 'Vanilla Gift',
  },
  {
    test: /mobile payment/i,
    format: () => 'Amex payment',
  },
  {
    test: /jollibee|chickenjoy/i,
    format: () => 'Jollibee',
  },
  {
    test: /restaurant|fast food|buffet/i,
    format: (raw) => {
      const cleaned = stripTrailingLocation(stripAplPay(normalizeWhitespace(raw)))
      const words = cleaned.split(' ').slice(0, 4).join(' ')
      return truncate(titleCaseWords(words), 40)
    },
  },
]

function fallbackDisplayName(raw) {
  let s = stripTrailingLocation(stripAplPay(normalizeWhitespace(raw)))
  s = s.replace(/\d{3}-\d{3}-\d{4}/g, '')
  s = normalizeWhitespace(s)
  const parts = s.split(/\s{2,}/)
  if (parts[0]) s = parts[0]
  s = s.replace(/\s+\d{5,}.*$/g, '')
  s = normalizeWhitespace(s)
  if (!s) return 'Amex charge'
  return truncate(titleCaseWords(s), 40)
}

/**
 * @param {string} rawDescription
 * @param {string | null | undefined} [notes]
 */
export function formatAmexDisplayName(rawDescription, notes) {
  const raw = normalizeWhitespace(rawDescription)
  if (!raw) return 'Amex charge'

  for (const rule of MERCHANT_FORMATTERS) {
    if (rule.test.test(raw) || rule.test.test(`${notes ?? ''}\n${raw}`)) {
      return rule.format(raw, notes ?? null)
    }
  }

  return fallbackDisplayName(raw)
}

/**
 * @param {string | null | undefined} notes
 * @returns {string | null}
 */
export function extractAmexDescriptionFromNotes(notes) {
  const trimmed = notes?.trim()
  if (!trimmed) return null
  const firstLine = trimmed.split('\n')[0].trim()
  const prefix = `${AMEX_NOTE_PREFIX} `
  if (firstLine.startsWith(prefix)) {
    return firstLine.slice(prefix.length).trim()
  }
  return null
}

/**
 * @param {string} rawDescription
 * @param {string | null | undefined} [existingNotes]
 */
export function prependAmexDescription(rawDescription, existingNotes) {
  const raw = normalizeWhitespace(rawDescription)
  if (!raw) return existingNotes?.trim() ?? ''

  const amexLine = `${AMEX_NOTE_PREFIX} ${raw}`
  const rest = existingNotes?.trim() ?? ''

  if (!rest) return amexLine

  if (rest.startsWith(`${AMEX_NOTE_PREFIX} `)) {
    const lines = rest.split('\n')
    lines[0] = amexLine
    return lines.join('\n').trim()
  }

  return `${amexLine}\n\n${rest}`
}

/**
 * Resolve raw Amex description for backfill (notes prefix or expense_name).
 * @param {string} expenseName
 * @param {string | null | undefined} notes
 */
export function resolveRawAmexDescription(expenseName, notes) {
  return extractAmexDescriptionFromNotes(notes) ?? normalizeWhitespace(expenseName)
}
