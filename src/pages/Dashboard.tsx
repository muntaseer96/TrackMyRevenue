import { Header } from '../components/layout/Header'
import { DateRangeFilter } from '../components/layout/DateRangeFilter'
import { KPICards, MonthlyTrendChart, RevenueByWebsiteChart, CategoryPieChart } from '../components/dashboard'
import { AIInsightsSection } from '../components/ai'
import { useDashboardStats, useDashboardData } from '../hooks/useDashboardStats'
import { useFilterStore, formatDateRange } from '../stores/filterStore'
import { DEFAULT_EXCHANGE_RATE } from '../hooks/useExchangeRates'

export function Dashboard() {
  const { year, startMonth, endMonth } = useFilterStore()
  const { data: dashboardData, isLoading: isDataLoading } = useDashboardData()
  const {
    isLoading,
    totals,
    monthlyTrend,
    websiteRevenue,
    revenueByCategory,
  } = useDashboardStats()

  // Calculate average exchange rate for the year (or use default)
  const avgExchangeRate = dashboardData?.exchangeRates?.length
    ? dashboardData.exchangeRates.reduce((sum, r) => sum + r.rate, 0) / dashboardData.exchangeRates.length
    : DEFAULT_EXCHANGE_RATE

  if (isLoading || isDataLoading) {
    return (
      <div>
        <Header
          title="Dashboard"
          action={<DateRangeFilter />}
        />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="h-72 bg-gray-200 rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-72 bg-gray-200 rounded-lg" />
              <div className="h-72 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title="Dashboard"
        action={<DateRangeFilter />}
      />
      <div className="p-6 space-y-6">
        {/* Date range indicator */}
        <div className="text-sm text-gray-500">
          Showing data for <span className="font-semibold text-gray-700">{formatDateRange(startMonth, endMonth, year)}</span>
        </div>

        {/* KPI Cards */}
        <KPICards
          revenue={totals.revenue}
          expense={totals.expense}
          profit={totals.profit}
          margin={totals.margin}
          exchangeRate={avgExchangeRate}
        />

        {/* AI Financial Insights */}
        <AIInsightsSection />

        {/* Monthly Trend Chart */}
        <MonthlyTrendChart data={monthlyTrend} exchangeRate={avgExchangeRate} />

        {/* Revenue by Website */}
        <RevenueByWebsiteChart data={websiteRevenue} exchangeRate={avgExchangeRate} />

        {/* Revenue by Category - Full width with website filter */}
        <CategoryPieChart
          revenueData={revenueByCategory}
          exchangeRate={avgExchangeRate}
          websites={dashboardData?.websites || []}
          entries={dashboardData?.entries || []}
          categories={dashboardData?.categories || []}
        />
      </div>
    </div>
  )
}
