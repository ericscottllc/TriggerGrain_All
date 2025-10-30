/*
  # Update RLS Policies for Business Tables

  ## Overview
  Updates RLS policies on all business tables to use the simplified is_approved_user() function.
  Only ADMIN users can access business tables. PENDING users have no access.

  ## Changes Made

  1. **Update Navigation Items Policies**
     - Allow approved users to read navigation items
     - Allow approved users to manage navigation items

  2. **Update Client-Related Tables Policies**
     - clients, client_elevators, client_towns, client_regions, client_crops
     - Only approved users can access

  3. **Update Scenario Tables Policies**
     - scenarios, scenario_sales, scenario_recommendations, scenario_evaluations
     - Only approved users can access

  ## Security
  - All policies use is_approved_user() helper function
  - No recursive queries
  - PENDING users are blocked from all business features
*/

-- Update navigation_items policies
DROP POLICY IF EXISTS "Anyone can read active navigation items" ON navigation_items;
DROP POLICY IF EXISTS "Authenticated users can manage navigation items" ON navigation_items;

CREATE POLICY "Approved users can read navigation items"
  ON navigation_items FOR SELECT
  TO authenticated
  USING (public.is_approved_user());

CREATE POLICY "Approved users can manage navigation items"
  ON navigation_items FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update clients table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON clients;
DROP POLICY IF EXISTS "Enable update for users based on email" ON clients;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON clients;

CREATE POLICY "Approved users can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update client_elevators table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON client_elevators;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON client_elevators;
DROP POLICY IF EXISTS "Enable update for users based on email" ON client_elevators;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON client_elevators;

CREATE POLICY "Approved users can manage client_elevators"
  ON client_elevators FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update client_towns table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON client_towns;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON client_towns;
DROP POLICY IF EXISTS "Enable update for users based on email" ON client_towns;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON client_towns;

CREATE POLICY "Approved users can manage client_towns"
  ON client_towns FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update client_regions table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON client_regions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON client_regions;
DROP POLICY IF EXISTS "Enable update for users based on email" ON client_regions;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON client_regions;

CREATE POLICY "Approved users can manage client_regions"
  ON client_regions FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update client_crops table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON client_crops;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON client_crops;
DROP POLICY IF EXISTS "Enable update for users based on email" ON client_crops;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON client_crops;

CREATE POLICY "Approved users can manage client_crops"
  ON client_crops FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update scenarios table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON scenarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON scenarios;
DROP POLICY IF EXISTS "Enable update for users based on email" ON scenarios;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON scenarios;

CREATE POLICY "Approved users can manage scenarios"
  ON scenarios FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update scenario_sales table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON scenario_sales;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON scenario_sales;
DROP POLICY IF EXISTS "Enable update for users based on email" ON scenario_sales;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON scenario_sales;

CREATE POLICY "Approved users can manage scenario_sales"
  ON scenario_sales FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update scenario_recommendations table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON scenario_recommendations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON scenario_recommendations;
DROP POLICY IF EXISTS "Enable update for users based on email" ON scenario_recommendations;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON scenario_recommendations;

CREATE POLICY "Approved users can manage scenario_recommendations"
  ON scenario_recommendations FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());

-- Update scenario_evaluations table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON scenario_evaluations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON scenario_evaluations;
DROP POLICY IF EXISTS "Enable update for users based on email" ON scenario_evaluations;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON scenario_evaluations;

CREATE POLICY "Approved users can manage scenario_evaluations"
  ON scenario_evaluations FOR ALL
  TO authenticated
  USING (public.is_approved_user())
  WITH CHECK (public.is_approved_user());
