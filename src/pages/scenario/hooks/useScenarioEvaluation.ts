import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
  ScenarioEvaluation,
  Scenario,
  ScenarioSale,
  ScenarioRecommendation,
  MarketDataPoint
} from '../types/scenarioTypes';
import {
  calculateWeightedAveragePrice,
  calculateTotalRevenue,
  calculatePercentageSold,
  calculateUnrealizedValue,
  calculateMarketAverage,
  findMarketHighLow,
  calculatePerformanceScore,
  calculateVarianceFromRecommendation,
  countMissedOpportunities
} from '../utils/scenarioCalculations';

export function useScenarioEvaluation() {
  const [evaluations, setEvaluations] = useState<ScenarioEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluations = useCallback(async (scenarioId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('scenario_evaluations')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('evaluation_date', { ascending: false });

      if (fetchError) throw fetchError;

      setEvaluations(data || []);
    } catch (err) {
      console.error('Error fetching evaluations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch evaluations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMarketData = useCallback(async (
    scenario: Scenario
  ): Promise<MarketDataPoint[]> => {
    let query = supabase
      .from('grain_entries')
      .select('date, cash_price, futures, basis')
      .gte('date', scenario.start_date)
      .lte('date', scenario.end_date)
      .order('date', { ascending: true });

    if (scenario.crop_id) {
      query = query.eq('crop_id', scenario.crop_id);
    }

    if (scenario.class_id) {
      query = query.eq('class_id', scenario.class_id);
    }

    if (scenario.elevator_id) {
      query = query.eq('elevator_id', scenario.elevator_id);
    }

    if (scenario.town_id) {
      query = query.eq('town_id', scenario.town_id);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    return (data || []).map(entry => ({
      date: entry.date,
      cash_price: entry.cash_price || 0,
      futures_price: entry.futures || 0,
      basis: entry.basis || 0
    }));
  }, []);

  const evaluateScenario = useCallback(async (
    scenario: Scenario,
    sales: ScenarioSale[],
    recommendations: ScenarioRecommendation[],
    isFinal: boolean = false
  ): Promise<ScenarioEvaluation> => {
    setLoading(true);
    setError(null);

    try {
      const evaluationDate = new Date().toISOString().split('T')[0];

      const totalVolumeSold = sales.reduce((sum, sale) => sum + sale.volume_bushels, 0);
      const percentageSold = calculatePercentageSold(sales, scenario.production_estimate);
      const averagePriceAchieved = calculateWeightedAveragePrice(sales);
      const totalRevenue = calculateTotalRevenue(sales);

      const marketData = await fetchMarketData(scenario);

      const marketAveragePrice = calculateMarketAverage(marketData);
      const { high: marketHighPrice, low: marketLowPrice } = findMarketHighLow(marketData);

      const varianceFromRecommendation = calculateVarianceFromRecommendation(
        percentageSold,
        recommendations,
        new Date(evaluationDate)
      );

      const opportunitiesMissed = countMissedOpportunities(sales, marketData);

      const performanceScore = calculatePerformanceScore(
        averagePriceAchieved,
        marketAveragePrice,
        marketHighPrice,
        varianceFromRecommendation
      );

      const currentMarketPrice = marketData.length > 0
        ? marketData[marketData.length - 1].cash_price
        : 0;

      const unrealizedValue = calculateUnrealizedValue(
        sales,
        scenario.production_estimate,
        currentMarketPrice
      );

      let evaluationNotes = 'Automated evaluation.\n';
      if (performanceScore >= 80) {
        evaluationNotes += 'Excellent performance - achieved high price capture and followed strategy.\n';
      } else if (performanceScore >= 60) {
        evaluationNotes += 'Good performance - reasonable price capture with some opportunities missed.\n';
      } else if (performanceScore >= 40) {
        evaluationNotes += 'Fair performance - improvement possible in timing and price capture.\n';
      } else {
        evaluationNotes += 'Below target performance - significant opportunities missed.\n';
      }

      if (Math.abs(varianceFromRecommendation) > 15) {
        evaluationNotes += `Variance from recommendation: ${varianceFromRecommendation.toFixed(1)}% ${varianceFromRecommendation > 0 ? 'ahead' : 'behind'} target.\n`;
      }

      if (opportunitiesMissed > 0) {
        evaluationNotes += `Missed ${opportunitiesMissed} high-price opportunities during the period.\n`;
      }

      const evaluationData = {
        scenario_id: scenario.id,
        evaluation_date: evaluationDate,
        percentage_sold: percentageSold,
        total_volume_sold: totalVolumeSold,
        average_price_achieved: averagePriceAchieved,
        market_average_price: marketAveragePrice,
        market_high_price: marketHighPrice,
        market_low_price: marketLowPrice,
        performance_score: performanceScore,
        variance_from_recommendation: varianceFromRecommendation,
        opportunities_missed: opportunitiesMissed,
        total_revenue: totalRevenue,
        unrealized_value: unrealizedValue,
        evaluation_notes: evaluationNotes,
        is_final: isFinal
      };

      const { data: newEvaluation, error: createError } = await supabase
        .from('scenario_evaluations')
        .insert(evaluationData)
        .select()
        .single();

      if (createError) throw createError;

      if (isFinal) {
        await supabase
          .from('scenarios')
          .update({ status: 'evaluated' })
          .eq('id', scenario.id);
      }

      await fetchEvaluations(scenario.id);

      return newEvaluation;
    } catch (err) {
      console.error('Error evaluating scenario:', err);
      setError(err instanceof Error ? err.message : 'Failed to evaluate scenario');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMarketData, fetchEvaluations]);

  const deleteEvaluation = useCallback(async (evaluationId: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('scenario_evaluations')
      .delete()
      .eq('id', evaluationId);

    if (deleteError) throw deleteError;

    setEvaluations(prev => prev.filter(e => e.id !== evaluationId));
  }, []);

  return {
    evaluations,
    loading,
    error,
    fetchEvaluations,
    evaluateScenario,
    deleteEvaluation,
    fetchMarketData
  };
}
