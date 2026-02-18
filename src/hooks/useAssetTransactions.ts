import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useFilterStore } from '../stores/filterStore'
import type { AssetTransaction, AssetTransactionFormData } from '../types'

export const assetTransactionKeys = {
  all: ['assetTransactions'] as const,
  lists: () => [...assetTransactionKeys.all, 'list'] as const,
  byAsset: (assetId: string) => [...assetTransactionKeys.all, 'asset', assetId] as const,
  allForDashboard: (userId: string, year: number, startMonth: number, endMonth: number) =>
    [...assetTransactionKeys.all, 'dashboard', userId, year, startMonth, endMonth] as const,
}

export function useAssetTransactions(assetId: string | undefined) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: assetTransactionKeys.byAsset(assetId ?? ''),
    queryFn: async () => {
      if (!user?.id || !assetId) throw new Error('Missing required params')

      const { data, error } = await supabase
        .from('asset_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_id', assetId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('day', { ascending: false })

      if (error) throw error
      return data as AssetTransaction[]
    },
    enabled: !!user?.id && !!assetId,
  })
}

export function useAllAssetTransactions() {
  const { user } = useAuthStore()
  const { year, startMonth, endMonth } = useFilterStore()

  return useQuery({
    queryKey: assetTransactionKeys.allForDashboard(user?.id ?? '', year, startMonth, endMonth),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('asset_transactions')
        .select('*, asset:assets(currency)')
        .eq('user_id', user.id)
        .eq('year', year)
        .gte('month', startMonth)
        .lte('month', endMonth)

      if (error) throw error
      return data as (AssetTransaction & { asset: { currency: string } })[]
    },
    enabled: !!user?.id,
  })
}

export function useCreateAssetTransaction() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: AssetTransactionFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: txn, error } = await supabase
        .from('asset_transactions')
        .insert({
          user_id: user.id,
          asset_id: data.asset_id,
          transaction_type: data.transaction_type,
          year: data.year,
          month: data.month,
          day: data.day ?? null,
          amount: data.amount,
          quantity: data.quantity ?? null,
          price_per_unit: data.price_per_unit ?? null,
          fees: data.fees ?? 0,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      // Auto-update asset's purchase_price and quantity on buy/sell
      if (data.transaction_type === 'buy' || data.transaction_type === 'sell') {
        const { data: asset } = await supabase
          .from('assets')
          .select('purchase_price, quantity')
          .eq('id', data.asset_id)
          .single()

        if (asset) {
          const currentCost = Number(asset.purchase_price) || 0
          const currentQty = Number(asset.quantity) || 0
          const txnQty = data.quantity || 0

          if (data.transaction_type === 'buy') {
            await supabase
              .from('assets')
              .update({
                purchase_price: currentCost + data.amount,
                quantity: currentQty + txnQty,
                updated_at: new Date().toISOString(),
              })
              .eq('id', data.asset_id)
          } else {
            // sell: reduce cost proportionally, reduce quantity
            const costPerUnit = currentQty > 0 ? currentCost / currentQty : 0
            const costReduction = costPerUnit * txnQty
            await supabase
              .from('assets')
              .update({
                purchase_price: Math.max(0, currentCost - costReduction),
                quantity: Math.max(0, currentQty - txnQty),
                updated_at: new Date().toISOString(),
              })
              .eq('id', data.asset_id)
          }
        }
      }

      return txn as AssetTransaction
    },
    onSuccess: (txn) => {
      queryClient.invalidateQueries({ queryKey: assetTransactionKeys.byAsset(txn.asset_id) })
      queryClient.invalidateQueries({ queryKey: assetTransactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateAssetTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AssetTransactionFormData> }) => {
      const { data: txn, error } = await supabase
        .from('asset_transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return txn as AssetTransaction
    },
    onSuccess: (txn) => {
      queryClient.invalidateQueries({ queryKey: assetTransactionKeys.byAsset(txn.asset_id) })
      queryClient.invalidateQueries({ queryKey: assetTransactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteAssetTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, assetId }: { id: string; assetId: string }) => {
      const { error } = await supabase
        .from('asset_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, assetId }
    },
    onSuccess: ({ assetId }) => {
      queryClient.invalidateQueries({ queryKey: assetTransactionKeys.byAsset(assetId) })
      queryClient.invalidateQueries({ queryKey: assetTransactionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
