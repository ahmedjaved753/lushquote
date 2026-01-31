import { createClient } from '@supabase/supabase-js'

// Supabase project configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Custom memory-only storage that doesn't persist anything
const memoryStorage = {
  _data: {},
  getItem: (key) => memoryStorage._data[key] || null,
  setItem: (key, value) => { memoryStorage._data[key] = value },
  removeItem: (key) => { delete memoryStorage._data[key] }
}

// Create an anonymous-only client for public operations (no persisted sessions)
// Uses memory-only storage and a unique storage key to completely isolate from main client
export const supabaseAnon = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: memoryStorage,
    storageKey: 'supabase-anon-auth'
  }
})
