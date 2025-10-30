/*
  # Fix get_user_info Function - Final Authoritative Version

  ## Overview
  This migration resolves all conflicts with the get_user_info function by:
  1. Dropping ALL previous versions regardless of signature
  2. Creating a single, definitive version that matches frontend expectations
  3. Setting proper security and search_path configuration
  4. Ensuring compatibility with the AuthContext implementation

  ## Problem
  Multiple migrations have created conflicting versions of get_user_info:
  - Original: get_user_info(user_id uuid) returning user_email, user_status, role_name, is_admin
  - Fixed: get_user_info(p_user_id uuid) with same return structure
  - Refactored: get_user_info(user_uuid uuid) returning user_id, email, full_name, roles[]

  This causes a 404 error when the frontend calls the function because the signature
  doesn't match what exists in the database.

  ## Solution
  Create a definitive version that:
  - Uses parameter name: p_user_id (matches frontend call)
  - Returns the structure expected by AuthContext: user_email, user_status, role_name, is_admin
  - Has SECURITY DEFINER to bypass RLS when fetching user info
  - Uses explicit search_path for security
  - Handles cases where user has no role assigned (returns 'Pending' as default)

  ## Changes
  1. Drop ALL possible versions of get_user_info
  2. Create single authoritative version with proper signature
  3. Add helpful comments for future maintenance
*/

-- ============================================================================
-- STEP 1: Drop all possible versions of get_user_info
-- ============================================================================

-- Drop any version with different parameter names
DROP FUNCTION IF EXISTS public.get_user_info(user_id uuid);
DROP FUNCTION IF EXISTS public.get_user_info(p_user_id uuid);
DROP FUNCTION IF EXISTS public.get_user_info(user_uuid uuid);

-- Drop with explicit return type in case of overloads
DROP FUNCTION IF EXISTS public.get_user_info(uuid);

-- ============================================================================
-- STEP 2: Create the definitive, authoritative version
-- ============================================================================

-- This is the ONLY version of get_user_info that should exist
-- Parameter name: p_user_id (matches frontend AuthContext call)
-- Return structure: matches UserProfile interface in AuthContext
CREATE OR REPLACE FUNCTION public.get_user_info(p_user_id uuid)
RETURNS TABLE (
  user_email text,
  user_status text,
  role_name text,
  is_admin boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Return user info with role information
  -- If user has no role, defaults to 'Pending' role
  RETURN QUERY
  SELECT
    u.email::text as user_email,
    u.status::text as user_status,
    COALESCE(r.name, 'Pending')::text as role_name,
    COALESCE(r.name = 'Admin', false) as is_admin
  FROM public.public_users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.roles r ON ur.role_id = r.id
  WHERE u.id = p_user_id
  LIMIT 1;
END;
$$;

-- ============================================================================
-- STEP 3: Add helpful comment for future developers
-- ============================================================================

COMMENT ON FUNCTION public.get_user_info(uuid) IS
'Retrieves user profile information including email, status, role name, and admin status.
This function is called by the frontend AuthContext.tsx during authentication.
Parameters:
  - p_user_id: The UUID of the user (typically from auth.uid())
Returns:
  - user_email: The user email address
  - user_status: User status (active, pending, suspended)
  - role_name: The name of the user primary role (defaults to "Pending" if no role assigned)
  - is_admin: Boolean indicating if user has Admin role
Security: SECURITY DEFINER allows function to read user data despite RLS policies.
DO NOT change the parameter name or return structure without updating AuthContext.tsx!';

-- ============================================================================
-- STEP 4: Grant execute permission to authenticated users
-- ============================================================================

-- Ensure all authenticated users can call this function
GRANT EXECUTE ON FUNCTION public.get_user_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_info(uuid) TO anon;
