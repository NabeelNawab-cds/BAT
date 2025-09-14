import { createClient } from '@supabase/supabase-js'

// Get Supabase config from environment variables (set in Netlify dashboard)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('supabaseUrl is required. Set VITE_SUPABASE_URL in your environment variables.')
}
if (!supabaseAnonKey) {
  throw new Error('supabaseAnonKey is required. Set VITE_SUPABASE_ANON_KEY in your environment variables.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const authHelpers = {
  signUp: async (email: string, password: string, metadata?: { firstName?: string; lastName?: string; username?: string }) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  signInWithGoogle: async () => {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  },

  signOut: async () => {
    return await supabase.auth.signOut()
  },

  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
  },

  updatePassword: async (password: string) => {
    return await supabase.auth.updateUser({ password })
  },

  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  getSession: () => {
    return supabase.auth.getSession()
  }
}
