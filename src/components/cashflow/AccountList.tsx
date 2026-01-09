import { Edit2, Trash2, Wallet, Layers } from 'lucide-react'
import { Button } from '../ui/Button'
import type { AccountSummary } from '../../types'

interface AccountListProps {
  accounts: AccountSummary[]
  onEdit: (account: AccountSummary) => void
  onDelete: (account: AccountSummary) => void
  onSetBalance: (account: AccountSummary) => void
  onManageBalanceCategories: (account: AccountSummary) => void
  onSelectAccount: (accountId: string) => void
  isLoading?: boolean
}

function formatBDT(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-IN')
  return amount < 0 ? `-৳${formatted}` : `৳${formatted}`
}

export function AccountList({
  accounts,
  onEdit,
  onDelete,
  onSetBalance,
  onManageBalanceCategories,
  onSelectAccount,
  isLoading = false,
}: AccountListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse border border-gray-200">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-6 bg-gray-200 rounded w-28" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No accounts yet</h3>
        <p className="text-gray-500">Add your first bank account to start tracking</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
          onClick={() => onSelectAccount(account.id)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: account.color }}
              />
              <h3 className="font-semibold text-gray-900">{account.name}</h3>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onManageBalanceCategories(account)
                }}
                aria-label="Manage balance categories"
                title="Manage balance categories"
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSetBalance(account)
                }}
                aria-label="Set balance"
                title="Set beginning balance"
              >
                <Wallet className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(account)
                }}
                aria-label="Edit account"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(account)
                }}
                aria-label="Delete account"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>

          {/* Balances */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Beginning</span>
              <span className="font-medium">{formatBDT(account.beginning_balance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ending</span>
              <span className="font-semibold text-gray-900">{formatBDT(account.ending_balance)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Net Change</span>
                <span className={`font-semibold ${account.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {account.net_change >= 0 ? '+' : ''}{formatBDT(account.net_change)}
                </span>
              </div>
            </div>
          </div>

          {/* Income/Expense breakdown */}
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Income</span>
              <p className="font-medium text-green-600">{formatBDT(account.total_income)}</p>
            </div>
            <div>
              <span className="text-gray-400">Expense</span>
              <p className="font-medium text-red-600">{formatBDT(account.total_expense)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
