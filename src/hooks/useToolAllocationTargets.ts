import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'
import { expenseKeys } from './useExpenses'
import { dashboardKeys } from './useDashboardStats'
import { websiteStatsKeys } from './useWebsiteStats'
import type { ToolAllocationTarget } from '../types'

export const allocationTargetKeys = {
  all: ['toolAllocationTargets'] as const,
  list: (userId: string) => [...allocationTargetKeys.all, userId] as const,
}

export function useToolAllocationTargets() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: allocationTargetKeys.list(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('tool_allocation_targets')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      return data as ToolAllocationTarget[]
    },
    enabled: !!user?.id,
  })
}

/**
 * Sets which websites a shared expense is split across.
 *
 * An expense is stored as one row per month, so tagging a single row would
 * leave the other eleven months split across everybody. This applies the
 * choice to every row with the same name in the same year, which is how the
 * expense reads on screen — one subscription, not twelve.
 *
 * An empty websiteIds list clears the targets, putting the expense back to
 * being shared by every revenue-earning site.
 */
export function useSetToolAllocationTargets() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async ({ name, websiteIds }: { name: string; websiteIds: string[] }) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: siblings, error: siblingError } = await supabase
        .from('tools')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .eq('name', name)
        .is('website_id', null)

      if (siblingError) throw siblingError

      const toolIds = (siblings ?? []).map(t => t.id)
      if (toolIds.length === 0) return

      const { error: deleteError } = await supabase
        .from('tool_allocation_targets')
        .delete()
        .in('tool_id', toolIds)

      if (deleteError) throw deleteError

      if (websiteIds.length === 0) return

      const rows = toolIds.flatMap(toolId =>
        websiteIds.map(websiteId => ({
          user_id: user.id,
          tool_id: toolId,
          website_id: websiteId,
        }))
      )

      const { error: insertError } = await supabase
        .from('tool_allocation_targets')
        .insert(rows)

      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: allocationTargetKeys.all })
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
      queryClient.invalidateQueries({ queryKey: websiteStatsKeys.all })
    },
  })
}
