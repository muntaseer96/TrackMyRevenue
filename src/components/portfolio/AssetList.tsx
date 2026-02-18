import { useState } from 'react'
import { ChevronDown, ChevronRight, MoreVertical, Plus, Trash2, Edit, DollarSign } from 'lucide-react'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import { DEFAULT_EXCHANGE_RATE } from '../../hooks/useExchangeRates'
import { AssetDetail } from './AssetDetail'
import type { Asset, AssetWithStats, AssetType } from '../../types'

interface AssetListProps {
  assets: AssetWithStats[]
  filterType?: AssetType | 'all'
  onFilterChange: (type: AssetType | 'all') => void
  onEdit: (asset: Asset) => void
  onDelete: (asset: Asset) => void
  onAddTransaction: (asset: Asset) => void
  onUpdateValue: (asset: Asset) => void
  isLoading?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  all: 'All',
  bd_stock: 'BD Stock',
  intl_stock: 'Intl Stock',
  real_estate: 'Real Estate',
  fixed_deposit: 'Fixed Deposit',
  gold: 'Gold',
  crypto: 'Crypto',
  bond: 'Bond',
  other: 'Other',
}

const TYPE_COLORS: Record<string, string> = {
  bd_stock: '#3b82f6',
  intl_stock: '#ec4899',
  real_estate: '#f59e0b',
  fixed_deposit: '#10b981',
  gold: '#eab308',
  crypto: '#8b5cf6',
  bond: '#06b6d4',
  other: '#6b7280',
}

export function AssetList({
  assets,
  filterType = 'all',
  onFilterChange,
  onEdit,
  onDelete,
  onAddTransaction,
  onUpdateValue,
  isLoading,
}: AssetListProps) {
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

  // Filter chips
  const activeTypes = new Set(assets.map(a => a.asset_type))
  const filterOptions: (AssetType | 'all')[] = ['all', ...Array.from(activeTypes) as AssetType[]]

  const filteredAssets = filterType === 'all' ? assets : assets.filter(a => a.asset_type === filterType)

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterOptions.map(type => (
          <button
            key={type}
            onClick={() => onFilterChange(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterType === type
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {TYPE_LABELS[type]}
            {type !== 'all' && (
              <span className="ml-1 opacity-75">
                ({assets.filter(a => a.asset_type === type).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No assets found.</p>
          <p className="text-sm text-gray-400 mt-1">Add your first asset to start tracking.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {filteredAssets.map((asset) => {
            const isExpanded = expandedId === asset.id
            const isMenuOpen = menuOpenId === asset.id
            const isUSD = asset.currency === 'USD'
            const rate = DEFAULT_EXCHANGE_RATE
            const costBDT = isUSD ? asset.purchase_price * rate : asset.purchase_price
            const valueBDT = isUSD ? asset.current_value * rate : asset.current_value
            const isGain = asset.gainLoss >= 0

            return (
              <div key={asset.id}>
                {/* Asset Row */}
                <div
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : asset.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Expand Icon */}
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>

                    {/* Type Badge */}
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium text-white flex-shrink-0"
                      style={{ backgroundColor: TYPE_COLORS[asset.asset_type] || '#6b7280' }}
                    >
                      {TYPE_LABELS[asset.asset_type]}
                    </span>

                    {/* Asset Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {asset.name}
                        {asset.ticker && <span className="text-gray-400 ml-1 text-sm">({asset.ticker})</span>}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Cost: {isUSD ? formatUSD(asset.purchase_price) : formatBDT(costBDT)}
                        {isUSD && <span className="text-gray-400 text-xs ml-1">({formatBDT(costBDT)})</span>}
                        {asset.quantity && <span className="ml-2">Qty: {asset.quantity}</span>}
                      </p>
                    </div>

                    {/* Value & Gain/Loss */}
                    <div className="text-right mr-2 hidden sm:block">
                      <p className="font-medium text-gray-900">
                        {isUSD ? formatUSD(asset.current_value) : formatBDT(valueBDT)}
                      </p>
                      {isUSD && (
                        <p className="text-xs text-gray-400">({formatBDT(valueBDT)})</p>
                      )}
                      <p className={`text-xs font-medium ${isGain ? 'text-green-600' : 'text-red-600'}`}>
                        {isGain ? '+' : ''}{asset.gainLossPercent.toFixed(1)}%
                      </p>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpenId(isMenuOpen ? null : asset.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]">
                            {asset.has_transactions && (
                              <button
                                onClick={() => { onAddTransaction(asset); setMenuOpenId(null) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Plus className="w-4 h-4" />
                                Add Transaction
                              </button>
                            )}
                            <button
                              onClick={() => { onUpdateValue(asset); setMenuOpenId(null) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <DollarSign className="w-4 h-4" />
                              Update Value
                            </button>
                            <button
                              onClick={() => { onEdit(asset); setMenuOpenId(null) }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Asset
                            </button>
                            <button
                              onClick={() => { onDelete(asset); setMenuOpenId(null) }}
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
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <AssetDetail
                    asset={asset}
                    onAddTransaction={() => onAddTransaction(asset)}
                    onUpdateValue={() => onUpdateValue(asset)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
