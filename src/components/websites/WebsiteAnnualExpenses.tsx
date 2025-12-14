import { useState } from 'react'
import { CalendarClock, Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '../ui/Modal'
import { DeleteConfirmation } from './DeleteConfirmation'
import { useWebsiteExpenses, useCreateYearlyExpense, useUpdateExpense, useDeleteExpense } from '../../hooks/useExpenses'
import { useCurrencyStore } from '../../stores/currencyStore'
import { formatBDT, formatUSD } from '../../utils/formatCurrency'
import { DEFAULT_EXCHANGE_RATE } from '../../hooks/useExchangeRates'
import type { Tool } from '../../types'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

interface WebsiteAnnualExpensesProps {
  websiteId: string
  websiteName?: string // Optional, not currently used but available for future
}

interface ExpenseFormData {
  name: string
  cost_usd: number
  due_month: number
}

export function WebsiteAnnualExpenses({ websiteId }: WebsiteAnnualExpensesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Tool | null>(null)
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    cost_usd: 0,
    due_month: 1,
  })

  const { currencyView } = useCurrencyStore()

  // Fetch annual expenses for this website
  const { data: annualExpenses = [], isLoading } = useWebsiteExpenses(websiteId)

  // Mutations
  const createMutation = useCreateYearlyExpense()
  const updateMutation = useUpdateExpense()
  const deleteMutation = useDeleteExpense()

  const formatAmount = (amount: number) => {
    if (currencyView === 'BDT') {
      return formatBDT(amount * DEFAULT_EXCHANGE_RATE)
    }
    return formatUSD(amount)
  }

  const handleAddNew = () => {
    setSelectedExpense(null)
    setFormData({
      name: '',
      cost_usd: 0,
      due_month: 1,
    })
    setIsFormOpen(true)
  }

  const handleEdit = (expense: Tool) => {
    setSelectedExpense(expense)
    setFormData({
      name: expense.name,
      cost_usd: expense.cost_usd,
      due_month: expense.due_month || 1,
    })
    setIsFormOpen(true)
  }

  const handleDelete = (expense: Tool) => {
    setSelectedExpense(expense)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (selectedExpense) {
        await updateMutation.mutateAsync({
          id: selectedExpense.id,
          name: formData.name,
          costUsd: formData.cost_usd,
          exchangeRate: DEFAULT_EXCHANGE_RATE,
          recurrence: 'yearly',
          dueMonth: formData.due_month,
        })
      } else {
        await createMutation.mutateAsync({
          name: formData.name,
          costUsd: formData.cost_usd,
          dueMonth: formData.due_month,
          exchangeRate: DEFAULT_EXCHANGE_RATE,
          websiteId,
        })
      }
      setIsFormOpen(false)
      setSelectedExpense(null)
    } catch (error) {
      console.error('Failed to save expense:', error)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return

    try {
      await deleteMutation.mutateAsync(selectedExpense.id)
      setIsDeleteOpen(false)
      setSelectedExpense(null)
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  // Calculate totals
  const totalYearlyCost = annualExpenses.reduce((sum, exp) => sum + exp.cost_usd, 0)
  const monthlyImpact = totalYearlyCost / 12

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-40" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Annual Expenses List */}
      <div className="flex justify-end">
        <Button size="sm" onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-1" />
          Add Annual Expense
        </Button>
      </div>

      {annualExpenses.length > 0 ? (
        <div className="space-y-3">
          {annualExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-gray-900">{expense.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    Due: {MONTHS.find(m => m.value === expense.due_month)?.label || 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 ml-6">
                  {formatUSD(expense.cost_usd)}/year
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatAmount(expense.cost_usd / 12)}/mo
                </p>
                <p className="text-xs text-gray-500">amortized</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CalendarClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No annual expenses tracked</p>
          <p className="text-sm text-gray-400">
            Add yearly costs like domain renewals, annual subscriptions, etc.
          </p>
        </div>
      )}

      {annualExpenses.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Monthly Impact:</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-blue-900">{formatAmount(monthlyImpact)}</span>
              <span className="text-xs text-blue-700 ml-2">({formatAmount(totalYearlyCost)}/year)</span>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      <Modal open={isFormOpen} onOpenChange={setIsFormOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {selectedExpense ? 'Edit Annual Expense' : 'Add Annual Expense'}
            </ModalTitle>
          </ModalHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 px-6 pb-6">
            <div>
              <label htmlFor="expense-name" className="block text-sm font-medium text-gray-700 mb-1">
                Expense Name
              </label>
              <Input
                id="expense-name"
                placeholder="e.g., Domain renewal, Annual subscription"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Annual Cost (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7"
                  placeholder="0.00"
                  value={formData.cost_usd || ''}
                  onChange={(e) => setFormData({ ...formData, cost_usd: parseFloat(e.target.value) || 0 })}
                  onFocus={(e) => {
                    if (e.target.value === '0') {
                      e.target.value = ''
                      setFormData({ ...formData, cost_usd: 0 })
                    }
                  }}
                  required
                />
              </div>
              {formData.cost_usd > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Monthly impact: {formatAmount(formData.cost_usd / 12)} (amortized)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Month
              </label>
              <Select
                value={formData.due_month.toString()}
                onValueChange={(value) => setFormData({ ...formData, due_month: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select when payment is due" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsFormOpen(false)}
                disabled={isFormLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isFormLoading}>
                {isFormLoading ? 'Saving...' : selectedExpense ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setSelectedExpense(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${selectedExpense?.name}"?`}
        description="Are you sure you want to delete this expense? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
