import { Coins, Calculator, CheckCircle, AlertCircle } from 'lucide-react'
import { KPICard } from '../ui/Card'

interface ZakatSummaryProps {
  totalWealth: number
  zakatDue: number
  totalPaid: number
  remaining: number
  isAboveNisab: boolean
  isLoading?: boolean
}

function formatBDT(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-IN')
  return `৳${formatted}`
}

export function ZakatSummary({
  totalWealth,
  zakatDue,
  totalPaid,
  remaining,
  isAboveNisab,
  isLoading = false,
}: ZakatSummaryProps) {
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
        title="Total Zakatable Wealth"
        value={formatBDT(totalWealth)}
        icon={<Coins className="w-5 h-5 text-primary" />}
        subtitle={isAboveNisab ? 'Above Nisab' : 'Below Nisab'}
      />
      <KPICard
        title="Zakat Due (2.5%)"
        value={formatBDT(zakatDue)}
        icon={<Calculator className="w-5 h-5 text-amber-600" />}
        subtitle={!isAboveNisab ? 'No Zakat due' : undefined}
      />
      <KPICard
        title="Total Paid"
        value={formatBDT(totalPaid)}
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        subtitle={totalPaid > 0 ? `${Math.min(100, Math.round((totalPaid / Math.max(zakatDue, 1)) * 100))}% of due` : undefined}
      />
      <KPICard
        title="Remaining"
        value={formatBDT(remaining)}
        icon={<AlertCircle className="w-5 h-5 text-red-600" />}
        subtitle={remaining === 0 && zakatDue > 0 ? 'Fully paid' : undefined}
      />
    </div>
  )
}
