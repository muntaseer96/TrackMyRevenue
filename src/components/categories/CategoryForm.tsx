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
import { Input, Label } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Category } from '../../types'

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  type: z.enum(['revenue', 'expense'], { message: 'Please select a type' }),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CategoryFormValues) => void
  category?: Category | null
  defaultType?: 'revenue' | 'expense'
  isLoading?: boolean
}

export function CategoryForm({
  open,
  onOpenChange,
  onSubmit,
  category,
  defaultType = 'revenue',
  isLoading,
}: CategoryFormProps) {
  const isEditing = !!category

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: defaultType,
    },
  })

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? '',
        type: (category?.type as 'revenue' | 'expense') ?? defaultType,
      })
    }
  }, [open, category, defaultType, reset])

  const handleFormSubmit = (data: CategoryFormValues) => {
    onSubmit(data)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>
              {isEditing ? 'Edit Category' : 'Add New Category'}
            </ModalTitle>
            <ModalDescription>
              {isEditing
                ? 'Update the details of this category.'
                : 'Add a new revenue or expense category for this website.'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <Input
              label="Category Name"
              placeholder="e.g., AdSense, Hosting Costs"
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="space-y-2">
              <Label>Category Type</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="revenue"
                    className="w-4 h-4 text-primary focus:ring-primary"
                    {...register('type')}
                  />
                  <span className="text-sm font-medium text-green-700">Revenue</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="expense"
                    className="w-4 h-4 text-danger focus:ring-danger"
                    {...register('type')}
                  />
                  <span className="text-sm font-medium text-red-700">Expense</span>
                </label>
              </div>
              {errors.type && (
                <p className="text-sm text-danger">{errors.type.message}</p>
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
              {isEditing ? 'Save Changes' : 'Add Category'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
