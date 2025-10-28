import type { GrainEntry } from '../types/analyticsTypes';

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number | null;
}

export interface SeriesConfig {
  key: string;
  name: string;
  color: string;
  strokeWidth?: number;
}

export interface CropClassChartData {
  cropClassName: string;
  chartData: ChartDataPoint[];
  series: SeriesConfig[];
}

const METRIC_COLORS = {
  price: '#10b981',
  futures: '#3b82f6',
  basis: '#f59e0b',
};

export const transformAnalyticsDataForCharts = (
  entries: GrainEntry[]
): CropClassChartData[] => {
  const cropClassGroups = new Map<string, GrainEntry[]>();

  entries.forEach(entry => {
    const className = entry.crop_classes?.name || 'Unknown';
    if (!cropClassGroups.has(className)) {
      cropClassGroups.set(className, []);
    }
    cropClassGroups.get(className)!.push(entry);
  });

  const result: CropClassChartData[] = [];

  cropClassGroups.forEach((classEntries, className) => {
    const locationMap = new Map<string, GrainEntry[]>();

    classEntries.forEach(entry => {
      const location = `${entry.master_elevators?.name || 'Unknown'} - ${entry.master_towns?.name || 'Unknown'}`;
      if (!locationMap.has(location)) {
        locationMap.set(location, []);
      }
      locationMap.get(location)!.push(entry);
    });

    const allDates = Array.from(new Set(classEntries.map(e => e.date))).sort();

    const chartData: ChartDataPoint[] = allDates.map(date => {
      const dataPoint: ChartDataPoint = { date };

      locationMap.forEach((locationEntries, location) => {
        const entriesForDate = locationEntries.filter(e => e.date === date);

        if (entriesForDate.length > 0) {
          const avgPrice = entriesForDate.reduce((sum, e) => sum + (e.cash_price || 0), 0) / entriesForDate.length;
          const avgFutures = entriesForDate.reduce((sum, e) => sum + (e.futures || 0), 0) / entriesForDate.length;
          const avgBasis = entriesForDate.reduce((sum, e) => sum + (e.basis || 0), 0) / entriesForDate.length;

          dataPoint[`${location}_price`] = avgPrice || null;
          dataPoint[`${location}_futures`] = avgFutures || null;
          dataPoint[`${location}_basis`] = avgBasis || null;
        }
      });

      return dataPoint;
    });

    const series: SeriesConfig[] = [];

    locationMap.forEach((_, location) => {
      series.push({
        key: `${location}_price`,
        name: `${location} - Price`,
        color: METRIC_COLORS.price,
        strokeWidth: 2,
      });

      series.push({
        key: `${location}_futures`,
        name: `${location} - Futures`,
        color: METRIC_COLORS.futures,
        strokeWidth: 2,
      });

      series.push({
        key: `${location}_basis`,
        name: `${location} - Basis`,
        color: METRIC_COLORS.basis,
        strokeWidth: 2,
      });
    });

    result.push({
      cropClassName: className,
      chartData,
      series,
    });
  });

  return result;
};

export const getDateRange = (entries: GrainEntry[]): { start: string; end: string } | null => {
  if (entries.length === 0) return null;

  const dates = entries.map(e => e.date).sort();
  return {
    start: dates[0],
    end: dates[dates.length - 1],
  };
};
