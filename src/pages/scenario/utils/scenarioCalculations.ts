import type {
  ScenarioSale,
  ScenarioRecommendation,
  MarketDataPoint,
  Scenario
} from '../types/scenarioTypes';

export function calculateWeightedAveragePrice(sales: ScenarioSale[]): number {
  if (sales.length === 0) return 0;

  const totalVolume = sales.reduce((sum, sale) => sum + sale.volume_bushels, 0);
  if (totalVolume === 0) return 0;

  const weightedSum = sales.reduce((sum, sale) => {
    const price = sale.cash_price || 0;
    return sum + (price * sale.volume_bushels);
  }, 0);

  return weightedSum / totalVolume;
}

export function calculateTotalRevenue(sales: ScenarioSale[]): number {
  return sales.reduce((sum, sale) => {
    const price = sale.cash_price || 0;
    return sum + (price * sale.volume_bushels);
  }, 0);
}

export function calculatePercentageSold(
  sales: ScenarioSale[],
  productionEstimate: number
): number {
  if (productionEstimate === 0) return 0;

  const totalSold = sales.reduce((sum, sale) => sum + sale.volume_bushels, 0);
  return (totalSold / productionEstimate) * 100;
}

export function calculateRemainingVolume(
  sales: ScenarioSale[],
  productionEstimate: number
): number {
  const totalSold = sales.reduce((sum, sale) => sum + sale.volume_bushels, 0);
  return Math.max(0, productionEstimate - totalSold);
}

export function calculateUnrealizedValue(
  sales: ScenarioSale[],
  productionEstimate: number,
  currentMarketPrice: number
): number {
  const remainingVolume = calculateRemainingVolume(sales, productionEstimate);
  return remainingVolume * currentMarketPrice;
}

export function calculateBasis(cashPrice?: number, futuresPrice?: number): number | null {
  if (!cashPrice || !futuresPrice) return null;
  return cashPrice - futuresPrice;
}

export function calculateMarketAverage(marketData: MarketDataPoint[]): number {
  if (marketData.length === 0) return 0;

  const sum = marketData.reduce((acc, point) => acc + point.cash_price, 0);
  return sum / marketData.length;
}

export function findMarketHighLow(marketData: MarketDataPoint[]): {
  high: number;
  low: number;
} {
  if (marketData.length === 0) return { high: 0, low: 0 };

  const prices = marketData.map(point => point.cash_price);
  return {
    high: Math.max(...prices),
    low: Math.min(...prices)
  };
}

export function calculatePerformanceScore(
  averagePriceAchieved: number,
  marketAveragePrice: number,
  marketHighPrice: number,
  varianceFromRecommendation: number
): number {
  if (marketHighPrice === 0) return 0;

  const pricePerformance = (averagePriceAchieved / marketHighPrice) * 100;
  const strategyAdherence = Math.max(0, 100 - Math.abs(varianceFromRecommendation));

  return Math.min(100, (pricePerformance * 0.7) + (strategyAdherence * 0.3));
}

export function calculateVarianceFromRecommendation(
  actualPercentageSold: number,
  recommendations: ScenarioRecommendation[],
  evaluationDate: Date
): number {
  if (recommendations.length === 0) return 0;

  const sortedRecs = [...recommendations].sort((a, b) =>
    new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );

  const relevantRec = sortedRecs.find(rec =>
    new Date(rec.target_date) >= evaluationDate
  ) || sortedRecs[sortedRecs.length - 1];

  if (!relevantRec) return 0;

  return actualPercentageSold - relevantRec.target_percentage_sold;
}

export function countMissedOpportunities(
  sales: ScenarioSale[],
  marketData: MarketDataPoint[],
  thresholdPercentile: number = 90
): number {
  if (marketData.length === 0) return 0;

  const prices = marketData.map(d => d.cash_price).sort((a, b) => b - a);
  const thresholdIndex = Math.floor(prices.length * (1 - thresholdPercentile / 100));
  const thresholdPrice = prices[thresholdIndex];

  const highPriceDates = new Set(
    marketData
      .filter(d => d.cash_price >= thresholdPrice)
      .map(d => d.date)
  );

  const saleDates = new Set(sales.map(s => s.sale_date));

  let missedCount = 0;
  highPriceDates.forEach(date => {
    if (!saleDates.has(date)) {
      missedCount++;
    }
  });

  return missedCount;
}

export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function formatVolume(value: number): string {
  return new Intl.NumberFormat('en-CA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value) + ' bu';
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%';
}

export function isScenarioReadyForEvaluation(
  scenario: Scenario,
  sales: ScenarioSale[],
  currentDate: Date = new Date()
): boolean {
  const percentageSold = calculatePercentageSold(sales, scenario.production_estimate);

  const endDate = new Date(scenario.end_date);
  const hasEnded = currentDate >= endDate;

  const significantlySold = percentageSold >= 80;

  return hasEnded || significantlySold;
}

export function getScenarioHealthStatus(
  percentageSold: number,
  recommendations: ScenarioRecommendation[],
  currentDate: Date = new Date()
): 'on-track' | 'ahead' | 'behind' | 'no-target' {
  if (recommendations.length === 0) return 'no-target';

  const sortedRecs = [...recommendations].sort((a, b) =>
    new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );

  const currentTarget = sortedRecs.find(rec =>
    new Date(rec.target_date) >= currentDate
  );

  if (!currentTarget) {
    const lastTarget = sortedRecs[sortedRecs.length - 1];
    if (percentageSold >= lastTarget.target_percentage_sold) {
      return 'on-track';
    }
    return 'behind';
  }

  const variance = percentageSold - currentTarget.target_percentage_sold;

  if (Math.abs(variance) <= 5) return 'on-track';
  if (variance > 5) return 'ahead';
  return 'behind';
}

export function interpolateRecommendation(
  recommendations: ScenarioRecommendation[],
  targetDate: Date
): number {
  if (recommendations.length === 0) return 0;

  const sortedRecs = [...recommendations].sort((a, b) =>
    new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );

  const targetTime = targetDate.getTime();

  const beforeRec = sortedRecs.filter(r => new Date(r.target_date).getTime() <= targetTime).pop();
  const afterRec = sortedRecs.find(r => new Date(r.target_date).getTime() > targetTime);

  if (!beforeRec && !afterRec) return 0;
  if (!afterRec) return beforeRec!.target_percentage_sold;
  if (!beforeRec) return 0;

  const beforeTime = new Date(beforeRec.target_date).getTime();
  const afterTime = new Date(afterRec.target_date).getTime();

  const ratio = (targetTime - beforeTime) / (afterTime - beforeTime);

  return beforeRec.target_percentage_sold +
    (ratio * (afterRec.target_percentage_sold - beforeRec.target_percentage_sold));
}
