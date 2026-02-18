import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Asset, AssetFormData, AssetType } from '../types'

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (userId: string, assetType?: AssetType) => [...assetKeys.lists(), userId, assetType] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
}

export function useAssets(assetType?: AssetType) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: assetKeys.list(user?.id ?? '', assetType),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      let query = supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (assetType) {
        query = query.eq('asset_type', assetType)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Asset[]
    },
    enabled: !!user?.id,
  })
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: assetKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Asset ID required')

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Asset
    },
    enabled: !!id,
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: AssetFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          user_id: user.id,
          name: data.name,
          asset_type: data.asset_type,
          currency: data.currency,
          purchase_date: data.purchase_date || null,
          purchase_price: data.purchase_price,
          current_value: data.current_value,
          has_transactions: data.has_transactions,
          notes: data.notes || null,
          quantity: data.quantity ?? null,
          ticker: data.ticker || null,
          area_sqft: data.area_sqft ?? null,
          location: data.location || null,
          interest_rate: data.interest_rate ?? null,
          maturity_date: data.maturity_date || null,
          institution: data.institution || null,
        })
        .select()
        .single()

      if (error) throw error
      return asset as Asset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
    },
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AssetFormData> }) => {
      const { data: asset, error } = await supabase
        .from('assets')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return asset as Asset
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(asset.id) })
    },
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      queryClient.removeQueries({ queryKey: assetKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
