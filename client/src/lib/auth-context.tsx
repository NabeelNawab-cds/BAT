import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string; username?: string }) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true);
    const sessionTimeout = 10000; // 10 seconds

    // Promise for a timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase session request timed out.')), sessionTimeout)
    );

    // Promise for the session
    const sessionPromise = supabase.auth.getSession();

    // Race the session promise against the timeout
    Promise.race([sessionPromise, timeoutPromise])
      .then((result: any) => {
        const { data, error } = result;
        if (error) {
          console.error('Error getting session:', error.message);
        }
        const { session } = data || { session: null };
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch((error) => {
        console.error('Error or timeout getting session:', error.message);
        // In case of timeout or other errors, assume no session
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Loading is false after any auth event

      // Create or update profile when user signs in
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureProfileExists(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Ensure a profile exists for the authenticated user
  const ensureProfileExists = async (user: User) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.first_name,
          lastName: user.user_metadata?.last_name,
          username: user.user_metadata?.username || user.email?.split('@')[0],
          avatar: user.user_metadata?.avatar_url
        })
      })
      
      if (!response.ok) {
        console.warn('Failed to create/update profile:', await response.text())
      }
    } catch (error) {
      console.warn('Error ensuring profile exists:', error)
    }
  }

  const signUp = async (email: string, password: string, metadata?: { firstName?: string; lastName?: string; username?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: metadata?.firstName,
          last_name: metadata?.lastName,
          username: metadata?.username
        }
      }
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { data, error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}