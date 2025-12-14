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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
import { useFilterStore } from '../../stores/filterStore'

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

// Validation schema
const dividendSchema = z.object({
  month: z.number().min(1).max(12),
  amount: z.number({ message: 'Amount is required' }).min(0.01, 'Amount must be greater than 0'),
})

type DividendFormValues = z.infer<typeof dividendSchema>

interface DividendFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: DividendFormValues) => void
  companyName: string
  isLoading?: boolean
}

export function DividendForm({
  open,
  onOpenChange,
  onSubmit,
  companyName,
  isLoading,
}: DividendFormProps) {
  const { year } = useFilterStore()
  const currentMonth = new Date().getMonth() + 1

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DividendFormValues>({
    resolver: zodResolver(dividendSchema),
    defaultValues: {
      month: currentMonth,
      amount: 0,
    },
  })

  const selectedMonth = watch('month')

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        month: currentMonth,
        amount: 0,
      })
    }
  }, [open, currentMonth, reset])

  const handleFormSubmit = (data: DividendFormValues) => {
    onSubmit(data)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>Add Dividend</ModalTitle>
            <ModalDescription>
              Record a dividend payment from {companyName} for {year}.
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Month</label>
              <Select
                value={selectedMonth?.toString()}
                onValueChange={(v) => setValue('month', parseInt(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.month && (
                <p className="text-sm text-danger">{errors.month.message}</p>
              )}
            </div>

            <Input
              label="Dividend Amount (BDT)"
              type="number"
              step="0.01"
              placeholder="e.g., 5000"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
            />
          </ModalBody>

          <ModalFooter className="gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Add Dividend
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
