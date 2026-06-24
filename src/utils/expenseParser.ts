import type { DailyExpenseCategory, DailyExpenseCurrency } from '../types'

export interface ParsedExpense {
  amount: number
  currency: DailyExpenseCurrency
  category: DailyExpenseCategory
  note: string
  rawInput: string
}

/**
 * Keyword -> category map. First matching category (in this order) wins.
 * Matching is done on whole words so "tea" doesn't match "steam", etc.
 */
const CATEGORY_KEYWORDS: { category: DailyExpenseCategory; keywords: string[] }[] = [
  {
    category: 'Cigarettes',
    keywords: ['cig', 'cigs', 'cigarette', 'cigarettes', 'smoke', 'smokes', 'marlboro', 'benson', 'gold leaf', 'navy', 'hookah', 'vape'],
  },
  {
    category: 'Tea/Coffee',
    keywords: ['tea', 'coffee', 'cha', 'chai', 'latte', 'espresso', 'cappuccino', 'mocha', 'americano'],
  },
  {
    category: 'Eating Out',
    keywords: ['restaurant', 'cafe', 'dine', 'dining', 'fast food', 'kfc', 'pizza hut', 'takeaway', 'takeout', 'foodpanda', 'food panda'],
  },
  {
    category: 'Groceries',
    keywords: ['grocery', 'groceries', 'bazar', 'bazaar', 'vegetable', 'vegetables', 'veggies', 'fish', 'meat', 'chicken', 'beef', 'egg', 'eggs', 'supershop', 'agora', 'shwapno', 'meena bazar'],
  },
  {
    category: 'Food',
    keywords: ['food', 'lunch', 'dinner', 'breakfast', 'snack', 'snacks', 'meal', 'burger', 'pizza', 'biryani', 'biriyani', 'kacchi', 'rice', 'fuchka', 'singara', 'samosa', 'juice', 'water', 'fruit', 'fruits', 'bread'],
  },
  {
    category: 'Fuel',
    keywords: ['fuel', 'petrol', 'octane', 'diesel'],
  },
  {
    category: 'Transport',
    keywords: ['rickshaw', 'uber', 'pathao', 'bus', 'cng', 'taxi', 'ride', 'fare', 'metro', 'train', 'launch', 'parking', 'toll', 'auto', 'tempo', 'scooter'],
  },
  {
    category: 'Mobile/Internet',
    keywords: ['recharge', 'flexiload', 'flexi', 'mb', 'data pack', 'internet', 'wifi', 'sim', 'gp', 'robi', 'banglalink', 'airtel', 'minute', 'minutes'],
  },
  {
    category: 'Bills/Utilities',
    keywords: ['electricity', 'electric bill', 'water bill', 'gas bill', 'utility', 'dpdc', 'wasa', 'titas', 'bill', 'bills'],
  },
  {
    category: 'Rent',
    keywords: ['rent', 'house rent', 'flat rent'],
  },
  {
    category: 'Health/Medical',
    keywords: ['medicine', 'medicines', 'doctor', 'pharmacy', 'hospital', 'clinic', 'dentist', 'checkup', 'tablet', 'syrup', 'lab test'],
  },
  {
    category: 'Personal Care',
    keywords: ['salon', 'haircut', 'parlor', 'parlour', 'grooming', 'cosmetics', 'shampoo', 'soap', 'skincare', 'spa', 'shave', 'makeup'],
  },
  {
    category: 'Education',
    keywords: ['book', 'books', 'course', 'tuition', 'fee', 'fees', 'exam', 'college', 'university', 'stationery', 'notebook', 'udemy', 'pen'],
  },
  {
    category: 'Entertainment',
    keywords: ['movie', 'cinema', 'game', 'games', 'netflix', 'spotify', 'youtube', 'concert', 'ticket', 'streaming', 'prime', 'hoichoi'],
  },
  {
    category: 'Travel',
    keywords: ['travel', 'trip', 'tour', 'hotel', 'flight', 'air ticket', 'resort', 'vacation', 'holiday'],
  },
  {
    category: 'Clothing',
    keywords: ['shirt', 'pant', 'pants', 'clothes', 'clothing', 'shoe', 'shoes', 'panjabi', 'tshirt', 't-shirt', 'dress', 'saree', 'kurti', 'jeans', 'jacket'],
  },
  {
    category: 'Electronics',
    keywords: ['electronics', 'gadget', 'phone', 'laptop', 'charger', 'headphone', 'earbuds', 'cable', 'mouse', 'keyboard', 'monitor', 'battery'],
  },
  {
    category: 'Shopping',
    keywords: ['shopping', 'amazon', 'daraz', 'shop', 'store', 'mall', 'order', 'watch'],
  },
  {
    category: 'Tools/Software',
    keywords: ['software', 'saas', 'domain', 'hosting', 'server', 'tool', 'license', 'github', 'figma', 'chatgpt', 'openai', 'claude', 'notion', 'vercel', 'netlify', 'subscription', 'cloud', 'aws'],
  },
  {
    category: 'Kids',
    keywords: ['kid', 'kids', 'baby', 'toy', 'toys', 'diaper', 'child', 'children'],
  },
  {
    category: 'Gifts',
    keywords: ['gift', 'gifts', 'present'],
  },
  {
    category: 'Charity/Sadaqah',
    keywords: ['charity', 'sadaqah', 'sadqa', 'donation', 'donate', 'zakat', 'fitra', 'fitrah', 'masjid', 'mosque', 'orphan'],
  },
  {
    category: 'Repairs/Maintenance',
    keywords: ['repair', 'repairs', 'servicing', 'service', 'mechanic', 'fixing', 'maintenance', 'plumber', 'electrician', 'spare'],
  },
  {
    category: 'Family/Home',
    keywords: ['household', 'home', 'maid', 'furniture', 'kitchen', 'utensils', 'family', 'wife', 'parents', 'cleaning', 'decor'],
  },
  {
    category: 'Business',
    keywords: ['business', 'office', 'client', 'ads', 'marketing', 'employee', 'salary', 'invoice', 'meeting', 'freelancer', 'vendor', 'supplies'],
  },
]

