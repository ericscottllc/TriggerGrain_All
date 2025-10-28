import type {
  CreateScenarioData,
  CreateSaleData,
  CreateRecommendationData,
  ScenarioSale
} from '../types/scenarioTypes';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export function validateScenario(data: CreateScenarioData): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Scenario name is required'
    });
  }

  if (data.name && data.name.length > 200) {
    errors.push({
      field: 'name',
      message: 'Scenario name must be 200 characters or less'
    });
  }

  if (!data.start_date) {
    errors.push({
      field: 'start_date',
      message: 'Start date is required'
    });
  }

  if (!data.end_date) {
    errors.push({
      field: 'end_date',
      message: 'End date is required'
    });
  }

  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (endDate <= startDate) {
      errors.push({
        field: 'end_date',
        message: 'End date must be after start date'
      });
    }
  }

  if (!data.production_estimate || data.production_estimate <= 0) {
    errors.push({
      field: 'production_estimate',
      message: 'Production estimate must be greater than 0'
    });
  }

  if (data.production_estimate && data.production_estimate > 10000000) {
    errors.push({
      field: 'production_estimate',
      message: 'Production estimate seems unreasonably high'
    });
  }

  const hasAnyGranularity = !!(
    data.crop_id ||
    data.class_id ||
    data.region_id ||
    data.town_id ||
    data.elevator_id
  );

  if (!hasAnyGranularity) {
    errors.push({
      field: 'granularity',
      message: 'At least one level of granularity (crop, class, region, town, or elevator) must be selected'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateSale(
  data: CreateSaleData,
  productionEstimate: number,
  existingSales: ScenarioSale[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.sale_date) {
    errors.push({
      field: 'sale_date',
      message: 'Sale date is required'
    });
  }

  if (!data.volume_bushels || data.volume_bushels <= 0) {
    errors.push({
      field: 'volume_bushels',
      message: 'Volume must be greater than 0'
    });
  }

  if (data.volume_bushels && data.volume_bushels > productionEstimate * 2) {
    errors.push({
      field: 'volume_bushels',
      message: 'Volume seems unreasonably high compared to production estimate'
    });
  }

  const totalExistingSales = existingSales.reduce(
    (sum, sale) => sum + sale.volume_bushels,
    0
  );
  const totalAfterNewSale = totalExistingSales + (data.volume_bushels || 0);

  if (totalAfterNewSale > productionEstimate * 1.5) {
    errors.push({
      field: 'volume_bushels',
      message: `Warning: Total sales (${totalAfterNewSale.toFixed(0)} bu) would exceed 150% of production estimate`
    });
  }

  if (!data.price_type) {
    errors.push({
      field: 'price_type',
      message: 'Price type is required'
    });
  }

  if (data.price_type === 'manual' && !data.cash_price) {
    errors.push({
      field: 'cash_price',
      message: 'Cash price is required for manual entry'
    });
  }

  if (data.price_type === 'grain_entry' && !data.grain_entry_id) {
    errors.push({
      field: 'grain_entry_id',
      message: 'Grain entry selection is required'
    });
  }

  if (data.cash_price !== undefined && data.cash_price < 0) {
    errors.push({
      field: 'cash_price',
      message: 'Cash price cannot be negative'
    });
  }

  if (data.cash_price !== undefined && data.cash_price > 1000) {
    errors.push({
      field: 'cash_price',
      message: 'Cash price seems unreasonably high'
    });
  }

  if (data.futures_price !== undefined && data.futures_price < 0) {
    errors.push({
      field: 'futures_price',
      message: 'Futures price cannot be negative'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRecommendation(
  data: CreateRecommendationData,
  scenarioStartDate: string,
  scenarioEndDate: string
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.target_date) {
    errors.push({
      field: 'target_date',
      message: 'Target date is required'
    });
  }

  if (data.target_date) {
    const targetDate = new Date(data.target_date);
    const startDate = new Date(scenarioStartDate);
    const endDate = new Date(scenarioEndDate);

    if (targetDate < startDate) {
      errors.push({
        field: 'target_date',
        message: 'Target date cannot be before scenario start date'
      });
    }

    if (targetDate > endDate) {
      errors.push({
        field: 'target_date',
        message: 'Target date cannot be after scenario end date'
      });
    }
  }

  if (data.target_percentage_sold === undefined || data.target_percentage_sold === null) {
    errors.push({
      field: 'target_percentage_sold',
      message: 'Target percentage is required'
    });
  }

  if (data.target_percentage_sold < 0) {
    errors.push({
      field: 'target_percentage_sold',
      message: 'Target percentage cannot be negative'
    });
  }

  if (data.target_percentage_sold > 100) {
    errors.push({
      field: 'target_percentage_sold',
      message: 'Target percentage cannot exceed 100%'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRecommendationSequence(
  recommendations: CreateRecommendationData[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (recommendations.length < 2) {
    return { isValid: true, errors: [] };
  }

  const sorted = [...recommendations].sort(
    (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = sorted[i - 1];

    if (current.target_percentage_sold < previous.target_percentage_sold) {
      errors.push({
        field: 'recommendations',
        message: `Target percentage on ${current.target_date} (${current.target_percentage_sold}%) is less than previous target on ${previous.target_date} (${previous.target_percentage_sold}%)`
      });
    }
  }

  const uniqueDates = new Set(recommendations.map(r => r.target_date));
  if (uniqueDates.size !== recommendations.length) {
    errors.push({
      field: 'recommendations',
      message: 'Each recommendation must have a unique target date'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end > start;
}

export function isWithinDateRange(
  date: string,
  startDate: string,
  endDate: string
): boolean {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return checkDate >= start && checkDate <= end;
}
