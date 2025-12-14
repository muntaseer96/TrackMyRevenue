import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import { useWebsiteStats } from '../../hooks/useWebsiteStats'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

interface WebsiteChartsProps {
  websiteId: string
}

export function WebsiteCharts({ websiteId }: WebsiteChartsProps) {
  const { currencyView } = useCurrencyStore()
  const {
    isLoading,
    totals,
    monthlyTrend,
    revenueByCategory,
    expenseByCategory,
    avgExchangeRate,
  } = useWebsiteStats(websiteId)

  const formatAmount = (value: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(value * avgExchangeRate)
    }
    return formatUSD(value)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  const hasData = monthlyTrend.some(d => d.revenue > 0 || d.expense > 0)

  // Transform data for charts
  const trendChartData = monthlyTrend.map(item => ({
    ...item,
    revenue: currencyView === 'BDT' ? item.revenue * avgExchangeRate : item.revenue,
    expense: currencyView === 'BDT' ? item.expense * avgExchangeRate : item.expense,
    profit: currencyView === 'BDT' ? item.profit * avgExchangeRate : item.profit,
  }))

  const revenueChartData = revenueByCategory.map(item => ({
    name: item.categoryName,
    value: currencyView === 'BDT' ? item.amount * avgExchangeRate : item.amount,
  }))

  const expenseChartData = expenseByCategory.map(item => ({
    name: item.categoryName,
    value: currencyView === 'BDT' ? item.amount * avgExchangeRate : item.amount,
  }))

  return (
    <div className="p-4 space-y-6">
      {/* KPI Cards - Smaller version */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Revenue */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-gray-600">Revenue</span>
          </div>
          <p className="text-lg font-bold text-green-600 mt-1">
            {formatAmount(totals.revenue)}
          </p>
        </div>

        {/* Total Expense */}
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-xs text-gray-600">Expense</span>
          </div>
          <p className="text-lg font-bold text-red-600 mt-1">
            {formatAmount(totals.expense)}
          </p>
        </div>

        {/* Net Profit */}
        <div className={`rounded-lg p-3 border ${
          totals.profit >= 0 ? 'bg-primary-light border-primary' : 'bg-red-100 border-red-300'
        }`}>
          <div className="flex items-center gap-2">
            <DollarSign className={`w-4 h-4 ${totals.profit >= 0 ? 'text-primary' : 'text-red-600'}`} />
            <span className="text-xs text-gray-600">Profit</span>
          </div>
          <p className={`text-lg font-bold mt-1 ${totals.profit >= 0 ? 'text-primary' : 'text-red-600'}`}>
            {formatAmount(Math.abs(totals.profit))}
          </p>
        </div>

        {/* Profit Margin */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">Margin</span>
          </div>
          <p className={`text-lg font-bold mt-1 ${totals.margin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {totals.margin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Monthly Trend</h4>
        {hasData ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
                  formatter={(value: number) => formatAmount(value / (currencyView === 'BDT' ? avgExchangeRate : 1))}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Expense" />
                <Line type="monotone" dataKey="profit" stroke="#5A8C27" strokeWidth={2} dot={{ r: 3 }} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
            No data available for this year
          </div>
        )}
      </div>

      {/* Category Breakdown - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Revenue by Category</h4>
          {revenueByCategory.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => formatAmount(value / (currencyView === 'BDT' ? avgExchangeRate : 1))}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No revenue data
            </div>
          )}
        </div>

        {/* Expense by Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Expense by Category</h4>
          {expenseByCategory.length > 0 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => formatAmount(value / (currencyView === 'BDT' ? avgExchangeRate : 1))}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              No expense data
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
