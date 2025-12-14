import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'
import type { Category, CategoryFormData } from '../types'

// Query keys
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  listAll: (userId: string, year: number) => [...categoryKeys.lists(), 'all', userId, year] as const,
  listByWebsite: (websiteId: string) => [...categoryKeys.lists(), websiteId] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

// Fetch all categories for current user and selected year
export function useAllCategories() {
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useQuery({
    queryKey: categoryKeys.listAll(user?.id ?? '', selectedYear),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .order('website_id', { ascending: true })
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return data as Category[]
    },
    enabled: !!user?.id,
  })
}

// Fetch categories for a specific website
export function useCategoriesByWebsite(websiteId: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.listByWebsite(websiteId ?? ''),
    queryFn: async () => {
      if (!websiteId) throw new Error('Website ID required')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('website_id', websiteId)
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return data as Category[]
    },
    enabled: !!websiteId,
  })
}

// Fetch single category by ID
export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) throw new Error('Category ID required')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Category
    },
    enabled: !!id,
  })
}

// Create category mutation
export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { selectedYear } = useYearStore()

  return useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          website_id: data.website_id,
          name: data.name,
          type: data.type,
          year: selectedYear,
        })
        .select()
        .single()

      if (error) throw error
      return category as Category
    },
    onSuccess: (category) => {
      // Invalidate categories lists
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      if (category.website_id) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.listByWebsite(category.website_id) })
      }
    },
  })
}

// Update category mutation
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      const { data: category, error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          type: data.type,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return category as Category
    },
    onSuccess: (category) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      if (category.website_id) {
        queryClient.invalidateQueries({ queryKey: categoryKeys.listByWebsite(category.website_id) })
      }
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(category.id) })
    },
  })
}

// Delete category mutation
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, websiteId }: { id: string; websiteId: string }) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, websiteId }
    },
    onSuccess: ({ id, websiteId }) => {
      // Invalidate list and remove detail from cache
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.listByWebsite(websiteId) })
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) })
    },
  })
}
