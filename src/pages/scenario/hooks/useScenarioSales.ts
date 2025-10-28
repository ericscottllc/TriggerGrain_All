import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
  ScenarioSale,
  CreateSaleData,
  ScenarioRecommendation,
  CreateRecommendationData
} from '../types/scenarioTypes';

export function useScenarioSales(scenarioId?: string) {
  const [sales, setSales] = useState<ScenarioSale[]>([]);
  const [recommendations, setRecommendations] = useState<ScenarioRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(async (sid?: string) => {
    const targetId = sid || scenarioId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('scenario_sales')
        .select(`
          *,
          elevator:master_elevators(name),
          town:master_towns(name)
        `)
        .eq('scenario_id', targetId)
        .order('sale_date', { ascending: true });

      if (fetchError) throw fetchError;

      const salesWithNames = (data || []).map(sale => ({
        ...sale,
        elevator_name: sale.elevator?.name,
        town_name: sale.town?.name
      }));

      setSales(salesWithNames);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  }, [scenarioId]);

  const fetchRecommendations = useCallback(async (sid?: string) => {
    const targetId = sid || scenarioId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('scenario_recommendations')
        .select('*')
        .eq('scenario_id', targetId)
        .order('target_date', { ascending: true });

      if (fetchError) throw fetchError;

      setRecommendations(data || []);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [scenarioId]);

  const createSale = useCallback(async (saleData: CreateSaleData): Promise<ScenarioSale> => {
    const { data, error: createError } = await supabase
      .from('scenario_sales')
      .insert(saleData)
      .select(`
        *,
        elevator:master_elevators(name),
        town:master_towns(name)
      `)
      .single();

    if (createError) throw createError;

    const saleWithNames = {
      ...data,
      elevator_name: data.elevator?.name,
      town_name: data.town?.name
    };

    await fetchSales();
    return saleWithNames;
  }, [fetchSales]);

  const updateSale = useCallback(async (
    saleId: string,
    updates: Partial<CreateSaleData>
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('scenario_sales')
      .update(updates)
      .eq('id', saleId);

    if (updateError) throw updateError;

    await fetchSales();
  }, [fetchSales]);

  const deleteSale = useCallback(async (saleId: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('scenario_sales')
      .delete()
      .eq('id', saleId);

    if (deleteError) throw deleteError;

    setSales(prev => prev.filter(s => s.id !== saleId));
  }, []);

  const createRecommendation = useCallback(async (
    recData: CreateRecommendationData
  ): Promise<ScenarioRecommendation> => {
    const { data, error: createError } = await supabase
      .from('scenario_recommendations')
      .insert(recData)
      .select()
      .single();

    if (createError) throw createError;

    await fetchRecommendations();
    return data;
  }, [fetchRecommendations]);

  const updateRecommendation = useCallback(async (
    recId: string,
    updates: Partial<CreateRecommendationData>
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('scenario_recommendations')
      .update(updates)
      .eq('id', recId);

    if (updateError) throw updateError;

    await fetchRecommendations();
  }, [fetchRecommendations]);

  const deleteRecommendation = useCallback(async (recId: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('scenario_recommendations')
      .delete()
      .eq('id', recId);

    if (deleteError) throw deleteError;

    setRecommendations(prev => prev.filter(r => r.id !== recId));
  }, []);

  const bulkCreateRecommendations = useCallback(async (
    recsData: CreateRecommendationData[]
  ): Promise<void> => {
    const { error: createError } = await supabase
      .from('scenario_recommendations')
      .insert(recsData);

    if (createError) throw createError;

    await fetchRecommendations();
  }, [fetchRecommendations]);

  const clearAllRecommendations = useCallback(async (sid?: string): Promise<void> => {
    const targetId = sid || scenarioId;
    if (!targetId) return;

    const { error: deleteError } = await supabase
      .from('scenario_recommendations')
      .delete()
      .eq('scenario_id', targetId);

    if (deleteError) throw deleteError;

    setRecommendations([]);
  }, [scenarioId]);

  return {
    sales,
    recommendations,
    loading,
    error,
    fetchSales,
    fetchRecommendations,
    createSale,
    updateSale,
    deleteSale,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation,
    bulkCreateRecommendations,
    clearAllRecommendations
  };
}
