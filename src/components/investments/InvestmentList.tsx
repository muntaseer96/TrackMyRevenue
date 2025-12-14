import { useState } from 'react'
import { ChevronDown, ChevronRight, MoreVertical, Plus, Trash2, Edit, Calendar } from 'lucide-react'
import { formatBDT } from '../../utils/formatCurrency'
import { Button } from '../ui/Button'
import type { Investment, DividendWithInvestment } from '../../types'
import { getMonthName } from '../../stores/filterStore'

interface InvestmentListProps {
  investments: Investment[]
  dividends: DividendWithInvestment[]
  onEdit: (investment: Investment) => void
  onDelete: (investment: Investment) => void
  onAddDividend: (investment: Investment) => void
  onDeleteDividend: (dividendId: string, investmentId: string) => void
  isLoading?: boolean
}

export function InvestmentList({
  investments,
  dividends,
  onEdit,
  onDelete,
  onAddDividend,
  onDeleteDividend,
  isLoading,
}: InvestmentListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (investments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No investments found for this year.</p>
        <p className="text-sm text-gray-400 mt-1">Add your first investment to start tracking.</p>
      </div>
    )
  }

  // Group dividends by investment
  const dividendsByInvestment = dividends.reduce((acc, div) => {
    if (!acc[div.investment_id]) {
      acc[div.investment_id] = []
    }
    acc[div.investment_id].push(div)
    return acc
  }, {} as Record<string, DividendWithInvestment[]>)

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
      {investments.map((investment) => {
        const isExpanded = expandedId === investment.id
        const investmentDividends = dividendsByInvestment[investment.id] || []
        const totalDividends = investmentDividends.reduce((sum, d) => sum + d.amount, 0)
        const isMenuOpen = menuOpenId === investment.id

        return (
          <div key={investment.id}>
            {/* Investment Row */}
            <div
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : investment.id)}
            >
              <div className="flex items-center gap-3">
                {/* Expand Icon */}
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>

                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {investment.company_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Principal: {formatBDT(investment.principal_amount)}
                  </p>
                </div>

                {/* Dividends Total */}
                <div className="text-right mr-2">
                  <p className="font-medium text-green-600">
                    {formatBDT(totalDividends)}
                  </p>
                  <p className="text-xs text-gray-400">Dividends</p>
                </div>

                {/* Actions Menu */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpenId(isMenuOpen ? null : investment.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpenId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                        <button
                          onClick={() => {
                            onAddDividend(investment)
                            setMenuOpenId(null)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                          Add Dividend
                        </button>
                        <button
                          onClick={() => {
                            onEdit(investment)
                            setMenuOpenId(null)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Investment
                        </button>
                        <button
                          onClick={() => {
                            onDelete(investment)
                            setMenuOpenId(null)
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes if present */}
              {investment.notes && (
                <p className="text-sm text-gray-500 mt-2 ml-8 italic">
                  {investment.notes}
                </p>
              )}
            </div>

            {/* Expanded Dividend History */}
            {isExpanded && (
              <div className="bg-gray-50 border-t border-gray-100">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dividend History
                  </h4>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddDividend(investment)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {investmentDividends.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No dividends recorded for selected period.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {investmentDividends
                      .sort((a, b) => a.month - b.month)
                      .map((dividend) => (
                        <div
                          key={dividend.id}
                          className="px-4 py-3 flex items-center justify-between hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600 w-24">
                              {getMonthName(dividend.month, false)}
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              {formatBDT(dividend.amount)}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteDividend(dividend.id, dividend.investment_id)
                            }}
                            className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
