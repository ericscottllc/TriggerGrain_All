import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { rpcWithRetry } from '../../../utils/supabaseUtils';
import type { GrainEntry, AnalyticsFilters, MasterCrop, CropClass, MasterElevator, MasterTown, MasterRegion } from '../types/analyticsTypes';
import { getCachedData, saveCachedData, getCacheTimestamp } from '../utils/cacheUtils';
import { applyLocalFilters, getLastNDatesFromEntries, getDateRangeCount } from '../utils/filterUtils';

export const useAnalyticsData = () => {
  const [entries, setEntries] = useState<GrainEntry[]>([]);
  const [allCachedEntries, setAllCachedEntries] = useState<GrainEntry[]>([]);
  const [crops, setCrops] = useState<MasterCrop[]>([]);
  const [classes, setClasses] = useState<CropClass[]>([]);
  const [elevators, setElevators] = useState<MasterElevator[]>([]);
  const [towns, setTowns] = useState<MasterTown[]>([]);
  const [regions, setRegions] = useState<MasterRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const fetchMetadata = useCallback(async () => {
    try {
      const [cropsRes, classesRes, elevatorsRes, townsRes, regionsRes] = await Promise.all([
        supabase.from('master_crops').select('*').eq('is_active', true).order('name'),
        supabase.from('crop_classes').select('*').eq('is_active', true).order('name'),
        supabase.from('master_elevators').select('*').eq('is_active', true).order('name'),
        supabase.from('master_towns').select('*').eq('is_active', true).order('name'),
        supabase.from('master_regions').select('*').eq('is_active', true).order('name'),
      ]);

      if (cropsRes.error) throw cropsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (elevatorsRes.error) throw elevatorsRes.error;
      if (townsRes.error) throw townsRes.error;
      if (regionsRes.error) throw regionsRes.error;

      setCrops(cropsRes.data || []);
      setClasses(classesRes.data || []);
      setElevators(elevatorsRes.data || []);
      setTowns(townsRes.data || []);
      setRegions(regionsRes.data || []);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  }, []);

  useEffect(() => {
    const cached = getCachedData();
    const timestamp = getCacheTimestamp();

    if (cached && cached.length > 0) {
      setAllCachedEntries(cached);
      setCacheTimestamp(timestamp);
      setUsingCache(true);
    }
  }, []);

  const queryAllData = useCallback(async () => {
    try {
      setQuerying(true);
      setError(null);

      const query = supabase
        .from('grain_entries')
        .select(`
          *,
          master_crops(name, code),
          crop_classes(name, code),
          master_elevators(name),
          master_towns(name, province)
        `)
        .eq('is_active', true)
        .order('date', { ascending: false })
        .limit(100000);

      const { data, error: entriesError } = await query;

      if (entriesError) throw entriesError;

      const entries = data || [];

      setAllCachedEntries(entries);
      saveCachedData(entries);
      setCacheTimestamp(Date.now());
      setUsingCache(true);

      return entries;
    } catch (err) {
      console.error('Error querying all data:', err);
      setError(err instanceof Error ? err.message : 'Failed to query data');
      return null;
    } finally {
      setQuerying(false);
    }
  }, []);

  const applyFilters = useCallback((filters?: Partial<AnalyticsFilters>) => {
    setLoading(true);

    try {
      if (allCachedEntries.length === 0) {
        setEntries([]);
        return;
      }

      const dateCount = filters?.dateRange ? getDateRangeCount(filters.dateRange) : 90;
      const lastNDates = getLastNDatesFromEntries(allCachedEntries, dateCount);

      const filtered = applyLocalFilters(allCachedEntries, filters || {}, lastNDates);
      setEntries(filtered);
    } catch (err) {
      console.error('Error applying filters:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  }, [allCachedEntries]);

  return {
    entries,
    allCachedEntries,
    crops,
    classes,
    elevators,
    towns,
    regions,
    loading,
    querying,
    error,
    cacheTimestamp,
    usingCache,
    queryAllData,
    applyFilters,
    fetchMetadata,
  };
};
