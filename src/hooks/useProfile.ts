import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import type { Profile } from '../types'

// Query keys
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
}

// Form data types
export interface ProfileFormData {
  name: string
  phone: string
}

// Fetch current user's profile
export function useProfile() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: profileKeys.detail(user?.id ?? ''),
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data as Profile
    },
    enabled: !!user?.id,
  })
}

// Update profile mutation (name, phone)
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user?.id) throw new Error('User not authenticated')

      const { data: profile, error } = await supabase
        .from('profiles')
        .update({
          name: data.name || null,
          phone: data.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return profile as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

// Upload avatar mutation
export function useUploadAvatar() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('User not authenticated')

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.')
      }

      // Validate file size (2MB max)
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 2MB.')
      }

      // Get file extension
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${user.id}/avatar.${ext}`

      // Delete existing avatar first (if any)
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id)

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`)
        await supabase.storage.from('avatars').remove(filesToDelete)
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}` // Add timestamp to bust cache

      // Update profile with new avatar URL
      const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      return profile as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

// Delete avatar mutation
export function useDeleteAvatar() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated')

      // List and delete all files in user's avatar folder
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id)

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`)
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(filesToDelete)

        if (deleteError) throw deleteError
      }

      // Clear avatar URL in profile
      const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      return profile as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
