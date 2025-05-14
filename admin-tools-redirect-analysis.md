# Admin Tools Functionality Investigation

This document summarizes the investigation into the "too many redirects" error encountered when promoting a user to admin status via the `/admin-tools` page.

## Identified Issues

1.  **Duplicate API Routes**
    There are two nearly identical API routes for making a user an admin:
    *   `/api/admin/make-admin/route.ts` (kebab-case)
    *   `/api/admin/makeAdmin/route.ts` (camelCase)

    This duplication could cause confusion in routing and potentially lead to unexpected behavior.

2.  **Middleware Redirect Logic**
    The middleware (`src/middleware.ts`) implements role-based redirects:
    *   It checks the user's role from the `profiles` table.
    *   It redirects admins to `/dashboard/admin` and subcontractors to `/dashboard/subcontractor`.
    *   It enforces role-based access control for dashboard sections.

3.  **Session State Not Updated**
    When a user's role is updated to admin, the session state (stored in browser cookies) might not be immediately updated. This causes the middleware to continue treating them as a non-admin based on their stale session data, even if the database reflects the change. Clearing cookies resolves this by forcing a fresh session read.

4.  **Previous RLS Policy Recursion Issues**
    The migrations (particularly `003_fix_admin_policies_recursion.sql`) show there was a previous issue with infinite recursion in admin RLS policies. While this was addressed with the `is_admin()` function, potential complexities remain.

## Root Cause Analysis of Redirect Loop

The "too many redirects" error was most likely caused by stale session data:

1.  User is promoted to admin (database update *attempted*).
2.  User tries to access admin functionality.
3.  Middleware checks session (still shows as non-admin due to stale cookie).
4.  Middleware redirects to non-admin routes.
5.  The process repeats, causing the redirect loop.

Clearing cookies fixed this loop by forcing the browser to get fresh session information reflecting the (intended) role change.

## Recommended Solutions for Redirect Loop

1.  **Fix Session Refresh:** After promoting a user, invalidate their current session and force a new login, or update the session data.
2.  **Consolidate Duplicate API Routes:** Remove one of the duplicate API routes (`make-admin` or `makeAdmin`).
3.  **Modify Middleware:** Update middleware to handle role transitions more gracefully.
4.  **Add Session Refresh to API:** Modify the `make-admin` API to refresh the user's session after updating their role.

## Investigation into Role Update Failure (Next Steps)

The fact that the user's role *didn't* actually change in the database despite the API call suggests the database update itself failed silently or was prevented. Further investigation is needed into the `make-admin` API route and associated RLS policies.