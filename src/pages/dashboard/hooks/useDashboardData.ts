import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type { DashboardStats, PriceTrend, ElevatorPerformance, DeliveryMonthTrend } from '../types/dashboardTypes';

export const useDashboardData = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [topElevators, setTopElevators] = useState<ElevatorPerformance[]>([]);
  const [bottomElevators, setBottomElevators] = useState<ElevatorPerformance[]>([]);
  const [deliveryMonthTrends, setDeliveryMonthTrends] = useState<DeliveryMonthTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const { data: totalEntries, error: totalError } = await supabase
        .from('grain_entries')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (totalError) throw totalError;

      const { data: activeCropClasses, error: cropError } = await supabase
        .from('crop_classes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (cropError) throw cropError;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentEntries, error: recentError } = await supabase
        .from('grain_entries')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (recentError) throw recentError;

      const { data: avgPriceData, error: avgError } = await supabase
        .from('grain_entries')
        .select('cash_price')
        .eq('is_active', true)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (avgError) throw avgError;

      const avgPrice = avgPriceData && avgPriceData.length > 0
        ? avgPriceData.reduce((sum, entry) => sum + Number(entry.cash_price), 0) / avgPriceData.length
        : 0;

      setStats({
        totalEntries: totalEntries?.length || 0,
        activeCropClasses: activeCropClasses?.length || 0,
        recentEntries: recentEntries?.length || 0,
        avgPrice: avgPrice
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics');
    }
  }, []);

  const fetch30DayPriceTrends = useCallback(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: cropClasses, error: classError } = await supabase
        .from('crop_classes')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (classError) throw classError;

      const trends: PriceTrend[] = [];

      for (const cropClass of cropClasses || []) {
        const { data: entries, error: entriesError } = await supabase
          .from('grain_entries')
          .select('date, cash_price')
          .eq('class_id', cropClass.id)
          .eq('is_active', true)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date');

        if (entriesError) {
          console.error(`Error fetching entries for ${cropClass.name}:`, entriesError);
          continue;
        }

        if (entries && entries.length > 0) {
          const groupedByDate = entries.reduce((acc, entry) => {
            if (!acc[entry.date]) {
              acc[entry.date] = [];
            }
            acc[entry.date].push(Number(entry.cash_price));
            return acc;
          }, {} as Record<string, number[]>);

          const dataPoints = Object.entries(groupedByDate)
            .map(([date, prices]) => ({
              date,
              price: prices.reduce((sum, p) => sum + p, 0) / prices.length
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          const firstPrice = dataPoints[0].price;
          const lastPrice = dataPoints[dataPoints.length - 1].price;
          const change = lastPrice - firstPrice;
          const changePercent = (change / firstPrice) * 100;

          trends.push({
            cropClassId: cropClass.id,
            cropClassName: cropClass.name,
            cropClassCode: cropClass.code,
            dataPoints,
            change,
            changePercent
          });
        }
      }

      setPriceTrends(trends);
    } catch (err) {
      console.error('Error fetching price trends:', err);
      setError('Failed to load price trends');
    }
  }, []);

  const fetchElevatorPerformance = useCallback(async () => {
    try {
      const { data: cropClasses, error: classError } = await supabase
        .from('crop_classes')
        .select('id, name, code')
        .eq('is_active', true);

      if (classError) throw classError;

      const { data: regions, error: regionError } = await supabase
        .from('master_regions')
        .select('id, name')
        .eq('is_active', true);

      if (regionError) throw regionError;

      const top: ElevatorPerformance[] = [];
      const bottom: ElevatorPerformance[] = [];

      for (const cropClass of cropClasses || []) {
        for (const region of regions || []) {
          const { data: townRegions, error: trError } = await supabase
            .from('town_regions')
            .select('town_id')
            .eq('region_id', region.id)
            .eq('is_active', true);

          if (trError || !townRegions || townRegions.length === 0) continue;

          const townIds = townRegions.map(tr => tr.town_id);

          const { data: entries, error: entriesError } = await supabase
            .from('grain_entries')
            .select('elevator_id, cash_price, master_elevators!inner(name)')
            .eq('class_id', cropClass.id)
            .eq('is_active', true)
            .in('town_id', townIds);

          if (entriesError || !entries || entries.length === 0) continue;

          const elevatorAvgs = entries.reduce((acc, entry) => {
            const elevatorId = entry.elevator_id;
            const elevatorName = (entry.master_elevators as any).name;
            if (!acc[elevatorId]) {
              acc[elevatorId] = {
                elevatorId,
                elevatorName,
                prices: []
              };
            }
            acc[elevatorId].prices.push(Number(entry.cash_price));
            return acc;
          }, {} as Record<string, { elevatorId: string; elevatorName: string; prices: number[] }>);

          const elevatorPerformances = Object.values(elevatorAvgs).map(elev => ({
            elevatorId: elev.elevatorId,
            elevatorName: elev.elevatorName,
            cropClassId: cropClass.id,
            cropClassName: cropClass.name,
            regionId: region.id,
            regionName: region.name,
            avgPrice: elev.prices.reduce((sum, p) => sum + p, 0) / elev.prices.length,
            entryCount: elev.prices.length
          }));

          elevatorPerformances.sort((a, b) => b.avgPrice - a.avgPrice);

          const topPerformers = elevatorPerformances.slice(0, 5);
          const bottomPerformers = elevatorPerformances.slice(-5).reverse();

          top.push(...topPerformers);
          bottom.push(...bottomPerformers);
        }
      }

      setTopElevators(top);
      setBottomElevators(bottom);
    } catch (err) {
      console.error('Error fetching elevator performance:', err);
      setError('Failed to load elevator performance');
    }
  }, []);

  const fetchDeliveryMonthTrends = useCallback(async () => {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('grain_entries')
        .select('month, year, cash_price, date')
        .eq('is_active', true)
        .not('month', 'is', null)
        .not('year', 'is', null)
        .order('year', { ascending: false })
        .order('date', { ascending: false })
        .limit(1000);

      if (entriesError) throw entriesError;

      const grouped = (entries || []).reduce((acc, entry) => {
        const key = `${entry.month}/${String(entry.year).slice(-2)}`;
        if (!acc[key]) {
          acc[key] = {
            deliveryMonth: entry.month,
            deliveryYear: entry.year,
            prices: [],
            sortKey: entry.year * 100 + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(entry.month)
          };
        }
        acc[key].prices.push(Number(entry.cash_price));
        return acc;
      }, {} as Record<string, { deliveryMonth: string; deliveryYear: number; prices: number[]; sortKey: number }>);

      const trends: DeliveryMonthTrend[] = Object.values(grouped)
        .map(group => ({
          deliveryMonth: group.deliveryMonth,
          deliveryYear: group.deliveryYear,
          avgPrice: group.prices.reduce((sum, p) => sum + p, 0) / group.prices.length,
          entryCount: group.prices.length,
          sortKey: group.sortKey
        }))
        .sort((a, b) => b.sortKey - a.sortKey)
        .slice(0, 12);

      setDeliveryMonthTrends(trends);
    } catch (err) {
      console.error('Error fetching delivery month trends:', err);
      setError('Failed to load delivery month trends');
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchDashboardStats(),
        fetch30DayPriceTrends(),
        fetchElevatorPerformance(),
        fetchDeliveryMonthTrends()
      ]);

      setLoading(false);
    };

    loadDashboardData();
  }, [authLoading, user, fetchDashboardStats, fetch30DayPriceTrends, fetchElevatorPerformance, fetchDeliveryMonthTrends]);

  return {
    stats,
    priceTrends,
    topElevators,
    bottomElevators,
    deliveryMonthTrends,
    loading,
    error
  };
};
