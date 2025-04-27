/**
 * This file re-exports Supabase client functions from separate files
 * to maintain backward compatibility while avoiding the issue with
 * importing 'next/headers' in non-server contexts.
 * 
 * - Use createClientComponentClient in client components
 * - Use createServerComponentClient in App Router server components
 * - Use createPagesServerClient in Pages Router getServerSideProps
 * - Use createApiRouteClient in API routes
 * - Use createDirectClient or createMiddlewareClient in middleware
 */

// Re-export from client file (for client components)
export { createClientComponentClient } from './supabase-client'

// Re-export from server file (for App Router server components)
export { createServerComponentClient } from './supabase-server'

// Re-export from pages file (for Pages Router)
export { 
  createPagesServerClient,
  createApiRouteClient,
  createPagesDirectClient
} from './supabase-pages'

// Re-export from middleware file (for middleware and other contexts)
export { createDirectClient, createMiddlewareClient } from './supabase-middleware'
