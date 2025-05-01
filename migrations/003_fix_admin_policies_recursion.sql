-- Fix for infinite recursion in admin RLS policies
-- This script creates a SECURITY DEFINER function to safely check admin status
-- without triggering recursive RLS policy evaluation

-- Create the is_admin function with SECURITY DEFINER
-- This allows the function to bypass RLS when checking the profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE    -- Function result depends on database state but not on arguments
SECURITY DEFINER  -- Function executes with privileges of the owner, bypassing RLS
SET search_path = public  -- Restrict search_path for security
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Comment on function
COMMENT ON FUNCTION public.is_admin() IS 'Checks if the current user has admin role. Uses SECURITY DEFINER to bypass RLS checks, preventing infinite recursion when used in policies.';

-- Drop existing problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies using the is_admin() function
-- SELECT policy for admins
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_admin());

-- UPDATE policy for admins
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Note: This script assumes that other necessary policies for non-admin users
-- already exist and are functioning correctly.