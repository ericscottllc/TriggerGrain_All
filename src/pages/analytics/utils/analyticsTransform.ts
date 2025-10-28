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

export interface TermStructureDataPoint {
  deliveryMonth: string;
  deliverySort: number;
  futures: number | null;
  basis: number | null;
  [key: string]: string | number | null;
}

export interface CropClassTermStructure {
  cropClassName: string;
  dates: string[];
  termStructureByDate: Map<string, {
    data: TermStructureDataPoint[];
    locationKeys: string[];
  }>;
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

export const transformDataForTimeSeries = (entries: GrainEntry[]) => {
  const dateMap = new Map<string, Map<string, { cash: number[]; futures: number[]; basis: number[] }>>();

  entries.forEach(entry => {
    const date = entry.date;
    const locationKey = `${entry.master_elevators?.name || 'Unknown'} - ${entry.master_towns?.name || 'Unknown'}`;

    if (!dateMap.has(date)) {
      dateMap.set(date, new Map());
    }

    const dateData = dateMap.get(date)!;
    if (!dateData.has(locationKey)) {
      dateData.set(locationKey, { cash: [], futures: [], basis: [] });
    }

    const locationData = dateData.get(locationKey)!;
    if (entry.cash_price !== null) locationData.cash.push(entry.cash_price);
    if (entry.futures !== null) locationData.futures.push(entry.futures);
    if (entry.basis !== null) locationData.basis.push(entry.basis);
  });

  const allDates = Array.from(dateMap.keys()).sort();
  const allLocations = new Set<string>();
  dateMap.forEach(dateData => {
    dateData.forEach((_, location) => allLocations.add(location));
  });

  const chartData = allDates.map(date => {
    const dataPoint: ChartDataPoint = { date };
    const dateData = dateMap.get(date)!;

    allLocations.forEach(location => {
      const locationData = dateData.get(location);
      if (locationData) {
        const avgCash = locationData.cash.length > 0
          ? locationData.cash.reduce((a, b) => a + b, 0) / locationData.cash.length
          : null;
        const avgFutures = locationData.futures.length > 0
          ? locationData.futures.reduce((a, b) => a + b, 0) / locationData.futures.length
          : null;
        const avgBasis = locationData.basis.length > 0
          ? locationData.basis.reduce((a, b) => a + b, 0) / locationData.basis.length
          : null;

        dataPoint[`${location}_price`] = avgCash;
        dataPoint[`${location}_futures`] = avgFutures;
        dataPoint[`${location}_basis`] = avgBasis;
      }
    });

    return dataPoint;
  });

  return chartData;
};

export const transformDataByCropClass = (entries: GrainEntry[]) => {
  const cropClassGroups = new Map<string, GrainEntry[]>();

  entries.forEach(entry => {
    const className = entry.crop_classes?.name || 'Unknown';
    if (!cropClassGroups.has(className)) {
      cropClassGroups.set(className, []);
    }
    cropClassGroups.get(className)!.push(entry);
  });

  const result: Array<{ cropClassName: string; data: ChartDataPoint[] }> = [];

  cropClassGroups.forEach((classEntries, className) => {
    const data = transformDataForTimeSeries(classEntries);
    result.push({ cropClassName: className, data });
  });

  return result;
};

export const transformDataByLocation = (entries: GrainEntry[]) => {
  const locationGroups = new Map<string, GrainEntry[]>();

  entries.forEach(entry => {
    const locationKey = `${entry.master_elevators?.name || 'Unknown'} - ${entry.master_towns?.name || 'Unknown'}`;
    if (!locationGroups.has(locationKey)) {
      locationGroups.set(locationKey, []);
    }
    locationGroups.get(locationKey)!.push(entry);
  });

  const result: Array<{ locationName: string; data: ChartDataPoint[] }> = [];

  locationGroups.forEach((locationEntries, locationName) => {
    const data = transformDataForTimeSeries(locationEntries);
    result.push({ locationName, data });
  });

  return result;
};

const MONTH_ORDER: { [key: string]: number } = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12,
};

