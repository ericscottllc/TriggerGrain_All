import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ClientPricingEntry, ClientPricingFilters } from '../types/clientTypes';

export const useClientPricing = (clientId: string | undefined) => {
  const [pricingData, setPricingData] = useState<ClientPricingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientPricing = useCallback(async (filters?: Partial<ClientPricingFilters>) => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);

      const { data: clientElevators, error: elevatorsError } = await supabase
        .from('client_elevators')
        .select('elevator_id')
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (elevatorsError) throw elevatorsError;

      const { data: clientTowns, error: townsError } = await supabase
        .from('client_towns')
        .select('town_id')
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (townsError) throw townsError;

      const elevatorIds = clientElevators?.map(e => e.elevator_id) || [];
      const townIds = clientTowns?.map(t => t.town_id) || [];

      if (elevatorIds.length === 0 || townIds.length === 0) {
        setPricingData([]);
        return;
      }

      let query = supabase
        .from('grain_entries')
        .select(`
          *,
          master_crops(name, code),
          crop_classes(name, code),
          master_elevators(name),
          master_towns(name, province)
        `)
        .eq('is_active', true)
        .in('elevator_id', elevatorIds)
        .in('town_id', townIds);

      if (filters?.dateRange) {
        if (filters.dateRange === '30dates') {
          const { data: lastDates } = await supabase.rpc('get_last_n_dates', { n: 30 });
          if (lastDates && lastDates.length > 0) {
            query = query.in('date', lastDates);
          }
        } else if (filters.dateRange === 'custom') {
          if (filters.startDate) {
            query = query.gte('date', filters.startDate);
          }
          if (filters.endDate) {
            query = query.lte('date', filters.endDate);
          }
        } else {
          const today = new Date();
          let startDate: Date;

          switch (filters.dateRange) {
            case '7days':
              startDate = new Date(today);
              startDate.setDate(today.getDate() - 7);
              query = query.gte('date', startDate.toISOString().split('T')[0]);
              break;
            case '30days':
              startDate = new Date(today);
              startDate.setDate(today.getDate() - 30);
              query = query.gte('date', startDate.toISOString().split('T')[0]);
              break;
            case '90days':
              startDate = new Date(today);
              startDate.setDate(today.getDate() - 90);
              query = query.gte('date', startDate.toISOString().split('T')[0]);
              break;
          }
        }
      } else {
        const { data: lastDates } = await supabase.rpc('get_last_n_dates', { n: 30 });
        if (lastDates && lastDates.length > 0) {
          query = query.in('date', lastDates);
        }
      }

      if (filters?.crop_ids && filters.crop_ids.length > 0) {
        query = query.in('crop_id', filters.crop_ids);
      }

      if (filters?.elevator_ids && filters.elevator_ids.length > 0) {
        query = query.in('elevator_id', filters.elevator_ids);
      }

      if (filters?.town_ids && filters.town_ids.length > 0) {
        query = query.in('town_id', filters.town_ids);
      }

      const sortBy = filters?.sortBy || 'date';
      const sortOrder = filters?.sortOrder === 'asc';
      query = query.order(sortBy, { ascending: sortOrder });

      const { data: entries, error: entriesError } = await query.limit(200);

      if (entriesError) throw entriesError;

      setPricingData(entries || []);
    } catch (err) {
      console.error('Error fetching client pricing:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pricing data');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  return {
    pricingData,
    loading,
    error,
    fetchClientPricing,
  };
};
