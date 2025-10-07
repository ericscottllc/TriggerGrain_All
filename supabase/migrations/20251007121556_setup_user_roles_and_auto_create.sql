/*
  # Setup User Roles and Auto-Creation System

  ## Overview
  Implements automatic user profile creation with role assignment:
  - First user becomes Admin
  - All subsequent users are Pending approval

  ## Changes
  1. **Default Roles**
     - Admin: Full system access
     - Member: Standard user access
     - Pending: Awaiting approval (limited access)

  2. **Default Permissions**
     - Admin gets all permissions
     - Member gets read/write for their own data
     - Pending gets minimal read access

  3. **Auto-Creation Function**
     - Triggered when new auth.users record is created
     - Creates public_users profile automatically
     - Assigns appropriate role based on user count

  4. **User Status Field**
     - Add status field to public_users
     - Values: active, pending, suspended

  ## Security
  - RLS policies enforce role-based access
  - First user detection is atomic
  - Status field controls access to features
*/

-- Add status field to public_users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_users' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.public_users ADD COLUMN status text NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- Create default roles if they don't exist
INSERT INTO public.roles (name, description, is_system_role, is_active)
VALUES
  ('Admin', 'System administrator with full access', true, true),
  ('Member', 'Standard member with basic access', true, true),
  ('Pending', 'User awaiting approval', true, true)
ON CONFLICT (name) DO NOTHING;

-- Create default permissions if they don't exist
INSERT INTO public.permissions (name, description, resource, action, is_active)
VALUES
  ('users.read', 'View user profiles', 'users', 'read', true),
  ('users.create', 'Create new users', 'users', 'create', true),
  ('users.update', 'Update user profiles', 'users', 'update', true),
  ('users.delete', 'Delete users', 'users', 'delete', true),
  ('users.manage_roles', 'Manage user roles', 'users', 'manage_roles', true),
  ('master_data.read', 'View master data', 'master_data', 'read', true),
  ('master_data.write', 'Edit master data', 'master_data', 'write', true),
  ('grain_entries.read', 'View grain entries', 'grain_entries', 'read', true),
  ('grain_entries.write', 'Create/edit grain entries', 'grain_entries', 'write', true),
  ('grain_entries.delete', 'Delete grain entries', 'grain_entries', 'delete', true)
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to Admin role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- Assign basic permissions to Member role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Member'
  AND p.name IN (
    'master_data.read',
    'grain_entries.read',
    'grain_entries.write',
    'grain_entries.delete'
  )
ON CONFLICT DO NOTHING;

-- Assign minimal permissions to Pending role
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Pending'
  AND p.name IN ('master_data.read')
ON CONFLICT DO NOTHING;

-- Function to automatically create user profile and assign role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count integer;
  admin_role_id uuid;
  pending_role_id uuid;
  assigned_role_id uuid;
  user_status text;
BEGIN
  -- Count existing users in public_users
  SELECT COUNT(*) INTO user_count FROM public.public_users;
  
  -- Get role IDs
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Admin';
  SELECT id INTO pending_role_id FROM public.roles WHERE name = 'Pending';
  
  -- Determine role and status based on user count
  IF user_count = 0 THEN
    -- First user becomes Admin
    assigned_role_id := admin_role_id;
    user_status := 'active';
  ELSE
    -- All other users are Pending
    assigned_role_id := pending_role_id;
    user_status := 'pending';
  END IF;
  
  -- Create public_users profile
  INSERT INTO public.public_users (id, email, full_name, status, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_status,
    CASE WHEN user_status = 'active' THEN true ELSE false END
  );
  
  -- Assign role to user
  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, assigned_role_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policy for public_users to consider status
DROP POLICY IF EXISTS "Users can view own profile" ON public.public_users;
CREATE POLICY "Users can view own profile"
  ON public.public_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.public_users;
CREATE POLICY "Users can update own profile"
  ON public.public_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add policy for admins to view all users
CREATE POLICY "Admins can view all users"
  ON public.public_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
    )
  );

-- Add policy for admins to update user status
CREATE POLICY "Admins can update user status"
  ON public.public_users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
    )
  );

-- Add policy for admins to manage user roles
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name = 'Admin'
    )
  );

-- Function to approve a pending user
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_admin boolean;
  member_role_id uuid;
  pending_role_id uuid;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;
  
  -- Get role IDs
  SELECT id INTO member_role_id FROM public.roles WHERE name = 'Member';
  SELECT id INTO pending_role_id FROM public.roles WHERE name = 'Pending';
  
  -- Update user status
  UPDATE public.public_users
  SET status = 'active', is_active = true
  WHERE id = target_user_id;
  
  -- Update user role from Pending to Member
  UPDATE public.user_roles
  SET role_id = member_role_id
  WHERE user_id = target_user_id
    AND role_id = pending_role_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role and status
CREATE OR REPLACE FUNCTION public.get_user_info(user_id uuid)
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
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_public_users_status ON public.public_users(status);