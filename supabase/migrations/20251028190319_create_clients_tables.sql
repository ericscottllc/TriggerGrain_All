/*
  # Create Clients Management Tables

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, client/farm name)
      - `status` (text, Active/Inactive/Prospect/Archived)
      - `contact_email` (text, optional contact email)
      - `contact_phone` (text, optional contact phone)
      - `notes` (text, optional notes about client)
      - `metadata` (jsonb, for future extensibility)
      - `is_active` (boolean, soft delete flag)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `client_elevators`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `elevator_id` (uuid, foreign key to master_elevators)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `client_towns`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `town_id` (uuid, foreign key to master_towns)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `client_regions` (for future use)
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `region_id` (uuid, foreign key to master_regions)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `client_crops` (for future use)
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `crop_id` (uuid, foreign key to master_crops)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all client tables
    - Add policies for authenticated users to read and manage clients
    - Ensure proper foreign key constraints

  3. Indexes
    - Add indexes on foreign keys for performance
    - Add index on client name for searching
    - Add index on client status for filtering

  4. Notes
    - Metadata field allows adding custom attributes without schema changes
    - Junction tables support many-to-many relationships
    - All tables include soft delete capability via is_active flag
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  contact_email text,
  contact_phone text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT clients_status_check CHECK (status IN ('Active', 'Inactive', 'Prospect', 'Archived'))
);

-- Create client_elevators junction table
CREATE TABLE IF NOT EXISTS client_elevators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  elevator_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT client_elevators_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT client_elevators_elevator_id_fkey FOREIGN KEY (elevator_id) REFERENCES master_elevators(id) ON DELETE CASCADE,
  CONSTRAINT client_elevators_unique UNIQUE (client_id, elevator_id)
);

-- Create client_towns junction table
CREATE TABLE IF NOT EXISTS client_towns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  town_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT client_towns_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT client_towns_town_id_fkey FOREIGN KEY (town_id) REFERENCES master_towns(id) ON DELETE CASCADE,
  CONSTRAINT client_towns_unique UNIQUE (client_id, town_id)
);

-- Create client_regions junction table (for future use)
CREATE TABLE IF NOT EXISTS client_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  region_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT client_regions_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT client_regions_region_id_fkey FOREIGN KEY (region_id) REFERENCES master_regions(id) ON DELETE CASCADE,
  CONSTRAINT client_regions_unique UNIQUE (client_id, region_id)
);

-- Create client_crops junction table (for future use)
CREATE TABLE IF NOT EXISTS client_crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  crop_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT client_crops_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT client_crops_crop_id_fkey FOREIGN KEY (crop_id) REFERENCES master_crops(id) ON DELETE CASCADE,
  CONSTRAINT client_crops_unique UNIQUE (client_id, crop_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_client_elevators_client_id ON client_elevators(client_id);
CREATE INDEX IF NOT EXISTS idx_client_elevators_elevator_id ON client_elevators(elevator_id);
CREATE INDEX IF NOT EXISTS idx_client_towns_client_id ON client_towns(client_id);
CREATE INDEX IF NOT EXISTS idx_client_towns_town_id ON client_towns(town_id);
CREATE INDEX IF NOT EXISTS idx_client_regions_client_id ON client_regions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_regions_region_id ON client_regions(region_id);
CREATE INDEX IF NOT EXISTS idx_client_crops_client_id ON client_crops(client_id);
CREATE INDEX IF NOT EXISTS idx_client_crops_crop_id ON client_crops(crop_id);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_elevators ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_crops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
CREATE POLICY "Authenticated users can read all clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for client_elevators table
CREATE POLICY "Authenticated users can read client elevators"
  ON client_elevators
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client elevators"
  ON client_elevators
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client elevators"
  ON client_elevators
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client elevators"
  ON client_elevators
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for client_towns table
CREATE POLICY "Authenticated users can read client towns"
  ON client_towns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client towns"
  ON client_towns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client towns"
  ON client_towns
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client towns"
  ON client_towns
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for client_regions table
CREATE POLICY "Authenticated users can read client regions"
  ON client_regions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client regions"
  ON client_regions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client regions"
  ON client_regions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client regions"
  ON client_regions
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for client_crops table
CREATE POLICY "Authenticated users can read client crops"
  ON client_crops
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client crops"
  ON client_crops
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client crops"
  ON client_crops
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client crops"
  ON client_crops
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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
