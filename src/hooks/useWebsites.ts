import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'
import type { Website, WebsiteFormData } from '../types'

// Query keys
export const websiteKeys = {
  all: ['websites'] as const,
  lists: () => [...websiteKeys.all, 'list'] as const,
  list: (userId: string, year: number) => [...websiteKeys.lists(), userId, year] as const,
  details: () => [...websiteKeys.all, 'detail'] as const,
  detail: (id: string) => [...websiteKeys.details(), id] as const,
}

// Fetch all websites for current user and selected year
export function useWebsites() {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: websiteKeys.list(user?.id ?? '', selectedYear),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Website[]
    },
    enabled: !!user?.id,
  })
}

// Fetch single website by ID
export function useWebsite(id: string | undefined) {
  return useQuery({
    queryKey: websiteKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Website ID required')

      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Website
    },
    enabled: !!id,
  })
}

// Create website mutation
export function useCreateWebsite() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async (data: WebsiteFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: website, error } = await supabase
        .from('websites')
        .insert({
          user_id: user.id,
          name: data.name,
          url: data.url || null,
          year: selectedYear,
        })
        .select()
        .single()

      if (error) throw error
      return website as Website
    },
    onSuccess: () => {
      // Invalidate websites list to refetch
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() })
    },
  })
}

// Update website mutation
export function useUpdateWebsite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WebsiteFormData }) => {
      const { data: website, error } = await supabase
        .from('websites')
        .update({
          name: data.name,
          url: data.url || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return website as Website
    },
    onSuccess: (website) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: websiteKeys.detail(website.id) })
    },
  })
}

// Delete website mutation
export function useDeleteWebsite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      // Invalidate list and remove detail from cache
      queryClient.invalidateQueries({ queryKey: websiteKeys.lists() })
      queryClient.removeQueries({ queryKey: websiteKeys.detail(id) })
    },
  })
}
