'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }
        
        setUser(session?.user ?? null)
        setInitialized(true)
        
        // If no user and not on login or callback page, redirect to login
        if (!session?.user && pathname !== '/login' && pathname !== '/auth/callback') {
          // Don't redirect if we're on the home page
          if (pathname !== '/') {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Handle different auth events
      if (event === 'SIGNED_IN') {
        router.refresh()
        // Redirect to home or intended page after sign in
        const searchParams = new URLSearchParams(window.location.search)
        const redirectTo = searchParams.get('redirectTo') || '/'
        router.push(redirectTo)
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully')
      } else if (event === 'USER_UPDATED') {
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, pathname])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}