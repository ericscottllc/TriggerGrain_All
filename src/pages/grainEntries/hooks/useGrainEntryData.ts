import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type { 
  CropClass, 
  Region, 
  ElevatorTownPair, 
  GrainEntrySubmission 
} from '../types/grainEntryTypes';

export const useGrainEntryData = () => {
  const { user } = useAuth();
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

  // Fetch crop classes
  const fetchCropClasses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crop_classes')
        .select(`
          id,
          name,
          code,
          crop_id
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCropClasses(data || []);
    } catch (error) {
      console.error('Error fetching crop classes:', error);
    }
  }, []);

  // Fetch regions
  const fetchRegions = useCallback(async (cropClassId?: string) => {
    try {
      // Since there's no direct relationship between crop_classes and regions in the schema,
      // we'll fetch all active regions. If you need crop-class-specific regions,
      // you'll need to add a relationship table to your schema.
      const { data, error } = await supabase
        .from('master_regions')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  }, []);

  // Fetch elevator/town pairs for a specific region
  const fetchElevatorTownPairs = useCallback(async (regionId?: string, cropClassId?: string) => {
    try {
      setLoading(true);
      
      let townIds: string[] = [];
      let elevatorIds: string[] = [];

      // Get towns based on region selection
      if (regionId) {
        const { data: townData, error: townError } = await supabase
          .from('town_regions')
          .select('town_id')
          .eq('region_id', regionId)
          .eq('is_active', true);

        if (townError) throw townError;
        townIds = (townData || []).map(item => item.town_id);
      }

      // Get elevators based on crop class selection
      if (cropClassId) {
        const { data: elevatorClassData, error: elevatorClassError } = await supabase
          .from('elevator_crop_classes')
          .select('elevator_id')
          .eq('class_id', cropClassId)
          .eq('is_active', true);

        if (elevatorClassError) throw elevatorClassError;
        elevatorIds = (elevatorClassData || []).map(item => item.elevator_id);
      }

      // Build the elevator-town query with appropriate filters
      let elevatorTownQuery = supabase
        .from('elevator_towns')
        .select(`
          elevator_id,
          town_id,
          master_elevators!inner(id, name),
          master_towns!inner(id, name)
        `)
        .eq('is_active', true);

      // Apply town filter if region is selected
      if (regionId && townIds.length > 0) {
        elevatorTownQuery = elevatorTownQuery.in('town_id', townIds);
      }

      // Apply elevator filter if crop class is selected
      if (cropClassId && elevatorIds.length > 0) {
        elevatorTownQuery = elevatorTownQuery.in('elevator_id', elevatorIds);
      }

      // If both filters are applied but no valid combinations exist, return empty
      if ((regionId && townIds.length === 0) || (cropClassId && elevatorIds.length === 0)) {
        setElevatorTownPairs([]);
        return;
      }

      const { data: elevatorTownData, error: elevatorTownError } = await elevatorTownQuery;

      if (elevatorTownError) throw elevatorTownError;

      const pairs: ElevatorTownPair[] = (elevatorTownData || []).map(item => ({
        elevator_id: item.elevator_id,
        elevator_name: (item.master_elevators as any).name,
        town_id: item.town_id,
        town_name: (item.master_towns as any).name,
      }));

      // Sort pairs alphabetically by elevator name, then by town name
      pairs.sort((a, b) => {
        const elevatorCompare = a.elevator_name.localeCompare(b.elevator_name);
        if (elevatorCompare !== 0) return elevatorCompare;
        return a.town_name.localeCompare(b.town_name);
      });

      setElevatorTownPairs(pairs);
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

  // Fetch grain entries with related data
  const fetchGrainEntries = useCallback(async (filters?: any) => {
    try {
      setQueryLoading(true);
      
      // Build the query with filters
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

      // Apply filters
      if (filters) {
        // Date range filter
        if (filters.dateRange === 'recent') {
          // Default: configurable limit
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

        // Crop filters
        if (filters.cropIds && filters.cropIds.length > 0) {
          query = query.in('crop_id', filters.cropIds);
        }

        // Class filters
        if (filters.classIds && filters.classIds.length > 0) {
          query = query.in('class_id', filters.classIds);
        }

        // Elevator filters
        if (filters.elevatorIds && filters.elevatorIds.length > 0) {
          query = query.in('elevator_id', filters.elevatorIds);
        }

        // Town filters
        if (filters.townIds && filters.townIds.length > 0) {
          query = query.in('town_id', filters.townIds);
        }
      } else {
        // Default: Most recent entries with configurable limit
        query = query.order('date', { ascending: false }).limit(50);
      }

      // Always order by date descending if not already ordered
      if (!filters || filters.dateRange !== 'recent') {
        query = query.order('date', { ascending: false });
      }

      const { data: entriesData, error } = await query;

      if (error) throw error;
      
      // Filter by regions if specified, then fetch region information
      let filteredEntries = entriesData || [];
      
      if (filters?.regionIds && filters.regionIds.length > 0) {
        // First get all towns in the selected regions
        const { data: regionTowns, error: regionTownError } = await supabase
          .from('town_regions')
          .select('town_id')
          .in('region_id', filters.regionIds)
          .eq('is_active', true);

        if (regionTownError) throw regionTownError;

        if (!regionTowns || regionTowns.length === 0) {
          setEntries([]);
          setHasQueriedEntries(true);
          return;
        }

        // Get town IDs
        const townIds = regionTowns.map(item => item.town_id);

        // Now get all elevator-town pairs for these towns
        const { data: elevatorTownPairs, error: elevatorTownError } = await supabase
          .from('elevator_towns')
          .select('elevator_id, town_id')
          .in('town_id', townIds)
          .eq('is_active', true);

        if (elevatorTownError) throw elevatorTownError;

        // Filter entries to only include those with matching elevator/town combinations
        const validCombinations = new Set(
          (elevatorTownPairs || []).map(pair => `${pair.elevator_id}-${pair.town_id}`)
        );

        filteredEntries = filteredEntries.filter(entry => 
          validCombinations.has(`${entry.elevator_id}-${entry.town_id}`)
        );
      }

      // Now fetch region information for each filtered entry
      const entriesWithRegions = await Promise.all(
        filteredEntries.map(async (entry) => {
          // Find the region for this town
          const { data: townRegionData, error: townRegionError } = await supabase
            .from('town_regions')
            .select(`
              master_regions!inner(name)
            `)
            .eq('town_id', entry.town_id)
            .eq('is_active', true)
            .limit(1)
            .single();

          return {
            ...entry,
            region_name: townRegionData?.master_regions?.name || 'Unknown Region'
          };
        })
      );
      
      setEntries(entriesWithRegions);
      setHasQueriedEntries(true);
    } catch (error) {
      console.error('Error fetching grain entries:', error);
      setEntries([]);
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

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCropClasses(),
        fetchRegions()
      ]);
      setLoading(false);
    };

    initializeData();
  }, [fetchCropClasses, fetchRegions]);

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