import {
  createServerComponentClient as createSupabaseServerComponentClient,
  createServerActionClient as createSupabaseServerActionClient
} from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Server-side Supabase client for App Router server components
// This function is designed to be used only in the App Router
export async function createServerComponentClient() {
  console.log("Creating server component client with cookies")

  try {
    // Import cookies from next/headers
    const { cookies } = await import('next/headers')

    // Create the Supabase client with the cookie store using a factory function
    // This properly handles cookies as recommended by Next.js (avoids synchronous cookies access)
    return createSupabaseServerComponentClient<Database>({
      cookies,
      options: {
        // Configure auth to ensure proper session handling
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce', // Use PKCE flow for better security
        },
        // Add global error handler for rate limit detection
        global: {
          fetch: async (url, options) => {
            try {
              const response = await fetch(url, options)

              // Check for rate limit errors
              if (response.status === 429) {
                console.warn('Rate limit reached in server component client:', url.toString())
              }

              return response
            } catch (error) {
              console.error('Error in server component client fetch:', error)
              throw error
            }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error creating server component client with cookies:", error)
    console.log("Falling back to direct client creation")

    // Fallback to direct client creation if cookies are not available
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )
  }
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