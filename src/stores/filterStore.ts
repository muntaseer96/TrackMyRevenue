import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FilterPreset =
  | 'this_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'year_to_date'
  | 'full_year'
  | 'custom'

interface FilterState {
  year: number
  startMonth: number
  endMonth: number
  preset: FilterPreset

  // Actions
  setYear: (year: number) => void
  setMonthRange: (startMonth: number, endMonth: number) => void
  setPreset: (preset: FilterPreset) => void
  setThisMonth: () => void
  setLast3Months: () => void
  setLast6Months: () => void
  setYearToDate: () => void
  setFullYear: () => void
  setCustomRange: (startMonth: number, endMonth: number) => void
  resetFilters: () => void
}

const currentDate = new Date()
const currentYear = currentDate.getFullYear()

// Helper to calculate months back within the same year
const getMonthsBack = (monthsBack: number, year: number): { startMonth: number; adjustedYear: number } => {
  const now = new Date()
  const current = now.getMonth() + 1

  let startMonth = current - monthsBack + 1
  let adjustedYear = year

  // If we go before January, clamp to January of same year for MVP
  if (startMonth < 1) {
    startMonth = 1
  }

  return { startMonth, adjustedYear }
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      year: currentYear,
      startMonth: 1,
      endMonth: 12,
      preset: 'full_year' as FilterPreset,

      setYear: (year: number) => set({ year, preset: 'full_year', startMonth: 1, endMonth: 12 }),

      setMonthRange: (startMonth: number, endMonth: number) =>
        set({ startMonth, endMonth, preset: 'custom' }),

      setPreset: (preset: FilterPreset) => set({ preset }),

      setThisMonth: () => {
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()
        set({ year, startMonth: month, endMonth: month, preset: 'this_month' })
      },

      setLast3Months: () => {
        const now = new Date()
        const endMonth = now.getMonth() + 1
        const year = now.getFullYear()
        const { startMonth } = getMonthsBack(3, year)
        set({ year, startMonth, endMonth, preset: 'last_3_months' })
      },

      setLast6Months: () => {
        const now = new Date()
        const endMonth = now.getMonth() + 1
        const year = now.getFullYear()
        const { startMonth } = getMonthsBack(6, year)
        set({ year, startMonth, endMonth, preset: 'last_6_months' })
      },

      setYearToDate: () => {
        const now = new Date()
        const endMonth = now.getMonth() + 1
        const year = now.getFullYear()
        set({ year, startMonth: 1, endMonth, preset: 'year_to_date' })
      },

      setFullYear: () => {
        set({ startMonth: 1, endMonth: 12, preset: 'full_year' })
      },

      setCustomRange: (startMonth: number, endMonth: number) =>
        set({ startMonth, endMonth, preset: 'custom' }),

      resetFilters: () =>
        set({ year: currentYear, startMonth: 1, endMonth: 12, preset: 'full_year' }),
    }),
    {
      name: 'filter-storage',
      partialize: (state) => ({
        year: state.year,
        startMonth: state.startMonth,
        endMonth: state.endMonth,
        preset: state.preset,
      }),
    }
  )
)

// Helper to get preset label
export const getPresetLabel = (preset: FilterPreset): string => {
  switch (preset) {
    case 'this_month':
      return 'This Month'
    case 'last_3_months':
      return 'Last 3 Months'
    case 'last_6_months':
      return 'Last 6 Months'
    case 'year_to_date':
      return 'Year to Date'
    case 'full_year':
      return 'Full Year'
    case 'custom':
      return 'Custom Range'
    default:
      return 'Full Year'
  }
}

// Helper to get month name
export const getMonthName = (month: number, short = true): string => {
  const months = short
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return months[month - 1] || ''
}

// Helper to format date range display
export const formatDateRange = (startMonth: number, endMonth: number, year: number): string => {
  if (startMonth === endMonth) {
    return `${getMonthName(startMonth)} ${year}`
  }
  return `${getMonthName(startMonth)} - ${getMonthName(endMonth)} ${year}`
}
