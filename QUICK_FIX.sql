-- QUICK FIX: Run this SQL in your Supabase Dashboard SQL Editor
-- This will migrate your database from the old complex schema to the new simple schema

-- Step 1: Backup and rename old table
ALTER TABLE IF EXISTS public.user_roles RENAME TO user_roles_backup;

-- Step 2: Create new simplified user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'PENDING')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Enable RLS on new table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple RLS policies
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 5: Migrate existing users as ADMIN
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT
  user_id,
  'ADMIN' as role,
  COALESCE(assigned_at, NOW()) as created_at
FROM public.user_roles_backup
ON CONFLICT (user_id) DO NOTHING;

-- Step 6: Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Step 7: Create helper function for RLS policies on business tables
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger for automatic role assignment on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count integer;
  assigned_role text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;

  IF user_count = 0 THEN
    assigned_role := 'ADMIN';
  ELSE
    assigned_role := 'PENDING';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Verify migration
SELECT
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at DESC;

-- You should see all users with role = 'ADMIN' (text, not UUID)
