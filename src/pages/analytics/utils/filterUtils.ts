import type { GrainEntry, AnalyticsFilters } from '../types/analyticsTypes';

export const applyLocalFilters = (
  allEntries: GrainEntry[],
  filters: Partial<AnalyticsFilters>,
  lastNDates: string[] | null
): GrainEntry[] => {
  let filtered = [...allEntries];

  if (lastNDates && lastNDates.length > 0) {
    filtered = filtered.filter(entry => lastNDates.includes(entry.date));
  }

  if (filters.crop_ids && filters.crop_ids.length > 0) {
    filtered = filtered.filter(entry => filters.crop_ids!.includes(entry.crop_id));
  }

  if (filters.class_ids && filters.class_ids.length > 0) {
    filtered = filtered.filter(entry => filters.class_ids!.includes(entry.class_id));
  }

  if (filters.elevator_ids && filters.elevator_ids.length > 0) {
    filtered = filtered.filter(entry => filters.elevator_ids!.includes(entry.elevator_id));
  }

  if (filters.town_ids && filters.town_ids.length > 0) {
    filtered = filtered.filter(entry => filters.town_ids!.includes(entry.town_id));
  }

  return filtered;
};

export const getLastNDatesFromEntries = (
  entries: GrainEntry[],
  n: number
): string[] => {
  const uniqueDates = Array.from(new Set(entries.map(e => e.date))).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return uniqueDates.slice(0, n);
};

export const getDateRangeCount = (dateRange: string): number => {
  const match = dateRange.match(/(\d+)dates/);
  return match ? parseInt(match[1], 10) : 30;
};
