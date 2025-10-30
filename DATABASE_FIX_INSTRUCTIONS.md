# Database Fix Instructions

## Problem

Your database still has the old complex schema with:
- `user_roles` table with `role_id` (UUID) pointing to `roles` table
- `roles` table with Admin, Member, Pending roles
- Your user is assigned Admin via role_id, but the new code expects a simple text `role` column

## Solution

You need to apply the new migration that will:
1. Rename the old `user_roles` table to `user_roles_backup`
2. Create the new simplified `user_roles` table with text `role` column
3. Migrate all existing users to ADMIN role in the new table
4. Preserve old data as backup

## Steps to Fix

### Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration file: `supabase/migrations/20251030220000_migrate_existing_users_to_new_schema.sql`
4. Run the SQL
5. Verify by running:
   ```sql
   -- Check new table structure
   SELECT * FROM user_roles LIMIT 5;

   -- You should see columns: id, user_id, role (text), created_at, updated_at
   -- role should be 'ADMIN' or 'PENDING' (text, not UUID)
   ```

### Option 2: Manual SQL Fix

If the migration doesn't work, run this SQL directly:

```sql
-- Backup old table
ALTER TABLE public.user_roles RENAME TO user_roles_backup;

-- Create new simplified table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'PENDING')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Migrate all existing users as ADMIN
INSERT INTO public.user_roles (user_id, role, created_at)
SELECT
  user_id,
  'ADMIN' as role,
  COALESCE(assigned_at, NOW()) as created_at
FROM public.user_roles_backup
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Recreate helper function
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger function
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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Verify It Worked

Run this query to check:

```sql
SELECT
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY ur.created_at DESC;
```

You should see:
- `role` column showing 'ADMIN' (text, not a UUID)
- All your existing users should have 'ADMIN' role

## After Migration

1. **Clear browser cache and reload** - The app might have cached old auth state
2. **Sign out and sign in again** - This will reload your role from the new table
3. **You should see the main app** - Not the pending approval page

## Troubleshooting

### Still seeing "Pending" status after migration?

Run this to force your user to ADMIN:

```sql
-- Replace YOUR_EMAIL with your actual email
UPDATE public.user_roles
SET role = 'ADMIN'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL'
);
```

### Old tables causing issues?

Once you verify everything works, you can drop the old tables:

```sql
-- CAUTION: Only run after verifying new system works!
DROP TABLE IF EXISTS public.user_roles_backup CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.public_users CASCADE;
DROP TABLE IF EXISTS public.user_invitations CASCADE;
```

## What Changed in Code

The frontend now expects:
- `user_roles` table with simple text `role` column ('ADMIN' or 'PENDING')
- No complex joins with roles/permissions tables
- Auth context loads just the role text, not role_id
- `isApproved` checks if `role === 'ADMIN'`

This is much simpler and matches the Supabase Auth RBAC Guide pattern exactly.
