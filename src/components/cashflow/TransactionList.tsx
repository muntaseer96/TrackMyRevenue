import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
} from '../ui/Table'
import type { PersonalTransactionWithCategory, PersonalAccount } from '../../types'

interface TransactionListProps {
  transactions: PersonalTransactionWithCategory[]
  accounts: PersonalAccount[]
  onEdit: (transaction: PersonalTransactionWithCategory) => void
  onDelete: (transaction: PersonalTransactionWithCategory) => void
  isLoading?: boolean
  showAccountColumn?: boolean
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatBDT(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-IN')
  return amount < 0 ? `-৳${formatted}` : `+৳${formatted}`
}

function formatDate(day: number, month: number, year: number): string {
  const date = new Date(year, month - 1, day)
  const dayName = DAYS[date.getDay()]
  return `${day}-${MONTHS[month - 1]}, ${dayName}`
}

export function TransactionList({
  transactions,
  accounts,
  onEdit,
  onDelete,
  isLoading = false,
  showAccountColumn = true,
}: TransactionListProps) {
  // Create account map for quick lookup
  const accountMap = new Map(accounts.map(a => [a.id, a]))

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {showAccountColumn && <TableHead>Account</TableHead>}
              <TableHead>Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableSkeleton columns={showAccountColumn ? 6 : 5} rows={5} />
          </TableBody>
        </Table>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {showAccountColumn && <TableHead>Account</TableHead>}
              <TableHead>Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty
              columns={showAccountColumn ? 6 : 5}
              message="No transactions yet"
            />
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showAccountColumn && <TableHead>Account</TableHead>}
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const account = accountMap.get(transaction.account_id)
            const isIncome = transaction.amount > 0

            return (
              <TableRow key={transaction.id} className="group">
                <TableCell className="font-medium">
                  {formatDate(transaction.day, transaction.month, transaction.year)}
                </TableCell>
                {showAccountColumn && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: account?.color || '#666' }}
                      />
                      <span className="text-sm">{account?.name || 'Unknown'}</span>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <span className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {formatBDT(transaction.amount)}
                  </span>
                </TableCell>
                <TableCell>
                  {transaction.category ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      transaction.category.type === 'income'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Uncategorized</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-gray-600 text-sm line-clamp-1" title={transaction.note || ''}>
                    {transaction.note || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(transaction)}
                      aria-label="Edit transaction"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(transaction)}
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
