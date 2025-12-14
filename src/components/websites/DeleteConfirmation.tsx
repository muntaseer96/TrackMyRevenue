import { AlertTriangle } from 'lucide-react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '../ui/Modal'
import { Button } from '../ui/Button'

interface DeleteConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description?: string
  isLoading?: boolean
}

export function DeleteConfirmation({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  isLoading,
}: DeleteConfirmationProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <ModalTitle>{title}</ModalTitle>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <ModalDescription className="text-gray-600">
            {description ||
              'This action cannot be undone. All associated data will be permanently deleted.'}
          </ModalDescription>

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> Deleting this item will also remove all
              related monthly entries and category associations.
            </p>
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
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={isLoading}
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
