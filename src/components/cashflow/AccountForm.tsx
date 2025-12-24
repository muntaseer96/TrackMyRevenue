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
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { PersonalAccount } from '../../types'

const COLORS = [
  '#5A8C27', // Primary Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EF4444', // Red
  '#6366F1', // Indigo
]

const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  color: z.string().optional(),
})

type AccountFormData = z.infer<typeof accountSchema>

interface AccountFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AccountFormData) => void
  account?: PersonalAccount | null
  isLoading?: boolean
}

export function AccountForm({
  isOpen,
  onClose,
  onSubmit,
  account,
  isLoading = false,
}: AccountFormProps) {
  const isEditing = !!account

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      color: COLORS[0],
    },
  })

  const selectedColor = watch('color')

  useEffect(() => {
    if (isOpen) {
      if (account) {
        reset({
          name: account.name,
          color: account.color || COLORS[0],
        })
      } else {
        reset({
          name: '',
          color: COLORS[0],
        })
      }
    }
  }, [isOpen, account, reset])

  const handleFormSubmit = (data: AccountFormData) => {
    onSubmit(data)
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>{isEditing ? 'Edit Account' : 'Add Account'}</ModalTitle>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <Input
              label="Account Name"
              placeholder="e.g., Personal Bank, Business Bank"
              error={errors.name?.message}
              {...register('name')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color
                        ? 'border-gray-900 scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {isEditing ? 'Save Changes' : 'Add Account'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
