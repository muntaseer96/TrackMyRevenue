import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface StockPriceResult {
  ticker: string
  requestedDate: string
  // The actual trading day the price is from (may be earlier than requestedDate
  // if the market was closed on the requested date).
  priceDate: string
  close: number
  currency: 'USD'
}

export const stockPriceKeys = {
  all: ['stockPrice'] as const,
  byTickerDate: (ticker: string, date: string) =>
    [...stockPriceKeys.all, ticker.toUpperCase(), date] as const,
}

/**
 * Fetch the historical daily closing price for a ticker on (or just before) a
 * date, via the `stock-price` Supabase edge function. Results are cached
 * permanently per (ticker, date) — historical prices never change.
 */
export function useStockPrice(
  ticker: string | null | undefined,
  date: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: stockPriceKeys.byTickerDate(ticker ?? '', date ?? ''),
    queryFn: async (): Promise<StockPriceResult> => {
      const { data, error } = await supabase.functions.invoke('stock-price', {
        body: { ticker, date },
      })

      if (error) {
        // Edge function returned a non-2xx — try to surface its JSON message.
        let message = error.message
        try {
          const ctx = (error as { context?: Response }).context
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json()
            if (body?.message) message = body.message
          }
        } catch {
          /* ignore parse errors, fall back to error.message */
        }
        throw new Error(message)
      }

      if (data?.error) {
        throw new Error(data.message || data.error)
      }

      return data as StockPriceResult
    },
    enabled: enabled && !!ticker && !!date,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })
}
