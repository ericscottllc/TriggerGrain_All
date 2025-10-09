/*
  # Fix Ambiguous Column Reference in get_user_info Function

  ## Issue
  The `get_user_info` function has an ambiguous column reference error (42702)
  where "user_id" could refer to either:
  - The function parameter `user_id`
  - The table column `ur.user_id` in the user_roles table
  
  ## Solution
  Rename the function parameter from `user_id` to `p_user_id` to avoid naming conflicts
  and make the code more explicit about parameter vs column references.

  ## Changes
  - Drop and recreate the `get_user_info` function with renamed parameter
  - Update WHERE clause to use the renamed parameter
  - No changes to return type or function signature (except parameter name)
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_user_info(uuid);

-- Recreate function with unambiguous parameter name
CREATE OR REPLACE FUNCTION public.get_user_info(p_user_id uuid)
RETURNS TABLE (
  user_email text,
  user_status text,
  role_name text,
  is_admin boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.email,
    u.status,
    r.name as role_name,
    r.name = 'Admin' as is_admin
  FROM public.public_users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  LEFT JOIN public.roles r ON ur.role_id = r.id
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;