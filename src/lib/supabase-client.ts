import { createClientComponentClient as createSupabaseClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Client-side Supabase client (to be used in client components)
export function createClientComponentClient() {
  return createSupabaseClientComponentClient({
    options: {
      // Configure auth to ensure proper session handling
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce', // Use PKCE flow for better security
        // Set cookie options for better persistence
        cookieOptions: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 28800 // 8 hours
        }
      },
      // Add global error handler for rate limit detection
      global: {
        fetch: async (url, options) => {
          try {
            const response = await fetch(url, options)

            // Check for rate limit errors
            if (response.status === 429) {
              console.warn('Rate limit reached in Supabase client fetch:', url.toString())
            }

            return response
          } catch (error) {
            console.error('Error in Supabase client fetch:', error)
            throw error
          }
        }
      }
    }
  })
}