import { useState, useEffect } from 'react'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { WebsiteList } from '../components/websites/WebsiteList'
import { WebsiteForm } from '../components/websites/WebsiteForm'
import { DeleteConfirmation } from '../components/websites/DeleteConfirmation'
import {
  useWebsites,
  useCreateWebsite,
  useUpdateWebsite,
  useDeleteWebsite,
} from '../hooks/useWebsites'
import type { Website, WebsiteFormData } from '../types'
import { Plus } from 'lucide-react'

export function Websites() {
  // Debug: Track mount/unmount
  useEffect(() => {
    console.log('[Websites] MOUNTED at:', new Date().toISOString())
    return () => console.log('[Websites] UNMOUNTED at:', new Date().toISOString())
  }, [])
  // State for modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null)

  // Query and mutations
  const { data: websites = [], isLoading } = useWebsites()
  const createMutation = useCreateWebsite()
  const updateMutation = useUpdateWebsite()
  const deleteMutation = useDeleteWebsite()

  // Handlers
  const handleAddNew = () => {
    setSelectedWebsite(null)
    setIsFormOpen(true)
  }

  const handleEdit = (website: Website) => {
    setSelectedWebsite(website)
    setIsFormOpen(true)
  }

  const handleDelete = (website: Website) => {
    setSelectedWebsite(website)
    setIsDeleteOpen(true)
  }

  const handleFormSubmit = async (data: WebsiteFormData) => {
    try {
      if (selectedWebsite) {
        // Update existing
        await updateMutation.mutateAsync({
          id: selectedWebsite.id,
          data,
        })
      } else {
        // Create new
        await createMutation.mutateAsync(data)
      }
      setIsFormOpen(false)
      setSelectedWebsite(null)
    } catch (error) {
      console.error('Failed to save website:', error)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedWebsite) return

    try {
      await deleteMutation.mutateAsync(selectedWebsite.id)
      setIsDeleteOpen(false)
      setSelectedWebsite(null)
    } catch (error) {
      console.error('Failed to delete website:', error)
    }
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <Header
        title="My Websites"
        action={
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Button>
        }
      />

      <div className="p-6">
        <WebsiteList
          websites={websites}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Create/Edit Form Modal */}
      <WebsiteForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedWebsite(null)
        }}
        onSubmit={handleFormSubmit}
        website={selectedWebsite}
        isLoading={isFormLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) setSelectedWebsite(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${selectedWebsite?.name}"?`}
        description={`Are you sure you want to delete ${selectedWebsite?.name}? This will permanently remove all monthly entries and category associations for this website.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
