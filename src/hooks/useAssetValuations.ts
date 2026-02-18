import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { assetKeys } from './useAssets'
import type { AssetValuation, AssetValuationFormData } from '../types'

export const assetValuationKeys = {
  all: ['assetValuations'] as const,
  byAsset: (assetId: string) => [...assetValuationKeys.all, 'asset', assetId] as const,
}

export function useAssetValuations(assetId: string | undefined) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: assetValuationKeys.byAsset(assetId ?? ''),
    queryFn: async () => {
      if (!user?.id || !assetId) throw new Error('Missing required params')

      const { data, error } = await supabase
        .from('asset_valuations')
        .select('*')
        .eq('user_id', user.id)
        .eq('asset_id', assetId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (error) throw error
      return data as AssetValuation[]
    },
    enabled: !!user?.id && !!assetId,
  })
}

export function useUpsertAssetValuation() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: AssetValuationFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Check if entry already exists for this asset/year/month
      const { data: existing, error: fetchError } = await supabase
        .from('asset_valuations')
        .select('id')
        .eq('user_id', user.id)
        .eq('asset_id', data.asset_id)
        .eq('year', data.year)
        .eq('month', data.month)
        .maybeSingle()

      if (fetchError) throw fetchError

      let valuation: AssetValuation

      if (existing) {
        const { data: updated, error } = await supabase
          .from('asset_valuations')
          .update({ value: data.value })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        valuation = updated as AssetValuation
      } else {
        const { data: created, error } = await supabase
          .from('asset_valuations')
          .insert({
            user_id: user.id,
            asset_id: data.asset_id,
            year: data.year,
            month: data.month,
            value: data.value,
          })
          .select()
          .single()

        if (error) throw error
        valuation = created as AssetValuation
      }

      // Also update the parent asset's current_value
      await supabase
        .from('assets')
        .update({
          current_value: data.value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.asset_id)

      return valuation
    },
    onSuccess: (valuation) => {
      queryClient.invalidateQueries({ queryKey: assetValuationKeys.byAsset(valuation.asset_id) })
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(valuation.asset_id) })
    },
  })
}

export function useDeleteAssetValuation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, assetId }: { id: string; assetId: string }) => {
      const { error } = await supabase
        .from('asset_valuations')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, assetId }
    },
    onSuccess: ({ assetId }) => {
      queryClient.invalidateQueries({ queryKey: assetValuationKeys.byAsset(assetId) })
    },
  })
}
