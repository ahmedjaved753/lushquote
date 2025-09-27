import { createClient } from '@supabase/supabase-js'

// Supabase project configuration
const supabaseUrl = 'https://mekynypkkangghybwyxt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1la3lueXBra2FuZ2doeWJ3eXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5ODk2NDUsImV4cCI6MjA3NDU2NTY0NX0.2PPZSiye4dcFNzbPv2ABGsVa1QkKae0k3thRm0L57X0'

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
