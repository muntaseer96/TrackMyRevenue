import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'
import { useFilterStore } from '../stores/filterStore'
import type { Profile } from '../types'

// Query keys
export const yearKeys = {
  all: ['years'] as const,
  profile: (userId: string) => [...yearKeys.all, 'profile', userId] as const,
}

// Fetch user's profile to get available years
export function useUserYears() {
  const { user } = useAuthStore()
  const { setAvailableYears, setSelectedYear, selectedYear } = useYearStore()
  const { setYear } = useFilterStore()

  const query = useQuery({
    queryKey: yearKeys.profile(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .select('available_years, selected_year')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data as Pick<Profile, 'available_years' | 'selected_year'>
    },
    enabled: !!user?.id,
  })

  // Sync available years from database to store
  useEffect(() => {
    if (query.data?.available_years) {
      setAvailableYears(query.data.available_years)
      // If stored selected year is not in available years, use the first available
      if (!query.data.available_years.includes(selectedYear)) {
        const newYear = query.data.available_years[0] ?? new Date().getFullYear()
        setSelectedYear(newYear)
        setYear(newYear) // Sync to filterStore
      } else {
        // Sync current selected year to filterStore on initial load
        setYear(selectedYear)
      }
    }
  }, [query.data, setAvailableYears, setSelectedYear, selectedYear, setYear])

  return query
}

// Create new year mutation (copies websites and categories from previous year)
export function useCreateYear() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { availableYears, addYear } = useYearStore()
  const { setYear } = useFilterStore()

  return useMutation({
    mutationFn: async (newYear: number) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Get the previous year (most recent available)
      const previousYear = Math.max(...availableYears.filter((y) => y < newYear))
      if (!previousYear || previousYear === -Infinity) {
        // No previous year, just add the new year to profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            available_years: [...availableYears, newYear].sort((a, b) => b - a),
            selected_year: newYear,
          })
          .eq('id', user.id)

        if (profileError) throw profileError
        return { newYear, copiedWebsites: 0, copiedCategories: 0 }
      }

      // 1. Get all websites from previous year
      const { data: previousWebsites, error: websitesError } = await supabase
        .from('websites')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', previousYear)

      if (websitesError) throw websitesError

      // 2. Create a mapping of old website IDs to new ones
      const websiteIdMap = new Map<string, string>()

      // 3. Copy websites to new year
      if (previousWebsites && previousWebsites.length > 0) {
        for (const website of previousWebsites) {
          const { data: newWebsite, error: insertError } = await supabase
            .from('websites')
            .insert({
              user_id: user.id,
              name: website.name,
              url: website.url,
              year: newYear,
            })
            .select()
            .single()

          if (insertError) throw insertError
          websiteIdMap.set(website.id, newWebsite.id)
        }
      }

      // 4. Get all categories from previous year
      const { data: previousCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', previousYear)

      if (categoriesError) throw categoriesError

      // 5. Copy categories to new year with updated website_id
      if (previousCategories && previousCategories.length > 0) {
        for (const category of previousCategories) {
          const newWebsiteId = category.website_id
            ? websiteIdMap.get(category.website_id)
            : null

          const { error: insertError } = await supabase.from('categories').insert({
            user_id: user.id,
            website_id: newWebsiteId,
            name: category.name,
            type: category.type,
            year: newYear,
          })

          if (insertError) throw insertError
        }
      }

      // 6. Assets persist across years (no copy needed)

      // 7. Get all yearly expenses (tools) from previous year
      const { data: previousYearlyExpenses, error: yearlyExpensesError } = await supabase
        .from('tools')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', previousYear)
        .eq('recurrence', 'yearly')

      if (yearlyExpensesError) throw yearlyExpensesError

      // 9. Copy yearly expenses to new year with updated website_id
      if (previousYearlyExpenses && previousYearlyExpenses.length > 0) {
        for (const expense of previousYearlyExpenses) {
          const newWebsiteId = expense.website_id
            ? websiteIdMap.get(expense.website_id) ?? null
            : null

          const { error: insertError } = await supabase.from('tools').insert({
            user_id: user.id,
            name: expense.name,
            year: newYear,
            month: expense.month,
            cost_usd: expense.cost_usd,
            exchange_rate: expense.exchange_rate,
            recurrence: 'yearly',
            due_month: expense.due_month,
            website_id: newWebsiteId,
            is_template: expense.is_template,
            is_allocated: expense.is_allocated ?? true,
          })

          if (insertError) throw insertError
        }
      }

      // 10. Update profile with new available year
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          available_years: [...availableYears, newYear].sort((a, b) => b - a),
          selected_year: newYear,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      return {
        newYear,
        copiedWebsites: previousWebsites?.length ?? 0,
        copiedCategories: previousCategories?.length ?? 0,
        copiedYearlyExpenses: previousYearlyExpenses?.length ?? 0,
      }
    },
    onSuccess: ({ newYear }) => {
      // Add year to local store
      addYear(newYear)
      // Sync to filterStore for dashboard
      setYear(newYear)
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: yearKeys.all })
      queryClient.invalidateQueries({ queryKey: ['websites'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['investments'] })
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    },
  })
}

// Update selected year in profile
export function useUpdateSelectedYear() {
  const { user } = useAuthStore()
  const { setSelectedYear } = useYearStore()
  const { setYear } = useFilterStore()

  return useMutation({
    mutationFn: async (year: number) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ selected_year: year })
        .eq('id', user.id)

      if (error) throw error
      return year
    },
    onSuccess: (year) => {
      setSelectedYear(year)
      // Also update filterStore to sync dashboard data
      setYear(year)
    },
  })
}
