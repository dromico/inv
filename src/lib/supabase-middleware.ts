import { createClient } from '@supabase/supabase-js'
import { createMiddlewareClient as createSupabaseMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest, NextResponse } from 'next/server'

// For direct client creation (useful in middleware or other contexts)
export function createDirectClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  )
}

// Middleware-specific Supabase client with improved configuration
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  try {
    return createSupabaseMiddlewareClient({
      req,
      res,
      options: {
        // Configure auth to ensure proper session handling
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        },
        // Add global error handler for debugging
        global: {
          fetch: (url, options) => {
            // Only log auth-related requests in development
            if (process.env.NODE_ENV === 'development' &&
                url.toString().includes('/auth/')) {
              console.log('Middleware Supabase fetch:', url.toString().split('/').pop())
            }
            return fetch(url, options)
          }
        }
      }
    })
  } catch (error) {
    console.error('Error creating middleware client:', error)
    // Fallback to direct client if middleware client creation fails
    return createDirectClient()
  }
}