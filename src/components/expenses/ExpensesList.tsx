import { Edit2, Trash2, Share2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import type { Tool } from '../../types'

interface ExpensesListProps {
  expenses: Tool[]
  isLoading?: boolean
  onEdit: (expense: Tool) => void
  onDelete: (expense: Tool) => void
  exchangeRate: number
}

export function ExpensesList({
  expenses,
  isLoading = false,
  onEdit,
  onDelete,
  exchangeRate,
}: ExpensesListProps) {
  const { currencyView } = useCurrencyStore()

  const formatAmount = (amountUSD: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(amountUSD * exchangeRate)
    }
    return formatUSD(amountUSD)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-lg" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No expenses for this month.</p>
        <p className="text-sm mt-1">Click "Add Expense" to get started.</p>
      </div>
    )
  }

  const total = expenses.reduce((sum, exp) => sum + exp.cost_usd, 0)

  return (
    <div className="space-y-1">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{expense.name}</span>
            {expense.is_allocated !== false && !expense.website_id && (
              <span title="Allocated to websites" className="text-primary">
                <Share2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">
              {formatAmount(expense.cost_usd)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(expense)}
                className="p-1.5 h-auto"
              >
                <Edit2 className="w-4 h-4 text-gray-500 hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(expense)}
                className="p-1.5 h-auto"
              >
                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="flex items-center justify-between py-3 px-4 bg-red-50 rounded-lg border border-red-200 mt-3">
        <span className="font-semibold text-red-800">Total Expenses</span>
        <span className="font-bold text-red-700">{formatAmount(total)}</span>
      </div>
    </div>
  )
}
