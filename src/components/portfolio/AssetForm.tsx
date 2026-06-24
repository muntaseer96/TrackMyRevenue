import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  Globe,
  TrendingUp,
  Home,
  Landmark,
  Coins,
  Bitcoin,
  FileText,
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react'
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
import { TickerAutocomplete } from './TickerAutocomplete'
import { useStockPrice } from '../../hooks/useStockPrice'
import { DEFAULT_EXCHANGE_RATE } from '../../hooks/useExchangeRates'
import { formatUSD, formatBDT } from '../../utils/formatCurrency'
import { ASSET_TYPE_LABELS } from '../../types'
import type { Asset, AssetType } from '../../types'

const TYPE_CARDS: { type: AssetType; label: string; icon: typeof Globe; color: string }[] = [
  { type: 'intl_stock', label: 'Intl Stock', icon: Globe, color: '#ec4899' },
  { type: 'bd_stock', label: 'BD Stock', icon: TrendingUp, color: '#3b82f6' },
  { type: 'crypto', label: 'Crypto', icon: Bitcoin, color: '#8b5cf6' },
  { type: 'real_estate', label: 'Real Estate', icon: Home, color: '#f59e0b' },
  { type: 'fixed_deposit', label: 'Fixed Deposit', icon: Landmark, color: '#10b981' },
  { type: 'gold', label: 'Gold', icon: Coins, color: '#eab308' },
  { type: 'bond', label: 'Bond', icon: FileText, color: '#06b6d4' },
  { type: 'other', label: 'Other', icon: Package, color: '#6b7280' },
]

const assetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  asset_type: z.string().min(1, 'Type is required'),
  currency: z.string().min(1),
  purchase_date: z.string().optional().nullable(),
  purchase_price: z.number({ message: 'Required' }).min(0),
  current_value: z.number({ message: 'Required' }).min(0),
  has_transactions: z.boolean(),
  is_zakatable: z.boolean(),
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

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AssetForm({ open, onOpenChange, onSubmit, asset, isLoading }: AssetFormProps) {
  const isEditing = !!asset

  // Two-step flow: pick a type, then fill the type-specific form.
  const [step, setStep] = useState<'type' | 'form'>('type')

  // Simplified intl-stock/crypto entry state.
  const [inputMode, setInputMode] = useState<'shares' | 'amount'>('shares')
  const [rawInput, setRawInput] = useState('')
  const [dirty, setDirty] = useState(false)

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
      asset_type: 'intl_stock',
      currency: 'BDT',
      purchase_price: 0,
      current_value: 0,
      has_transactions: false,
      is_zakatable: true,
    },
  })

  const assetType = useWatch({ control, name: 'asset_type' }) as AssetType
  const purchasePrice = useWatch({ control, name: 'purchase_price' })
  const currentValue = useWatch({ control, name: 'current_value' })
  const quantity = useWatch({ control, name: 'quantity' })
  const tickerValue = useWatch({ control, name: 'ticker' })
  const purchaseDate = useWatch({ control, name: 'purchase_date' })
  const isZakatable = useWatch({ control, name: 'is_zakatable' })
  const currencyValue = useWatch({ control, name: 'currency' })

  const isStock = assetType === 'intl_stock' || assetType === 'crypto'

  useEffect(() => {
    if (open) {
      reset({
        name: asset?.name ?? '',
        asset_type: asset?.asset_type ?? 'intl_stock',
        currency: asset?.currency ?? 'BDT',
        purchase_date: asset?.purchase_date ?? '',
        purchase_price: asset?.purchase_price ?? 0,
        current_value: asset?.current_value ?? 0,
        has_transactions: asset?.has_transactions ?? false,
        is_zakatable: asset?.is_zakatable !== false,
        notes: asset?.notes ?? '',
        quantity: asset?.quantity ?? null,
        ticker: asset?.ticker ?? '',
        area_sqft: asset?.area_sqft ?? null,
        location: asset?.location ?? '',
        interest_rate: asset?.interest_rate ?? null,
        maturity_date: asset?.maturity_date ?? '',
        institution: asset?.institution ?? '',
      })
      // Editing jumps straight to the form; adding starts at the type picker.
      setStep(isEditing ? 'form' : 'type')
      setInputMode('shares')
      setRawInput(asset?.quantity != null ? String(asset.quantity) : '')
      setDirty(false)
    }
  }, [open, asset, isEditing, reset])

  // --- Auto-pricing for intl stock / crypto -------------------------------
  const ticker = (tickerValue ?? '').trim() || null
  const today = todayStr()

  const histPrice = useStockPrice(
    ticker,
    purchaseDate || null,
    open && isStock && !!ticker && !!purchaseDate,
  )
  const curPrice = useStockPrice(ticker, today, open && isStock && !!ticker)

  const histClose = histPrice.data?.close ?? 0
  const curClose = curPrice.data?.close ?? histClose

  // Recompute quantity / cost / value from the user's shares-or-amount input.
  // Only when "dirty" so editing an existing asset doesn't clobber stored values.
  useEffect(() => {
    if (!isStock || !dirty) return
    const n = Number(rawInput)
    let q = 0
    let cost = 0
    if (rawInput !== '' && !Number.isNaN(n)) {
      if (inputMode === 'shares') {
        q = n
        cost = histClose > 0 ? n * histClose : 0
      } else {
        cost = n
        q = histClose > 0 ? n / histClose : 0
      }
    }
    const val = q * curClose
    setValue('quantity', q || null)
    setValue('purchase_price', Math.round(cost * 100) / 100)
    setValue('current_value', Math.round(val * 100) / 100)
    setValue('currency', 'USD')
    setValue('has_transactions', true)
  }, [isStock, dirty, rawInput, inputMode, histClose, curClose, setValue])

  // Auto-sync current_value to purchase_price for new NON-stock assets.
  useEffect(() => {
    if (!isEditing && !isStock && purchasePrice > 0) {
      setValue('current_value', purchasePrice)
    }
  }, [purchasePrice, isEditing, isStock, setValue])

  const chooseType = (type: AssetType) => {
    setValue('asset_type', type)
    if (type === 'intl_stock' || type === 'crypto') {
      setValue('currency', 'USD')
      setValue('has_transactions', true)
    }
    setStep('form')
  }

  const showBDStockFields = assetType === 'bd_stock'
  const showRealEstateFields = assetType === 'real_estate'
  const showFDFields = assetType === 'fixed_deposit' || assetType === 'bond'

  // Submit guard for the simplified stock form.
  const stockReady = isStock ? Number(quantity) > 0 && Number(purchasePrice) > 0 : true

  const gain = (Number(currentValue) || 0) - (Number(purchasePrice) || 0)
  const gainPct = Number(purchasePrice) > 0 ? (gain / Number(purchasePrice)) * 100 : 0

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-lg">
        {step === 'type' ? (
          <>
            <ModalHeader>
              <ModalTitle>Add New Asset</ModalTitle>
              <ModalDescription>Choose the type of asset you want to add.</ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TYPE_CARDS.map((c) => {
                  const Icon = c.icon
                  return (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => chooseType(c.type)}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${c.color}1a`, color: c.color }}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-sm font-medium text-gray-700">{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setStep('type')}
                    className="p-1 -ml-1 rounded hover:bg-gray-100 text-gray-500"
                    aria-label="Back to asset types"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <ModalTitle>
                  {isEditing ? 'Edit' : 'Add'} {ASSET_TYPE_LABELS[assetType]}
                </ModalTitle>
              </div>
              <ModalDescription>
                {isStock
                  ? 'Search the ticker, then enter your shares or amount — cost and value are calculated automatically.'
                  : isEditing
                    ? 'Update the details of this asset.'
                    : 'Enter the details of this asset.'}
              </ModalDescription>
            </ModalHeader>

            <ModalBody className="space-y-4 max-h-[60vh] overflow-y-auto">
              {isStock ? (
                /* ---------- Simplified Intl Stock / Crypto body ---------- */
                <>
                  <TickerAutocomplete
                    label="Ticker / Symbol"
                    value={tickerValue ?? ''}
                    onChange={(v) => {
                      setValue('ticker', v)
                      setDirty(true)
                    }}
                    onSelect={(r) => {
                      setValue('ticker', r.symbol)
                      setValue('name', r.name)
                      setDirty(true)
                    }}
                  />

                  <Input
                    label="Asset Name"
                    placeholder="Filled from the ticker"
                    error={errors.name?.message}
                    {...register('name')}
                  />

                  <Input
                    label="Purchase Date"
                    type="date"
                    max={today}
                    {...register('purchase_date', {
                      onChange: () => setDirty(true),
                    })}
                  />

                  {/* Shares / Amount toggle */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Enter by</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['shares', 'amount'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setInputMode(m)
                            setRawInput('')
                            setDirty(true)
                          }}
                          className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                            inputMode === m
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {m === 'shares' ? 'Shares' : 'Amount ($)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label={inputMode === 'shares' ? 'Number of shares' : 'Amount invested (USD)'}
                    type="number"
                    step="any"
                    min={0}
                    placeholder={inputMode === 'shares' ? 'e.g. 1.5' : 'e.g. 100'}
                    value={rawInput}
                    onChange={(e) => {
                      setRawInput(e.target.value)
                      setDirty(true)
                    }}
                  />

                  {/* Price / preview */}
                  {!ticker ? (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>Search and pick a ticker above to auto-fetch prices.</span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm space-y-1.5">
                      {histPrice.isFetching && (
                        <p className="flex items-center gap-1.5 text-gray-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching price for {purchaseDate || '…'}
                        </p>
                      )}
                      {histPrice.error && !histPrice.isFetching && (
                        <p className="flex items-center gap-1.5 text-red-600 text-xs">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Couldn't fetch the purchase-date price.
                        </p>
                      )}
                      {histClose > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            Bought {Number(quantity) ? Number(quantity).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '—'}{' '}
                            @ {formatUSD(histClose)}
                            {histPrice.data && histPrice.data.priceDate !== purchaseDate && (
                              <span className="text-amber-600"> ({histPrice.data.priceDate})</span>
                            )}
                          </span>
                          <span className="font-semibold text-gray-900">{formatUSD(Number(purchasePrice) || 0)}</span>
                        </div>
                      )}
                      {curClose > 0 && Number(currentValue) > 0 && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Now @ {formatUSD(curClose)}/sh</span>
                            <span className="font-semibold text-gray-900">{formatUSD(Number(currentValue))}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">≈ {formatBDT(Number(currentValue) * DEFAULT_EXCHANGE_RATE)}</span>
                            <span className={gain >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {gain >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Zakat toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={isZakatable !== false}
                      onChange={(e) => setValue('is_zakatable', e.target.checked)}
                    />
                    <span className="text-sm text-gray-700">Include in Zakat calculation</span>
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
                </>
              ) : (
                /* ---------- Generic body (all other types) ---------- */
                <>
                  <Input
                    label="Asset Name"
                    placeholder="e.g., Grameenphone, Uttara Plot"
                    error={errors.name?.message}
                    {...register('name')}
                  />

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Currency</label>
                    <Select
                      value={currencyValue || 'BDT'}
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

                  <Input
                    label="Purchase Date (Optional)"
                    type="date"
                    {...register('purchase_date')}
                  />

                  {showBDStockFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Ticker / Symbol" placeholder="e.g., GP" {...register('ticker')} />
                      <Input
                        label="Quantity"
                        type="number"
                        step="any"
                        placeholder="Shares/Units"
                        {...register('quantity', { valueAsNumber: true })}
                      />
                    </div>
                  )}

                  {showRealEstateFields && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Location" placeholder="e.g., Uttara, Dhaka" {...register('location')} />
                      <Input label="Area (sqft)" type="number" {...register('area_sqft', { valueAsNumber: true })} />
                    </div>
                  )}

                  {showFDFields && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Interest Rate (%)"
                          type="number"
                          step="0.01"
                          {...register('interest_rate', { valueAsNumber: true })}
                        />
                        <Input label="Maturity Date" type="date" {...register('maturity_date')} />
                      </div>
                      <Input label="Institution / Issuer" placeholder="e.g., Dutch Bangla Bank" {...register('institution')} />
                    </>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      {...register('has_transactions')}
                    />
                    <span className="text-sm text-gray-700">Enable transaction tracking (buy/sell/income)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      {...register('is_zakatable')}
                    />
                    <span className="text-sm text-gray-700">Include in Zakat calculation</span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                      rows={2}
                      placeholder="Any notes about this asset..."
                      {...register('notes')}
                    />
                  </div>
                </>
              )}
            </ModalBody>

            <ModalFooter className="gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" loading={isLoading} disabled={!stockReady}>
                {isEditing ? 'Save Changes' : 'Add Asset'}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  )
}
