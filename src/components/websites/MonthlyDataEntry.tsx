import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import { useCategoriesByWebsite } from '../../hooks/useCategories'
import { useMonthlyEntriesByWebsite, useUpsertMonthlyEntry } from '../../hooks/useMonthlyEntries'
import { useExchangeRate, useUpsertExchangeRate, DEFAULT_EXCHANGE_RATE } from '../../hooks/useExchangeRates'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import type { Category, MonthlyEntry } from '../../types'

const MONTHS = [
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
]

interface MonthlyDataEntryProps {
  websiteId: string
}

interface AmountInputProps {
  categoryId: string
  initialAmount: number
  onSave: (categoryId: string, amount: number) => void
  isSaving: boolean
}

function AmountInput({
  categoryId,
  initialAmount,
  onSave,
  isSaving,
}: AmountInputProps) {
  const [value, setValue] = useState(initialAmount.toString())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevInitialAmount = useRef(initialAmount)

  // Update local value when initialAmount changes (e.g., after data refetch)
  useEffect(() => {
    if (prevInitialAmount.current !== initialAmount) {
      setValue(initialAmount.toString())
      prevInitialAmount.current = initialAmount
    }
  }, [initialAmount])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value

      // Allow empty or valid numbers
      if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
        setValue(newValue)

        // Clear existing debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }

        // Debounce save
        debounceRef.current = setTimeout(() => {
          const numValue = parseFloat(newValue) || 0
          onSave(categoryId, numValue)
        }, 500)
      }
    },
    [categoryId, onSave]
  )

  // Clear "0" on focus so user doesn't have to delete it
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      setValue('')
    }
  }, [])

  // Restore "0" on blur if empty
  const handleBlur = useCallback(() => {
    if (value === '') {
      setValue('0')
    }
  }, [value])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-right
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          ${isSaving ? 'bg-gray-50' : 'bg-white'}`}
        placeholder="0"
      />
    </div>
  )
}

interface ExchangeRateInputProps {
  rate: number
  onSave: (rate: number) => void
  isSaving: boolean
}

function ExchangeRateInput({ rate, onSave, isSaving }: ExchangeRateInputProps) {
  const [value, setValue] = useState(rate.toString())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevRate = useRef(rate)

  useEffect(() => {
    if (prevRate.current !== rate) {
      setValue(rate.toString())
      prevRate.current = rate
    }
  }, [rate])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value

      if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
        setValue(newValue)

        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(() => {
          const numValue = parseFloat(newValue) || DEFAULT_EXCHANGE_RATE
          onSave(numValue)
        }, 500)
      }
    },
    [onSave]
  )

  // Clear value on focus if it equals default rate
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === DEFAULT_EXCHANGE_RATE.toString()) {
      setValue('')
    }
  }, [])

  // Restore default rate on blur if empty
  const handleBlur = useCallback(() => {
    if (value === '') {
      setValue(DEFAULT_EXCHANGE_RATE.toString())
    }
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">$1 =</span>
      <div className="relative w-24">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">৳</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-right text-sm
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${isSaving ? 'bg-gray-50' : 'bg-white'}`}
          placeholder={DEFAULT_EXCHANGE_RATE.toString()}
        />
      </div>
    </div>
  )
}

