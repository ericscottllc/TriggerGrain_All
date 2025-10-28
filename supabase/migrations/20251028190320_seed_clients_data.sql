/*
  # Seed Initial Client Data

  1. Data Seeding
    - Insert 10 farm clients from clients.md file
    - Create associations between clients and their elevators
    - Create associations between clients and their towns
    - All clients set to Active status by default

  2. Client Data
    - Jerald Bowey (7 elevator-town associations)
    - Arnie Bechard (6 elevator-town associations)
    - Devon Walker (12 elevator-town associations)
    - Harbin Seed Farms (12 elevator-town associations)
    - Ian Brassington (12 elevator-town associations)
    - Mccormick Bros (12 elevator-town associations)
    - Jose & Crystal Mendez (12 elevator-town associations)
    - Samida Farms (9 elevator-town associations)
    - Array Farms (10 elevator-town associations)
    - Cochet/Webb (9 elevator-town associations)

  3. Notes
    - Using actual elevator and town IDs from master tables
    - Broker/Picked Up associations included
    - All associations set to active by default
*/

-- Insert clients
INSERT INTO clients (name, status) VALUES
  ('Jerald Bowey', 'Active'),
  ('Arnie Bechard', 'Active'),
  ('Devon Walker', 'Active'),
  ('Harbin Seed Farms', 'Active'),
  ('Ian Brassington', 'Active'),
  ('Mccormick Bros', 'Active'),
  ('Jose & Crystal Mendez', 'Active'),
  ('Samida Farms', 'Active'),
  ('Array Farms', 'Active'),
  ('Cochet/Webb', 'Active')
ON CONFLICT DO NOTHING;

-- Create temporary table to store client IDs for associations
DO $$
DECLARE
  v_jerald_bowey_id uuid;
  v_arnie_bechard_id uuid;
  v_devon_walker_id uuid;
  v_harbin_seed_id uuid;
  v_ian_brassington_id uuid;
  v_mccormick_bros_id uuid;
  v_jose_crystal_id uuid;
  v_samida_farms_id uuid;
  v_array_farms_id uuid;
  v_cochet_webb_id uuid;
