import { 
  createServerComponentClient as createSupabaseServerComponentClient,
  createServerActionClient as createSupabaseServerActionClient
} from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for App Router server components
// This function is designed to be used only in the App Router
export function createServerComponentClient() {
  // In App Router, we would use:
  // return createSupabaseServerComponentClient({ cookies })
  // But to avoid the import, we'll use a direct client instead
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// This is a placeholder to maintain API compatibility
// The actual implementation is in supabase-pages.ts
export function createPagesServerClient() {
  console.warn('Warning: createPagesServerClient should be imported from supabase-pages.ts')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// This is a placeholder to maintain API compatibility
// The actual implementation is in supabase-pages.ts
export function createApiRouteClient() {
  console.warn('Warning: createApiRouteClient should be imported from supabase-pages.ts')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}