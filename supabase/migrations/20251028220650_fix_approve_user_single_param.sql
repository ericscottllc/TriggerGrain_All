/*
  # Fix approve_user(uuid) Function Search Path

  ## Overview
  Fixes the search_path for the single-parameter approve_user function.

  ## Changes
  Drops and recreates approve_user(uuid) with SET search_path = public
*/

-- Drop the single-parameter version
DROP FUNCTION IF EXISTS public.approve_user(uuid);

-- Recreate with proper search_path
CREATE FUNCTION public.approve_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  member_role_id uuid;
  pending_role_id uuid;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'Admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;

  -- Get role IDs
  SELECT id INTO member_role_id FROM roles WHERE name = 'Member';
  SELECT id INTO pending_role_id FROM roles WHERE name = 'Pending';

  -- Update user status
  UPDATE public_users
  SET status = 'active', is_active = true
  WHERE id = target_user_id;

  -- Update user role from Pending to Member
  UPDATE user_roles
  SET role_id = member_role_id
  WHERE user_id = target_user_id
  AND role_id = pending_role_id;

  RETURN true;
END;
$$;