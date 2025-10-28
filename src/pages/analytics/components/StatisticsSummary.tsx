import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Activity } from 'lucide-react';
import type { GrainEntry } from '../types/analyticsTypes';

interface StatisticsSummaryProps {
  entries: GrainEntry[];
}

interface PriceStats {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  min: number;
  max: number;
  avg: number;
  volatility: number;
}

const calculateStats = (entries: GrainEntry[]): PriceStats | null => {
  if (entries.length === 0) return null;

  const prices = entries
    .map(e => e.cash_price)
    .filter((p): p is number => p !== null)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  const sortedByDate = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const recentEntries = sortedByDate.filter(e => e.cash_price !== null).slice(-5);
  const olderEntries = sortedByDate.filter(e => e.cash_price !== null).slice(0, 5);

  const current = recentEntries.length > 0
    ? recentEntries.reduce((sum, e) => sum + (e.cash_price || 0), 0) / recentEntries.length
    : prices[prices.length - 1];

  const previous = olderEntries.length > 0
    ? olderEntries.reduce((sum, e) => sum + (e.cash_price || 0), 0) / olderEntries.length
    : prices[0];

  const change = current - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : 0;

  const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
  const volatility = Math.sqrt(variance);

  return {
    current,
    previous,
    change,
    changePercent,
    min: prices[0],
    max: prices[prices.length - 1],
    avg,
    volatility,
  };
};

const calculateBasisStats = (entries: GrainEntry[]) => {
  const basisValues = entries
    .map(e => e.basis)
    .filter((b): b is number => b !== null);

  if (basisValues.length === 0) return null;

  const avg = basisValues.reduce((sum, b) => sum + b, 0) / basisValues.length;
  const min = Math.min(...basisValues);
  const max = Math.max(...basisValues);

  return { avg, min, max };
};

export const StatisticsSummary: React.FC<StatisticsSummaryProps> = ({ entries }) => {
  const stats = calculateStats(entries);
  const basisStats = calculateBasisStats(entries);

  if (!stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center">No data available for statistics</p>
      </div>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (change < 0) return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-900">Current Price</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 mb-1">
            ${stats.current.toFixed(2)}
          </p>
          <div className="flex items-center gap-2">
            {getTrendIcon(stats.change)}
            <span className={`text-sm font-medium ${getTrendColor(stats.change)}`}>
              ${Math.abs(stats.change).toFixed(2)} ({Math.abs(stats.changePercent).toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-900">Average Price</p>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-900 mb-1">
            ${stats.avg.toFixed(2)}
          </p>
          <p className="text-sm text-green-700">
            Across {entries.length} entries
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-orange-900">Price Range</p>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-900 mb-1">
            ${(stats.max - stats.min).toFixed(2)}
          </p>
          <p className="text-sm text-orange-700">
            ${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-900">Volatility</p>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900 mb-1">
            ${stats.volatility.toFixed(2)}
          </p>
          <p className="text-sm text-purple-700">
            Standard deviation
          </p>
        </div>
      </div>

      {basisStats && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Basis Analysis</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Average Basis</p>
              <p className="text-lg font-semibold text-gray-800">
                {(basisStats.avg * 100).toFixed(1)}¢
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Min Basis</p>
              <p className="text-lg font-semibold text-gray-800">
                {(basisStats.min * 100).toFixed(1)}¢
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Max Basis</p>
              <p className="text-lg font-semibold text-gray-800">
                {(basisStats.max * 100).toFixed(1)}¢
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
