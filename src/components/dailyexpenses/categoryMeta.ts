import type { DailyExpenseCategoryRow } from '../../types'

/** Palette used to colour any category that has no explicit colour in the DB. */
const FALLBACK_PALETTE = [
  '#f59e0b', '#84cc16', '#fb923c', '#a16207', '#ef4444', '#3b82f6', '#0ea5e9',
  '#6366f1', '#0d9488', '#14b8a6', '#22d3ee', '#10b981', '#64748b', '#ec4899',
  '#f472b6', '#8b5cf6', '#e11d48', '#d946ef', '#2563eb', '#a855f7', '#06b6d4',
]

/** Deterministic fallback colour derived from the category name. */
export function fallbackColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length]
}

/** Build a name -> colour lookup from the DB categories. */
export function buildColorMap(categories?: DailyExpenseCategoryRow[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const c of categories ?? []) map[c.name] = c.color
  return map
}

/** Colour for a category name, falling back to a stable hashed colour. */
export function colorFor(name: string, map: Record<string, string>): string {
  return map[name] ?? fallbackColor(name)
}
