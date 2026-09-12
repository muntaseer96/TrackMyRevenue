import type { Category, MonthlyEntry, Tool, ToolAllocationTarget } from '../types'

/**
 * Shared expense allocation rules.
 *
 * Both the Dashboard (all sites at once) and the Website Detail page (one site)
 * need to answer "how much of the shared cost pool belongs to this site?".
 * They used to answer it differently — the Dashboard amortized yearly global
 * expenses across 12 months while the site page dropped the whole amount into
 * the renewal month, so the same site showed two different profits. Everything
 * here exists so there is exactly one answer.
 *
 * An expense is pooled when it has no website_id and is_allocated is not false.
 * A pooled expense is split across:
 *   - the websites named in tool_allocation_targets, if any are named
 *   - otherwise every website that earned revenue in the period
 */

/** Websites that earned revenue in the period — only these carry shared cost. */
export function getAllocationEligibleWebsiteIds(
  entries: MonthlyEntry[],
  categories: Category[]
): Set<string> {
  const categoryMap = new Map(categories.map(c => [c.id, c]))
  const eligible = new Set<string>()

  entries.forEach(entry => {
    if (!entry.website_id || entry.amount <= 0) return
    if (categoryMap.get(entry.category_id)?.type === 'revenue') {
      eligible.add(entry.website_id)
    }
  })

  return eligible
}

/** The websites a single pooled expense is split across. */
function getMembers(tool: Tool, targets: ToolAllocationTarget[], eligible: Set<string>): string[] {
  const named = targets.filter(t => t.tool_id === tool.id).map(t => t.website_id)

  // No explicit targets means the cost is shared by everyone.
  if (named.length === 0) return Array.from(eligible)

  // A named site that earned nothing this period still can't absorb cost, or
  // the pool would leak. Fall back to the full set if none of them qualify.
  const active = named.filter(id => eligible.has(id))
  return active.length > 0 ? active : Array.from(eligible)
}

/**
 * A pooled expense's cost landing in a given month.
 * Yearly expenses are amortized across all 12 months — a $540 annual hosting
 * bill is $45/month, not a single catastrophic August.
 */
function monthlyCost(tool: Tool, month: number): number {
  if (tool.recurrence === 'yearly') return tool.cost_usd / 12
  return tool.month === month ? tool.cost_usd : 0
}

export interface GlobalAllocator {
  /** Shared cost charged to one website for one month. */
  forWebsiteMonth: (websiteId: string, month: number) => number
  /** Shared cost charged to one website across the given months. */
  forWebsiteRange: (websiteId: string, startMonth: number, endMonth: number) => number
  /** How many websites are carrying shared cost — for display. */
  eligibleCount: number
}

export function buildGlobalAllocator(
  allExpenses: Tool[],
  targets: ToolAllocationTarget[],
  entries: MonthlyEntry[],
  categories: Category[]
): GlobalAllocator {
  const eligible = getAllocationEligibleWebsiteIds(entries, categories)

  const pooled = allExpenses
    .filter(exp => !exp.website_id && exp.is_allocated !== false)
    .map(exp => ({ tool: exp, members: getMembers(exp, targets, eligible) }))

  const forWebsiteMonth = (websiteId: string, month: number): number =>
    pooled.reduce((sum, { tool, members }) => {
      if (!members.includes(websiteId)) return sum
      return sum + monthlyCost(tool, month) / members.length
    }, 0)

  const forWebsiteRange = (websiteId: string, startMonth: number, endMonth: number): number => {
    let total = 0
    for (let month = startMonth; month <= endMonth; month++) {
      total += forWebsiteMonth(websiteId, month)
    }
    return total
  }

  return { forWebsiteMonth, forWebsiteRange, eligibleCount: eligible.size }
}
