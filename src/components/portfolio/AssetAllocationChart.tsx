import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatBDT } from '../../utils/formatCurrency'
import type { AssetType } from '../../types'

const TYPE_LABELS: Record<AssetType, string> = {
  bd_stock: 'BD Stock',
  intl_stock: 'Intl Stock',
  real_estate: 'Real Estate',
  fixed_deposit: 'Fixed Deposit',
  gold: 'Gold',
  crypto: 'Crypto',
  bond: 'Bond',
  other: 'Other',
}

const TYPE_COLORS: Record<AssetType, string> = {
  bd_stock: '#3b82f6',
  intl_stock: '#ec4899',
  real_estate: '#f59e0b',
  fixed_deposit: '#10b981',
  gold: '#eab308',
  crypto: '#8b5cf6',
  bond: '#06b6d4',
  other: '#6b7280',
}

interface AllocationEntry {
  value: number
  percentage: number
}

interface AssetAllocationChartProps {
  allocationByType: Record<AssetType, AllocationEntry>
}

export function AssetAllocationChart({ allocationByType }: AssetAllocationChartProps) {
  const data = (Object.entries(allocationByType) as [AssetType, AllocationEntry][])
    .filter(([_, entry]) => entry.value > 0)
    .map(([type, entry]) => ({
      name: TYPE_LABELS[type],
      value: entry.value,
      percentage: entry.percentage,
      color: TYPE_COLORS[type],
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No assets to display allocation chart.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Portfolio Allocation</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatBDT(value)}
              contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
            />
            <Legend
              formatter={(value) => {
                const item = data.find(d => d.name === value)
                return `${value} (${item?.percentage.toFixed(1)}%)`
              }}
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