/**
 * Filler/connector words that are stripped from the trailing edge of the note
 * once the amount has been removed (e.g. "bought coffee for 180" -> "bought coffee").
 */
const TRAILING_FILLERS = new Set(['for', 'at', 'on', 'of', 'the', 'a', 'an', '@', '-', ':', '=', '~'])

/**
 * Matches money-like numbers, optionally with thousands separators and decimals.
 * Examples: 120, 20, 1,200, 12.50, 1,250.75
 */
const NUMBER_REGEX = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g

/** Detect currency mentioned in the text. Defaults to BDT when nothing is found. */
export function detectCurrency(text: string): DailyExpenseCurrency {
  const lower = text.toLowerCase()
  if (/\$|\busd\b|\bdollar\b|\bdollars\b/.test(lower)) return 'USD'
  // BDT is the default; explicit BDT markers are handled by the default.
  return 'BDT'
}

/** Assign a category from keywords. Returns 'Other' when nothing matches. */
export function categorizeExpense(text: string): DailyExpenseCategory {
  const lower = text.toLowerCase()
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    for (const kw of keywords) {
      // Whole-word (or whole-phrase) match.
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i')
      if (re.test(lower)) return category
    }
  }
  return 'Other'
}

function toNumber(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''))
}

/**
 * Parse a free-text expense entry into structured fields.
 *
 * Rules:
 * - Currency defaults to BDT unless USD / $ is present.
 * - When several numbers appear, the "money-like" amount is preferred:
 *   a number adjacent to a currency marker wins; otherwise the LAST number is used.
 *   e.g. "10 cigs 120 BDT" -> amount 120, note "10 cigs".
 * - The note is the raw text with the chosen amount + currency token removed.
 * - The category comes from keyword matching on the original text.
 */
export function parseExpense(input: string): ParsedExpense {
  const rawInput = input.trim()
  const currency = detectCurrency(rawInput)
  const category = categorizeExpense(rawInput)

  // Collect every number with its position in the string.
  const matches: { value: number; start: number; end: number; text: string }[] = []
  for (const m of rawInput.matchAll(NUMBER_REGEX)) {
    if (m.index === undefined) continue
    matches.push({
      value: toNumber(m[0]),
      start: m.index,
      end: m.index + m[0].length,
      text: m[0],
    })
  }

  if (matches.length === 0) {
    return { amount: 0, currency, category, note: rawInput, rawInput }
  }

  // Currency markers (symbol or word) so we can prefer a number sitting next to one.
  const CURRENCY_MARKER = /\$|৳|\busd\b|\bbdt\b|\btk\b|\btaka\b|\bdollars?\b/gi
  const markerRanges: { start: number; end: number }[] = []
  for (const m of rawInput.matchAll(CURRENCY_MARKER)) {
    if (m.index === undefined) continue
    markerRanges.push({ start: m.index, end: m.index + m[0].length })
  }

  // Prefer a number that is directly adjacent (within a couple chars) to a currency marker.
  const isAdjacent = (n: { start: number; end: number }) =>
    markerRanges.some((mk) => Math.abs(mk.start - n.end) <= 2 || Math.abs(n.start - mk.end) <= 2)

  const adjacent = matches.filter(isAdjacent)
  const chosen = adjacent.length > 0 ? adjacent[adjacent.length - 1] : matches[matches.length - 1]

  // Build the note: drop the chosen number, then drop any currency markers, then tidy.
  let note = rawInput.slice(0, chosen.start) + ' ' + rawInput.slice(chosen.end)
  note = note.replace(CURRENCY_MARKER, ' ')
  note = note.replace(/\s+/g, ' ').trim()

  // Strip trailing/leading connector words and stray punctuation.
  const tokens = note.split(' ').filter(Boolean)
  while (tokens.length && TRAILING_FILLERS.has(tokens[tokens.length - 1].toLowerCase())) {
    tokens.pop()
  }
  while (tokens.length && TRAILING_FILLERS.has(tokens[0].toLowerCase())) {
    tokens.shift()
  }
  note = tokens.join(' ').replace(/^[\s\-:=~]+|[\s\-:=~]+$/g, '').trim()

  return {
    amount: chosen.value,
    currency,
    category,
    note,
    rawInput,
  }
}
