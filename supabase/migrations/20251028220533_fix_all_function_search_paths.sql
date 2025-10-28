/*
  # Fix All Function Search Path Security Warnings

  ## Overview
  This migration adds immutable search_path settings to all functions to prevent
  potential security vulnerabilities from search_path manipulation attacks.

  ## Strategy
  1. Drop ALL triggers that depend on the functions
  2. Drop and recreate functions with SET search_path
  3. Recreate ALL triggers

  ## Security Notes
  - Functions with SECURITY DEFINER require extra care with search_path
  - Setting search_path prevents malicious schema manipulation
  - All functions maintain their original functionality
*/

-- ============================================================================
-- STEP 1: Drop ALL triggers that depend on functions we're updating
-- ============================================================================

-- Triggers using update_clients_updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_client_elevators_updated_at ON client_elevators;
DROP TRIGGER IF EXISTS update_client_towns_updated_at ON client_towns;
DROP TRIGGER IF EXISTS update_client_regions_updated_at ON client_regions;
DROP TRIGGER IF EXISTS update_client_crops_updated_at ON client_crops;

-- Triggers using update_updated_at_column
DROP TRIGGER IF EXISTS update_crop_classes_updated_at ON crop_classes;
DROP TRIGGER IF EXISTS update_crop_specs_updated_at ON crop_specs;
DROP TRIGGER IF EXISTS update_elevator_crop_classes_updated_at ON elevator_crop_classes;
DROP TRIGGER IF EXISTS update_elevator_crops_updated_at ON elevator_crops;
DROP TRIGGER IF EXISTS update_elevator_towns_updated_at ON elevator_towns;
DROP TRIGGER IF EXISTS update_grain_entries_updated_at ON grain_entries;
DROP TRIGGER IF EXISTS update_master_crop_comparison_updated_at ON master_crop_comparison;
DROP TRIGGER IF EXISTS update_master_crops_updated_at ON master_crops;
DROP TRIGGER IF EXISTS update_master_elevators_updated_at ON master_elevators;
DROP TRIGGER IF EXISTS update_master_regions_updated_at ON master_regions;
DROP TRIGGER IF EXISTS update_master_towns_updated_at ON master_towns;
DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
DROP TRIGGER IF EXISTS update_public_users_updated_at ON public_users;
DROP TRIGGER IF EXISTS update_region_crop_comparisons_updated_at ON region_crop_comparisons;
DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
DROP TRIGGER IF EXISTS update_town_regions_updated_at ON town_regions;

-- Triggers using update_scenario_timestamp
DROP TRIGGER IF EXISTS update_scenarios_timestamp ON scenarios;
DROP TRIGGER IF EXISTS update_scenario_sales_timestamp ON scenario_sales;

-- Triggers using calculate_sale_percentage
DROP TRIGGER IF EXISTS calculate_scenario_sale_percentage ON scenario_sales;

-- Trigger using handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- STEP 2: Drop and recreate functions with SET search_path
-- ============================================================================

-- Drop functions
DROP FUNCTION IF EXISTS public.get_user_info(uuid);
DROP FUNCTION IF EXISTS public.get_last_n_dates(integer);
DROP FUNCTION IF EXISTS public.update_scenario_timestamp();
DROP FUNCTION IF EXISTS public.calculate_sale_percentage();
DROP FUNCTION IF EXISTS public.get_scenario_total_sales(uuid);
DROP FUNCTION IF EXISTS public.get_scenario_percentage_sold(uuid);
DROP FUNCTION IF EXISTS public.get_distinct_dates();
DROP FUNCTION IF EXISTS public.update_clients_updated_at();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.approve_user(uuid, uuid);

