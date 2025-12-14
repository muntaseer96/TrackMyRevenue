import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useYearStore } from '../stores/yearStore'
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
        setSelectedYear(query.data.available_years[0] ?? new Date().getFullYear())
      }
    }
  }, [query.data, setAvailableYears, setSelectedYear, selectedYear])

  return query
}

// Create new year mutation (copies websites and categories from previous year)
export function useCreateYear() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { availableYears, addYear } = useYearStore()

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

      // 6. Get all investments from previous year
      const { data: previousInvestments, error: investmentsError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', previousYear)

      if (investmentsError) throw investmentsError

      // 7. Copy investments to new year (without dividends - those are per-year)
      if (previousInvestments && previousInvestments.length > 0) {
        for (const investment of previousInvestments) {
          const { error: insertError } = await supabase.from('investments').insert({
            user_id: user.id,
            company_name: investment.company_name,
            principal_amount: investment.principal_amount,
            notes: investment.notes,
            year: newYear,
          })

          if (insertError) throw insertError
        }
      }

      // 8. Update profile with new available year
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
        copiedInvestments: previousInvestments?.length ?? 0,
      }
    },
    onSuccess: ({ newYear }) => {
      // Add year to local store
      addYear(newYear)
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: yearKeys.all })
      queryClient.invalidateQueries({ queryKey: ['websites'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['investments'] })
    },
  })
}

// Update selected year in profile
export function useUpdateSelectedYear() {
  const { user } = useAuthStore()
  const { setSelectedYear } = useYearStore()

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
    },
  })
}
