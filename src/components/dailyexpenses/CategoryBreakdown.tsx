import { useMemo } from 'react'
import { formatBDT } from '../../utils/formatCurrency'
import { useDailyExpenseStats } from '../../hooks/useDailyExpenses'
import { useDailyExpenseCategories } from '../../hooks/useDailyExpenseCategories'
import { buildColorMap, colorFor } from './categoryMeta'

export function CategoryBreakdown() {
  const stats = useDailyExpenseStats()
  const { categoryBreakdown, monthTotal } = stats
  const { data: dbCategories } = useDailyExpenseCategories()
  const colorMap = useMemo(() => buildColorMap(dbCategories), [dbCategories])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">This month by category</h3>

      {categoryBreakdown.length === 0 ? (
        <p className="text-sm text-gray-500">No expenses recorded this month yet.</p>
      ) : (
        <ul className="space-y-3">
          {categoryBreakdown.map(({ category, total }) => {
            const pct = monthTotal > 0 ? (total / monthTotal) * 100 : 0
            return (
              <li key={category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 text-gray-700">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colorFor(category, colorMap) }}
                    />
                    {category}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatBDT(total)}{' '}
                    <span className="text-gray-400 font-normal">({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: colorFor(category, colorMap) }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
