import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'

interface KPICardsProps {
  revenue: number
  expense: number
  profit: number
  margin: number
  exchangeRate?: number
}

export function KPICards({ revenue, expense, profit, margin, exchangeRate = 122 }: KPICardsProps) {
  const { currencyView } = useCurrencyStore()

  const formatAmount = (amount: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(amount * exchangeRate)
    }
    return formatUSD(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatAmount(revenue)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Total Expenses */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatAmount(expense)}
            </p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Net Profit */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Net Profit</p>
            <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {formatAmount(Math.abs(profit))}
              {profit < 0 && <span className="text-sm ml-1">(Loss)</span>}
            </p>
          </div>
          <div className={`p-3 rounded-full ${profit >= 0 ? 'bg-primary-light' : 'bg-red-100'}`}>
            <DollarSign className={`w-6 h-6 ${profit >= 0 ? 'text-primary' : 'text-red-600'}`} />
          </div>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Profit Margin</p>
            <p className={`text-2xl font-bold mt-1 ${margin >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {margin.toFixed(1)}%
            </p>
          </div>
          <div className={`p-3 rounded-full ${margin >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
            <Percent className={`w-6 h-6 ${margin >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
