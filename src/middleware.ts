import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-middleware';

// Helper function to check if a URL is a redirect loop
function isRedirectLoop(req: NextRequest): boolean {
  // Get the referer header
  const referer = req.headers.get('referer');
  if (!referer) return false;

  // Get the current URL
  const currentUrl = req.nextUrl.pathname;

  // Check if the referer contains the current URL and vice versa
  // This indicates a potential redirect loop
  try {
    const refererUrl = new URL(referer).pathname;

    // Check for direct back-and-forth redirects
    if (
      (currentUrl.includes('/dashboard/admin') && refererUrl.includes('/dashboard/subcontractor')) ||
      (currentUrl.includes('/dashboard/subcontractor') && refererUrl.includes('/dashboard/admin')) ||
      (currentUrl.includes('/auth') && (refererUrl.includes('/dashboard/admin') || refererUrl.includes('/dashboard/subcontractor')))
    ) {
      console.log('Middleware: Detected potential redirect loop between', refererUrl, 'and', currentUrl);
      return true;
    }
  } catch (e) {
    // Invalid URL in referer, ignore
    return false;
  }

  return false;
}

export async function middleware(req: NextRequest) {
  // Create a response to modify
  const res = NextResponse.next();

  // Check for redirect loops early
  if (isRedirectLoop(req)) {
    console.log('Middleware: Breaking potential redirect loop');
    // Return the current response without redirecting
    return res;
  }

  try {
    // Create Supabase client
    const supabase = createMiddlewareClient(req, res);

    // Get the pathname from the URL
    const { pathname } = req.nextUrl;

    // Check if session exists
    console.log("Middleware: Checking session for path:", pathname);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // Handle session check errors
    if (sessionError) {
      console.error("Middleware: Session check error:", sessionError.message);
      // If there's an error checking the session, treat as not logged in
      if (pathname.startsWith('/dashboard')) {
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('redirect', encodeURIComponent(pathname));
        return NextResponse.redirect(redirectUrl);
      }
      return res;
    }

    console.log("Middleware: Session check result:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

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

    // Logged in - Get user data
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("Middleware: Error getting user data:", userError.message);
        // If there's an error getting user data, continue without redirecting
        // This prevents redirect loops when auth is in an inconsistent state
        return res;
      }

      const user = userData.user;

      if (!user) {
        console.log("Middleware: No user found in session, signing out");
        // If user data can't be retrieved, sign out and redirect to login
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.error("Middleware: Error signing out:", signOutError);
        }
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }

      const userEmail = user.email || 'unknown';
      console.log(`Middleware: User session active for ${userEmail}`);

      // Special case for romico@gmail.com - always admin
      const isSpecialAdmin = userEmail === 'romico@gmail.com';

      // RULE 1: Logged in users at / or /auth should go to appropriate dashboard
      if (pathname === '/' || pathname.startsWith('/auth')) {
        if (isSpecialAdmin) {
          console.log('Middleware: Special admin user - redirect to admin dashboard');
          return NextResponse.redirect(new URL('/dashboard/admin', req.url));
        }

        // Determine role
        let role = 'subcontractor';

        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Middleware: Error fetching profile:', profileError.message);
            // Continue with default role if profile fetch fails
          } else if (profile && profile.role) {
            role = profile.role;
          }
        } catch (err) {
          console.error('Middleware: Error fetching profile:', err);
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
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Middleware: Error fetching profile for access control:', profileError.message);
            // If we can't determine the role, default to allowing access
            // This prevents redirect loops when profile data is unavailable
            return res;
          } else if (profile && profile.role) {
            role = profile.role;
          }
        } catch (err) {
          console.error('Middleware: Error fetching profile for access control:', err);
          // If we can't determine the role, default to allowing access
          return res;
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
    } catch (error) {
      console.error("Middleware: Unexpected error:", error);
      // For any unexpected errors, continue without redirecting
      // This prevents redirect loops when something goes wrong
      return res;
    }

    return res;
  } catch (error) {
    console.error("Middleware: Critical error:", error);
    // For any critical errors in the middleware itself, continue without redirecting
    return res;
  }
}

// Define which routes this middleware should run on
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/auth/:path*',
  ],
};