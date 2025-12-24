import { Wallet, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'
import { KPICard } from '../ui/Card'

interface CashflowSummaryProps {
  totalBalance: number
  totalIncome: number
  totalExpense: number
  netChange: number
  isLoading?: boolean
}

function formatBDT(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-IN')
  return `৳${formatted}`
}

export function CashflowSummary({
  totalBalance,
  totalIncome,
  totalExpense,
  netChange,
  isLoading = false,
}: CashflowSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Balance"
        value={formatBDT(totalBalance)}
        icon={<Wallet className="w-5 h-5 text-primary" />}
        subtitle="End of month balance"
      />
      <KPICard
        title="Total Income"
        value={formatBDT(totalIncome)}
        icon={<TrendingUp className="w-5 h-5 text-green-600" />}
        subtitle="This month"
      />
      <KPICard
        title="Total Expense"
        value={formatBDT(totalExpense)}
        icon={<TrendingDown className="w-5 h-5 text-red-600" />}
        subtitle="This month"
      />
      <KPICard
        title="Net Change"
        value={`${netChange >= 0 ? '+' : '-'}${formatBDT(netChange)}`}
        icon={<ArrowUpDown className="w-5 h-5 text-primary" />}
        subtitle="Income - Expense"
      />
    </div>
  )
}
