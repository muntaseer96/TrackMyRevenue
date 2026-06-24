import { Header } from '../components/layout/Header'
import {
  QuickAddExpense,
  DailyExpenseSummary,
  DailyExpenseList,
  CategoryBreakdown,
} from '../components/dailyexpenses'

export function DailyExpenses() {
  return (
    <div>
      <Header title="Personal Daily Expense" />
      <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
        {/* Quick natural-language entry */}
        <QuickAddExpense />

        {/* KPI summary for the current month */}
        <DailyExpenseSummary />

        {/* Breakdown + recent list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <CategoryBreakdown />
          <DailyExpenseList />
        </div>
      </div>
    </div>
  )
}
