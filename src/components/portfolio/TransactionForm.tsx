import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../ui/Select'
import { useFilterStore } from '../../stores/filterStore'
import type { Asset, AssetTransactionType } from '../../types'

const TXN_TYPES: { value: AssetTransactionType; label: string }[] = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'interest', label: 'Interest' },
  { value: 'rental_income', label: 'Rental Income' },
  { value: 'other_income', label: 'Other Income' },
]

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
}))

const txnSchema = z.object({
  transaction_type: z.string().min(1, 'Type is required'),
  year: z.number().min(2020).max(2100),
  month: z.number().min(1).max(12),
  day: z.number().min(1).max(31).optional().nullable(),
  amount: z.number({ message: 'Amount is required' }).min(0.01, 'Amount must be positive'),
  quantity: z.number().optional().nullable(),
  price_per_unit: z.number().optional().nullable(),
  fees: z.number().min(0).optional(),
  notes: z.string().max(200).optional().nullable(),
})

type TxnFormValues = z.infer<typeof txnSchema>

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TxnFormValues) => void
  asset: Asset | null
  isLoading?: boolean
}

export function TransactionForm({ open, onOpenChange, onSubmit, asset, isLoading }: TransactionFormProps) {
  const { year } = useFilterStore()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TxnFormValues>({
    resolver: zodResolver(txnSchema),
    defaultValues: {
      transaction_type: 'dividend',
      year,
      month: new Date().getMonth() + 1,
      amount: 0,
      fees: 0,
    },
  })

  const txnType = useWatch({ control, name: 'transaction_type' })
  const showQuantityFields = txnType === 'buy' || txnType === 'sell'

  useEffect(() => {
    if (open) {
      reset({
        transaction_type: 'dividend',
        year,
        month: new Date().getMonth() + 1,
        amount: 0,
        fees: 0,
        quantity: null,
        price_per_unit: null,
        notes: '',
      })
    }
  }, [open, year, reset])

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <ModalTitle>Add Transaction</ModalTitle>
            <ModalDescription>
              {asset ? `Record a transaction for ${asset.name}` : 'Record a new transaction'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            {/* Transaction Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Transaction Type</label>
              <Select
                value={txnType}
                onValueChange={(val) => setValue('transaction_type', val)}
              >
                <SelectTrigger error={!!errors.transaction_type}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TXN_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year + Month + Day */}
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Year"
                type="number"
                error={errors.year?.message}
                {...register('year', { valueAsNumber: true })}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Month</label>
                <Select
                  value={String(useWatch({ control, name: 'month' }) || 1)}
                  onValueChange={(val) => setValue('month', parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                label="Day (Optional)"
                type="number"
                min={1}
                max={31}
                {...register('day', { valueAsNumber: true })}
              />
            </div>

            {/* Amount */}
            <Input
              label={`Amount (${asset?.currency ?? 'BDT'})`}
              type="number"
              step="0.01"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
            />

            {/* Conditional: Quantity + Price per unit for buy/sell */}
            {showQuantityFields && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  step="0.001"
                  {...register('quantity', { valueAsNumber: true })}
                />
                <Input
                  label="Price per Unit"
                  type="number"
                  step="0.01"
                  {...register('price_per_unit', { valueAsNumber: true })}
                />
              </div>
            )}

            {/* Fees */}
            <Input
              label="Fees (Optional)"
              type="number"
              step="0.01"
              {...register('fees', { valueAsNumber: true })}
            />

            {/* Notes */}
            <Input
              label="Notes (Optional)"
              placeholder="Any notes..."
              {...register('notes')}
            />
          </ModalBody>

          <ModalFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Add Transaction
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
