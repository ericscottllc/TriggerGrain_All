/*
  # Fix Duplicate Admin Roles

  1. Updates
    - Update the RLS policy to use the existing "Admin" role (capital A)
    - Remove the duplicate "admin" role that was created
    
  2. Security
    - Maintains existing RLS policies
    - Uses the original "Admin" role for consistency
*/

-- Update the RLS policy to use the existing "Admin" role (capital A)
DROP POLICY IF EXISTS "Admins can read all user profiles" ON public.users;

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
        AND r.name = 'Admin'
        AND r.is_active = true
    )
  );

-- Remove the duplicate "admin" role (lowercase)
DELETE FROM public.roles 
WHERE name = 'admin' 
  AND is_system_role = true 
  AND created_at > '2025-08-25 21:00:00';