export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/**
 * Get month name from 1-indexed month number
 */
export function getMonthName(month: number): string {
  return MONTHS[month - 1] || ''
}

/**
 * Get short month name from 1-indexed month number
 */
export function getMonthShortName(month: number): string {
  return MONTHS_SHORT[month - 1] || ''
}

/**
 * Get current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Get current month (1-indexed)
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

/**
 * Generate array of years from start to end
 */
export function getYearRange(startYear: number, endYear: number): number[] {
  const years: number[] = []
  for (let year = endYear; year >= startYear; year--) {
    years.push(year)
  }
  return years
}

/**
 * Generate array of months (1-12)
 */
export function getMonthsArray(): { value: number; label: string }[] {
  return MONTHS.map((month, index) => ({
    value: index + 1,
    label: month,
  }))
}

/**
 * Format date as "Month Year"
 */
export function formatMonthYear(month: number, year: number): string {
  return `${getMonthName(month)} ${year}`
}

/**
 * Check if a date is in the current month
 */
export function isCurrentMonth(month: number, year: number): boolean {
  return month === getCurrentMonth() && year === getCurrentYear()
}

/**
 * Get the previous month and year
 */
export function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 }
  }
  return { month: month - 1, year }
}

/**
 * Get the next month and year
 */
export function getNextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 }
  }
  return { month: month + 1, year }
}