export function MonthlyDataEntry({ websiteId }: MonthlyDataEntryProps) {
  // Default to current month
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)

  // Currency view preference
  const { currencyView } = useCurrencyStore()

  // Fetch categories for this website
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategoriesByWebsite(websiteId)

  // Fetch monthly entries for selected month
  const { data: entries = [], isLoading: isEntriesLoading } = useMonthlyEntriesByWebsite(
    websiteId,
    selectedMonth
  )

  // Fetch exchange rate for selected month
  const { data: exchangeRateData, isLoading: isRateLoading } = useExchangeRate(selectedMonth)

  // Mutations
  const upsertMutation = useUpsertMonthlyEntry()
  const upsertRateMutation = useUpsertExchangeRate()

  // Get current exchange rate (from DB or default)
  const exchangeRate = exchangeRateData?.rate ?? DEFAULT_EXCHANGE_RATE

  // Create a map of category_id -> amount for quick lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, number>()
    entries.forEach((entry: MonthlyEntry) => {
      map.set(entry.category_id, entry.amount)
    })
    return map
  }, [entries])

  // Split categories by type
  const revenueCategories = useMemo(
    () => categories.filter((c: Category) => c.type === 'revenue'),
    [categories]
  )
  const expenseCategories = useMemo(
    () => categories.filter((c: Category) => c.type === 'expense'),
    [categories]
  )

  // Calculate totals (in USD)
  const totalRevenue = useMemo(() => {
    return revenueCategories.reduce((sum: number, cat: Category) => {
      return sum + (entryMap.get(cat.id) || 0)
    }, 0)
  }, [revenueCategories, entryMap])

  const totalExpense = useMemo(() => {
    return expenseCategories.reduce((sum: number, cat: Category) => {
      return sum + (entryMap.get(cat.id) || 0)
    }, 0)
  }, [expenseCategories, entryMap])

  const netProfit = totalRevenue - totalExpense

  // Format amount based on currency view
  const formatAmount = useCallback(
    (amountUSD: number) => {
      if (currencyView === 'BDT') {
        return formatBDT(amountUSD * exchangeRate)
      }
      return formatUSD(amountUSD)
    },
    [currencyView, exchangeRate]
  )

  // Handle save entry
  const handleSave = useCallback(
    (categoryId: string, amount: number) => {
      upsertMutation.mutate({
        websiteId,
        categoryId,
        month: selectedMonth,
        amount,
      })
    },
    [websiteId, selectedMonth, upsertMutation]
  )

  // Handle save exchange rate
  const handleSaveRate = useCallback(
    (rate: number) => {
      upsertRateMutation.mutate({
        month: selectedMonth,
        rate,
      })
    },
    [selectedMonth, upsertRateMutation]
  )

  const isLoading = isCategoriesLoading || isEntriesLoading || isRateLoading

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-40"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-2">No categories found for this website.</p>
        <p className="text-sm text-gray-400">
          Add revenue and expense categories first to start tracking monthly data.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Month Selector & Exchange Rate */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-500" />
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v, 10))}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ExchangeRateInput
          rate={exchangeRate}
          onSave={handleSaveRate}
          isSaving={upsertRateMutation.isPending}
        />
      </div>

      {/* Revenue Section */}
      {revenueCategories.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-green-50">
            <h4 className="font-semibold text-green-800">Revenue</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {revenueCategories.map((category: Category) => (
              <div
                key={category.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-gray-700">{category.name}</span>
                <div className="w-40">
                  <AmountInput
                    categoryId={category.id}
                    initialAmount={entryMap.get(category.id) || 0}
                    onSave={handleSave}
                    isSaving={upsertMutation.isPending}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-green-50 font-semibold">
              <span className="text-green-800">Total Revenue</span>
              <span className="text-green-700">{formatAmount(totalRevenue)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Expense Section */}
      {expenseCategories.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
            <h4 className="font-semibold text-red-800">Expenses</h4>
          </div>
          <div className="divide-y divide-gray-100">
            {expenseCategories.map((category: Category) => (
              <div
                key={category.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-gray-700">{category.name}</span>
                <div className="w-40">
                  <AmountInput
                    categoryId={category.id}
                    initialAmount={entryMap.get(category.id) || 0}
                    onSave={handleSave}
                    isSaving={upsertMutation.isPending}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-red-50 font-semibold">
              <span className="text-red-800">Total Expenses</span>
              <span className="text-red-700">{formatAmount(totalExpense)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Net Profit Summary */}
      <div
        className={`rounded-lg border p-4 ${
          netProfit >= 0
            ? 'bg-primary-light border-primary'
            : 'bg-red-100 border-red-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`font-semibold ${netProfit >= 0 ? 'text-primary-dark' : 'text-red-800'}`}>
            Net {netProfit >= 0 ? 'Profit' : 'Loss'}
          </span>
          <span className={`text-xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-red-600'}`}>
            {formatAmount(Math.abs(netProfit))}
          </span>
        </div>
        {totalRevenue > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            Profit Margin: {((netProfit / totalRevenue) * 100).toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  )
}
