export interface AnalyticsFilters {
  dateRange: '30dates' | '60dates' | '90dates' | '180dates' | '365dates' | 'custom';
  startDate?: string;
  endDate?: string;
  crop_ids: string[];
  class_ids: string[];
  elevator_ids: string[];
  town_ids: string[];
  region_ids: string[];
}

export interface GrainEntry {
  id: string;
  date: string;
  crop_id: string;
  class_id: string;
  elevator_id: string;
  town_id: string;
  month: string;
  year: number;
  cash_price: number | null;
  futures: number | null;
  basis: number | null;
  master_crops?: {
    name: string;
    code: string | null;
  };
  crop_classes?: {
    name: string;
    code: string | null;
  };
  master_elevators?: {
    name: string;
  };
  master_towns?: {
    name: string;
    province: string | null;
  };
}

export interface MasterCrop {
  id: string;
  name: string;
  code: string | null;
}

export interface CropClass {
  id: string;
  crop_id: string;
  name: string;
  code: string | null;
}

export interface MasterElevator {
  id: string;
  name: string;
  code: string | null;
}

export interface MasterTown {
  id: string;
  name: string;
  province: string | null;
}

export interface MasterRegion {
  id: string;
  name: string;
  code: string | null;
}
