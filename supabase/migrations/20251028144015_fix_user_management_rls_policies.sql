/*
  # Fix User Management RLS Policies

  ## Overview
  Fixes Row Level Security policies to allow admin users to properly manage the user management system.
  The current policies are too restrictive and prevent admins from viewing other users' roles and managing the system.

  ## Issues Being Fixed
  1. **user_roles table**: Only allows users to view their own roles, blocking admins from seeing other users' role assignments
  2. **roles/permissions tables**: Policies too restrictive for authenticated users to view all options
  3. **public_users table**: Admin policy exists but may need refinement
  4. **Missing CRUD policies**: No INSERT/DELETE policies on user_roles for admins to assign/remove roles
  5. **Missing UPDATE policies**: No UPDATE policies on roles/permissions tables for admin management

  ## Changes

  ### 1. user_roles Table Policies
  - Add policy for admins to SELECT all user_roles (not just their own)
  - Add policy for admins to INSERT new role assignments
  - Add policy for admins to DELETE role assignments
  - Keep existing policy for users to view their own roles

  ### 2. roles Table Policies
  - Update to allow all authenticated users to SELECT all roles (not just active)
  - Add policy for admins to UPDATE roles

  ### 3. permissions Table Policies
  - Update to allow all authenticated users to SELECT all permissions (not just active)
  - Add policy for admins to UPDATE permissions

  ### 4. role_permissions Table Policies
  - Ensure all authenticated users can SELECT role-permission mappings

  ### 5. public_users Table Policies
  - Verify admin can SELECT all users
  - Verify admin can UPDATE any user

  ## Security Notes
  - All admin checks verify the user has the 'Admin' role via user_roles and roles tables
  - Non-admin users maintain restricted access to only their own data
  - System roles are protected from deletion but can be deactivated
*/

-- ============================================================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- ============================================================================

-- Drop existing user_roles policies
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Drop existing roles policies
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.roles;

-- Drop existing permissions policies
DROP POLICY IF EXISTS "Authenticated users can read permissions" ON public.permissions;

-- Drop existing role_permissions policies
DROP POLICY IF EXISTS "Authenticated users can read role permissions" ON public.role_permissions;

-- Drop existing public_users policies (we'll recreate them)
DROP POLICY IF EXISTS "Users can view own profile" ON public.public_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.public_users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.public_users;
DROP POLICY IF EXISTS "Admins can update user status" ON public.public_users;

-- ============================================================================
-- CREATE COMPREHENSIVE RLS POLICIES
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

-- Allow admins to view all users
CREATE POLICY "Admins can view all users"
  ON public.public_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  );

-- Allow admins to update any user
CREATE POLICY "Admins can update any user"
  ON public.public_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  );

-- ----------------------------------------------------------------------------
-- 2. user_roles Table Policies
-- ----------------------------------------------------------------------------

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to view all user roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  );

-- Allow admins to insert new role assignments
CREATE POLICY "Admins can assign roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  );

-- Allow admins to remove role assignments
CREATE POLICY "Admins can remove roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  );

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
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  );

-- ----------------------------------------------------------------------------
-- 5. role_permissions Table Policies
-- ----------------------------------------------------------------------------

-- Allow all authenticated users to view role-permission mappings
CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- CREATE HELPER FUNCTION FOR ADMIN CHECK
-- ============================================================================

-- Create a helper function to check if current user is an admin
-- This can be used in application code and potentially in future policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
      AND r.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================================================

-- Create index on user_roles for faster admin checks
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_lookup 
  ON public.user_roles(user_id, role_id);

-- Create index on roles for faster name lookups
CREATE INDEX IF NOT EXISTS idx_roles_name 
  ON public.roles(name) WHERE is_active = true;