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
import type { BalanceCategory } from '../../types'

const COLORS = [
  '#6366F1', // Indigo (default)
  '#5A8C27', // Primary Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EF4444', // Red
]

const balanceCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  initial_balance: z.number({ message: 'Initial balance is required' }),
  color: z.string().optional(),
})

type BalanceCategoryFormData = z.infer<typeof balanceCategorySchema>

interface BalanceCategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BalanceCategoryFormData) => void
  balanceCategory?: BalanceCategory | null
  isLoading?: boolean
}

export function BalanceCategoryForm({
  isOpen,
  onClose,
  onSubmit,
  balanceCategory,
  isLoading = false,
}: BalanceCategoryFormProps) {
  const isEditing = !!balanceCategory

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BalanceCategoryFormData>({
    resolver: zodResolver(balanceCategorySchema),
    defaultValues: {
      name: '',
      initial_balance: 0,
      color: COLORS[0],
    },
  })

  const selectedColor = watch('color')

  useEffect(() => {
    if (isOpen) {
      if (balanceCategory) {
        reset({
          name: balanceCategory.name,
          initial_balance: balanceCategory.initial_balance,
          color: balanceCategory.color || COLORS[0],
        })
      } else {
        reset({
          name: '',
          initial_balance: 0,
          color: COLORS[0],
        })
      }
    }
  }, [isOpen, balanceCategory, reset])

  const handleFormSubmit = (data: BalanceCategoryFormData) => {
    onSubmit(data)
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>
              {isEditing ? 'Edit Balance Category' : 'Add Balance Category'}
            </ModalTitle>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <Input
              label="Name"
              placeholder="e.g., InkSane Balance, Darul Kitab Balance"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              type="number"
              label="Initial Balance"
              placeholder="0"
              hint="The starting balance for this category"
              error={errors.initial_balance?.message}
              {...register('initial_balance', { valueAsNumber: true })}
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
              {isEditing ? 'Save Changes' : 'Add Category'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
