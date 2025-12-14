import { Receipt, Calendar, TrendingDown } from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { formatUSD } from '../../utils/formatCurrency'
import { getMonthName } from '../../stores/filterStore'

export function ExpensesSummary() {
  const { data: expenses = [], isLoading } = useExpenses()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    )
  }

  // Separate monthly and yearly expenses (global only, not website-specific)
  const globalExpenses = expenses.filter(exp => !exp.website_id)
  const websiteExpenses = expenses.filter(exp => exp.website_id)

  const monthlyExpenses = globalExpenses.filter(exp => exp.recurrence === 'monthly' || !exp.recurrence)
  const yearlyExpenses = globalExpenses.filter(exp => exp.recurrence === 'yearly')

  // Find the latest month with monthly expenses
  const latestMonth = monthlyExpenses.length > 0
    ? Math.max(...monthlyExpenses.map(exp => exp.month))
    : 0

  // Get only the latest month's expenses
  const latestMonthExpenses = monthlyExpenses.filter(exp => exp.month === latestMonth)
  const totalMonthlyRecurring = latestMonthExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)
  const monthlyToolCount = latestMonthExpenses.length

  // Yearly: full cost of all yearly expenses
  const totalYearly = yearlyExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)

  // Website-specific (like domain renewals) - yearly
  const totalWebsiteYearly = websiteExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)

  // Effective monthly cost = monthly recurring + (yearly / 12) + (website yearly / 12)
  const effectiveMonthly = totalMonthlyRecurring + (totalYearly / 12) + (totalWebsiteYearly / 12)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Monthly Recurring */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Monthly Recurring</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatUSD(totalMonthlyRecurring)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {monthlyToolCount} tool{monthlyToolCount !== 1 ? 's' : ''} in {latestMonth > 0 ? getMonthName(latestMonth) : 'N/A'}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <Receipt className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Yearly Expenses */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Yearly Expenses</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {formatUSD(totalYearly + totalWebsiteYearly)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {yearlyExpenses.length + websiteExpenses.length} annual cost{(yearlyExpenses.length + websiteExpenses.length) !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="p-3 bg-orange-100 rounded-full">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Effective Monthly */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Effective Monthly</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatUSD(effectiveMonthly)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              incl. amortized yearly
            </p>
          </div>
          <div className="p-3 bg-gray-100 rounded-full">
            <TrendingDown className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
