/*
  # Simplified User Roles System - ADMIN and PENDING only

  ## Overview
  This migration implements a simplified role-based access control system with only two roles:
  - ADMIN: Full system access
  - PENDING: Awaiting approval, no access to features

  ## Changes Made

  1. **New Tables**
    - `user_roles`: Simple table linking auth.users to a role (ADMIN or PENDING)
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `role` (text, constrained to ADMIN or PENDING)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. **Automatic Role Assignment**
    - `handle_new_user()`: Trigger function that runs when new user signs up
    - First user becomes ADMIN automatically
    - All subsequent users are PENDING

  3. **Helper Functions**
    - `is_approved_user()`: Returns true if user is ADMIN, used by RLS policies

  4. **RLS Policies**
    - Users can read their own role only
    - Service role has full access (for Edge Functions)
    - Simple, non-recursive policies to avoid infinite loops

  ## Security
  - RLS enabled on user_roles table
  - No recursive policy checks that could cause deadlocks
  - Service role used only in Edge Functions for admin operations
  - All admin operations require manual verification of admin status
*/

-- Drop existing complex tables if they exist (we're simplifying)
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.user_invitations CASCADE;
DROP TABLE IF EXISTS public.public_users CASCADE;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_info(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.approve_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_user() CASCADE;

-- Create simplified user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN', 'PENDING')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own role only (no recursion)
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Service role has full access (used by Edge Functions)
CREATE POLICY "Service role can manage all roles"
  ON public.user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create automatic role assignment trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count integer;
  assigned_role text;
BEGIN
  -- Count existing user roles
  SELECT COUNT(*) INTO user_count FROM public.user_roles;

  -- First user gets ADMIN, everyone else gets PENDING
  IF user_count = 0 THEN
    assigned_role := 'ADMIN';
  ELSE
    assigned_role := 'PENDING';
  END IF;

  -- Insert the role for the new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function for RLS policies on business tables
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Migrate existing users to new system (set all existing users as ADMIN)
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  FOR existing_user_id IN
    SELECT id FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.user_roles)
  LOOP
    INSERT INTO public.user_roles (user_id, role)
    VALUES (existing_user_id, 'ADMIN')
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;
