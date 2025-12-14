import { useState } from 'react'
import { Calendar, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select'
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
import { useYearStore } from '../../stores/yearStore'
import { useUserYears, useCreateYear, useUpdateSelectedYear } from '../../hooks/useYears'

export function YearSelector() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { selectedYear, availableYears } = useYearStore()

  // Fetch years from database
  useUserYears()

  const createYearMutation = useCreateYear()
  const updateSelectedYearMutation = useUpdateSelectedYear()

  const handleYearChange = (value: string) => {
    if (value === 'add-new') {
      setIsModalOpen(true)
    } else {
      const year = parseInt(value, 10)
      updateSelectedYearMutation.mutate(year)
    }
  }

  const handleCreateYear = async () => {
    const newYear = Math.max(...availableYears) + 1
    try {
      await createYearMutation.mutateAsync(newYear)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to create year:', error)
    }
  }

  const nextYear = Math.max(...availableYears) + 1
  const previousYear = Math.max(...availableYears)

  return (
    <>
      <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[130px] bg-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <SelectValue placeholder="Select year" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {availableYears.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
          <div className="border-t border-gray-200 mt-1 pt-1">
            <SelectItem value="add-new" className="text-primary font-medium">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add {nextYear}
              </div>
            </SelectItem>
          </div>
        </SelectContent>
      </Select>

      {/* Create Year Confirmation Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Create {nextYear}?</ModalTitle>
            <ModalDescription>
              This will copy all websites and categories from {previousYear} to {nextYear}.
            </ModalDescription>
          </ModalHeader>

          <ModalBody>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>What happens:</strong>
              </p>
              <ul className="text-sm text-blue-600 mt-1 list-disc list-inside">
                <li>All your websites will be copied to {nextYear}</li>
                <li>All categories for each website will be copied</li>
                <li>Monthly financial data starts fresh at ৳0</li>
                <li>You can edit {nextYear} independently from {previousYear}</li>
              </ul>
            </div>
          </ModalBody>

          <ModalFooter className="gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={createYearMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateYear}
              loading={createYearMutation.isPending}
            >
              Create {nextYear}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
