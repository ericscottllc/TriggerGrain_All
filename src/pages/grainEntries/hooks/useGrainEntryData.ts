import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { sortElevatorTownPairs } from '../utils/grainEntryUtils';
import type {
  CropClass,
  Region,
  ElevatorTownPair,
  GrainEntrySubmission
} from '../types/grainEntryTypes';

export const useGrainEntryData = () => {
  const { user, loading: authLoading } = useAuth();
  const [cropClasses, setCropClasses] = useState<CropClass[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [elevatorTownPairs, setElevatorTownPairs] = useState<ElevatorTownPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [hasQueriedEntries, setHasQueriedEntries] = useState(false);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [cropsData, elevatorsData, townsData, regionsData] = await Promise.all([
        supabase.from('master_crops').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('master_elevators').select('id, name').eq('is_active', true).order('name'),
        supabase.from('master_towns').select('id, name, province').eq('is_active', true).order('name'),
        supabase.from('master_regions').select('id, name').eq('is_active', true).order('name')
      ]);

      return {
        crops: cropsData.data || [],
        elevators: elevatorsData.data || [],
        towns: townsData.data || [],
        regions: regionsData.data || []
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return {
        crops: [],
        elevators: [],
        towns: [],
        regions: []
      };
    }
  }, []);

  const fetchCropClasses = useCallback(async () => {
    try {
      console.log('[fetchCropClasses] Starting fetch...');
      const { data, error } = await supabase
        .from('crop_classes')
        .select('id, name, code, crop_id')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('[fetchCropClasses] Error:', error);
        throw error;
      }

      console.log('[fetchCropClasses] Fetched', data?.length || 0, 'crop classes');
      setCropClasses(data || []);
      return data || [];
    } catch (error) {
      console.error('[fetchCropClasses] Exception:', error);
      setCropClasses([]);
      return [];
    }
  }, []);

  const fetchRegions = useCallback(async (cropClassId?: string) => {
    try {
      console.log('[fetchRegions] Starting fetch...');
      const { data, error } = await supabase
        .from('master_regions')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('[fetchRegions] Error:', error);
        throw error;
      }

      console.log('[fetchRegions] Fetched', data?.length || 0, 'regions');
      setRegions(data || []);
      return data || [];
    } catch (error) {
      console.error('[fetchRegions] Exception:', error);
      setRegions([]);
      return [];
    }
  }, []);

  const fetchElevatorTownPairs = useCallback(async (regionId?: string, cropClassId?: string) => {
    try {
      setLoading(true);

      if (!regionId && !cropClassId) {
        setElevatorTownPairs([]);
        return;
      }

      const queries = [];

      if (regionId) {
        queries.push(
          supabase
            .from('town_regions')
            .select('town_id')
            .eq('region_id', regionId)
            .eq('is_active', true)
        );
      } else {
        queries.push(Promise.resolve({ data: null, error: null }));
      }

      if (cropClassId) {
        queries.push(
          supabase
            .from('elevator_crop_classes')
            .select('elevator_id')
            .eq('class_id', cropClassId)
            .eq('is_active', true)
        );
      } else {
        queries.push(Promise.resolve({ data: null, error: null }));
      }

      const [townResult, elevatorResult] = await Promise.all(queries);

      if (townResult.error) throw townResult.error;
      if (elevatorResult.error) throw elevatorResult.error;

      const townIds = townResult.data ? townResult.data.map(item => item.town_id) : [];
      const elevatorIds = elevatorResult.data ? elevatorResult.data.map(item => item.elevator_id) : [];

      if ((regionId && townIds.length === 0) || (cropClassId && elevatorIds.length === 0)) {
        setElevatorTownPairs([]);
        return;
      }

      let elevatorTownQuery = supabase
        .from('elevator_towns')
        .select('elevator_id, town_id, master_elevators!inner(id, name), master_towns!inner(id, name)')
        .eq('is_active', true);

      if (regionId && townIds.length > 0) {
        elevatorTownQuery = elevatorTownQuery.in('town_id', townIds);
      }

      if (cropClassId && elevatorIds.length > 0) {
        elevatorTownQuery = elevatorTownQuery.in('elevator_id', elevatorIds);
      }

      const { data: elevatorTownData, error: elevatorTownError } = await elevatorTownQuery;

      if (elevatorTownError) throw elevatorTownError;

      const pairs: ElevatorTownPair[] = (elevatorTownData || []).map(item => ({
        elevator_id: item.elevator_id,
        elevator_name: (item.master_elevators as any).name,
        town_id: item.town_id,
        town_name: (item.master_towns as any).name,
      }));

      const sortedPairs = sortElevatorTownPairs(pairs);
      setElevatorTownPairs(sortedPairs);
    } catch (error) {
      console.error('Error fetching elevator/town pairs:', error);
      setElevatorTownPairs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save grain entries to database
  const saveGrainEntries = useCallback(async (submission: GrainEntrySubmission) => {
    if (!user) throw new Error('User not authenticated');

    // Find the selected crop class to get the crop_id
    const selectedCropClass = cropClasses.find(cc => cc.id === submission.cropClassId);
    if (!selectedCropClass) {
      throw new Error('Selected crop class not found');
    }

    const entries = submission.entries
      .map(entry => ({
        date: submission.date,
        crop_id: selectedCropClass.crop_id,
        class_id: submission.cropClassId,
        elevator_id: entry.elevatorId,
        town_id: entry.townId,
        month: entry.monthName,
        year: entry.year,
        cash_price: entry.cashPrice,
        futures: entry.futuresPrice,
        basis: entry.basis,
        user_id: user.id,
        notes: '',
        is_active: true
      }));

    const { error } = await supabase
      .from('grain_entries')
      .insert(entries);

    if (error) throw error;
  }, [user, cropClasses]);

  const fetchGrainEntries = useCallback(async (filters?: any) => {
    try {
      setQueryLoading(true);

      let query = supabase
        .from('grain_entries')
        .select(`
          *,
          master_crops!inner(name, code),
          crop_classes!inner(name, code),
          master_elevators!inner(name),
          master_towns!inner(name, province)
        `)
        .eq('is_active', true);

      if (filters) {
        if (filters.dateRange === 'recent') {
          query = query.order('date', { ascending: false }).limit(filters.limit || 50);
        } else if (filters.dateRange === 'last30') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.gte('date', thirtyDaysAgo.toISOString().split('T')[0]);
        } else if (filters.dateRange === 'last90') {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          query = query.gte('date', ninetyDaysAgo.toISOString().split('T')[0]);
        } else if (filters.dateRange === 'thisYear') {
          const currentYear = new Date().getFullYear();
          query = query.eq('year', currentYear);
        } else if (filters.dateRange === 'lastYear') {
          const lastYear = new Date().getFullYear() - 1;
          query = query.eq('year', lastYear);
        } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
          query = query.gte('date', filters.startDate).lte('date', filters.endDate);
        }

        if (filters.cropIds && filters.cropIds.length > 0) {
          query = query.in('crop_id', filters.cropIds);
        }

        if (filters.classIds && filters.classIds.length > 0) {
          query = query.in('class_id', filters.classIds);
        }

        if (filters.elevatorIds && filters.elevatorIds.length > 0) {
          query = query.in('elevator_id', filters.elevatorIds);
        }

        if (filters.townIds && filters.townIds.length > 0) {
          query = query.in('town_id', filters.townIds);
        }
      } else {
        query = query.order('date', { ascending: false }).limit(50);
      }

      if (!filters || filters.dateRange !== 'recent') {
        query = query.order('date', { ascending: false });
      }

      const { data: entriesData, error } = await query;

      if (error) throw error;

      let filteredEntries = entriesData || [];

      if (filters?.regionIds && filters.regionIds.length > 0) {
        const [townRegionsResult, elevatorTownsResult] = await Promise.all([
          supabase
            .from('town_regions')
            .select('town_id')
            .in('region_id', filters.regionIds)
            .eq('is_active', true),
          supabase
            .from('elevator_towns')
            .select('elevator_id, town_id')
            .eq('is_active', true)
        ]);

        if (townRegionsResult.error) throw townRegionsResult.error;
        if (elevatorTownsResult.error) throw elevatorTownsResult.error;

        if (!townRegionsResult.data || townRegionsResult.data.length === 0) {
          setEntries([]);
          setHasQueriedEntries(true);
          return;
        }

        const townIds = new Set(townRegionsResult.data.map(item => item.town_id));
        const validCombinations = new Set(
          (elevatorTownsResult.data || [])
            .filter(pair => townIds.has(pair.town_id))
            .map(pair => `${pair.elevator_id}-${pair.town_id}`)
        );

        filteredEntries = filteredEntries.filter(entry =>
          validCombinations.has(`${entry.elevator_id}-${entry.town_id}`)
        );
      }

      const uniqueTownIds = [...new Set(filteredEntries.map(entry => entry.town_id))];

      const { data: townRegionsData, error: townRegionsError } = await supabase
        .from('town_regions')
        .select('town_id, master_regions!inner(name)')
        .in('town_id', uniqueTownIds)
        .eq('is_active', true);

      if (townRegionsError) {
        console.error('Error fetching town regions:', townRegionsError);
      }

      const townToRegionMap = new Map(
        (townRegionsData || []).map(item => [
          item.town_id,
          (item.master_regions as any)?.name || 'Unknown Region'
        ])
      );

      const entriesWithRegions = filteredEntries.map(entry => ({
        ...entry,
        region_name: townToRegionMap.get(entry.town_id) || 'Unknown Region'
      }));

      setEntries(entriesWithRegions);
      setHasQueriedEntries(true);
    } catch (error) {
      console.error('Error fetching grain entries:', error);
      setEntries([]);
      setHasQueriedEntries(true);
    } finally {
      setQueryLoading(false);
    }
  }, []);

  // Update grain entry
  const updateGrainEntry = useCallback(async (id: string, updates: any) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('grain_entries')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    
    // Refresh entries after update
    await fetchGrainEntries();
  }, [user, fetchGrainEntries]);

  // Delete grain entry
  const deleteGrainEntry = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('grain_entries')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    
    // Refresh entries after deletion
    await fetchGrainEntries();
  }, [user, fetchGrainEntries]);

  useEffect(() => {
    if (authLoading) {
      console.log('[useGrainEntryData] Auth is still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('[useGrainEntryData] No user authenticated');
      setLoading(false);
      return;
    }

    console.log('[useGrainEntryData] User authenticated, fetching data...');
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCropClasses(),
        fetchRegions()
      ]);
      setLoading(false);
      console.log('[useGrainEntryData] Data fetch complete');
    };

    initializeData();
  }, [authLoading, user, fetchCropClasses, fetchRegions]);

  return {
    cropClasses,
    regions,
    elevatorTownPairs,
    setElevatorTownPairs,
    entries,
    loading,
    queryLoading,
    hasQueriedEntries,
    fetchElevatorTownPairs,
    saveGrainEntries,
    fetchRegions,
    fetchGrainEntries,
    updateGrainEntry,
    deleteGrainEntry,
    fetchFilterOptions
  };
};