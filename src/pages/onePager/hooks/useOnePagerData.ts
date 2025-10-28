import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { MasterCrop, GrainEntry, OnePagerConfig } from '../types/onePagerTypes';

export const useOnePagerData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getOnePagerConfigs = async (): Promise<OnePagerConfig[]> => {
    try {
      setLoading(true);
      setError(null);

      // Query the new normalized structure
      // Get region -> crop comparison associations
      const { data: regionComparisons, error: rcError } = await supabase
        .from('region_crop_comparisons')
        .select(`
          region_id,
          crop_comparison_id,
          region:master_regions(*),
          crop_comparison:master_crop_comparison(*)
        `)
        .eq('is_active', true);

      if (rcError) throw rcError;

      // Get town -> region associations
      const { data: townRegions, error: trError } = await supabase
        .from('town_regions')
        .select(`
          town_id,
          region_id,
          town:master_towns(*),
          region:master_regions(*)
        `)
        .eq('is_active', true);

      if (trError) throw trError;

      // Get elevator -> town associations
      const { data: elevatorTowns, error: etError } = await supabase
        .from('elevator_towns')
        .select(`
          elevator_id,
          town_id,
          elevator:master_elevators(*),
          town:master_towns(*)
        `)
        .eq('is_active', true);

      if (etError) throw etError;

      // Build the config data by joining the relationships
      const configs: OnePagerConfig[] = [];
      
      for (const rc of regionComparisons || []) {
        // Find towns in this region
        const townsInRegion = townRegions?.filter(tr => tr.region_id === rc.region_id) || [];
        
        for (const tr of townsInRegion) {
          // Find elevators in this town
          const elevatorsInTown = elevatorTowns?.filter(et => et.town_id === tr.town_id) || [];
          
          for (const et of elevatorsInTown) {
            configs.push({
              id: `${rc.region_id}-${et.elevator_id}-${tr.town_id}-${rc.crop_comparison_id}`,
              region_id: rc.region_id,
              elevator_id: et.elevator_id,
              town_id: tr.town_id,
              name: `${rc.region?.name} - ${et.elevator?.name} - ${tr.town?.name}`,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              crop_comparison_id: rc.crop_comparison_id,
              class_id: null, // Will be set by user selection
              region: rc.region,
              elevator: et.elevator,
              town: tr.town
            });
          }
        }
      }

      return configs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch one pager configs';
      setError(errorMessage);
      console.error('Error fetching one pager configs:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getMasterCrops = async (): Promise<MasterCrop[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('master_crops')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch master crops';
      setError(errorMessage);
      console.error('Error fetching master crops:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getGrainEntriesForQuery = async (
    date: string, 
    classId: string, 
    cropComparisonId: string
  ): Promise<GrainEntry[]> => {
    try {
      setLoading(true);
      setError(null);

      // Get regions associated with the crop comparison
      const { data: regionComparisons, error: rcError } = await supabase
        .from('region_crop_comparisons')
        .select(`
          region_id,
          region:master_regions(*)
        `)
        .eq('crop_comparison_id', cropComparisonId)
        .eq('is_active', true);

      if (rcError) throw rcError;
      if (!regionComparisons || regionComparisons.length === 0) return [];

      const regionIds = regionComparisons.map(rc => rc.region_id);

      // Get towns in these regions
      const { data: townRegions, error: trError } = await supabase
        .from('town_regions')
        .select('town_id, region_id')
        .in('region_id', regionIds)
        .eq('is_active', true);

      if (trError) throw trError;
      if (!townRegions || townRegions.length === 0) return [];

      const townIds = [...new Set(townRegions.map(tr => tr.town_id))];

      // Get elevators in these towns
      const { data: elevatorTowns, error: etError } = await supabase
        .from('elevator_towns')
        .select('elevator_id, town_id')
        .in('town_id', townIds)
        .eq('is_active', true);

      if (etError) throw etError;
      if (!elevatorTowns || elevatorTowns.length === 0) return [];

      const elevatorIds = [...new Set(elevatorTowns.map(et => et.elevator_id))];

      // Query grain entries with the class_id filter
      const { data, error: fetchError } = await supabase
        .from('grain_entries')
        .select('*')
        .eq('date', date)
        .eq('class_id', classId)
        .in('elevator_id', elevatorIds)
        .in('town_id', townIds)
        .eq('is_active', true);

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grain entries';
      setError(errorMessage);
      console.error('Error fetching grain entries:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDates = async (): Promise<string[]> => {
    try {
      setLoading(true);
      setError(null);

      // Use the RPC function to get distinct dates
      const { data, error: fetchError } = await supabase
        .rpc('get_distinct_dates');

      if (fetchError) {
        throw fetchError;
      }

      // Data is already unique and sorted from the RPC function
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch available dates';
      setError(errorMessage);
      console.error('Error fetching available dates:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getOnePagerConfigs,
    getCropClasses,
    getMasterCropComparisons,
    getGrainEntriesForQuery,
    getAvailableDates
  };

  async function getCropClasses() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('crop_classes')
        .select(`
          *,
          crop:master_crops(*)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch crop classes';
      setError(errorMessage);
      console.error('Error fetching crop classes:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }

  async function getMasterCropComparisons() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('master_crop_comparison')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch crop comparisons';
      setError(errorMessage);
      console.error('Error fetching crop comparisons:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }
};