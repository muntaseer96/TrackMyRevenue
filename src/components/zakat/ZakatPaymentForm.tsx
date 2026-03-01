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
import type { ZakatPayment } from '../../types'

const schema = z.object({
  amount: z.number({ message: 'Required' }).min(1, 'Must be greater than 0'),
  payment_date: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface ZakatPaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: FormValues) => void
  payment?: ZakatPayment | null
  isLoading?: boolean
}

export function ZakatPaymentForm({ open, onOpenChange, onSubmit, payment, isLoading }: ZakatPaymentFormProps) {
  const isEditing = !!payment

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      payment_date: '',
      note: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        amount: payment?.amount ?? 0,
        payment_date: payment?.payment_date ?? new Date().toISOString().split('T')[0],
        note: payment?.note ?? '',
      })
    }
  }, [open, payment, reset])

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <ModalTitle>{isEditing ? 'Edit Payment' : 'Record Zakat Payment'}</ModalTitle>
            <ModalDescription>
              {isEditing ? 'Update this payment record.' : 'Record a Zakat payment you have made.'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <Input
              label="Amount (BDT)"
              type="number"
              step="0.01"
              placeholder="e.g., 25000"
              error={errors.amount?.message}
              {...register('amount', { valueAsNumber: true })}
            />

            <Input
              label="Payment Date"
              type="date"
              {...register('payment_date')}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Note (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                rows={2}
                placeholder="e.g., Paid to local mosque"
                {...register('note')}
              />
            </div>
          </ModalBody>

          <ModalFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {isEditing ? 'Update' : 'Record Payment'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
