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
import type { Asset, AssetType } from '../../types'

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'bd_stock', label: 'BD Stock' },
  { value: 'intl_stock', label: 'Intl Stock' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
  { value: 'gold', label: 'Gold' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'bond', label: 'Bond' },
  { value: 'other', label: 'Other' },
]

const assetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  asset_type: z.string().min(1, 'Type is required'),
  currency: z.string().min(1),
  purchase_date: z.string().optional().nullable(),
  purchase_price: z.number({ message: 'Required' }).min(0),
  current_value: z.number({ message: 'Required' }).min(0),
  has_transactions: z.boolean(),
  notes: z.string().max(500).optional().nullable(),
  quantity: z.number().optional().nullable(),
  ticker: z.string().max(20).optional().nullable(),
  area_sqft: z.number().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  interest_rate: z.number().optional().nullable(),
  maturity_date: z.string().optional().nullable(),
  institution: z.string().max(100).optional().nullable(),
})

type AssetFormValues = z.infer<typeof assetSchema>

interface AssetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AssetFormValues) => void
  asset?: Asset | null
  isLoading?: boolean
}

export function AssetForm({ open, onOpenChange, onSubmit, asset, isLoading }: AssetFormProps) {
  const isEditing = !!asset

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: '',
      asset_type: 'bd_stock',
      currency: 'BDT',
      purchase_price: 0,
      current_value: 0,
      has_transactions: false,
    },
  })

  const assetType = useWatch({ control, name: 'asset_type' })
  const purchasePrice = useWatch({ control, name: 'purchase_price' })

  useEffect(() => {
    if (open) {
      reset({
        name: asset?.name ?? '',
        asset_type: asset?.asset_type ?? 'bd_stock',
        currency: asset?.currency ?? 'BDT',
        purchase_date: asset?.purchase_date ?? '',
        purchase_price: asset?.purchase_price ?? 0,
        current_value: asset?.current_value ?? 0,
        has_transactions: asset?.has_transactions ?? false,
        notes: asset?.notes ?? '',
        quantity: asset?.quantity ?? null,
        ticker: asset?.ticker ?? '',
        area_sqft: asset?.area_sqft ?? null,
        location: asset?.location ?? '',
        interest_rate: asset?.interest_rate ?? null,
        maturity_date: asset?.maturity_date ?? '',
        institution: asset?.institution ?? '',
      })
    }
  }, [open, asset, reset])

  // Auto-sync current_value to purchase_price for new assets
  useEffect(() => {
    if (!isEditing && purchasePrice > 0) {
      setValue('current_value', purchasePrice)
    }
  }, [purchasePrice, isEditing, setValue])

  const showStockFields = assetType === 'bd_stock' || assetType === 'intl_stock' || assetType === 'crypto'
  const showRealEstateFields = assetType === 'real_estate'
  const showFDFields = assetType === 'fixed_deposit' || assetType === 'bond'

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>
            <ModalTitle>{isEditing ? 'Edit Asset' : 'Add New Asset'}</ModalTitle>
            <ModalDescription>
              {isEditing ? 'Update the details of this asset.' : 'Add a new asset to your portfolio.'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Name */}
            <Input
              label="Asset Name"
              placeholder="e.g., Grameenphone, Uttara Plot"
              error={errors.name?.message}
              {...register('name')}
            />

            {/* Type & Currency row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Type</label>
                <Select
                  value={assetType}
                  onValueChange={(val) => setValue('asset_type', val)}
                >
                  <SelectTrigger error={!!errors.asset_type}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Currency</label>
                <Select
                  value={useWatch({ control, name: 'currency' }) || 'BDT'}
                  onValueChange={(val) => setValue('currency', val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BDT">BDT</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Purchase Price & Current Value */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Purchase Price (Total)"
                type="number"
                step="0.01"
                error={errors.purchase_price?.message}
                {...register('purchase_price', { valueAsNumber: true })}
              />
              <Input
                label="Current Value"
                type="number"
                step="0.01"
                error={errors.current_value?.message}
                {...register('current_value', { valueAsNumber: true })}
              />
            </div>

            {/* Purchase Date */}
            <Input
              label="Purchase Date (Optional)"
              type="date"
              {...register('purchase_date')}
            />

            {/* Conditional: Stock/Crypto fields */}
            {showStockFields && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ticker / Symbol"
                  placeholder="e.g., GP, AAPL"
                  {...register('ticker')}
                />
                <Input
                  label="Quantity"
                  type="number"
                  step="any"
                  placeholder="Shares/Units"
                  {...register('quantity', { valueAsNumber: true })}
                />
              </div>
            )}

            {/* Conditional: Real Estate fields */}
            {showRealEstateFields && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Location"
                  placeholder="e.g., Uttara, Dhaka"
                  {...register('location')}
                />
                <Input
                  label="Area (sqft)"
                  type="number"
                  {...register('area_sqft', { valueAsNumber: true })}
                />
              </div>
            )}

            {/* Conditional: FD/Bond fields */}
            {showFDFields && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Interest Rate (%)"
                    type="number"
                    step="0.01"
                    {...register('interest_rate', { valueAsNumber: true })}
                  />
                  <Input
                    label="Maturity Date"
                    type="date"
                    {...register('maturity_date')}
                  />
                </div>
                <Input
                  label="Institution / Issuer"
                  placeholder="e.g., Dutch Bangla Bank"
                  {...register('institution')}
                />
              </>
            )}

            {/* Transaction tracking toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                {...register('has_transactions')}
              />
              <span className="text-sm text-gray-700">Enable transaction tracking (buy/sell/income)</span>
            </label>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                rows={2}
                placeholder="Any notes about this asset..."
                {...register('notes')}
              />
            </div>
          </ModalBody>

          <ModalFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" loading={isLoading}>
              {isEditing ? 'Save Changes' : 'Add Asset'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
