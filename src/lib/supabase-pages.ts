import { createPagesServerClient as createSupabasePagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// For use in Pages Router getServerSideProps
export function createPagesServerClient(context: GetServerSidePropsContext) {
  return createSupabasePagesServerClient(context)
}

// For use in API routes
export function createApiRouteClient(req: NextApiRequest, res: NextApiResponse) {
  return createSupabasePagesServerClient({ req, res })
}

// For direct client creation in Pages Router (without context)
export function createPagesDirectClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}