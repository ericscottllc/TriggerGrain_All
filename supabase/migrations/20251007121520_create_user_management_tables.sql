/*
  # Create User Management Tables

  ## Overview
  Creates the user management system with roles and permissions

  ## New Tables
  1. **roles** - System roles (Admin, Member, Pending)
     - id, name, description, is_system_role, is_active, timestamps
  
  2. **permissions** - Granular permissions
     - id, name, description, resource, action, is_active, timestamps
  
  3. **role_permissions** - Many-to-many: roles to permissions
     - id, role_id, permission_id, created_at
  
  4. **user_roles** - Many-to-many: users to roles
     - id, user_id, role_id, assigned_by, assigned_at

  ## Security
  - RLS enabled on all tables
  - Proper policies for role-based access
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system_role boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  resource text NOT NULL,
  action text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.public_users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.public_users(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles (Read-only for authenticated users)
CREATE POLICY "Authenticated users can read roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for permissions (Read-only for authenticated users)
CREATE POLICY "Authenticated users can read permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for role_permissions (Read-only for authenticated users)
CREATE POLICY "Authenticated users can read role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_roles (Users can read own roles)
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();