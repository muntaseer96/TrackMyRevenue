import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface YearState {
  selectedYear: number
  availableYears: number[]
  setSelectedYear: (year: number) => void
  setAvailableYears: (years: number[]) => void
  addYear: (year: number) => void
}

const currentYear = new Date().getFullYear()

export const useYearStore = create<YearState>()(
  persist(
    (set) => ({
      selectedYear: currentYear,
      availableYears: [currentYear],

      setSelectedYear: (year) => set({ selectedYear: year }),

      setAvailableYears: (years) => {
        const sortedYears = [...years].sort((a, b) => b - a) // Sort descending (newest first)
        set({ availableYears: sortedYears })
      },

      addYear: (year) =>
        set((state) => {
          if (state.availableYears.includes(year)) return state
          const newYears = [...state.availableYears, year].sort((a, b) => b - a)
          return { availableYears: newYears, selectedYear: year }
        }),
    }),
    {
      name: 'year-storage',
      partialize: (state) => ({ selectedYear: state.selectedYear }),
    }
  )
)
