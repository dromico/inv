import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-middleware'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient(req, res)

  // Check if session exists
  const { data: { session } } = await supabase.auth.getSession()

  // Get the pathname from the URL
  const { pathname } = req.nextUrl

  // Redirect rules
  if (!session) {
    // If not logged in and trying to access protected routes
    if (pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('redirect', encodeURIComponent(pathname))
      return NextResponse.redirect(redirectUrl)
    }
  } else {
    // If logged in
    if (pathname === '/' || pathname.startsWith('/auth')) {
      // Get user data
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // If user data can't be retrieved, sign out and redirect to login
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role || 'subcontractor'

      // Redirect to the appropriate dashboard
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard/admin', req.url))
      } else {
        return NextResponse.redirect(new URL('/dashboard/subcontractor', req.url))
      }
    }

    // Role-based access control for dashboard sections
    if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/dashboard/subcontractor')) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // If user data can't be retrieved, sign out and redirect to login
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role || 'subcontractor'

      // Enforce role-based access
      if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/subcontractor', req.url))
      }
      
      if (pathname.startsWith('/dashboard/subcontractor') && role === 'admin') {
        return NextResponse.redirect(new URL('/dashboard/admin', req.url))
      }
    }
  }

  return res
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}
