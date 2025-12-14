import { Wallet, TrendingUp, Percent } from 'lucide-react'
import { formatBDT } from '../../utils/formatCurrency'

interface InvestmentSummaryProps {
  totalPortfolio: number
  totalDividends: number
  dividendYield: number
  isLoading?: boolean
}

export function InvestmentSummary({
  totalPortfolio,
  totalDividends,
  dividendYield,
  isLoading,
}: InvestmentSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Portfolio */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Portfolio</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatBDT(totalPortfolio)}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* YTD Dividends */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Dividends (Selected Period)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatBDT(totalDividends)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Dividend Yield */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Dividend Yield</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {dividendYield.toFixed(2)}%
            </p>
          </div>
          <div className="p-3 bg-primary-light rounded-full">
            <Percent className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}
