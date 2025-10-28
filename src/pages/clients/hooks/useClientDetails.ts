import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ClientWithAssociations, ClientDashboardStats } from '../types/clientTypes';

export const useClientDetails = (clientId: string | undefined) => {
  const [client, setClient] = useState<ClientWithAssociations | null>(null);
  const [stats, setStats] = useState<ClientDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientDetails = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          client_elevators(
            id,
            elevator_id,
            is_active,
            created_at,
            updated_at,
            master_elevators(id, name, code)
          ),
          client_towns(
            id,
            town_id,
            is_active,
            created_at,
            updated_at,
            master_towns(id, name, province)
          ),
          client_regions(
            id,
            region_id,
            is_active,
            created_at,
            updated_at,
            master_regions(id, name, code)
          ),
          client_crops(
            id,
            crop_id,
            is_active,
            created_at,
            updated_at,
            master_crops(id, name, code)
          )
        `)
        .eq('id', clientId)
        .eq('is_active', true)
        .single();

      if (clientError) throw clientError;

      const activeElevators = clientData.client_elevators?.filter((e: any) => e.is_active) || [];
      const activeTowns = clientData.client_towns?.filter((t: any) => t.is_active) || [];
      const activeRegions = clientData.client_regions?.filter((r: any) => r.is_active) || [];
      const activeCrops = clientData.client_crops?.filter((c: any) => c.is_active) || [];

      const clientWithCounts = {
        ...clientData,
        elevator_count: activeElevators.length,
        town_count: activeTowns.length,
        region_count: activeRegions.length,
        crop_count: activeCrops.length,
      };

      setClient(clientWithCounts);

      const statsData: ClientDashboardStats = {
        total_elevators: activeElevators.length,
        total_towns: activeTowns.length,
        total_regions: activeRegions.length,
        total_crops: activeCrops.length,
        last_pricing_update: null,
        pricing_entries_count: 0,
      };

      setStats(statsData);
    } catch (err) {
      console.error('Error fetching client details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch client details');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const addElevatorAssociation = useCallback(async (elevatorId: string) => {
    if (!clientId) return;

    try {
      const { error: insertError } = await supabase
        .from('client_elevators')
        .insert([{ client_id: clientId, elevator_id: elevatorId }]);

      if (insertError) throw insertError;

      await fetchClientDetails();
    } catch (err) {
      console.error('Error adding elevator association:', err);
      throw err;
    }
  }, [clientId, fetchClientDetails]);

  const removeElevatorAssociation = useCallback(async (associationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('client_elevators')
        .delete()
        .eq('id', associationId);

      if (deleteError) throw deleteError;

      await fetchClientDetails();
    } catch (err) {
      console.error('Error removing elevator association:', err);
      throw err;
    }
  }, [fetchClientDetails]);

  const addTownAssociation = useCallback(async (townId: string) => {
    if (!clientId) return;

    try {
      const { error: insertError } = await supabase
        .from('client_towns')
        .insert([{ client_id: clientId, town_id: townId }]);

      if (insertError) throw insertError;

      await fetchClientDetails();
    } catch (err) {
      console.error('Error adding town association:', err);
      throw err;
    }
  }, [clientId, fetchClientDetails]);

  const removeTownAssociation = useCallback(async (associationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('client_towns')
        .delete()
        .eq('id', associationId);

      if (deleteError) throw deleteError;

      await fetchClientDetails();
    } catch (err) {
      console.error('Error removing town association:', err);
      throw err;
    }
  }, [fetchClientDetails]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  return {
    client,
    stats,
    loading,
    error,
    fetchClientDetails,
    addElevatorAssociation,
    removeElevatorAssociation,
    addTownAssociation,
    removeTownAssociation,
  };
};
