import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import type { CategoryBreakdownData } from '../../hooks/useDashboardStats'

interface CategoryPieChartProps {
  revenueData: CategoryBreakdownData[]
  exchangeRate?: number
}

const REVENUE_COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#4ade80', '#86efac', '#bbf7d0']

export function CategoryPieChart({ revenueData, exchangeRate = 122 }: CategoryPieChartProps) {
  const { currencyView } = useCurrencyStore()

  const formatAmount = (value: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(value * exchangeRate)
    }
    return formatUSD(value)
  }

  const revenueChartData = revenueData.map(item => ({
    name: item.categoryName,
    value: currencyView === 'BDT' ? item.amount * exchangeRate : item.amount,
    originalValue: item.amount,
  }))

  const hasRevenueData = revenueData.length > 0 && revenueData.some(d => d.amount > 0)

  // Calculate total revenue for display
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.amount, 0)

  if (!hasRevenueData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No revenue data available for this year
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Revenue by Category</h3>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-semibold text-green-600">{formatAmount(totalRevenue)}</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={revenueChartData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            >
              {revenueChartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                formatAmount(value / (currencyView === 'BDT' ? exchangeRate : 1)),
                name
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
