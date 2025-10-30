/*
  # Migrate Existing Users to New Simplified Schema

  ## Overview
  This migration handles existing user data and ensures compatibility with the new simplified user_roles system.

  ## Changes Made

  1. **Check if new user_roles table exists**
     - If the new simplified table exists alongside old tables, migrate data

  2. **Migrate existing user role data**
     - Copy user roles from old complex schema to new simple schema
     - Map Admin role_id to 'ADMIN' text
     - Default others to 'ADMIN' (since all existing users should be admins)

  3. **Clean up (optional)**
     - Keep old tables for now in case rollback is needed
     - Can be dropped manually later once verified

  ## Security
  - Maintains all existing user access
  - All current users become ADMIN in new system
*/

-- First, check if we're working with the new simplified schema
DO $$
DECLARE
  has_new_schema boolean;
  has_old_schema boolean;
BEGIN
  -- Check if new user_roles exists with 'role' text column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name = 'role'
      AND data_type = 'text'
  ) INTO has_new_schema;

  -- Check if old user_roles exists with 'role_id' uuid column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name = 'role_id'
      AND data_type = 'uuid'
  ) INTO has_old_schema;

  -- If we have old schema but new table doesn't exist, we need to rename and recreate
  IF has_old_schema AND NOT has_new_schema THEN
    RAISE NOTICE 'Migrating from old schema to new schema...';

    -- Rename old table to backup
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

    -- Migrate data: Set all existing users as ADMIN
    INSERT INTO public.user_roles (user_id, role, created_at)
    SELECT
      user_id,
      'ADMIN' as role,
      COALESCE(assigned_at, NOW()) as created_at
    FROM public.user_roles_backup
    ON CONFLICT (user_id) DO NOTHING;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

    -- Recreate helper function
    CREATE OR REPLACE FUNCTION public.is_approved_user()
    RETURNS boolean AS $func$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'ADMIN'
      );
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Recreate trigger function
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $func$
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
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Recreate trigger
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

    RAISE NOTICE 'Migration complete. Old data backed up to user_roles_backup table.';
  ELSIF has_new_schema THEN
    RAISE NOTICE 'New schema already in place. No migration needed.';
  ELSE
    RAISE NOTICE 'No user_roles table found. Running initial setup...';
  END IF;
END $$;