const createDeliveryMonthKey = (month: string, year: number): string => {
  return `${month} ${year}`;
};

const sortDeliveryMonths = (a: { month: string; year: number }, b: { month: string; year: number }): number => {
  if (a.year !== b.year) {
    return a.year - b.year;
  }
  return (MONTH_ORDER[a.month] || 0) - (MONTH_ORDER[b.month] || 0);
};

export const transformAnalyticsDataForTermStructure = (
  entries: GrainEntry[]
): CropClassTermStructure[] => {
  const cropClassGroups = new Map<string, GrainEntry[]>();

  entries.forEach(entry => {
    const className = entry.crop_classes?.name || 'Unknown';
    if (!cropClassGroups.has(className)) {
      cropClassGroups.set(className, []);
    }
    cropClassGroups.get(className)!.push(entry);
  });

  const result: CropClassTermStructure[] = [];

  cropClassGroups.forEach((classEntries, className) => {
    const dates = Array.from(new Set(classEntries.map(e => e.date))).sort();
    const termStructureByDate = new Map<string, {
      data: TermStructureDataPoint[];
      locationKeys: string[];
    }>();

    dates.forEach(date => {
      const entriesForDate = classEntries.filter(e => e.date === date);

      const deliveryMonthMap = new Map<string, {
        futures: number[];
        locations: Map<string, { cash: number[]; basis: number[] }>;
      }>();

      entriesForDate.forEach(entry => {
        const deliveryKey = createDeliveryMonthKey(entry.month, entry.year);
        const locationKey = `${entry.master_elevators?.name || 'Unknown'} - ${entry.master_towns?.name || 'Unknown'}`;

        if (!deliveryMonthMap.has(deliveryKey)) {
          deliveryMonthMap.set(deliveryKey, {
            futures: [],
            locations: new Map(),
          });
        }

        const deliveryData = deliveryMonthMap.get(deliveryKey)!;

        if (entry.futures !== null) {
          deliveryData.futures.push(entry.futures);
        }

        if (!deliveryData.locations.has(locationKey)) {
          deliveryData.locations.set(locationKey, { cash: [], basis: [] });
        }

        const locationData = deliveryData.locations.get(locationKey)!;
        if (entry.cash_price !== null) {
          locationData.cash.push(entry.cash_price);
        }
        if (entry.basis !== null) {
          locationData.basis.push(entry.basis);
        }
      });

      const deliveryMonths = Array.from(deliveryMonthMap.keys())
        .map(key => {
          const parts = key.split(' ');
          return { month: parts[0], year: parseInt(parts[1]), key };
        })
        .sort(sortDeliveryMonths);

      const allLocations = new Set<string>();
      deliveryMonthMap.forEach(data => {
        data.locations.forEach((_, location) => allLocations.add(location));
      });
      const locationKeys = Array.from(allLocations).sort();

      const termData: TermStructureDataPoint[] = deliveryMonths.map(({ key, month, year }, index) => {
        const deliveryData = deliveryMonthMap.get(key)!;

        const avgFutures = deliveryData.futures.length > 0
          ? deliveryData.futures.reduce((a, b) => a + b, 0) / deliveryData.futures.length
          : null;

        const dataPoint: TermStructureDataPoint = {
          deliveryMonth: key,
          deliverySort: index,
          futures: avgFutures,
          basis: null,
        };

        locationKeys.forEach(location => {
          const locationData = deliveryData.locations.get(location);
          if (locationData) {
            const avgCash = locationData.cash.length > 0
              ? locationData.cash.reduce((a, b) => a + b, 0) / locationData.cash.length
              : null;
            const avgBasis = locationData.basis.length > 0
              ? locationData.basis.reduce((a, b) => a + b, 0) / locationData.basis.length
              : null;

            dataPoint[`${location}_cash`] = avgCash;
            dataPoint[`${location}_basis`] = avgBasis;
          }
        });

        return dataPoint;
      });

      termStructureByDate.set(date, {
        data: termData,
        locationKeys,
      });
    });

    result.push({
      cropClassName: className,
      dates,
      termStructureByDate,
    });
  });

  return result;
};
