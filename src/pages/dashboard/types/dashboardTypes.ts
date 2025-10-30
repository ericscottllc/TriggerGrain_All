export interface DashboardStats {
  totalEntries: number;
  activeCropClasses: number;
  recentEntries: number;
  avgPrice: number;
}

export interface PriceTrend {
  cropClassId: string;
  cropClassName: string;
  cropClassCode: string;
  dataPoints: {
    date: string;
    price: number;
  }[];
  change: number;
  changePercent: number;
}

export interface ElevatorPerformance {
  elevatorId: string;
  elevatorName: string;
  cropClassId: string;
  cropClassName: string;
  regionId: string;
  regionName: string;
  avgPrice: number;
  entryCount: number;
}

export interface DeliveryMonthTrend {
  deliveryMonth: string;
  deliveryYear: number;
  avgPrice: number;
  entryCount: number;
  sortKey: number;
}
