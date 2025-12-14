import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select'
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

interface ExpenseFormData {
  name: string
  cost_usd: number
  recurrence: 'monthly' | 'yearly'
  due_month: number | null
}

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ExpenseFormData) => void
  expense?: Tool | null
  isLoading?: boolean
  mode?: 'monthly' | 'yearly' | 'any'
}

export function ExpenseForm({
  open,
  onOpenChange,
  onSubmit,
  expense,
  isLoading = false,
  mode = 'any',
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    defaultValues: {
      name: '',
      cost_usd: 0,
      recurrence: mode === 'yearly' ? 'yearly' : 'monthly',
      due_month: null,
    },
  })

  const recurrence = useWatch({ control, name: 'recurrence' })
  const costUsd = useWatch({ control, name: 'cost_usd' })
  const dueMonth = useWatch({ control, name: 'due_month' })

  // Reset form when expense changes or modal opens
  useEffect(() => {
    if (open) {
      const defaultRecurrence = mode === 'yearly' ? 'yearly' : mode === 'monthly' ? 'monthly' : (expense?.recurrence || 'monthly')
      reset({
        name: expense?.name || '',
        cost_usd: expense?.cost_usd || 0,
        recurrence: defaultRecurrence,
        due_month: expense?.due_month || null,
      })
    }
  }, [open, expense, reset, mode])

  const handleFormSubmit = (data: ExpenseFormData) => {
    onSubmit(data)
  }

  const getTitle = () => {
    if (expense) {
      return recurrence === 'yearly' ? 'Edit Yearly Expense' : 'Edit Monthly Expense'
    }
    if (mode === 'yearly') return 'Add Yearly Expense'
    if (mode === 'monthly') return 'Add Monthly Expense'
    return 'Add Expense'
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{getTitle()}</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 px-6 pb-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Expense Name
            </label>
            <Input
              id="name"
              placeholder="e.g., ChatGPT, Hosting, Domain"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="cost_usd" className="block text-sm font-medium text-gray-700 mb-1">
              {recurrence === 'yearly' ? 'Annual Cost (USD)' : 'Monthly Cost (USD)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="cost_usd"
                type="number"
                step="0.01"
                min="0"
                className="pl-7"
                placeholder="0.00"
                {...register('cost_usd', {
                  required: 'Cost is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Cost must be positive' },
                })}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.value = ''
                  }
                }}
              />
            </div>
            {errors.cost_usd && (
              <p className="text-sm text-red-500 mt-1">{errors.cost_usd.message}</p>
            )}
            {recurrence === 'yearly' && (
              <p className="text-xs text-gray-500 mt-1">
                Monthly impact: ${((costUsd || 0) / 12).toFixed(2)}/mo (amortized)
              </p>
            )}
          </div>

          {/* Recurrence toggle - only show in 'any' mode */}
          {mode === 'any' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recurrence
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="monthly"
                    {...register('recurrence')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Monthly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="yearly"
                    {...register('recurrence')}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Yearly</span>
                </label>
              </div>
            </div>
          )}

          {/* Due month selector - only show for yearly expenses */}
          {recurrence === 'yearly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Month
              </label>
              <Select
                value={dueMonth?.toString() || ''}
                onValueChange={(value) => setValue('due_month', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month when payment is due" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.due_month && (
                <p className="text-sm text-red-500 mt-1">{errors.due_month.message}</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : expense ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
