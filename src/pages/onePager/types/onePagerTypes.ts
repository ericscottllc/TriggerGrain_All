export interface MasterCrop {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterElevator {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterTown {
  id: string;
  name: string;
  province: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MasterRegion {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GrainEntry {
  id: string;
  date: string;
  crop_id: string | null;
  elevator_id: string;
  town_id: string;
  month: string;
  year: number;
  cash_price: number | null;
  futures: number | null;
  basis: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  class_id: string | null;
  user_id: string;
}

export interface OnePagerConfig {
  id: string;
  region_id: string;
  elevator_id: string;
  town_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  crop_comparison_id: string | null;
  class_id: string | null;
  region?: MasterRegion;
  elevator?: MasterElevator;
  town?: MasterTown;
}

export interface OnePagerData {
  region: string;
  entries: {
    elevator: string;
    town: string;
    prices: { [month: string]: number | null };
  }[];
}