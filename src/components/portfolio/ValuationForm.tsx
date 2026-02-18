import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../ui/Select'
import { useFilterStore } from '../../stores/filterStore'
import type { Asset } from '../../types'

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
}))

const valuationSchema = z.object({
  year: z.number().min(2020).max(2100),
  month: z.number().min(1).max(12),
  value: z.number({ message: 'Value is required' }).min(0),
})

type ValuationFormValues = z.infer<typeof valuationSchema>

interface ValuationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ValuationFormValues) => void
  asset: Asset | null
  isLoading?: boolean
}

export function ValuationForm({ open, onOpenChange, onSubmit, asset, isLoading }: ValuationFormProps) {
  const { year } = useFilterStore()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      year,
      month: new Date().getMonth() + 1,
      value: 0,
    },
  })

  useEffect(() => {
    if (open && asset) {
      reset({
        year,
        month: new Date().getMonth() + 1,
        value: asset.current_value,
      })
    }
  }, [open, asset, year, reset])

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <ModalTitle>Update Value</ModalTitle>
            <ModalDescription>
              {asset ? `Update the current market value of ${asset.name}` : 'Update asset value'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Year"
                type="number"
                error={errors.year?.message}
                {...register('year', { valueAsNumber: true })}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Month</label>
                <Select
                  value={String(useWatch({ control, name: 'month' }) || 1)}
                  onValueChange={(val) => setValue('month', parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Input
              label={`Market Value (${asset?.currency ?? 'BDT'})`}
              type="number"
              step="0.01"
              error={errors.value?.message}
              {...register('value', { valueAsNumber: true })}
            />
          </ModalBody>

          <ModalFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              Update Value
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
