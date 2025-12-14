import { useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import { useExpenses } from '../../hooks/useExpenses'
import { DEFAULT_EXCHANGE_RATE } from '../../hooks/useExchangeRates'
import { TrendingDown, DollarSign } from 'lucide-react'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function ExpenseCharts() {
  const { currencyView } = useCurrencyStore()
  const { data: expenses = [], isLoading } = useExpenses()

  // Calculate monthly totals
  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map((name, index) => {
      const month = index + 1
      const monthExpenses = expenses.filter(e => e.month === month)
      const total = monthExpenses.reduce((sum, e) => sum + e.cost_usd, 0)
      const avgRate = monthExpenses.length > 0
        ? monthExpenses.reduce((sum, e) => sum + e.exchange_rate, 0) / monthExpenses.length
        : DEFAULT_EXCHANGE_RATE

      return {
        month,
        monthName: name,
        total,
        totalConverted: currencyView === 'BDT' ? total * avgRate : total,
      }
    })
  }, [expenses, currencyView])

  // Calculate expense breakdown by name
  const expenseBreakdown = useMemo(() => {
    const breakdown = new Map<string, number>()

    expenses.forEach(expense => {
      const current = breakdown.get(expense.name) || 0
      breakdown.set(expense.name, current + expense.cost_usd)
    })

    return Array.from(breakdown.entries())
      .map(([name, total]) => ({
        name,
        total,
        totalConverted: currencyView === 'BDT' ? total * DEFAULT_EXCHANGE_RATE : total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Top 10
  }, [expenses, currencyView])

  // Calculate totals
  const yearTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.cost_usd, 0)
  }, [expenses])

  const formatAmount = (value: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(value * DEFAULT_EXCHANGE_RATE)
    }
    return formatUSD(value)
  }

  if (isLoading) {
    return (
      <div className="p-4 animate-pulse space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  const hasData = expenses.length > 0

  return (
    <div className="p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm text-gray-600">Total Expenses (Year)</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {formatAmount(yearTotal)}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">Monthly Average</span>
          </div>
          <p className="text-2xl font-bold text-gray-700 mt-2">
            {formatAmount(yearTotal / 12)}
          </p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Monthly Expense Trend</h4>
        {hasData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="monthName"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                />
                <Tooltip
                  formatter={(value: number) => formatAmount(value / (currencyView === 'BDT' ? DEFAULT_EXCHANGE_RATE : 1))}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="totalConverted"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
            No expense data for this year
          </div>
        )}
      </div>

      {/* Expense Breakdown Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Expense Breakdown (Top 10)</h4>
        {expenseBreakdown.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={expenseBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  width={75}
                />
                <Tooltip
                  formatter={(value: number) => formatAmount(value / (currencyView === 'BDT' ? DEFAULT_EXCHANGE_RATE : 1))}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar
                  dataKey="totalConverted"
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                  name="Total"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
            No expense data for this year
          </div>
        )}
      </div>
    </div>
  )
}
