export type ScenarioStatus = 'planning' | 'active' | 'closed' | 'evaluated';
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type PriceType = 'manual' | 'grain_entry' | 'current_market';

export interface Scenario {
  id: string;
  name: string;
  description?: string;
  crop_id?: string;
  crop_name?: string;
  class_id?: string;
  class_name?: string;
  region_id?: string;
  region_name?: string;
  town_id?: string;
  town_name?: string;
  elevator_id?: string;
  elevator_name?: string;
  start_date: string;
  end_date: string;
  production_estimate: number;
  status: ScenarioStatus;
  risk_tolerance?: RiskTolerance;
  market_assumptions?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScenarioWithStats extends Scenario {
  total_sales: number;
  percentage_sold: number;
  average_price: number;
  total_revenue: number;
  sales_count: number;
  last_sale_date?: string;
  latest_evaluation?: ScenarioEvaluation;
}

export interface ScenarioSale {
  id: string;
  scenario_id: string;
  sale_date: string;
  volume_bushels: number;
  percentage_of_production: number;
  price_type: PriceType;
  cash_price?: number;
  futures_price?: number;
  basis?: number;
  elevator_id?: string;
  elevator_name?: string;
  town_id?: string;
  town_name?: string;
  contract_month?: string;
  grain_entry_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScenarioRecommendation {
  id: string;
  scenario_id: string;
  target_date: string;
  target_percentage_sold: number;
  notes?: string;
  created_at: string;
}

export interface ScenarioEvaluation {
  id: string;
  scenario_id: string;
  evaluation_date: string;
  percentage_sold: number;
  total_volume_sold: number;
  average_price_achieved?: number;
  market_average_price?: number;
  market_high_price?: number;
  market_low_price?: number;
  performance_score?: number;
  variance_from_recommendation?: number;
  opportunities_missed: number;
  total_revenue?: number;
  unrealized_value?: number;
  evaluation_notes?: string;
  is_final: boolean;
  created_at: string;
}

export interface CreateScenarioData {
  name: string;
  description?: string;
  crop_id?: string;
  class_id?: string;
  region_id?: string;
  town_id?: string;
  elevator_id?: string;
  start_date: string;
  end_date: string;
  production_estimate: number;
  risk_tolerance?: RiskTolerance;
  market_assumptions?: string;
  notes?: string;
}

export interface CreateSaleData {
  scenario_id: string;
  sale_date: string;
  volume_bushels: number;
  price_type: PriceType;
  cash_price?: number;
  futures_price?: number;
  basis?: number;
  elevator_id?: string;
  town_id?: string;
  contract_month?: string;
  grain_entry_id?: string;
  notes?: string;
}

export interface CreateRecommendationData {
  scenario_id: string;
  target_date: string;
  target_percentage_sold: number;
  notes?: string;
}

export interface ScenarioFilters {
  status?: ScenarioStatus;
  crop_id?: string;
  class_id?: string;
  region_id?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ScenarioMetrics {
  totalScenarios: number;
  activeScenarios: number;
  completedScenarios: number;
  averagePerformanceScore: number;
}

export interface MarketDataPoint {
  date: string;
  cash_price: number;
  futures_price: number;
  basis: number;
}

export interface ChartDataPoint {
  date: string;
  price: number;
  type: 'market' | 'sale' | 'recommendation';
  label?: string;
}

export interface PerformanceComparison {
  scenarioId: string;
  scenarioName: string;
  averagePrice: number;
  totalRevenue: number;
  percentageSold: number;
  performanceScore: number;
  varianceFromRecommendation: number;
}
