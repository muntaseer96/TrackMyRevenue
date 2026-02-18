import { Calendar, MapPin, Building, Hash, Trash2, Plus, DollarSign } from 'lucide-react'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import { Button } from '../ui/Button'
import { useAssetTransactions, useDeleteAssetTransaction } from '../../hooks/useAssetTransactions'
import { useAssetValuations, useDeleteAssetValuation } from '../../hooks/useAssetValuations'
import { getMonthName } from '../../stores/filterStore'
import type { AssetWithStats } from '../../types'

const TXN_LABELS: Record<string, string> = {
  buy: 'Buy',
  sell: 'Sell',
  dividend: 'Dividend',
  interest: 'Interest',
  rental_income: 'Rental Income',
  other_income: 'Other Income',
}

interface AssetDetailProps {
  asset: AssetWithStats
  onAddTransaction: () => void
  onUpdateValue: () => void
}

export function AssetDetail({ asset, onAddTransaction, onUpdateValue }: AssetDetailProps) {
  const { data: transactions = [] } = useAssetTransactions(asset.id)
  const { data: valuations = [] } = useAssetValuations(asset.id)
  const deleteTxn = useDeleteAssetTransaction()
  const deleteVal = useDeleteAssetValuation()

  const formatAmount = asset.currency === 'USD' ? formatUSD : formatBDT

  return (
    <div className="bg-gray-50 border-t border-gray-100">
      {/* Asset details row */}
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-b border-gray-100">
        {asset.location && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <MapPin className="w-3.5 h-3.5" />
            <span>{asset.location}</span>
          </div>
        )}
        {asset.institution && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Building className="w-3.5 h-3.5" />
            <span>{asset.institution}</span>
          </div>
        )}
        {asset.interest_rate != null && (
          <div className="text-gray-600">
            Rate: {asset.interest_rate}%
          </div>
        )}
        {asset.maturity_date && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Calendar className="w-3.5 h-3.5" />
            <span>Matures: {asset.maturity_date}</span>
          </div>
        )}
        {asset.area_sqft != null && (
          <div className="text-gray-600">
            Area: {asset.area_sqft} sqft
          </div>
        )}
        {asset.notes && (
          <div className="col-span-2 text-gray-500 italic">
            {asset.notes}
          </div>
        )}
      </div>

      {/* Transactions section */}
      {asset.has_transactions && (
        <div>
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Transactions
            </h4>
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onAddTransaction() }}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>

          {transactions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No transactions recorded.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((txn) => (
                <div key={txn.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      txn.transaction_type === 'buy' ? 'bg-blue-100 text-blue-700' :
                      txn.transaction_type === 'sell' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {TXN_LABELS[txn.transaction_type] || txn.transaction_type}
                    </span>
                    <span className="text-sm text-gray-600">
                      {getMonthName(txn.month, false)} {txn.year}
                      {txn.day && <span className="text-gray-400">, {txn.day}</span>}
                    </span>
                    {txn.quantity && (
                      <span className="text-xs text-gray-400">
                        {txn.quantity} units
                        {txn.price_per_unit && ` @ ${formatAmount(txn.price_per_unit)}`}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${
                      txn.transaction_type === 'sell' ? 'text-orange-600' :
                      txn.transaction_type === 'buy' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {formatAmount(txn.amount)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTxn.mutate({ id: txn.id, assetId: txn.asset_id })
                      }}
                      className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Valuations section */}
      <div>
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Valuation History
          </h4>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onUpdateValue() }}>
            <Plus className="w-4 h-4 mr-1" />
            Update
          </Button>
        </div>

        {valuations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No valuation history.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {valuations.map((val) => (
              <div key={val.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-100">
                <span className="text-sm text-gray-600">
                  {getMonthName(val.month, false)} {val.year}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatAmount(val.value)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteVal.mutate({ id: val.id, assetId: val.asset_id })
                    }}
                    className="p-1.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
