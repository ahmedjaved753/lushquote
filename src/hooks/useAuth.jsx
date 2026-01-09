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
          console.error('[useAuth] Error getting session:', error)
          // Don't throw error for session retrieval issues
        } else {
          setSession(session)
          
          if (session?.user) {
            console.log('[useAuth] Session found, fetching user profile...');
            try {
              const userWithProfile = await fetchUserProfile(session.user)
              console.log('[useAuth] User profile fetched, setting user...');
              setUser(userWithProfile)
              await fetchUserRole(session.user)
              console.log('[useAuth] Initial setup complete');
            } catch (profileError) {
              console.error('[useAuth] Error fetching profile during init:', profileError);
              // Set user anyway with basic auth data
              setUser(session.user)
              await fetchUserRole(session.user)
            }
          } else {
            console.log('[useAuth] No session found');
            setUser(null)
          }
        }
      } catch (error) {
        console.error('[useAuth] Error in getSession:', error)
        // Continue with null session rather than crashing
      } finally {
        console.log('[useAuth] Setting loading to false (initial session complete)');
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] 📡 Auth state changed:', event, session?.user?.email)
        
        // Skip initial SIGNED_IN event if we already have a user
        // (prevents double fetch on mount)
        if (event === 'SIGNED_IN' && user) {
          console.log('[useAuth] ⏭️ Skipping duplicate SIGNED_IN event (user already loaded)');
          setLoading(false); // Make sure loading is false
          return;
        }
        
        try {
          console.log('[useAuth] 🔄 Processing auth state change...');
          setSession(session)
          
          if (session?.user) {
            console.log('[useAuth] 👤 User session exists, fetching profile...');
            console.log('[useAuth] About to call fetchUserProfile...');
            
            const userWithProfile = await fetchUserProfile(session.user)
            
            console.log('[useAuth] ✅ fetchUserProfile returned, setting user state...');
            setUser(userWithProfile)
            
            console.log('[useAuth] 🔐 Fetching user role...');
            await fetchUserRole(session.user)
            
            console.log('[useAuth] ✅ User profile and role set after auth change');
          } else {
            console.log('[useAuth] ❌ No user session, clearing user state');
            setUser(null)
            setUserRole(null)
          }
        } catch (error) {
          console.error('[useAuth] ❌ EXCEPTION handling auth state change:', {
            error: error,
            message: error?.message,
            stack: error?.stack
          })
          // Set user anyway to prevent infinite loading
          if (session?.user) {
            console.log('[useAuth] 🔄 Setting user with basic auth data as fallback');
            setUser(session.user)
          }
        } finally {
          console.log('[useAuth] 🏁 Setting loading to FALSE after auth change (FINALLY block)');
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
      console.log('[useAuth] User ID:', authUser.id);
      console.log('[useAuth] Starting database query to user_profiles table...');
      
      // Create timeout promise
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.error('[useAuth] ⚠️ TIMEOUT: Profile fetch took too long (3 seconds), using fallback');
          resolve({ timedOut: true });
        }, 3000);
      });
      
      // Create fetch promise
      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
        .then(result => {
          console.log('[useAuth] ✅ Database query completed');
          return { ...result, timedOut: false };
        });
      
      // Race between fetch and timeout
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (result.timedOut) {
        console.error('[useAuth] Using fallback due to timeout');
        return {
          ...authUser,
          subscription_tier: 'free',
          user_metadata: {
            ...authUser.user_metadata,
            subscription_tier: 'free',
          }
        };
      }
      
      let { data: profile, error: profileError } = result;
      console.log('[useAuth] Profile query result:', { 
        hasProfile: !!profile, 
        hasError: !!profileError,
        errorCode: profileError?.code,
        errorMessage: profileError?.message 
      });

      if (profileError && profileError.code === 'PGRST116') {
        console.log('[useAuth] ❌ Profile not found (PGRST116), creating new profile...');
        
        try {
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
            console.error('[useAuth] ❌ Error creating profile:', createError);
            return {
              ...authUser,
              subscription_tier: 'free',
              user_metadata: {
                ...authUser.user_metadata,
                subscription_tier: 'free',
              }
            };
          }
          
          console.log('[useAuth] ✅ New profile created successfully');
          profile = newProfile;
        } catch (createErr) {
          console.error('[useAuth] ❌ Exception creating profile:', createErr);
          return {
            ...authUser,
            subscription_tier: 'free',
            user_metadata: {
              ...authUser.user_metadata,
              subscription_tier: 'free',
            }
          };
        }
      } else if (profileError) {
        console.error('[useAuth] ❌ Error fetching profile:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        return {
          ...authUser,
          subscription_tier: 'free',
          user_metadata: {
            ...authUser.user_metadata,
            subscription_tier: 'free',
          }
        };
      }

      console.log('[useAuth] ✅ Profile fetched successfully:', {
        email: profile?.email,
        subscription_tier: profile?.subscription_tier,
        subscription_status: profile?.subscription_status,
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

      console.log('[useAuth] 🎯 Returning merged user with subscription_tier:', mergedUser.subscription_tier);
      return mergedUser;
      
    } catch (error) {
      console.error('[useAuth] ❌ EXCEPTION in fetchUserProfile:', {
        error: error,
        message: error?.message,
        stack: error?.stack
      });
      // Return auth user with default free tier on any error
      return {
        ...authUser,
        subscription_tier: 'free',
        user_metadata: {
          ...authUser.user_metadata,
          subscription_tier: 'free',
        }
      };
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
