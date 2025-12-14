import { useState } from 'react'
import { Header } from '../components/layout/Header'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { MonthlyExpensesEntry, ExpenseCharts, ExpensesSummary } from '../components/expenses'

export function Expenses() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'analytics'>('monthly')

  return (
    <div>
      <Header title="Expenses" />
      <div className="p-6">
        {/* Summary Cards */}
        <ExpensesSummary />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'monthly' | 'analytics')}>
          <TabsList className="mb-4">
            <TabsTrigger value="monthly">Monthly Data</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Monthly Expenses</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Track your recurring subscriptions and costs
                </p>
              </div>
              <MonthlyExpensesEntry />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Expense Analytics</h3>
                <p className="text-sm text-gray-500 mt-1">
                  View expense trends and breakdown
                </p>
              </div>
              <ExpenseCharts />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
