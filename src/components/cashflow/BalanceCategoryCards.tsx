import { Layers } from 'lucide-react'
import { useBalanceCategoryStats } from '../../hooks/useCashflow'

interface BalanceCategoryCardsProps {
  accountId: string
}

export function BalanceCategoryCards({ accountId }: BalanceCategoryCardsProps) {
  const { balanceCategories, isLoading } = useBalanceCategoryStats(accountId)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 flex-wrap">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-16 w-40 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (!balanceCategories || balanceCategories.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Layers className="w-4 h-4" />
        <span>Balance Categories</span>
      </div>
      <div className="flex gap-3 flex-wrap">
        {balanceCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <div>
              <div className="text-xs text-gray-500">{category.name}</div>
              <div className="font-semibold text-gray-900">
                ৳{formatCurrency(category.current_balance)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
