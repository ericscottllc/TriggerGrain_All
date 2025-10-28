export interface CropClass {
  id: string;
  name: string;
  code?: string;
  crop_id: string;
}

export interface Region {
  id: string;
  name: string;
  code?: string;
}

export interface ElevatorTownPair {
  elevator_id: string;
  elevator_name: string;
  town_id: string;
  town_name: string;
}

export interface GrainEntryFormData {
  date: string;
  cropClassId: string;
  regionId: string;
}

export interface MonthYearColumn {
  id: string;
  month: number;
  year: number;
  monthName: string;
  futuresPrice: string;
}

export interface GrainEntryRow {
  id: string;
  elevatorId: string;
  elevatorName: string;
  townId: string;
  townName: string;
  cashPrices: { [monthYearId: string]: string };
  basis: { [monthYearId: string]: number | null };
}

export interface GrainEntrySubmission {
  date: string;
  cropClassId: string;
  entries: {
    elevatorId: string;
    townId: string;
    month: number;
    year: number;
    monthName: string;
    futuresPrice: number;
    cashPrice: number;
    basis: number;
  }[];
}

export interface QueryFilters {
  dateRange: 'recent' | 'last30' | 'last90' | 'thisYear' | 'lastYear' | 'custom';
  startDate?: string;
  endDate?: string;
  cropIds: string[];
  classIds: string[];
  regionIds: string[];
  elevatorIds: string[];
  townIds: string[];
  limit?: number;
}