import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  signOut: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          // Don't throw error for session retrieval issues
        } else {
          setSession(session)
          setUser(session?.user || null)
          if (session?.user) {
            await fetchUserRole(session.user)
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error)
        // Continue with null session rather than crashing
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        
        try {
          setSession(session)
          setUser(session?.user || null)
          
          if (session?.user) {
            await fetchUserRole(session.user)
          } else {
            setUserRole(null)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (user) => {
    try {
      // Check user metadata for role
      const role = user.user_metadata?.role || user.app_metadata?.role || 'user'
      setUserRole(role)
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('user') // Default to user role
    }
  }

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  const signUpWithEmail = async (email, password, options = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        ...options
      }
    })
    
    if (error) throw error
    return data
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
    return data
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    if (error) throw error
    return data
  }

  const updatePassword = async (password) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value = {
    user,
    session,
    loading,
    userRole,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
