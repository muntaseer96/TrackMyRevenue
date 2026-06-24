import { useEffect, useState } from 'react'
import { Loader2, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react'
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
import { useStockPrice } from '../../hooks/useStockPrice'
import { DEFAULT_EXCHANGE_RATE } from '../../hooks/useExchangeRates'
import { formatUSD, formatBDT } from '../../utils/formatCurrency'
import type { Asset, AssetTransactionFormData } from '../../types'

interface IntlStockTransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<AssetTransactionFormData, 'asset_id'>) => void
  asset: Asset | null
  isLoading?: boolean
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function IntlStockTransactionForm({
  open,
  onOpenChange,
  onSubmit,
  asset,
  isLoading,
}: IntlStockTransactionFormProps) {
  const [date, setDate] = useState(todayStr())
  const [totalShares, setTotalShares] = useState<string>('')
  const [priceInput, setPriceInput] = useState<string>('')
  const [priceTouched, setPriceTouched] = useState(false)
  const [note, setNote] = useState('')

  const currentQty = asset?.quantity ?? 0
  const ticker = asset?.ticker?.trim() || null

  // Fetch the historical price for the chosen date.
  const {
    data: priceData,
    isFetching: priceLoading,
    error: priceError,
    refetch,
  } = useStockPrice(ticker, date, open && !!ticker)

  // Reset all state whenever the modal (re)opens.
  useEffect(() => {
    if (open) {
      setDate(todayStr())
      setTotalShares('')
      setPriceInput('')
      setPriceTouched(false)
      setNote('')
    }
  }, [open])

  // When a fresh price arrives and the user hasn't manually edited it, fill it in.
  useEffect(() => {
    if (priceData && !priceTouched) {
      setPriceInput(String(priceData.close))
    }
  }, [priceData, priceTouched])

  // Changing the date means a new lookup — let the next fetched price populate.
  const handleDateChange = (value: string) => {
    setDate(value)
    setPriceTouched(false)
  }

  const newTotal = totalShares === '' ? null : Number(totalShares)
  const delta = newTotal === null ? 0 : newTotal - currentQty
  const absDelta = Math.abs(delta)
  const price = priceInput === '' ? 0 : Number(priceInput)
  const amount = absDelta * price
  const isBuy = delta > 0
  const isSell = delta < 0
  const amountBDT = amount * DEFAULT_EXCHANGE_RATE

  const canSubmit =
    newTotal !== null &&
    newTotal >= 0 &&
    !Number.isNaN(newTotal) &&
    absDelta > 0 &&
    price > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const [y, m, d] = date.split('-').map(Number)
    const action = isBuy ? 'Bought' : 'Sold'
    const autoNote = `${action} ${absDelta} share${absDelta === 1 ? '' : 's'} @ ${formatUSD(price)}` +
      (priceData && priceData.priceDate !== date ? ` (price from ${priceData.priceDate})` : '') +
      ` — new total ${newTotal}`

    onSubmit({
      transaction_type: isBuy ? 'buy' : 'sell',
      year: y,
      month: m,
      day: d,
      amount,
      quantity: absDelta,
      price_per_unit: price,
      fees: 0,
      notes: note.trim() ? note.trim() : autoNote,
    })
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>Update Shares</ModalTitle>
            <ModalDescription>
              {asset
                ? `Enter the date and your new total share count for ${asset.name}${
                    ticker ? ` (${ticker})` : ''
                  }. The buy/sell amount and cost are calculated automatically.`
                : 'Update your share holding'}
            </ModalDescription>
          </ModalHeader>

          <ModalBody className="space-y-4">
            {/* Current holding */}
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Current holding:{' '}
              <span className="font-semibold text-gray-900">{currentQty}</span> shares
            </div>

            {/* No ticker warning */}
            {!ticker && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  No ticker set for this asset, so the price can't be auto-fetched. Add a
                  ticker via <strong>Edit Asset</strong>, or enter the price manually below.
                </span>
              </div>
            )}

            {/* Date */}
            <Input
              label="Date"
              type="date"
              max={todayStr()}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
            />

            {/* Total shares now held */}
            <Input
              label="Total shares you now hold"
              type="number"
              step="any"
              min={0}
              placeholder={`e.g. ${currentQty + 1}`}
              value={totalShares}
              onChange={(e) => setTotalShares(e.target.value)}
            />

            {/* Delta indicator */}
            {newTotal !== null && !Number.isNaN(newTotal) && (
              <div className="text-sm">
                {absDelta === 0 ? (
                  <span className="text-gray-500">No change from current holding.</span>
                ) : isBuy ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    Buying {absDelta} share{absDelta === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
                    <TrendingDown className="w-4 h-4" />
                    Selling {absDelta} share{absDelta === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            )}

            {/* Price per share (auto-fetched, editable) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Price per share (USD)
                </label>
                {ticker && (
                  <button
                    type="button"
                    onClick={() => {
                      setPriceTouched(false)
                      refetch()
                    }}
                    className="inline-flex items-center gap-1 text-xs text-link hover:underline"
                    disabled={priceLoading}
                  >
                    {priceLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Refetch
                  </button>
                )}
              </div>
              <Input
                type="number"
                step="any"
                min={0}
                placeholder={priceLoading ? 'Fetching price…' : 'Price per share'}
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value)
                  setPriceTouched(true)
                }}
              />
              {priceLoading && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching closing price for {date}…
                </p>
              )}
              {priceData && !priceLoading && (
                <p className="text-xs text-gray-500">
                  Auto-fetched close: {formatUSD(priceData.close)}
                  {priceData.priceDate !== date && (
                    <span className="text-amber-600">
                      {' '}
                      (market closed on {date}; using {priceData.priceDate})
                    </span>
                  )}
                </p>
              )}
              {priceError && !priceLoading && (
                <p className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  Couldn't fetch price ({(priceError as Error).message}). Enter it manually.
                </p>
              )}
            </div>

            {/* Computed amount */}
            {canSubmit && (
              <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {isSell ? 'Sale proceeds' : 'Purchase cost'}
                  </span>
                  <span className="font-semibold text-gray-900">{formatUSD(amount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>≈ in BDT (@ {DEFAULT_EXCHANGE_RATE})</span>
                  <span>{formatBDT(amountBDT)}</span>
                </div>
              </div>
            )}

            {/* Optional note */}
            <Input
              label="Note (Optional)"
              placeholder="Leave blank for an auto-generated note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
            <Button type="submit" loading={isLoading} disabled={!canSubmit}>
              {isSell ? 'Record Sale' : 'Record Purchase'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
