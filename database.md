-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.crop_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crop_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT crop_classes_pkey PRIMARY KEY (id),
  CONSTRAINT crop_classes_crop_id_fkey FOREIGN KEY (crop_id) REFERENCES public.master_crops(id)
);
CREATE TABLE public.crop_specs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  protein_percent numeric,
  moisture_percent numeric,
  other_specs jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT crop_specs_pkey PRIMARY KEY (id),
  CONSTRAINT crop_specs_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.crop_classes(id)
);
CREATE TABLE public.elevator_crop_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  elevator_id uuid NOT NULL,
  class_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT elevator_crop_classes_pkey PRIMARY KEY (id),
  CONSTRAINT elevator_crop_classes_elevator_id_fkey FOREIGN KEY (elevator_id) REFERENCES public.master_elevators(id),
  CONSTRAINT elevator_crop_classes_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.crop_classes(id)
);
CREATE TABLE public.elevator_crops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  elevator_id uuid NOT NULL,
  crop_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT elevator_crops_pkey PRIMARY KEY (id),
  CONSTRAINT elevator_crops_elevator_id_fkey FOREIGN KEY (elevator_id) REFERENCES public.master_elevators(id),
  CONSTRAINT elevator_crops_crop_id_fkey FOREIGN KEY (crop_id) REFERENCES public.master_crops(id)
);
CREATE TABLE public.elevator_towns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  elevator_id uuid NOT NULL,
  town_id uuid NOT NULL,
  valid_from date DEFAULT CURRENT_DATE,
  valid_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT elevator_towns_pkey PRIMARY KEY (id),
  CONSTRAINT elevator_towns_elevator_id_fkey FOREIGN KEY (elevator_id) REFERENCES public.master_elevators(id),
  CONSTRAINT elevator_towns_town_id_fkey FOREIGN KEY (town_id) REFERENCES public.master_towns(id)
);
CREATE TABLE public.grain_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  crop_id uuid,
  elevator_id uuid NOT NULL,
  town_id uuid NOT NULL,
  month text NOT NULL,
  year integer NOT NULL,
  cash_price numeric,
  futures numeric,
  basis numeric,
  notes text DEFAULT ''::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  class_id uuid,
  user_id uuid NOT NULL,
  CONSTRAINT grain_entries_pkey PRIMARY KEY (id),
  CONSTRAINT grain_entries_crop_id_fkey FOREIGN KEY (crop_id) REFERENCES public.master_crops(id),
  CONSTRAINT grain_entries_elevator_id_fkey FOREIGN KEY (elevator_id) REFERENCES public.master_elevators(id),
  CONSTRAINT grain_entries_town_id_fkey FOREIGN KEY (town_id) REFERENCES public.master_towns(id),
  CONSTRAINT grain_entries_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.crop_classes(id),
  CONSTRAINT grain_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.master_crop_comparison (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_crop_comparison_pkey PRIMARY KEY (id)
);
CREATE TABLE public.master_crops (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_crops_pkey PRIMARY KEY (id)
);
CREATE TABLE public.master_elevators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_elevators_pkey PRIMARY KEY (id)
);
CREATE TABLE public.master_regions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_regions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.master_towns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  province text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_towns_pkey PRIMARY KEY (id)
);
CREATE TABLE public.navigation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Circle'::text,
  subdomain text NOT NULL,
  color text NOT NULL DEFAULT 'tg-primary'::text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  redirect_active boolean NOT NULL DEFAULT false,
  CONSTRAINT navigation_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  resource text NOT NULL,
  action text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.public_users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT public_users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.region_crop_comparisons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL,
  crop_comparison_id uuid NOT NULL,
  valid_from date DEFAULT CURRENT_DATE,
  valid_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT region_crop_comparisons_pkey PRIMARY KEY (id),
  CONSTRAINT region_crop_comparisons_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.master_regions(id),
  CONSTRAINT region_crop_comparisons_crop_comparison_id_fkey FOREIGN KEY (crop_comparison_id) REFERENCES public.master_crop_comparison(id)
);
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system_role boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.schema_queries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  sql_query text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schema_queries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.town_regions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  town_id uuid NOT NULL,
  region_id uuid NOT NULL,
  valid_from date DEFAULT CURRENT_DATE,
  valid_to date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT town_regions_pkey PRIMARY KEY (id),
  CONSTRAINT town_regions_town_id_fkey FOREIGN KEY (town_id) REFERENCES public.master_towns(id),
  CONSTRAINT town_regions_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.master_regions(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.public_users(id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.public_users(id)
);