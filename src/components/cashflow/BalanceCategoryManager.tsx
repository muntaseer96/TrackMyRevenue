import { useState } from 'react'
import { Plus, Edit2, Trash2, Layers } from 'lucide-react'
import { Button } from '../ui/Button'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
} from '../ui/Modal'
import { BalanceCategoryForm } from './BalanceCategoryForm'
import {
  useBalanceCategories,
  useCreateBalanceCategory,
  useUpdateBalanceCategory,
  useDeleteBalanceCategory,
} from '../../hooks/useCashflow'
import type { BalanceCategory, BalanceCategoryFormData, PersonalAccount } from '../../types'

interface BalanceCategoryManagerProps {
  isOpen: boolean
  onClose: () => void
  account: PersonalAccount
}

export function BalanceCategoryManager({
  isOpen,
  onClose,
  account,
}: BalanceCategoryManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BalanceCategory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<BalanceCategory | null>(null)

  const { data: categories, isLoading } = useBalanceCategories(account.id)
  const createMutation = useCreateBalanceCategory()
  const updateMutation = useUpdateBalanceCategory()
  const deleteMutation = useDeleteBalanceCategory()

  const handleFormSubmit = async (data: BalanceCategoryFormData) => {
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          data,
        })
      } else {
        await createMutation.mutateAsync({
          accountId: account.id,
          data,
        })
      }
      setIsFormOpen(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Failed to save balance category:', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete balance category:', error)
    }
  }

  const openEditForm = (category: BalanceCategory) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const openAddForm = () => {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Modal open={isOpen} onOpenChange={onClose}>
        <ModalContent className="max-w-lg">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: account.color }}
              />
              Balance Categories - {account.name}
            </ModalTitle>
          </ModalHeader>

          <ModalBody>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !categories || categories.length === 0 ? (
              <div className="text-center py-8">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  No balance categories
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create balance categories to track sub-balances within this account
                </p>
                <Button onClick={openAddForm} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Balance Category
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          Initial: ৳{formatCurrency(category.initial_balance)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(category)}
                        aria-label="Edit balance category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(category)}
                        aria-label="Delete balance category"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            {categories && categories.length > 0 && (
              <Button onClick={openAddForm} variant="secondary">
                <Plus className="w-4 h-4 mr-1" />
                Add Category
              </Button>
            )}
            <Button onClick={onClose}>Done</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add/Edit Form Modal */}
      <BalanceCategoryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingCategory(null)
        }}
        onSubmit={handleFormSubmit}
        balanceCategory={editingCategory}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Delete Balance Category</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
              Transactions tagged to this category will become untagged.
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
    </>
  )
}
