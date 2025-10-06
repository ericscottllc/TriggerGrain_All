/*
  # Add Admin User Policy

  1. Security Changes
    - Add RLS policy to allow users with 'admin' role to read all user profiles
    - Maintains existing policy for users to read their own profile
    - Uses role-based access control through user_roles and roles tables

  2. Policy Details
    - Policy Name: "Admins can read all user profiles"
    - Command: SELECT
    - Target: public.users table
    - Qualification: Checks if current user has 'admin' role
*/

-- Add policy for admin users to read all user profiles
CREATE POLICY "Admins can read all user profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'admin'
        AND r.is_active = true
    )
  );

-- Ensure we have an admin role (create if it doesn't exist)
INSERT INTO public.roles (name, description, is_system_role, is_active)
VALUES ('admin', 'Administrator role with full system access', true, true)
ON CONFLICT (name) DO NOTHING;