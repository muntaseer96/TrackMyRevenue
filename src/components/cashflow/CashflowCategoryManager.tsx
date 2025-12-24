import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
} from '../ui/Modal'
import {
  usePersonalCategories,
  useCreatePersonalCategory,
  useUpdatePersonalCategory,
  useDeletePersonalCategory,
  useSeedDefaultCategories,
} from '../../hooks/useCashflow'
import type { PersonalCategory } from '../../types'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['income', 'expense']),
})

type CategoryFormData = z.infer<typeof categorySchema>

export function CashflowCategoryManager() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<PersonalCategory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<PersonalCategory | null>(null)

  const { data: categories, isLoading } = usePersonalCategories()
  const createMutation = useCreatePersonalCategory()
  const updateMutation = useUpdatePersonalCategory()
  const deleteMutation = useDeletePersonalCategory()
  const seedMutation = useSeedDefaultCategories()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
    },
  })

  const selectedType = watch('type')

  // Seed default categories on first load if none exist
  useEffect(() => {
    if (categories && categories.length === 0 && !seedMutation.isPending && !seedMutation.isSuccess) {
      seedMutation.mutate()
    }
  }, [categories, seedMutation.isPending, seedMutation.isSuccess])

  useEffect(() => {
    if (isFormOpen) {
      if (editingCategory) {
        reset({
          name: editingCategory.name,
          type: editingCategory.type,
        })
      } else {
        reset({
          name: '',
          type: 'expense',
        })
      }
    }
  }, [isFormOpen, editingCategory, reset])

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          data: {
            name: data.name,
            type: data.type,
          },
        })
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          type: data.type,
        })
      }
      setIsFormOpen(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Failed to save category:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const openEditForm = (category: PersonalCategory) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const openAddForm = () => {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  // Separate categories by type
  const incomeCategories = categories?.filter(c => c.type === 'income') || []
  const expenseCategories = categories?.filter(c => c.type === 'expense') || []

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Categories</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-24 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-10 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
        <Button onClick={openAddForm}>
          <Plus className="w-4 h-4 mr-1" />
          Add Category
        </Button>
      </div>

      {(!categories || categories.length === 0) ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No categories yet</h3>
          <p className="text-gray-500 mb-4">Add categories to organize your transactions</p>
          <Button onClick={openAddForm}>
            <Plus className="w-4 h-4 mr-1" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Categories */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-green-600 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Income Categories ({incomeCategories.length})
            </h3>
            {incomeCategories.length === 0 ? (
              <p className="text-sm text-gray-500">No income categories</p>
            ) : (
              <ul className="space-y-2">
                {incomeCategories.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group"
                  >
                    <span className="text-sm text-gray-700">{category.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(category)}
                        aria-label="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(category)}
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-medium text-red-600 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Expense Categories ({expenseCategories.length})
            </h3>
            {expenseCategories.length === 0 ? (
              <p className="text-sm text-gray-500">No expense categories</p>
            ) : (
              <ul className="space-y-2">
                {expenseCategories.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group"
                  >
                    <span className="text-sm text-gray-700">{category.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(category)}
                        aria-label="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(category)}
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <Modal open={isFormOpen} onOpenChange={() => setIsFormOpen(false)}>
        <ModalContent>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <ModalHeader>
              <ModalTitle>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </ModalTitle>
            </ModalHeader>

            <ModalBody className="space-y-4">
              <Input
                label="Category Name"
                placeholder="e.g., Groceries, Salary"
                error={errors.name?.message}
                {...register('name')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('type', 'income')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedType === 'income'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('type', 'expense')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedType === 'expense'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? 'Save Changes' : 'Add Category'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Category</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
              Transactions using this category will become uncategorized.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
