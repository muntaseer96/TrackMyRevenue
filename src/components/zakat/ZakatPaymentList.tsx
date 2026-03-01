import { Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableEmpty,
} from '../ui/Table'
import { Button } from '../ui/Button'
import type { ZakatPayment } from '../../types'

interface ZakatPaymentListProps {
  payments: ZakatPayment[]
  onEdit: (payment: ZakatPayment) => void
  onDelete: (payment: ZakatPayment) => void
  isLoading?: boolean
}

function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-IN')}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ZakatPaymentList({ payments, onEdit, onDelete, isLoading }: ZakatPaymentListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
      </div>

      {payments.length === 0 ? (
        <Table>
          <TableBody>
            <TableEmpty columns={4} message="No payments recorded yet." />
          </TableBody>
        </Table>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map(payment => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell className="text-right font-mono font-medium">
                  {formatBDT(payment.amount)}
                </TableCell>
                <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                  {payment.note || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(payment)}
                      aria-label="Edit payment"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(payment)}
                      aria-label="Delete payment"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {/* Total row */}
            <TableRow className="bg-gray-50 border-t-2">
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatBDT(totalPaid)}
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  )
}