BEGIN
  -- Get client IDs
  SELECT id INTO v_jerald_bowey_id FROM clients WHERE name = 'Jerald Bowey';
  SELECT id INTO v_arnie_bechard_id FROM clients WHERE name = 'Arnie Bechard';
  SELECT id INTO v_devon_walker_id FROM clients WHERE name = 'Devon Walker';
  SELECT id INTO v_harbin_seed_id FROM clients WHERE name = 'Harbin Seed Farms';
  SELECT id INTO v_ian_brassington_id FROM clients WHERE name = 'Ian Brassington';
  SELECT id INTO v_mccormick_bros_id FROM clients WHERE name = 'Mccormick Bros';
  SELECT id INTO v_jose_crystal_id FROM clients WHERE name = 'Jose & Crystal Mendez';
  SELECT id INTO v_samida_farms_id FROM clients WHERE name = 'Samida Farms';
  SELECT id INTO v_array_farms_id FROM clients WHERE name = 'Array Farms';
  SELECT id INTO v_cochet_webb_id FROM clients WHERE name = 'Cochet/Webb';

  -- Jerald Bowey associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_jerald_bowey_id, id FROM master_elevators WHERE name IN ('ADM', 'Pioneer', 'Viterra', 'G3', 'P&H', 'Husky')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_jerald_bowey_id, id FROM master_towns WHERE name IN ('Lloydminster', 'Unity', 'Maidstone', 'Provost', 'Wilkie')
  ON CONFLICT DO NOTHING;

  -- Arnie Bechard associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_arnie_bechard_id, id FROM master_elevators WHERE name IN ('Viterra', 'Cargill', 'ADM', 'Broker', 'Providence')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_arnie_bechard_id, id FROM master_towns WHERE name IN ('Rosetown', 'Clavet', 'Lloydminster', 'Picked Up', 'Marengo')
  ON CONFLICT DO NOTHING;

  -- Devon Walker associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_devon_walker_id, id FROM master_elevators WHERE name IN ('G3', 'Pioneer', 'Viterra', 'ADM', 'Cargill', 'P&H', 'Husky', 'Broker')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_devon_walker_id, id FROM master_towns WHERE name IN ('Maidstone', 'Marshall', 'Lloydminster', 'N. Battleford', 'Wilkie', 'Picked Up')
  ON CONFLICT DO NOTHING;

  -- Harbin Seed Farms associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_harbin_seed_id, id FROM master_elevators WHERE name IN ('G3', 'Pioneer', 'Viterra', 'ADM', 'Cargill', 'Providence', 'P&H', 'Husky', 'Broker')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_harbin_seed_id, id FROM master_towns WHERE name IN ('Maidstone', 'Marshall', 'Lloydminster', 'Vermilion', 'Camrose', 'Provost', 'Viking', 'Picked Up')
  ON CONFLICT DO NOTHING;

  -- Ian Brassington associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_ian_brassington_id, id FROM master_elevators WHERE name IN ('G3', 'Pioneer', 'Viterra', 'ADM', 'Cargill', 'Providence', 'P&H', 'Husky', 'Broker')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_ian_brassington_id, id FROM master_towns WHERE name IN ('Maidstone', 'Marshall', 'Lloydminster', 'Vermilion', 'Camrose', 'Provost', 'Viking', 'Picked Up')
  ON CONFLICT DO NOTHING;

  -- Mccormick Bros associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_mccormick_bros_id, id FROM master_elevators WHERE name IN ('G3', 'Pioneer', 'Viterra', 'ADM', 'Cargill', 'Providence', 'P&H', 'Husky', 'Broker')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_mccormick_bros_id, id FROM master_towns WHERE name IN ('Maidstone', 'Marshall', 'Lloydminster', 'Vermilion', 'Camrose', 'Provost', 'Viking', 'Picked Up')
  ON CONFLICT DO NOTHING;

  -- Jose & Crystal Mendez associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_jose_crystal_id, id FROM master_elevators WHERE name IN ('G3', 'Pioneer', 'Viterra', 'ADM', 'Cargill', 'Providence', 'P&H', 'Husky', 'Broker')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_jose_crystal_id, id FROM master_towns WHERE name IN ('Maidstone', 'Marshall', 'Lloydminster', 'Vermilion', 'Camrose', 'Provost', 'Viking', 'Picked Up')
  ON CONFLICT DO NOTHING;

  -- Samida Farms associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_samida_farms_id, id FROM master_elevators WHERE name IN ('Viterra', 'G3', 'P&H', 'Broker', 'Cargill', 'Bunge', 'ADM', 'LDC')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_samida_farms_id, id FROM master_towns WHERE name IN ('Melfort', 'Tisdale', 'Picked Up', 'Clavet', 'Nipawin', 'Watson', 'Yorkton')
  ON CONFLICT DO NOTHING;

  -- Array Farms associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_array_farms_id, id FROM master_elevators WHERE name IN ('ADM', 'Pioneer', 'Viterra', 'G3', 'Cargill', 'P&H', 'Husky', 'GrainsConnect', 'Broker')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_array_farms_id, id FROM master_towns WHERE name IN ('Lloydminster', 'Marshall', 'Maidstone', 'N. Battleford', 'Hamlin', 'Maymont', 'Picked Up')
  ON CONFLICT DO NOTHING;

  -- Cochet/Webb associations
  INSERT INTO client_elevators (client_id, elevator_id)
  SELECT v_cochet_webb_id, id FROM master_elevators WHERE name IN ('ADM', 'Pioneer', 'Viterra', 'G3', 'Cargill', 'P&H', 'Husky', 'Broker')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_towns (client_id, town_id)
  SELECT v_cochet_webb_id, id FROM master_towns WHERE name IN ('Lloydminster', 'Marshall', 'Maidstone', 'N. Battleford', 'Hamlin', 'Picked Up')
  ON CONFLICT DO NOTHING;

END $$;
