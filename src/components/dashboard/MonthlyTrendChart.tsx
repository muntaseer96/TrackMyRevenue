import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import type { MonthlyTrendData } from '../../hooks/useDashboardStats'

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[]
  exchangeRate?: number
}

export function MonthlyTrendChart({ data, exchangeRate = 122 }: MonthlyTrendChartProps) {
  const { currencyView } = useCurrencyStore()

  const formatAmount = (value: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(value * exchangeRate)
    }
    return formatUSD(value)
  }

  // Transform data for the selected currency view
  const chartData = data.map(item => ({
    ...item,
    revenue: currencyView === 'BDT' ? item.revenue * exchangeRate : item.revenue,
    expense: currencyView === 'BDT' ? item.expense * exchangeRate : item.expense,
    profit: currencyView === 'BDT' ? item.profit * exchangeRate : item.profit,
  }))

  if (data.every(d => d.revenue === 0 && d.expense === 0)) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for this year
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="monthName"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`
                }
                return value.toString()
              }}
            />
            <Tooltip
              formatter={(value: number) => formatAmount(value / (currencyView === 'BDT' ? exchangeRate : 1))}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: '#22c55e', strokeWidth: 2 }}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', strokeWidth: 2 }}
              name="Expense"
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#5A8C27"
              strokeWidth={2}
              dot={{ fill: '#5A8C27', strokeWidth: 2 }}
              name="Profit"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
