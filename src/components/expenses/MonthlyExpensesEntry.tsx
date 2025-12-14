import { useState, useCallback, useEffect, useRef } from 'react'
import { Calendar, Plus, Copy, CalendarClock } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import { Button } from '../ui/Button'
import { ExpensesList } from './ExpensesList'
import { ExpenseForm } from './ExpenseForm'
import { DeleteConfirmation } from '../websites/DeleteConfirmation'
import {
  useMonthlyExpenses,
  useYearlyExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useAutoPopulateExpenses,
  useCreateYearlyExpense,
} from '../../hooks/useExpenses'
import { useExchangeRate, useUpsertExchangeRate, DEFAULT_EXCHANGE_RATE } from '../../hooks/useExchangeRates'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import type { Tool } from '../../types'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === DEFAULT_EXCHANGE_RATE.toString()) {
      setValue('')
    }
  }, [])

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

export function MonthlyExpensesEntry() {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isYearlyFormOpen, setIsYearlyFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Tool | null>(null)

  const { currencyView } = useCurrencyStore()

  // Fetch data
  const { data: monthlyExpenses = [], isLoading: isMonthlyLoading } = useMonthlyExpenses(selectedMonth)
  const { data: yearlyExpenses = [], isLoading: isYearlyLoading } = useYearlyExpenses()
  const { data: exchangeRateData, isLoading: isRateLoading } = useExchangeRate(selectedMonth)

  // Mutations
  const createMutation = useCreateExpense()
  const createYearlyMutation = useCreateYearlyExpense()
  const updateMutation = useUpdateExpense()
  const deleteMutation = useDeleteExpense()
  const upsertRateMutation = useUpsertExchangeRate()
  const autoPopulateMutation = useAutoPopulateExpenses()

  const exchangeRate = exchangeRateData?.rate ?? DEFAULT_EXCHANGE_RATE

  // Calculate totals
  const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)
  const yearlyAmortizedTotal = yearlyExpenses.reduce((sum, exp) => sum + exp.cost_usd / 12, 0)
  const totalExpenses = monthlyTotal + yearlyAmortizedTotal

  const formatAmount = (amount: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(amount * exchangeRate)
    }
    return formatUSD(amount)
  }

  const handleAddNew = () => {
    setSelectedExpense(null)
    setIsFormOpen(true)
  }

  const handleAddYearly = () => {
    setSelectedExpense(null)
    setIsYearlyFormOpen(true)
  }

  const handleEdit = (expense: Tool) => {
    setSelectedExpense(expense)
    if (expense.recurrence === 'yearly') {
      setIsYearlyFormOpen(true)
    } else {
      setIsFormOpen(true)
    }
  }

  const handleDelete = (expense: Tool) => {
    setSelectedExpense(expense)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (data: { name: string; cost_usd: number; recurrence: 'monthly' | 'yearly'; due_month: number | null }) => {
    try {
      if (selectedExpense) {
        await updateMutation.mutateAsync({
          id: selectedExpense.id,
          name: data.name,
          costUsd: data.cost_usd,
          exchangeRate,
          recurrence: data.recurrence,
          dueMonth: data.due_month,
        })
      } else {
        if (data.recurrence === 'yearly') {
          await createYearlyMutation.mutateAsync({
            name: data.name,
            costUsd: data.cost_usd,
            dueMonth: data.due_month || 1,
            exchangeRate,
          })
        } else {
          await createMutation.mutateAsync({
            name: data.name,
            month: selectedMonth,
            costUsd: data.cost_usd,
            exchangeRate,
            recurrence: 'monthly',
          })
        }
      }
      setIsFormOpen(false)
      setIsYearlyFormOpen(false)
      setSelectedExpense(null)
    } catch (error) {
      console.error('Failed to save expense:', error)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return

    try {
      await deleteMutation.mutateAsync(selectedExpense.id)
      setIsDeleteOpen(false)
      setSelectedExpense(null)
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  const handleAutoPopulate = async () => {
    try {
      await autoPopulateMutation.mutateAsync({
        targetMonth: selectedMonth,
        exchangeRate,
      })
    } catch (error) {
      console.error('Failed to auto-populate expenses:', error)
    }
  }

  const handleSaveRate = useCallback(
    (rate: number) => {
      upsertRateMutation.mutate({
        month: selectedMonth,
        rate,
      })
    },
    [selectedMonth, upsertRateMutation]
  )

  const isLoading = isMonthlyLoading || isYearlyLoading || isRateLoading
  const isFormLoading = createMutation.isPending || updateMutation.isPending || createYearlyMutation.isPending

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-40" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header: Month Selector & Exchange Rate */}
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

      {/* Monthly Expenses Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Monthly Expenses</h3>
          <div className="flex items-center gap-2">
            {monthlyExpenses.length === 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAutoPopulate}
                disabled={autoPopulateMutation.isPending}
              >
                <Copy className="w-4 h-4 mr-1" />
                {autoPopulateMutation.isPending ? 'Copying...' : 'Copy from Last Month'}
              </Button>
            )}
            <Button size="sm" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        <div className="p-4">
          {monthlyExpenses.length > 0 ? (
            <ExpensesList
              expenses={monthlyExpenses}
              isLoading={isMonthlyLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              exchangeRate={exchangeRate}
            />
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No monthly expenses for {MONTHS[selectedMonth - 1]}. Add one or copy from last month.
            </p>
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Monthly Subtotal:</span>
          <span className="font-semibold text-gray-900">{formatAmount(monthlyTotal)}</span>
        </div>
      </div>

      {/* Yearly Expenses Section (Amortized) */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Yearly Expenses (Amortized)</h3>
          </div>
          <Button size="sm" onClick={handleAddYearly}>
            <Plus className="w-4 h-4 mr-1" />
            Add Yearly
          </Button>
        </div>

        <div className="p-4">
          {yearlyExpenses.length > 0 ? (
            <div className="space-y-2">
              {yearlyExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{expense.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        Due: {MONTHS[expense.due_month! - 1]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatUSD(expense.cost_usd)}/year
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatAmount(expense.cost_usd / 12)}/mo
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No yearly expenses. Add expenses like hosting, annual subscriptions, etc.
            </p>
          )}
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Yearly Amortized (per month):</span>
          <span className="font-semibold text-gray-900">{formatAmount(yearlyAmortizedTotal)}</span>
        </div>
      </div>

      {/* Total Expenses Summary */}
      <div className="bg-red-50 rounded-lg border border-red-200 p-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-red-900">Total Monthly Expense Impact:</span>
          <span className="text-xl font-bold text-red-600">{formatAmount(totalExpenses)}</span>
        </div>
        <p className="text-xs text-red-700 mt-1">
          Monthly ({formatAmount(monthlyTotal)}) + Yearly Amortized ({formatAmount(yearlyAmortizedTotal)})
        </p>
      </div>

      {/* Add/Edit Monthly Form Modal */}
      <ExpenseForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedExpense(null)
        }}
        onSubmit={handleFormSubmit}
        expense={selectedExpense}
        isLoading={isFormLoading}
        mode="monthly"
      />

      {/* Add/Edit Yearly Form Modal */}
      <ExpenseForm
        open={isYearlyFormOpen}
        onOpenChange={(open) => {
          setIsYearlyFormOpen(open)
          if (!open) setSelectedExpense(null)
        }}
        onSubmit={handleFormSubmit}
        expense={selectedExpense}
        isLoading={isFormLoading}
        mode="yearly"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setSelectedExpense(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${selectedExpense?.name}"?`}
        description={`Are you sure you want to delete this expense? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
