/**
 * Format a number as BDT currency
 */
export function formatBDT(amount: number): string {
  return `৳ ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format a number as USD currency
 */
export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

/**
 * Parse a currency string back to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and commas
  const cleaned = value.replace(/[৳$,\s]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format a large number with K/M/B suffixes
 */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `৳ ${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `৳ ${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `৳ ${(amount / 1_000).toFixed(1)}K`
  }
  return formatBDT(amount)
}
