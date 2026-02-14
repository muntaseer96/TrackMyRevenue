import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
} from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import type {
  PersonalAccount,
  PersonalCategory,
  PersonalTransactionWithCategory,
  BalanceCategory,
} from '../../types'

const transactionSchema = z.object({
  account_id: z.string().min(1, 'Account is required'),
  category_id: z.string().optional(),
  balance_category_id: z.string().optional(),
  day: z.number().min(1).max(31),
  amount: z.number().refine((val) => val !== 0, 'Amount cannot be zero'),
  note: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionFormData) => void
  transaction?: PersonalTransactionWithCategory | null
  accounts: PersonalAccount[]
  categories: PersonalCategory[]
  balanceCategories?: BalanceCategory[]
  defaultAccountId?: string
  lastTransactionDay?: number | null
  currentMonth: number
  currentYear: number
  isLoading?: boolean
}

export function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  accounts,
  categories,
  balanceCategories = [],
  defaultAccountId,
  lastTransactionDay,
  currentMonth,
  currentYear,
  isLoading = false,
}: TransactionFormProps) {
  const isEditing = !!transaction

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      account_id: defaultAccountId || '',
      category_id: '',
      balance_category_id: '',
      day: new Date().getDate(),
      amount: undefined as unknown as number,
      note: '',
    },
  })

  const selectedCategoryId = watch('category_id')
  const selectedAccountId = watch('account_id')
  const selectedBalanceCategoryId = watch('balance_category_id')
  const watchedAmount = watch('amount')

  // Filter balance categories for the selected account
  const accountBalanceCategories = balanceCategories.filter(
    bc => bc.account_id === selectedAccountId
  )

  // Get the number of days in the current month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)

  // Watch the day value to display day of week
  const selectedDay = watch('day')

  // Get day of week name
  const getDayOfWeekName = (day: number) => {
    if (!day || day < 1 || day > daysInMonth) return ''
    const date = new Date(currentYear, currentMonth - 1, day)
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  const dayOfWeekName = getDayOfWeekName(selectedDay)

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        reset({
          account_id: transaction.account_id,
          category_id: transaction.category_id || '',
          balance_category_id: transaction.balance_category_id || '',
          day: transaction.day,
          amount: transaction.amount,
          note: transaction.note || '',
        })
      } else {
        const defaultDay = lastTransactionDay
          ? Math.min(lastTransactionDay, daysInMonth)
          : Math.min(new Date().getDate(), daysInMonth)
        reset({
          account_id: defaultAccountId || accounts[0]?.id || '',
          category_id: '',
          balance_category_id: '',
          day: defaultDay,
          amount: undefined as unknown as number,
          note: '',
        })
      }
    }
  }, [isOpen, transaction, defaultAccountId, accounts, reset, daysInMonth, lastTransactionDay])

  // Clear balance category when account changes (if the category doesn't belong to new account)
  useEffect(() => {
    if (selectedBalanceCategoryId && selectedBalanceCategoryId !== 'none') {
      const categoryBelongsToAccount = balanceCategories.some(
        bc => bc.id === selectedBalanceCategoryId && bc.account_id === selectedAccountId
      )
      if (!categoryBelongsToAccount) {
        setValue('balance_category_id', '')
      }
    }
  }, [selectedAccountId, selectedBalanceCategoryId, balanceCategories, setValue])

  const handleFormSubmit = (data: TransactionFormData) => {
    onSubmit(data)
  }

  // Separate categories by type
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  // Determine which category type to show based on amount
  const amountType = watchedAmount > 0 ? 'income' : watchedAmount < 0 ? 'expense' : null
  const filteredCategories = amountType === 'income'
    ? incomeCategories
    : amountType === 'expense'
      ? expenseCategories
      : categories

  // Clear category if amount sign changes and selected category doesn't match
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== 'none' && amountType) {
      const selectedCategory = categories.find(c => c.id === selectedCategoryId)
      if (selectedCategory && selectedCategory.type !== amountType) {
        setValue('category_id', '')
      }
    }
  }, [amountType, selectedCategoryId, categories, setValue])

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</ModalTitle>
          </ModalHeader>

          <ModalBody className="space-y-4">
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account
              </label>
              <Select
                value={selectedAccountId}
                onValueChange={(value) => setValue('account_id', value)}
              >
                <SelectTrigger error={!!errors.account_id}>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: account.color }}
                        />
                        {account.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.account_id && (
                <p className="text-sm text-red-500 mt-1">{errors.account_id.message}</p>
              )}
            </div>

            {/* Day and Amount - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Day"
                min={1}
                max={daysInMonth}
                error={errors.day?.message}
                hint={dayOfWeekName}
                {...register('day', { valueAsNumber: true })}
              />
              <Input
                type="number"
                label="Amount"
                placeholder="Positive for income, negative for expense"
                step="0.01"
                error={errors.amount?.message}
                hint="Use negative for expenses (e.g., -5000)"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (Optional)
                {amountType && (
                  <span className={`ml-2 text-xs ${amountType === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    — showing {amountType} categories
                  </span>
                )}
              </label>
              <Select
                value={selectedCategoryId || 'none'}
                onValueChange={(value) => setValue('category_id', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {/* Show filtered categories based on amount, or all if no amount entered */}
                  {amountType ? (
                    // Show only relevant category type
                    filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    // Show all categories grouped when no amount entered
                    <>
                      {incomeCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-green-600 bg-green-50">
                            Income
                          </div>
                          {incomeCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {expenseCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-red-600 bg-red-50">
                            Expense
                          </div>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Balance Category Selection - Only show if account has balance categories */}
            {accountBalanceCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Balance Category (Optional)
                </label>
                <Select
                  value={selectedBalanceCategoryId || 'none'}
                  onValueChange={(value) => setValue('balance_category_id', value === 'none' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select balance category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {accountBalanceCategories.map((bc) => (
                      <SelectItem key={bc.id} value={bc.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: bc.color }}
                          />
                          {bc.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Tag this transaction to a balance category for sub-balance tracking
                </p>
              </div>
            )}

            {/* Note */}
            <Textarea
              label="Note (Optional)"
              placeholder="e.g., Grocery shopping, Salary, etc."
              {...register('note')}
            />
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
