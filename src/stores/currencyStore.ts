import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CurrencyView = 'USD' | 'BDT'

interface CurrencyState {
  currencyView: CurrencyView
  setCurrencyView: (currency: CurrencyView) => void
  toggleCurrencyView: () => void
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currencyView: 'USD',

      setCurrencyView: (currency) => set({ currencyView: currency }),

      toggleCurrencyView: () =>
        set((state) => ({
          currencyView: state.currencyView === 'USD' ? 'BDT' : 'USD',
        })),
    }),
    {
      name: 'currency-storage',
    }
  )
)
