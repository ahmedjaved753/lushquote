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
        console.log('[useAuth] Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          // Don't throw error for session retrieval issues
        } else {
          setSession(session)
          
          if (session?.user) {
            console.log('[useAuth] Session found, fetching user profile...');
            const userWithProfile = await fetchUserProfile(session.user)
            setUser(userWithProfile)
            await fetchUserRole(session.user)
          } else {
            console.log('[useAuth] No session found');
            setUser(null)
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
        console.log('[useAuth] Auth state changed:', event, session?.user?.email)
        
        try {
          setSession(session)
          
          if (session?.user) {
            console.log('[useAuth] Fetching user profile after auth change...');
            const userWithProfile = await fetchUserProfile(session.user)
            setUser(userWithProfile)
            await fetchUserRole(session.user)
          } else {
            console.log('[useAuth] No user after auth change');
            setUser(null)
            setUserRole(null)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    // Listen for custom userUpdated event (fired from Settings or after payment)
    const handleUserUpdated = async () => {
      console.log('[useAuth] userUpdated event received, refreshing user data...');
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const userWithProfile = await fetchUserProfile(session.user)
        setUser(userWithProfile)
      }
    }

    window.addEventListener('userUpdated', handleUserUpdated)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('userUpdated', handleUserUpdated)
    }
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

  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      console.log('[useAuth] No auth user, skipping profile fetch');
      return authUser;
    }

    try {
      console.log('[useAuth] Fetching user profile for:', authUser.email);
      
      // Get or create user profile
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        console.log('[useAuth] Profile not found, creating new profile');
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: authUser.id,
            email: authUser.email,
            preferred_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0]
          }])
          .select()
          .single();

        if (createError) {
          console.error('[useAuth] Error creating profile:', createError);
          return authUser; // Return auth user without profile data
        }
        profile = newProfile;
      } else if (profileError) {
        console.error('[useAuth] Error fetching profile:', profileError);
        return authUser; // Return auth user without profile data
      }

      console.log('[useAuth] Profile fetched successfully:', {
        email: profile.email,
        subscription_tier: profile.subscription_tier,
        subscription_status: profile.subscription_status,
      });

      // Merge auth user with profile data
      const mergedUser = {
        ...authUser,
        ...profile,
        // Also update user_metadata to keep backward compatibility
        user_metadata: {
          ...authUser.user_metadata,
          ...profile,
        }
      };

      return mergedUser;
    } catch (error) {
      console.error('[useAuth] Error in fetchUserProfile:', error);
      return authUser; // Return auth user without profile data on error
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
