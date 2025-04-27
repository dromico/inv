import { createClient } from '@supabase/supabase-js'
import { createMiddlewareClient as createSupabaseMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest, NextResponse } from 'next/server'

// For direct client creation (useful in middleware or other contexts)
export function createDirectClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Middleware-specific Supabase client
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createSupabaseMiddlewareClient({ req, res })
}