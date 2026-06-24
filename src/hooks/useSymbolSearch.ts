import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface SymbolResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

export const symbolSearchKeys = {
  all: ['symbolSearch'] as const,
  byQuery: (q: string) => [...symbolSearchKeys.all, q.toLowerCase()] as const,
}

/**
 * Search stock/ETF/crypto symbols via the `symbol-search` edge function.
 * Pass an already-debounced query string. Results cached per query.
 */
export function useSymbolSearch(query: string, enabled = true) {
  const q = query.trim()

  return useQuery({
    queryKey: symbolSearchKeys.byQuery(q),
    queryFn: async (): Promise<SymbolResult[]> => {
      const { data, error } = await supabase.functions.invoke('symbol-search', {
        body: { query: q },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.message || data.error)
      return (data?.results ?? []) as SymbolResult[]
    },
    enabled: enabled && q.length >= 1,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
