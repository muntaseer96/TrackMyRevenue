import { CalendarDays, CalendarRange, TrendingDown, Tag } from 'lucide-react'
import { KPICard } from '../ui/Card'
import { formatBDT } from '../../utils/formatCurrency'
import { useDailyExpenseStats } from '../../hooks/useDailyExpenses'

export function DailyExpenseSummary() {
  const stats = useDailyExpenseStats()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <KPICard
        title="Today"
        value={formatBDT(stats.todayTotal)}
        icon={<CalendarDays className="w-5 h-5 text-primary" />}
      />
      <KPICard
        title="This month"
        value={formatBDT(stats.monthTotal)}
        icon={<CalendarRange className="w-5 h-5 text-primary" />}
      />
      <KPICard
        title="Avg / day"
        value={formatBDT(stats.avgDaily)}
        subtitle={`over ${stats.daysElapsed} day${stats.daysElapsed === 1 ? '' : 's'} elapsed`}
        icon={<TrendingDown className="w-5 h-5 text-primary" />}
      />
      <KPICard
        title="Top category"
        value={stats.topCategory ? stats.topCategory.category : '—'}
        subtitle={stats.topCategory ? formatBDT(stats.topCategory.total) : 'no spending yet'}
        icon={<Tag className="w-5 h-5 text-primary" />}
      />
    </div>
  )
}
