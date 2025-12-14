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
import type { Website } from '../../types'

// Validation schema
const websiteSchema = z.object({
  name: z.string().min(1, 'Website name is required').max(100, 'Name too long'),
  url: z.string().url('Invalid URL format').optional().or(z.literal('')),
})

type WebsiteFormData = z.infer<typeof websiteSchema>

interface WebsiteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: WebsiteFormData) => void
  website?: Website | null // If provided, we're editing
  isLoading?: boolean
}

export function WebsiteForm({
  open,
  onOpenChange,
  onSubmit,
  website,
  isLoading,
}: WebsiteFormProps) {
  const isEditing = !!website

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebsiteFormData>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      name: '',
      url: '',
    },
  })

  // Reset form when modal opens/closes or website changes
  useEffect(() => {
    if (open) {
      reset({
        name: website?.name ?? '',
        url: website?.url ?? '',
      })
    }
  }, [open, website, reset])

  const handleFormSubmit = (data: WebsiteFormData) => {
    onSubmit({
      name: data.name,
      url: data.url || undefined,
    })
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <ModalHeader>
            <ModalTitle>
              {isEditing ? 'Edit Website' : 'Add New Website'}
            </ModalTitle>
            <ModalDescription>
              {isEditing
                ? 'Update the details of your website/income source.'
                : 'Add a new website or income source to track.'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <Input
              label="Website Name"
              placeholder="e.g., The Turtle Hub"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="URL (optional)"
              placeholder="e.g., https://theturtlehub.com"
              error={errors.url?.message}
              {...register('url')}
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
              {isEditing ? 'Save Changes' : 'Add Website'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
