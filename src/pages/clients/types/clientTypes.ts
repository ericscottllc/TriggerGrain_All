export type ClientStatus = 'Active' | 'Inactive' | 'Prospect' | 'Archived';

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientElevator {
  id: string;
  client_id: string;
  elevator_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_elevators?: {
    id: string;
    name: string;
    code: string | null;
  };
}

export interface ClientTown {
  id: string;
  client_id: string;
  town_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_towns?: {
    id: string;
    name: string;
    province: string | null;
  };
}

export interface ClientRegion {
  id: string;
  client_id: string;
  region_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_regions?: {
    id: string;
    name: string;
    code: string | null;
  };
}

export interface ClientCrop {
  id: string;
  client_id: string;
  crop_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_crops?: {
    id: string;
    name: string;
    code: string | null;
  };
}

export interface ClientWithAssociations extends Client {
  client_elevators: ClientElevator[];
  client_towns: ClientTown[];
  client_regions: ClientRegion[];
  client_crops: ClientCrop[];
  elevator_count?: number;
  town_count?: number;
  region_count?: number;
  crop_count?: number;
}

export interface ClientFormData {
  name: string;
  status: ClientStatus;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  elevator_ids: string[];
  town_ids: string[];
  region_ids: string[];
  crop_ids: string[];
}

export interface ClientPricingEntry {
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
  notes: string;
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

export interface ClientPricingFilters {
  dateRange: '7days' | '30days' | '90days' | 'custom';
  startDate?: string;
  endDate?: string;
  crop_ids: string[];
  elevator_ids: string[];
  town_ids: string[];
  sortBy: 'date' | 'cash_price' | 'basis';
  sortOrder: 'asc' | 'desc';
}

export interface ClientDashboardStats {
  total_elevators: number;
  total_towns: number;
  total_regions: number;
  total_crops: number;
  last_pricing_update: string | null;
  pricing_entries_count: number;
}

export interface ClientListFilters {
  searchTerm: string;
  status: ClientStatus | 'All';
  sortBy: 'name' | 'status' | 'updated_at';
  sortOrder: 'asc' | 'desc';
}
