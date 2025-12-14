import { create } from 'zustand'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null

  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      set({ user: session?.user ?? null, loading: false })

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null })
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false, error: 'Failed to initialize authentication' })
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ loading: false, error: error.message })
      return { error }
    }

    set({ user: data.user, loading: false })
    return { error: null }
  },

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      set({ loading: false, error: error.message })
      return { error }
    }

    set({ user: data.user, loading: false })
    return { error: null }
  },

  signOut: async () => {
    set({ loading: true })
    await supabase.auth.signOut()
    set({ user: null, loading: false })
  },

  clearError: () => set({ error: null }),
}))
