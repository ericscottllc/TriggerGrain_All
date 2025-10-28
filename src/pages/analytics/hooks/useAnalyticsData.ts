import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { rpcWithRetry } from '../../../utils/supabaseUtils';
import type { GrainEntry, AnalyticsFilters, MasterCrop, CropClass, MasterElevator, MasterTown, MasterRegion } from '../types/analyticsTypes';

export const useAnalyticsData = () => {
  const [entries, setEntries] = useState<GrainEntry[]>([]);
  const [crops, setCrops] = useState<MasterCrop[]>([]);
  const [classes, setClasses] = useState<CropClass[]>([]);
  const [elevators, setElevators] = useState<MasterElevator[]>([]);
  const [towns, setTowns] = useState<MasterTown[]>([]);
  const [regions, setRegions] = useState<MasterRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchEntries = useCallback(async (filters?: Partial<AnalyticsFilters>) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('grain_entries')
        .select(`
          *,
          master_crops(name, code),
          crop_classes(name, code),
          master_elevators(name),
          master_towns(name, province)
        `)
        .eq('is_active', true);

      if (filters?.dateRange) {
        const numDates = parseInt(filters.dateRange.replace('dates', ''));
        const { data: lastDates, error: datesError } = await rpcWithRetry('get_last_n_dates', { n: numDates });
        if (datesError) {
          console.error('[useAnalyticsData] Error fetching last dates:', datesError);
        }
        if (lastDates && lastDates.length > 0) {
          query = query.in('date', lastDates);
        }
      } else {
        const { data: lastDates, error: datesError } = await rpcWithRetry('get_last_n_dates', { n: 30 });
        if (datesError) {
          console.error('[useAnalyticsData] Error fetching last dates (default):', datesError);
        }
        if (lastDates && lastDates.length > 0) {
          query = query.in('date', lastDates);
        }
      }

      if (filters?.crop_ids && filters.crop_ids.length > 0) {
        query = query.in('crop_id', filters.crop_ids);
      }

      if (filters?.class_ids && filters.class_ids.length > 0) {
        query = query.in('class_id', filters.class_ids);
      }

      if (filters?.elevator_ids && filters.elevator_ids.length > 0) {
        query = query.in('elevator_id', filters.elevator_ids);
      }

      if (filters?.town_ids && filters.town_ids.length > 0) {
        query = query.in('town_id', filters.town_ids);
      }

      query = query.order('date', { ascending: false });

      const { data, error: entriesError } = await query;

      if (entriesError) throw entriesError;

      setEntries(data || []);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch entries');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    entries,
    crops,
    classes,
    elevators,
    towns,
    regions,
    loading,
    error,
    fetchEntries,
    fetchMetadata,
  };
};
