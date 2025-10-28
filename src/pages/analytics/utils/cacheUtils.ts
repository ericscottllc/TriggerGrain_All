import type { GrainEntry } from '../types/analyticsTypes';

const CACHE_KEY = 'analytics_grain_entries_cache';
const CACHE_TIMESTAMP_KEY = 'analytics_grain_entries_timestamp';
const CACHE_VERSION = '1.0';
const MAX_CACHE_AGE_DAYS = 7;

export interface CachedData {
  version: string;
  timestamp: number;
  entries: GrainEntry[];
}

export const saveCachedData = (entries: GrainEntry[]): boolean => {
  try {
    const cacheData: CachedData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      entries,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, cacheData.timestamp.toString());
    return true;
  } catch (error) {
    console.error('Error saving cached data:', error);
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Clearing cache and retrying...');
      clearCachedData();
    }
    return false;
  }
};

export const getCachedData = (): GrainEntry[] | null => {
  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (!cachedStr) return null;

    const cached: CachedData = JSON.parse(cachedStr);

    if (cached.version !== CACHE_VERSION) {
      console.warn('Cache version mismatch. Clearing cache.');
      clearCachedData();
      return null;
    }

    const ageInDays = (Date.now() - cached.timestamp) / (1000 * 60 * 60 * 24);
    if (ageInDays > MAX_CACHE_AGE_DAYS) {
      console.warn('Cache is too old. Clearing cache.');
      clearCachedData();
      return null;
    }

    return cached.entries;
  } catch (error) {
    console.error('Error reading cached data:', error);
    clearCachedData();
    return null;
  }
};

export const getCacheTimestamp = (): number | null => {
  try {
    const timestampStr = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    return timestampStr ? parseInt(timestampStr, 10) : null;
  } catch (error) {
    console.error('Error reading cache timestamp:', error);
    return null;
  }
};

export const clearCachedData = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing cached data:', error);
  }
};

export const getCacheAge = (): string | null => {
  const timestamp = getCacheTimestamp();
  if (!timestamp) return null;

  const ageMs = Date.now() - timestamp;
  const ageMinutes = Math.floor(ageMs / (1000 * 60));
  const ageHours = Math.floor(ageMs / (1000 * 60 * 60));
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  if (ageDays > 0) {
    return `${ageDays} day${ageDays === 1 ? '' : 's'} ago`;
  } else if (ageHours > 0) {
    return `${ageHours} hour${ageHours === 1 ? '' : 's'} ago`;
  } else if (ageMinutes > 0) {
    return `${ageMinutes} minute${ageMinutes === 1 ? '' : 's'} ago`;
  } else {
    return 'just now';
  }
};
