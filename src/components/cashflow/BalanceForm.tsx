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
  ModalDescription,
} from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { AccountSummary } from '../../types'

const balanceSchema = z.object({
  beginning_balance: z.number(),
})

type BalanceFormData = z.infer<typeof balanceSchema>

interface BalanceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BalanceFormData) => void
  account: AccountSummary | null
  year: number
  month: number
  isLoading?: boolean
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function BalanceForm({
  isOpen,
  onClose,
  onSubmit,
  account,
  year,
  month,
  isLoading = false,
}: BalanceFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BalanceFormData>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      beginning_balance: 0,
    },
  })

  useEffect(() => {
    if (isOpen && account) {
      reset({
        beginning_balance: account.beginning_balance,
      })
    }
  }, [isOpen, account, reset])

  const handleFormSubmit = (data: BalanceFormData) => {
    onSubmit(data)
  }

  if (!account) return null

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>Set Beginning Balance</ModalTitle>
            <ModalDescription>
              Set the beginning balance for <strong>{account.name}</strong> for {MONTHS[month - 1]} {year}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <Input
              type="number"
              label="Beginning Balance (BDT)"
              placeholder="e.g., 50000"
              step="0.01"
              error={errors.beginning_balance?.message}
              {...register('beginning_balance', { valueAsNumber: true })}
            />

            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p>
                This is the balance at the <strong>start</strong> of the month, before any
                transactions.
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Save Balance
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
