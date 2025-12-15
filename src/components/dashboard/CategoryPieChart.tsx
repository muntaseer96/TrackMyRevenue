import { useState, useMemo, useEffect } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import type { CategoryBreakdownData } from '../../hooks/useDashboardStats'
import type { Website, Category, MonthlyEntry } from '../../types'

interface CategoryPieChartProps {
  revenueData: CategoryBreakdownData[]
  exchangeRate?: number
  websites?: Website[]
  entries?: MonthlyEntry[]
  categories?: Category[]
}

const REVENUE_COLORS = [
  '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  '#4ade80', '#86efac', '#bbf7d0', '#10b981', '#059669',
  '#047857', '#065f46', '#064e3b', '#34d399', '#6ee7b7'
]

const OTHER_COLOR = '#9ca3af'
const MIN_PERCENTAGE_THRESHOLD = 2 // Categories below this % will be grouped into "Other"
const MAX_VISIBLE_CATEGORIES = 8 // Maximum number of categories to show before grouping

export function CategoryPieChart({
  revenueData,
  exchangeRate = 122,
  websites = [],
  entries = [],
  categories = []
}: CategoryPieChartProps) {
  const { currencyView } = useCurrencyStore()
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('')

  // Set default to first website when websites load
  useEffect(() => {
    if (websites.length > 0 && !selectedWebsiteId) {
      setSelectedWebsiteId(websites[0].id)
    }
  }, [websites, selectedWebsiteId])

  const formatAmount = (value: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(value * exchangeRate)
    }
    return formatUSD(value)
  }

  // Filter categories by selected website
  const filteredRevenueData = useMemo(() => {
    if (!selectedWebsiteId) {
      return []
    }

    // Create a map of category totals for the selected website
    const categoryTotals = new Map<string, number>()
    const categoryMap = new Map(categories.map(c => [c.id, c]))

    entries.forEach(entry => {
      if (entry.website_id !== selectedWebsiteId) return
      const category = categoryMap.get(entry.category_id)
      if (category?.type === 'revenue') {
        const current = categoryTotals.get(entry.category_id) || 0
        categoryTotals.set(entry.category_id, current + entry.amount)
      }
    })

    return Array.from(categoryTotals.entries())
      .map(([categoryId, amount]) => ({
        categoryId,
        categoryName: categoryMap.get(categoryId)?.name || 'Unknown',
        amount,
        type: 'revenue' as const,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [selectedWebsiteId, revenueData, entries, categories])

  // Process data: group small categories into "Other"
  const processedData = useMemo(() => {
    const total = filteredRevenueData.reduce((sum, item) => sum + item.amount, 0)
    if (total === 0) return []

    const significantCategories: typeof filteredRevenueData = []
    let otherTotal = 0

    filteredRevenueData.forEach((item) => {
      const percentage = (item.amount / total) * 100
      // Keep category if it's above threshold AND we haven't exceeded max visible
      if (percentage >= MIN_PERCENTAGE_THRESHOLD && significantCategories.length < MAX_VISIBLE_CATEGORIES) {
        significantCategories.push(item)
      } else {
        otherTotal += item.amount
      }
    })

    // Add "Other" category if there are grouped items
    if (otherTotal > 0) {
      significantCategories.push({
        categoryId: 'other',
        categoryName: 'Other',
        amount: otherTotal,
        type: 'revenue',
      })
    }

    return significantCategories
  }, [filteredRevenueData])

  const chartData = processedData.map((item) => ({
    name: item.categoryName,
    value: currencyView === 'BDT' ? item.amount * exchangeRate : item.amount,
    originalValue: item.amount,
    isOther: item.categoryId === 'other',
  }))

  const hasRevenueData = processedData.length > 0 && processedData.some(d => d.amount > 0)
  const totalRevenue = filteredRevenueData.reduce((sum, item) => sum + item.amount, 0)
  const displayTotal = currencyView === 'BDT' ? totalRevenue * exchangeRate : totalRevenue

  // Show loading state while waiting for first website to be selected
  if (!selectedWebsiteId && websites.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No websites available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Revenue by Category</h3>

          {/* Website Filter */}
          {websites.length > 0 && (
            <select
              value={selectedWebsiteId}
              onChange={(e) => setSelectedWebsiteId(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {websites.map(website => (
                <option key={website.id} value={website.id}>
                  {website.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-semibold text-green-600">{formatAmount(totalRevenue)}</p>
        </div>
      </div>

      {!hasRevenueData ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No revenue data for this website
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Pie Chart */}
          <div className="h-72 lg:h-80 flex-1 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isOther ? OTHER_COLOR : REVENUE_COLORS[index % REVENUE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    formatAmount(value / (currencyView === 'BDT' ? exchangeRate : 1)),
                    'Amount'
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend as a list */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {chartData.map((item, index) => {
                const percentage = displayTotal > 0 ? (item.value / displayTotal) * 100 : 0
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.isOther ? OTHER_COLOR : REVENUE_COLORS[index % REVENUE_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatAmount(item.originalValue)}
                      </span>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
