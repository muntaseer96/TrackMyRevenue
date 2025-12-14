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
import type { Investment } from '../../types'

// Validation schema
const investmentSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(100, 'Name too long'),
  principal_amount: z.number({ message: 'Amount is required' }).min(0, 'Amount must be positive'),
  notes: z.string().max(500, 'Notes too long').optional(),
})

type InvestmentFormValues = z.infer<typeof investmentSchema>

interface InvestmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: InvestmentFormValues) => void
  investment?: Investment | null
  isLoading?: boolean
}

export function InvestmentForm({
  open,
  onOpenChange,
  onSubmit,
  investment,
  isLoading,
}: InvestmentFormProps) {
  const isEditing = !!investment

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      company_name: '',
      principal_amount: 0,
      notes: '',
    },
  })

  // Reset form when modal opens/closes or investment changes
  useEffect(() => {
    if (open) {
      reset({
        company_name: investment?.company_name ?? '',
        principal_amount: investment?.principal_amount ?? 0,
        notes: investment?.notes ?? '',
      })
    }
  }, [open, investment, reset])

  const handleFormSubmit = (data: InvestmentFormValues) => {
    onSubmit(data)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>
              {isEditing ? 'Edit Investment' : 'Add New Investment'}
            </ModalTitle>
            <ModalDescription>
              {isEditing
                ? 'Update the details of this investment.'
                : 'Add a new investment to track its principal and dividends.'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <Input
              label="Company Name"
              placeholder="e.g., Beximco Pharma, Square Pharma"
              error={errors.company_name?.message}
              {...register('company_name')}
            />

            <Input
              label="Principal Amount (BDT)"
              type="number"
              step="0.01"
              placeholder="e.g., 100000"
              error={errors.principal_amount?.message}
              {...register('principal_amount', { valueAsNumber: true })}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                rows={3}
                placeholder="Any additional notes about this investment..."
                {...register('notes')}
              />
              {errors.notes && (
                <p className="text-sm text-danger">{errors.notes.message}</p>
              )}
            </div>
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
              {isEditing ? 'Save Changes' : 'Add Investment'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
