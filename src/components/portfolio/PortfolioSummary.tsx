import { Wallet, TrendingUp, TrendingDown, Percent } from 'lucide-react'
import { formatBDT } from '../../utils/formatCurrency'

interface PortfolioSummaryProps {
  totalValue: number
  gainLoss: number
  totalIncome: number
  roi: number
  isLoading?: boolean
}

export function PortfolioSummary({
  totalValue,
  gainLoss,
  totalIncome,
  roi,
  isLoading,
}: PortfolioSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    )
  }

  const isGain = gainLoss >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatBDT(totalValue)}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Wallet className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Gain / Loss</p>
            <p className={`text-2xl font-bold mt-1 ${isGain ? 'text-green-600' : 'text-red-600'}`}>
              {isGain ? '+' : ''}{formatBDT(gainLoss)}
            </p>
          </div>
          <div className={`p-3 rounded-full ${isGain ? 'bg-green-100' : 'bg-red-100'}`}>
            {isGain ? (
              <TrendingUp className="w-6 h-6 text-green-600" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-600" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Income (Period)</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatBDT(totalIncome)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Overall ROI</p>
            <p className={`text-2xl font-bold mt-1 ${roi >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
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
