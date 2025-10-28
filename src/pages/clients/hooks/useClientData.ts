import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Client, ClientWithAssociations } from '../types/clientTypes';

export const useClientData = () => {
  const [clients, setClients] = useState<ClientWithAssociations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          client_elevators(
            id,
            elevator_id,
            is_active,
            master_elevators(id, name, code)
          ),
          client_towns(
            id,
            town_id,
            is_active,
            master_towns(id, name, province)
          ),
          client_regions(
            id,
            region_id,
            is_active,
            master_regions(id, name, code)
          ),
          client_crops(
            id,
            crop_id,
            is_active,
            master_crops(id, name, code)
          )
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (clientsError) throw clientsError;

      const clientsWithCounts = (clientsData || []).map(client => ({
        ...client,
        elevator_count: client.client_elevators?.filter((e: any) => e.is_active).length || 0,
        town_count: client.client_towns?.filter((t: any) => t.is_active).length || 0,
        region_count: client.client_regions?.filter((r: any) => r.is_active).length || 0,
        crop_count: client.client_crops?.filter((c: any) => c.is_active).length || 0,
      }));

      setClients(clientsWithCounts);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (clientData: Partial<Client>) => {
    try {
      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([{
          name: clientData.name,
          status: clientData.status || 'Active',
          contact_email: clientData.contact_email || null,
          contact_phone: clientData.contact_phone || null,
          notes: clientData.notes || null,
          metadata: clientData.metadata || {},
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchClients();
      return data;
    } catch (err) {
      console.error('Error creating client:', err);
      throw err;
    }
  }, [fetchClients]);

  const updateClient = useCallback(async (clientId: string, updates: Partial<Client>) => {
    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId);

      if (updateError) throw updateError;

      await fetchClients();
    } catch (err) {
      console.error('Error updating client:', err);
      throw err;
    }
  }, [fetchClients]);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId);

      if (deleteError) throw deleteError;

      await fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      throw err;
    }
  }, [fetchClients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
};
