import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import type { ZakatYear } from '../../types'

const NISAB_GOLD_GRAMS = 87.48

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const schema = z.object({
  gold_price_per_gram: z.number({ message: 'Required' }).min(1, 'Must be greater than 0'),
  calculation_month: z.number().min(1).max(12),
  payoneer_balance: z.number().min(0),
  paypal_balance: z.number().min(0),
  exchange_rate: z.number().min(1, 'Must be greater than 0'),
  notes: z.string().max(500).optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface ZakatYearSetupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { gold_price_per_gram: number; calculation_month: number; payoneer_balance: number; paypal_balance: number; exchange_rate: number; notes?: string | null }) => void
  year: number
  existing?: ZakatYear | null
  isLoading?: boolean
}

export function ZakatYearSetup({ open, onOpenChange, onSubmit, year, existing, isLoading }: ZakatYearSetupProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      gold_price_per_gram: 0,
      calculation_month: 3,
      payoneer_balance: 0,
      paypal_balance: 0,
      exchange_rate: 123,
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        gold_price_per_gram: existing?.gold_price_per_gram ?? 0,
        calculation_month: existing?.calculation_month ?? 3,
        payoneer_balance: existing?.payoneer_balance ?? 0,
        paypal_balance: existing?.paypal_balance ?? 0,
        exchange_rate: existing?.exchange_rate ?? 123,
        notes: existing?.notes ?? '',
      })
    }
  }, [open, existing, reset])

  const goldPrice = watch('gold_price_per_gram')
  const selectedMonth = watch('calculation_month')
  const calculatedNisab = (goldPrice || 0) * NISAB_GOLD_GRAMS

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <ModalTitle>{existing ? 'Edit' : 'Setup'} Zakat for {year}</ModalTitle>
            <ModalDescription>
              Configure gold price and the month to calculate your wealth snapshot.
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            {/* Calculation Month */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Calculation Month</label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(val) => setValue('calculation_month', Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((name, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Cash wealth will be calculated using this month's ending balances.
              </p>
            </div>

            <Input
              label="Gold Price per Gram (BDT)"
              type="number"
              step="0.01"
              placeholder="e.g., 10500"
              error={errors.gold_price_per_gram?.message}
              {...register('gold_price_per_gram', { valueAsNumber: true })}
            />

            {/* Nisab preview */}
            {goldPrice > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Nisab Threshold:</span>{' '}
                  ৳{calculatedNisab.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {NISAB_GOLD_GRAMS}g gold x ৳{goldPrice.toLocaleString('en-IN')} per gram
                </p>
              </div>
            )}

            <Input
              label="USD to BDT Exchange Rate"
              type="number"
              step="0.01"
              placeholder="e.g., 123"
              error={errors.exchange_rate?.message}
              {...register('exchange_rate', { valueAsNumber: true })}
            />

            {/* External wallet balances (USD) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">External Wallet Balances (USD)</label>
              <p className="text-xs text-gray-500">
                Enter balances in USD — converted at the rate above.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Payoneer"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={errors.payoneer_balance?.message}
                  {...register('payoneer_balance', { valueAsNumber: true })}
                />
                <Input
                  label="PayPal"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={errors.paypal_balance?.message}
                  {...register('paypal_balance', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                rows={2}
                placeholder="Any notes for this year..."
                {...register('notes')}
              />
            </div>
          </ModalBody>

          <ModalFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {existing ? 'Update' : 'Save'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
