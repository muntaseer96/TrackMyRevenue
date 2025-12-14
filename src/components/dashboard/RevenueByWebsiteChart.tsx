import {
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
import type { WebsiteRevenueData } from '../../hooks/useDashboardStats'

interface RevenueByWebsiteChartProps {
  data: WebsiteRevenueData[]
  exchangeRate?: number
}

export function RevenueByWebsiteChart({ data, exchangeRate = 122 }: RevenueByWebsiteChartProps) {
  const { currencyView } = useCurrencyStore()

  const formatAmount = (value: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(value * exchangeRate)
    }
    return formatUSD(value)
  }

  // Transform data for the selected currency view
  const chartData = data.map(item => ({
    name: item.websiteName.length > 15 ? item.websiteName.slice(0, 15) + '...' : item.websiteName,
    fullName: item.websiteName,
    revenue: currencyView === 'BDT' ? item.revenue * exchangeRate : item.revenue,
    expense: currencyView === 'BDT' ? item.expense * exchangeRate : item.expense,
    profit: currencyView === 'BDT' ? item.profit * exchangeRate : item.profit,
  }))

  if (data.length === 0 || data.every(d => d.revenue === 0 && d.expense === 0)) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Website</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for this year
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Website</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
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
              formatter={(value: number, name: string) => [
                formatAmount(value / (currencyView === 'BDT' ? exchangeRate : 1)),
                name
              ]}
              labelFormatter={(label, payload) => {
                if (payload?.[0]?.payload?.fullName) {
                  return payload[0].payload.fullName
                }
                return label
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
