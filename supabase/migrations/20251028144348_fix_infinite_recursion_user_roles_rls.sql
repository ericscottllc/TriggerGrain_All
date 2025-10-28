/*
  # Fix Infinite Recursion in user_roles RLS Policies

  ## Problem
  The previous RLS policies on user_roles table create infinite recursion because:
  - When querying user_roles, the policy checks if user is admin
  - To check if user is admin, it queries user_roles
  - This creates a circular dependency causing infinite recursion

  ## Solution
  Use a SECURITY DEFINER function that bypasses RLS to check admin status,
  and simplify the policies to avoid recursive queries.

  ## Changes
  1. Drop all existing problematic policies
  2. Create a SECURITY DEFINER function to check admin status that bypasses RLS
  3. Recreate policies using the non-recursive function
  4. Use simpler policy patterns that don't create circular dependencies
*/

-- ============================================================================
-- DROP ALL EXISTING POLICIES TO START FRESH
-- ============================================================================

-- Drop user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can remove roles" ON public.user_roles;

-- Drop public_users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.public_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.public_users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.public_users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.public_users;

-- Drop roles policies
DROP POLICY IF EXISTS "Authenticated users can view all roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.roles;

-- Drop permissions policies
DROP POLICY IF EXISTS "Authenticated users can view all permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admins can update permissions" ON public.permissions;

-- Drop role_permissions policies
DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;

-- ============================================================================
-- CREATE HELPER FUNCTION THAT BYPASSES RLS
-- ============================================================================

-- Drop existing is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

-- Create a new SECURITY DEFINER function that bypasses RLS
-- This function runs with the privileges of the function owner (bypassing RLS)
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
DECLARE
  admin_count integer;
BEGIN
  -- This query runs with SECURITY DEFINER privileges, bypassing RLS
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid()
    AND r.name = 'Admin'
    AND r.is_active = true;
  
  RETURN admin_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- ============================================================================
-- CREATE NON-RECURSIVE RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. public_users Table Policies
-- ----------------------------------------------------------------------------

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.public_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.public_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to view all users (using SECURITY DEFINER function)
CREATE POLICY "Admins can view all users"
  ON public.public_users FOR SELECT
  TO authenticated
  USING (public.current_user_is_admin());

-- Allow admins to update any user
CREATE POLICY "Admins can update any user"
  ON public.public_users FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ----------------------------------------------------------------------------
-- 2. user_roles Table Policies (NON-RECURSIVE)
-- ----------------------------------------------------------------------------

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to view all user roles (using SECURITY DEFINER function)
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.current_user_is_admin());

-- Allow admins to insert new role assignments
CREATE POLICY "Admins can assign roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_is_admin());

-- Allow admins to remove role assignments
CREATE POLICY "Admins can remove roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.current_user_is_admin());

-- Allow admins to update role assignments (in case we need this)
CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- ----------------------------------------------------------------------------
-- 3. roles Table Policies
-- ----------------------------------------------------------------------------

-- Allow all authenticated users to view all roles (needed for dropdowns)
CREATE POLICY "Authenticated users can view all roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to update roles
CREATE POLICY "Admins can update roles"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Allow admins to insert new roles
CREATE POLICY "Admins can insert roles"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_is_admin());

-- ----------------------------------------------------------------------------
-- 4. permissions Table Policies
-- ----------------------------------------------------------------------------

-- Allow all authenticated users to view all permissions (needed for UI)
CREATE POLICY "Authenticated users can view all permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to update permissions
CREATE POLICY "Admins can update permissions"
  ON public.permissions FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- Allow admins to insert new permissions
CREATE POLICY "Admins can insert permissions"
  ON public.permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_is_admin());

-- ----------------------------------------------------------------------------
-- 5. role_permissions Table Policies
-- ----------------------------------------------------------------------------

-- Allow all authenticated users to view role-permission mappings
CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage role-permission mappings
CREATE POLICY "Admins can insert role permissions"
  ON public.role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Admins can delete role permissions"
  ON public.role_permissions FOR DELETE
  TO authenticated
  USING (public.current_user_is_admin());

-- ============================================================================
-- VERIFY POLICIES ARE WORKING
-- ============================================================================

-- Test that we can query user_roles without recursion
-- (This will only work after the policies are in place)
COMMENT ON TABLE public.user_roles IS 'User role assignments with non-recursive RLS policies';