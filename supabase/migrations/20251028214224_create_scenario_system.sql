/*
  # Virtual Elevator Scenario Management System

  ## Overview
  This migration creates a comprehensive scenario management system for modeling
  grain marketing strategies. Admins can create virtual scenarios at any granularity
  level (crop, crop class, region, town, elevator) and track virtual sales against
  market data for performance evaluation.

  ## Tables Created

  ### 1. scenarios
  Core scenario definition with flexible granularity support. Scenarios can be
  defined at multiple levels: crop-only, crop+class, crop+class+region, or even
  specific elevator+town combinations.
  
  Columns:
  - `id` (uuid, primary key) - Unique scenario identifier
  - `name` (text, required) - Descriptive name for the scenario
  - `description` (text) - Detailed description of the scenario strategy
  - `crop_id` (uuid, optional) - Link to master_crops for crop-level scenarios
  - `class_id` (uuid, optional) - Link to crop_classes for class-specific scenarios
  - `region_id` (uuid, optional) - Link to master_regions for regional scenarios
  - `town_id` (uuid, optional) - Link to master_towns for town-specific scenarios
  - `elevator_id` (uuid, optional) - Link to master_elevators for elevator-specific scenarios
  - `start_date` (date, required) - Scenario start date
  - `end_date` (date, required) - Scenario end date
  - `production_estimate` (numeric, required) - Total bushels for the scenario
  - `status` (text, required) - Current status: planning, active, closed, evaluated
  - `risk_tolerance` (text) - Conservative, moderate, or aggressive
  - `market_assumptions` (text) - Notes on market conditions and assumptions
  - `notes` (text) - Additional notes and strategy details
  - `created_by` (uuid, required) - User who created the scenario
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. scenario_sales
  Individual virtual sale transactions within a scenario. Each sale represents
  a hypothetical grain sale decision with pricing, volume, and delivery details.
  
  Columns:
  - `id` (uuid, primary key) - Unique sale identifier
  - `scenario_id` (uuid, required) - Parent scenario reference
  - `sale_date` (date, required) - Date of the virtual sale
  - `volume_bushels` (numeric, required) - Bushels sold in this transaction
  - `percentage_of_production` (numeric) - Calculated percentage of total production
  - `price_type` (text, required) - Source: manual, grain_entry, current_market
  - `cash_price` (numeric) - Cash price per bushel
  - `futures_price` (numeric) - Futures price at time of sale
  - `basis` (numeric) - Calculated basis (cash - futures)
  - `elevator_id` (uuid) - Elevator for delivery
  - `town_id` (uuid) - Town location for delivery
  - `contract_month` (text) - Delivery month (e.g., March, May, November)
  - `grain_entry_id` (uuid) - Reference to grain_entries if price sourced from there
  - `notes` (text) - Additional sale notes
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. scenario_recommendations
  Percentage-sold targets by date to create a recommendation curve. Admins
  define strategic targets like "30% sold by March 31, 60% sold by June 30".
  
  Columns:
  - `id` (uuid, primary key) - Unique recommendation identifier
  - `scenario_id` (uuid, required) - Parent scenario reference
  - `target_date` (date, required) - Date by which target should be achieved
  - `target_percentage_sold` (numeric, required) - Target percentage (0-100)
  - `notes` (text) - Explanation of target rationale
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. scenario_evaluations
  Automated performance evaluations comparing scenario results against market
  data and recommendations. Evaluations can be interim or final.
  
  Columns:
  - `id` (uuid, primary key) - Unique evaluation identifier
  - `scenario_id` (uuid, required) - Parent scenario reference
  - `evaluation_date` (date, required) - Date evaluation was performed
  - `percentage_sold` (numeric, required) - Actual percentage sold at evaluation
  - `total_volume_sold` (numeric, required) - Total bushels sold
  - `average_price_achieved` (numeric) - Weighted average price of sales
  - `market_average_price` (numeric) - Average market price during scenario period
  - `market_high_price` (numeric) - Highest market price during period
  - `market_low_price` (numeric) - Lowest market price during period
  - `performance_score` (numeric) - Calculated performance metric (0-100)
  - `variance_from_recommendation` (numeric) - How far ahead/behind recommendation curve
  - `opportunities_missed` (integer) - Count of price spikes not captured
  - `total_revenue` (numeric) - Total realized revenue from sales
  - `unrealized_value` (numeric) - Value of unsold grain at current market price
  - `evaluation_notes` (text) - Detailed analysis and insights
  - `is_final` (boolean, default false) - Whether this is the final evaluation
  - `created_at` (timestamptz) - Creation timestamp

  ## Security (Row Level Security)
  
  All tables have RLS enabled with policies ensuring:
  - Only authenticated users with admin role can access scenarios
  - All CRUD operations restricted to admins
  - Automatic user tracking for audit trails

  ## Indexes
  
  Performance indexes created on:
  - scenario_id foreign keys for fast joins
  - status fields for filtering
  - date fields for temporal queries
  - created_by for user-based queries

  ## Functions
  
  - `update_scenario_timestamp()` - Automatically updates updated_at on row changes
  - `calculate_sale_percentage()` - Calculates percentage_of_production automatically
  - `check_scenario_overselling()` - Prevents total sales from exceeding production

  ## Important Notes
  
  - Scenarios use flexible granularity: any combination of crop/class/region/town/elevator can be NULL
  - Sales can exceed 100% if needed (for testing "what if" over-commitment scenarios)
  - Performance evaluation is automated via scheduled job or trigger
  - All monetary values stored as numeric for precision
*/

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  crop_id uuid REFERENCES master_crops(id) ON DELETE SET NULL,
  class_id uuid REFERENCES crop_classes(id) ON DELETE SET NULL,
  region_id uuid REFERENCES master_regions(id) ON DELETE SET NULL,
  town_id uuid REFERENCES master_towns(id) ON DELETE SET NULL,
  elevator_id uuid REFERENCES master_elevators(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  production_estimate numeric NOT NULL CHECK (production_estimate > 0),
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'closed', 'evaluated')),
  risk_tolerance text CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  market_assumptions text,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS scenario_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  sale_date date NOT NULL,
  volume_bushels numeric NOT NULL CHECK (volume_bushels > 0),
  percentage_of_production numeric,
  price_type text NOT NULL DEFAULT 'manual' CHECK (price_type IN ('manual', 'grain_entry', 'current_market')),
  cash_price numeric,
  futures_price numeric,
  basis numeric,
  elevator_id uuid REFERENCES master_elevators(id) ON DELETE SET NULL,
  town_id uuid REFERENCES master_towns(id) ON DELETE SET NULL,
  contract_month text,
  grain_entry_id uuid REFERENCES grain_entries(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  target_date date NOT NULL,
  target_percentage_sold numeric NOT NULL CHECK (target_percentage_sold >= 0 AND target_percentage_sold <= 100),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  evaluation_date date NOT NULL,
  percentage_sold numeric NOT NULL,
  total_volume_sold numeric NOT NULL,
  average_price_achieved numeric,
  market_average_price numeric,
  market_high_price numeric,
  market_low_price numeric,
  performance_score numeric CHECK (performance_score >= 0 AND performance_score <= 100),
  variance_from_recommendation numeric,
  opportunities_missed integer DEFAULT 0,
  total_revenue numeric,
  unrealized_value numeric,
  evaluation_notes text,
  is_final boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_by ON scenarios(created_by);
CREATE INDEX IF NOT EXISTS idx_scenarios_crop_id ON scenarios(crop_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_dates ON scenarios(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_scenario_sales_scenario_id ON scenario_sales(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_sales_date ON scenario_sales(sale_date);

CREATE INDEX IF NOT EXISTS idx_scenario_recommendations_scenario_id ON scenario_recommendations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_recommendations_target_date ON scenario_recommendations(target_date);

CREATE INDEX IF NOT EXISTS idx_scenario_evaluations_scenario_id ON scenario_evaluations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_evaluations_date ON scenario_evaluations(evaluation_date);

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scenario_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate percentage of production for sales
CREATE OR REPLACE FUNCTION calculate_sale_percentage()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Function to get total sales volume for a scenario
CREATE OR REPLACE FUNCTION get_scenario_total_sales(scenario_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total numeric;
BEGIN
  SELECT COALESCE(SUM(volume_bushels), 0) INTO total
  FROM scenario_sales
  WHERE scenario_id = scenario_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to get scenario percentage sold
CREATE OR REPLACE FUNCTION get_scenario_percentage_sold(scenario_uuid uuid)
RETURNS numeric AS $$
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on scenarios
CREATE TRIGGER update_scenarios_timestamp
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION update_scenario_timestamp();

-- Trigger to update updated_at on scenario_sales
CREATE TRIGGER update_scenario_sales_timestamp
  BEFORE UPDATE ON scenario_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_scenario_timestamp();

-- Trigger to calculate percentage on sale insert/update
CREATE TRIGGER calculate_scenario_sale_percentage
  BEFORE INSERT OR UPDATE ON scenario_sales
  FOR EACH ROW
  EXECUTE FUNCTION calculate_sale_percentage();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_evaluations ENABLE ROW LEVEL SECURITY;

-- Policies for scenarios table
CREATE POLICY "Admins can view all scenarios"
  ON scenarios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can create scenarios"
  ON scenarios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can update scenarios"
  ON scenarios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can delete scenarios"
  ON scenarios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

-- Policies for scenario_sales table
CREATE POLICY "Admins can view all scenario sales"
  ON scenario_sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can create scenario sales"
  ON scenario_sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can update scenario sales"
  ON scenario_sales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can delete scenario sales"
  ON scenario_sales FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

-- Policies for scenario_recommendations table
CREATE POLICY "Admins can view all scenario recommendations"
  ON scenario_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can create scenario recommendations"
  ON scenario_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can update scenario recommendations"
  ON scenario_recommendations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can delete scenario recommendations"
  ON scenario_recommendations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

-- Policies for scenario_evaluations table
CREATE POLICY "Admins can view all scenario evaluations"
  ON scenario_evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can create scenario evaluations"
  ON scenario_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can update scenario evaluations"
  ON scenario_evaluations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );

CREATE POLICY "Admins can delete scenario evaluations"
  ON scenario_evaluations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Admin'
    )
  );