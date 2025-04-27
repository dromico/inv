import { createClientComponentClient as createSupabaseClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side Supabase client (to be used in client components)
export function createClientComponentClient() {
  return createSupabaseClientComponentClient()
}