# Subcontractor Delete Fix - Test Plan

## Summary of Changes Made

### 1. Database Level Fixes
- ✅ **Added missing DELETE policy** for the `profiles` table:
  ```sql
  CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE
  TO public
  USING (is_admin());
  ```

### 2. API Route Improvements (`/api/admin/subcontractors/delete`)
- ✅ **Enhanced authentication and authorization checks** with detailed logging
- ✅ **Fixed auth deletion order** - now deletes from `auth.users` first using service role client
- ✅ **Improved error handling** with specific error messages and status codes
- ✅ **Added comprehensive logging** for debugging

### 3. Frontend Improvements (`/dashboard/admin/subcontractors`)
- ✅ **Enhanced error handling** with status-code-specific error messages
- ✅ **Added detailed logging** for debugging
- ✅ **Improved user feedback** with more descriptive error messages

## Root Cause Analysis

The original error "Auth deletion error: User not allowed" was caused by:

1. **Missing DELETE RLS Policy**: The `profiles` table had no DELETE policy, preventing admin users from deleting profiles
2. **Incorrect Service Role Usage**: The auth deletion was using the regular client instead of the service role client
3. **Poor Error Handling**: Generic error messages made debugging difficult

## Test Steps

### Prerequisites
1. Ensure you're logged in as an admin user (romico@gmail.com)
2. Have at least one test subcontractor account to delete
3. Open browser developer tools to monitor console logs

### Test Procedure

1. **Navigate to Admin Dashboard**
   - Go to `/dashboard/admin/subcontractors`
   - Verify the page loads and shows subcontractor list

2. **Attempt Subcontractor Deletion**
   - Click the delete button (trash icon) for a test subcontractor
   - Confirm the deletion in the dialog
   - Monitor both browser console and server logs

3. **Expected Results**
   - ✅ No "User not allowed" error
   - ✅ Success message: "Subcontractor [name] has been deleted successfully"
   - ✅ Subcontractor removed from the list
   - ✅ Related data (jobs, notifications) properly cascaded

4. **Verify Database State**
   - Check that the user is removed from `auth.users`
   - Check that the profile is removed from `profiles` table
   - Verify related data is properly cleaned up

### Error Scenarios to Test

1. **Non-admin user attempts deletion** (should get 403 error)
2. **Invalid subcontractor ID** (should get 404 error)
3. **Network/database errors** (should get appropriate error messages)

## Monitoring and Logs

### Browser Console Logs
- Look for: "Attempting to delete subcontractor: [name] ([id])"
- Look for: "Delete API response: [response]"
- Look for: "Successfully deleted subcontractor: [name]"

### Server Logs
- Look for: "Delete request from user: [email] ([id])"
- Look for: "Admin user [email] verified for delete operation"
- Look for: "Starting deletion process for subcontractor: [name]"
- Look for: "Attempting to delete user from auth.users..."
- Look for: "Successfully deleted user from auth.users"
- Look for: "Attempting to delete profile and related data..."
- Look for: "Successfully deleted profile and related data"

## Rollback Plan

If issues occur, the changes can be rolled back by:

1. **Remove the DELETE policy**:
   ```sql
   DROP POLICY "Admins can delete profiles" ON public.profiles;
   ```

2. **Revert the API route** to the previous version
3. **Revert the frontend changes** to the previous version

## Security Considerations

- ✅ DELETE policy properly uses `is_admin()` function
- ✅ Service role key is properly secured in environment variables
- ✅ Cascading deletes maintain data integrity
- ✅ Proper authentication and authorization checks in place