-- Recreate get_user_info
CREATE FUNCTION public.get_user_info(user_uuid uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pu.id,
    pu.email,
    pu.full_name,
    ARRAY_AGG(r.name) AS roles
  FROM public_users pu
  LEFT JOIN user_roles ur ON pu.id = ur.user_id
  LEFT JOIN roles r ON ur.role_id = r.id
  WHERE pu.id = user_uuid
  GROUP BY pu.id, pu.email, pu.full_name;
END;
$$;

-- Recreate get_last_n_dates
CREATE FUNCTION public.get_last_n_dates(n integer DEFAULT 5)
RETURNS TABLE(date date)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT grain_entries.date
  FROM grain_entries
  WHERE grain_entries.is_active = true
  ORDER BY grain_entries.date DESC
  LIMIT n;
END;
$$;

-- Recreate update_scenario_timestamp
CREATE FUNCTION public.update_scenario_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate calculate_sale_percentage
CREATE FUNCTION public.calculate_sale_percentage()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  production numeric;
BEGIN
  SELECT production_estimate INTO production
  FROM scenarios
  WHERE id = NEW.scenario_id;
  
  IF production > 0 THEN
    NEW.percentage_of_production = (NEW.volume_bushels / production) * 100;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate get_scenario_total_sales
CREATE FUNCTION public.get_scenario_total_sales(scenario_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(volume_bushels), 0) INTO total
  FROM scenario_sales
  WHERE scenario_id = scenario_uuid;
  
  RETURN total;
END;
$$;

-- Recreate get_scenario_percentage_sold
CREATE FUNCTION public.get_scenario_percentage_sold(scenario_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total_sold numeric;
  production numeric;
BEGIN
  SELECT COALESCE(SUM(volume_bushels), 0) INTO total_sold
  FROM scenario_sales
  WHERE scenario_id = scenario_uuid;
  
  SELECT production_estimate INTO production
  FROM scenarios
  WHERE id = scenario_uuid;
  
  IF production > 0 THEN
    RETURN (total_sold / production) * 100;
  END IF;
  
  RETURN 0;
END;
$$;

-- Recreate get_distinct_dates
CREATE FUNCTION public.get_distinct_dates()
RETURNS TABLE(date date)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT grain_entries.date
  FROM grain_entries
  WHERE grain_entries.is_active = true
  ORDER BY grain_entries.date DESC;
END;
$$;

-- Recreate update_clients_updated_at
CREATE FUNCTION public.update_clients_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate update_updated_at_column
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate handle_new_user
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.public_users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- Recreate approve_user
CREATE FUNCTION public.approve_user(user_uuid uuid, approver_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_role_id uuid;
BEGIN
  SELECT id INTO member_role_id FROM roles WHERE name = 'Member' LIMIT 1;
  
  IF member_role_id IS NULL THEN
    RAISE EXCEPTION 'Member role not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = approver_uuid AND r.name = 'Admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve users';
  END IF;
  
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (user_uuid, member_role_id, approver_uuid)
  ON CONFLICT DO NOTHING;
  
  UPDATE public_users
  SET is_active = true
  WHERE id = user_uuid;
END;
$$;

-- ============================================================================
-- STEP 3: Recreate ALL triggers
-- ============================================================================

-- Recreate triggers using update_clients_updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

CREATE TRIGGER update_client_elevators_updated_at
  BEFORE UPDATE ON client_elevators
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

CREATE TRIGGER update_client_towns_updated_at
  BEFORE UPDATE ON client_towns
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

CREATE TRIGGER update_client_regions_updated_at
  BEFORE UPDATE ON client_regions
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

CREATE TRIGGER update_client_crops_updated_at
  BEFORE UPDATE ON client_crops
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Recreate triggers using update_updated_at_column
CREATE TRIGGER update_crop_classes_updated_at
  BEFORE UPDATE ON crop_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crop_specs_updated_at
  BEFORE UPDATE ON crop_specs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elevator_crop_classes_updated_at
  BEFORE UPDATE ON elevator_crop_classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elevator_crops_updated_at
  BEFORE UPDATE ON elevator_crops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elevator_towns_updated_at
  BEFORE UPDATE ON elevator_towns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grain_entries_updated_at
  BEFORE UPDATE ON grain_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_crop_comparison_updated_at
  BEFORE UPDATE ON master_crop_comparison
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_crops_updated_at
  BEFORE UPDATE ON master_crops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_elevators_updated_at
  BEFORE UPDATE ON master_elevators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_regions_updated_at
  BEFORE UPDATE ON master_regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_towns_updated_at
  BEFORE UPDATE ON master_towns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_public_users_updated_at
  BEFORE UPDATE ON public_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_region_crop_comparisons_updated_at
  BEFORE UPDATE ON region_crop_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_town_regions_updated_at
  BEFORE UPDATE ON town_regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recreate scenario triggers
CREATE TRIGGER update_scenarios_timestamp
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_scenario_timestamp();

CREATE TRIGGER update_scenario_sales_timestamp
  BEFORE UPDATE ON scenario_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_scenario_timestamp();

CREATE TRIGGER calculate_scenario_sale_percentage
  BEFORE INSERT OR UPDATE ON scenario_sales
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sale_percentage();

-- Recreate auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();