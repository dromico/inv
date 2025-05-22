import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-middleware';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient(req, res);

  // Get the pathname from the URL
  const { pathname } = req.nextUrl;

  // Skip auth check for public assets and API routes to reduce auth calls
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|css|js)$/)
  ) {
    return res;
  }

  // Check if session exists - only log in development to reduce noise
  if (process.env.NODE_ENV === 'development') {
    console.log("Middleware: Checking session for path:", pathname);
  }

  const { data: { session } } = await supabase.auth.getSession();

  // Only log session details in development
  if (process.env.NODE_ENV === 'development') {
    console.log("Middleware: Session check result:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email?.split('@')[0] // Log only first part of email for privacy
    });
  }

  // Not logged in
  if (!session) {
    // If trying to access protected routes, redirect to login
    if (pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', encodeURIComponent(pathname));
      return NextResponse.redirect(redirectUrl);
    }

    // For non-protected routes, continue as normal
    return res;
  }

  // Use session.user instead of making a separate getUser call
  const user = session.user;

  if (!user) {
    // If user data can't be retrieved, sign out and redirect to login
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const userEmail = user.email || 'unknown';
  console.log(`Middleware: user session active for ${userEmail}`);

  // Special case for romico@gmail.com or users with admin role in metadata
  const isSpecialAdmin = userEmail === 'romico@gmail.com' || user.user_metadata?.role === 'admin';

  // RULE 1: Logged in users at / or /auth should go to appropriate dashboard
  if (pathname === '/' || pathname.startsWith('/auth')) {
    if (isSpecialAdmin) {
      console.log('Middleware: Special admin user - redirect to admin dashboard');
      return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    }

    // Determine role
    let role = 'subcontractor';

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile && profile.role) {
        role = profile.role;
      }
    } catch (err) {
      console.error('Error fetching profile in middleware:', err);
    }

    // Redirect based on role
    if (role === 'admin') {
      console.log('Middleware: Admin user - redirect to admin dashboard');
      return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    } else {
      console.log('Middleware: Subcontractor user - redirect to subcontractor dashboard');
      return NextResponse.redirect(new URL('/dashboard/subcontractor', req.url));
    }
  }

  // RULE 2: Enforce role-based access for dashboard sections
  if (pathname.startsWith('/dashboard/')) {
    // For special admin, always allow admin routes, redirect from subcontractor routes
    if (isSpecialAdmin) {
      if (pathname.startsWith('/dashboard/subcontractor')) {
        console.log('Middleware: Special admin accessing subcontractor routes - redirect to admin');
        return NextResponse.redirect(new URL('/dashboard/admin', req.url));
      }
      return res;
    }

    // For regular users, check role
    let role = 'subcontractor';

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile && profile.role) {
        role = profile.role;
      }
    } catch (err) {
      console.error('Error fetching profile for access control:', err);
    }

    // Admin trying to access subcontractor pages
    if (role === 'admin' && pathname.startsWith('/dashboard/subcontractor')) {
      console.log('Middleware: Admin accessing subcontractor routes - redirect to admin');
      return NextResponse.redirect(new URL('/dashboard/admin', req.url));
    }

    // Subcontractor trying to access admin pages
    if (role !== 'admin' && pathname.startsWith('/dashboard/admin')) {
      console.log('Middleware: Non-admin accessing admin routes - redirect to subcontractor');
      return NextResponse.redirect(new URL('/dashboard/subcontractor', req.url));
    }
  }

  return res;
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|api/public).*)',
  ],
};