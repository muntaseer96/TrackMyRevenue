import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import { toast } from '../ui/useToast'
import {
  useDailyExpenses,
  useDeleteDailyExpense,
  toBDT,
} from '../../hooks/useDailyExpenses'
import { useDailyExpenseCategories } from '../../hooks/useDailyExpenseCategories'
import type { DailyExpense } from '../../types'
import { buildColorMap, colorFor } from './categoryMeta'

function formatDayLabel(dateStr: string): string {
  // dateStr is YYYY-MM-DD (no timezone shift — parse as local).
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (isSame(date, today)) return 'Today'
  if (isSame(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function DailyExpenseList() {
  const { data: expenses, isLoading } = useDailyExpenses(100)
  const { data: dbCategories } = useDailyExpenseCategories()
  const colorMap = useMemo(() => buildColorMap(dbCategories), [dbCategories])
  const deleteExpense = useDeleteDailyExpense()

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense.mutateAsync(id)
      toast({ title: 'Expense deleted' })
    } catch (err) {
      toast({
        title: 'Could not delete',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center text-gray-500">
        Loading…
      </div>
    )
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center text-gray-500">
        No expenses yet. Add your first one above.
      </div>
    )
  }

  // Group by date for readable day headers.
  const groups: { date: string; items: DailyExpense[]; total: number }[] = []
  for (const e of expenses) {
    let group = groups.find((g) => g.date === e.expense_date)
    if (!group) {
      group = { date: e.expense_date, items: [], total: 0 }
      groups.push(group)
    }
    group.items.push(e)
    group.total += toBDT(e.amount, e.currency)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">Recent expenses</h3>
      </div>

      <div className="divide-y divide-gray-100">
        {groups.map((group) => (
          <div key={group.date}>
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {formatDayLabel(group.date)}
              </span>
              <span className="text-xs font-medium text-gray-600">{formatBDT(group.total)}</span>
            </div>

            <ul>
              {group.items.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorFor(e.category, colorMap) }}
                    title={e.category}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {e.note || e.raw_input || e.category}
                    </p>
                    <p className="text-xs text-gray-500">{e.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {e.currency === 'USD' ? (
                      <>
                        <p className="text-sm font-semibold text-gray-900">{formatUSD(e.amount)}</p>
                        <p className="text-xs text-gray-400">{formatBDT(toBDT(e.amount, e.currency))}</p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{formatBDT(e.amount)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(e.id)}
                    aria-label="Delete expense"
                    className="p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-red-50 transition-colors md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
