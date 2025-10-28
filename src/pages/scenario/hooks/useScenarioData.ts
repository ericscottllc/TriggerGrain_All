import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type {
  Scenario,
  ScenarioWithStats,
  CreateScenarioData,
  ScenarioFilters
} from '../types/scenarioTypes';

export function useScenarioData() {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<ScenarioWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = useCallback(async (filters?: ScenarioFilters) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('scenarios')
        .select(`
          *,
          master_crops(name),
          crop_classes(name),
          master_regions(name),
          master_towns(name),
          master_elevators(name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.crop_id) {
        query = query.eq('crop_id', filters.crop_id);
      }

      if (filters?.class_id) {
        query = query.eq('class_id', filters.class_id);
      }

      if (filters?.region_id) {
        query = query.eq('region_id', filters.region_id);
      }

      if (filters?.dateFrom) {
        query = query.gte('start_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('end_date', filters.dateTo);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const scenariosWithStats = await Promise.all(
        (data || []).map(async (scenario) => {
          const { data: salesData } = await supabase
            .from('scenario_sales')
            .select('volume_bushels, cash_price, sale_date')
            .eq('scenario_id', scenario.id);

          const totalSales = salesData?.reduce(
            (sum, sale) => sum + sale.volume_bushels,
            0
          ) || 0;

          const percentageSold = scenario.production_estimate > 0
            ? (totalSales / scenario.production_estimate) * 100
            : 0;

          let averagePrice = 0;
          let totalRevenue = 0;

          if (salesData && salesData.length > 0) {
            const weightedSum = salesData.reduce((sum, sale) => {
              const price = sale.cash_price || 0;
              return sum + (price * sale.volume_bushels);
            }, 0);

            averagePrice = totalSales > 0 ? weightedSum / totalSales : 0;
            totalRevenue = weightedSum;
          }

          const lastSaleDate = salesData && salesData.length > 0
            ? salesData.sort((a, b) =>
                new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
              )[0].sale_date
            : undefined;

          const { data: latestEval } = await supabase
            .from('scenario_evaluations')
            .select('*')
            .eq('scenario_id', scenario.id)
            .order('evaluation_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...scenario,
            crop_name: scenario.master_crops?.name,
            class_name: scenario.crop_classes?.name,
            region_name: scenario.master_regions?.name,
            town_name: scenario.master_towns?.name,
            elevator_name: scenario.master_elevators?.name,
            total_sales: totalSales,
            percentage_sold: percentageSold,
            average_price: averagePrice,
            total_revenue: totalRevenue,
            sales_count: salesData?.length || 0,
            last_sale_date: lastSaleDate,
            latest_evaluation: latestEval || undefined
          };
        })
      );

      let filteredScenarios = scenariosWithStats;

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredScenarios = filteredScenarios.filter(s =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description?.toLowerCase().includes(searchLower) ||
          s.crop_name?.toLowerCase().includes(searchLower) ||
          s.class_name?.toLowerCase().includes(searchLower) ||
          s.region_name?.toLowerCase().includes(searchLower)
        );
      }

      setScenarios(filteredScenarios);
    } catch (err) {
      console.error('Error fetching scenarios:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch scenarios');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getScenario = useCallback(async (scenarioId: string): Promise<ScenarioWithStats | null> => {
    if (!user) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('scenarios')
        .select(`
          *,
          master_crops(name),
          crop_classes(name),
          master_regions(name),
          master_towns(name),
          master_elevators(name)
        `)
        .eq('id', scenarioId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) return null;

      const { data: salesData } = await supabase
        .from('scenario_sales')
        .select('volume_bushels, cash_price, sale_date')
        .eq('scenario_id', scenarioId);

      const totalSales = salesData?.reduce(
        (sum, sale) => sum + sale.volume_bushels,
        0
      ) || 0;

      const percentageSold = data.production_estimate > 0
        ? (totalSales / data.production_estimate) * 100
        : 0;

      let averagePrice = 0;
      let totalRevenue = 0;

      if (salesData && salesData.length > 0) {
        const weightedSum = salesData.reduce((sum, sale) => {
          const price = sale.cash_price || 0;
          return sum + (price * sale.volume_bushels);
        }, 0);

        averagePrice = totalSales > 0 ? weightedSum / totalSales : 0;
        totalRevenue = weightedSum;
      }

      const lastSaleDate = salesData && salesData.length > 0
        ? salesData.sort((a, b) =>
            new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
          )[0].sale_date
        : undefined;

      const { data: latestEval } = await supabase
        .from('scenario_evaluations')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('evaluation_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        ...data,
        crop_name: data.master_crops?.name,
        class_name: data.crop_classes?.name,
        region_name: data.master_regions?.name,
        town_name: data.master_towns?.name,
        elevator_name: data.master_elevators?.name,
        total_sales: totalSales,
        percentage_sold: percentageSold,
        average_price: averagePrice,
        total_revenue: totalRevenue,
        sales_count: salesData?.length || 0,
        last_sale_date: lastSaleDate,
        latest_evaluation: latestEval || undefined
      };
    } catch (err) {
      console.error('Error fetching scenario:', err);
      throw err;
    }
  }, [user]);

  const createScenario = useCallback(async (data: CreateScenarioData): Promise<Scenario> => {
    if (!user) throw new Error('User not authenticated');

    const { data: newScenario, error: createError } = await supabase
      .from('scenarios')
      .insert({
        ...data,
        created_by: user.id,
        status: 'planning'
      })
      .select()
      .single();

    if (createError) throw createError;

    await fetchScenarios();
    return newScenario;
  }, [user, fetchScenarios]);

  const updateScenario = useCallback(async (
    scenarioId: string,
    updates: Partial<CreateScenarioData>
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('scenarios')
      .update(updates)
      .eq('id', scenarioId);

    if (updateError) throw updateError;

    await fetchScenarios();
  }, [fetchScenarios]);

  const deleteScenario = useCallback(async (scenarioId: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', scenarioId);

    if (deleteError) throw deleteError;

    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
  }, []);

  const updateScenarioStatus = useCallback(async (
    scenarioId: string,
    status: Scenario['status']
  ): Promise<void> => {
    const { error: updateError } = await supabase
      .from('scenarios')
      .update({ status })
      .eq('id', scenarioId);

    if (updateError) throw updateError;

    await fetchScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    if (user) {
      fetchScenarios();
    }
  }, [user, fetchScenarios]);

  return {
    scenarios,
    loading,
    error,
    fetchScenarios,
    getScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    updateScenarioStatus
  };
}
