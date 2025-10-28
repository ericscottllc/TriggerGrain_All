import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar } from 'lucide-react';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { AnalyticsFiltersPanel } from './components/AnalyticsFilters';
import { CropClassPanel } from './components/CropClassPanel';
import { transformAnalyticsDataForCharts, getDateRange } from './utils/analyticsTransform';
import type { AnalyticsFilters } from './types/analyticsTypes';

export const AnalyticsPage = () => {
  const { entries, crops, classes, elevators, towns, loading, fetchEntries, fetchMetadata } = useAnalyticsData();
  const [filters, setFilters] = useState<Partial<AnalyticsFilters>>({
    dateRange: '30dates',
    crop_ids: [],
    class_ids: [],
    elevator_ids: [],
    town_ids: [],
    region_ids: [],
  });

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchEntries(filters);
  }, [filters, fetchEntries]);

  const chartData = useMemo(() => {
    return transformAnalyticsDataForCharts(entries);
  }, [entries]);

  const dateRange = useMemo(() => {
    return getDateRange(entries);
  }, [entries]);

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-tg-green rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Pricing Analytics</h1>
              <p className="text-gray-600 mt-1">
                Visualize grain price trends and analyze market patterns across locations
              </p>
            </div>
          </div>
          {dateRange && (
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Showing data from {new Date(dateRange.start).toLocaleDateString()} to{' '}
                {new Date(dateRange.end).toLocaleDateString()}
              </span>
              <span className="ml-2 px-2 py-1 bg-tg-green/10 text-tg-green rounded-full font-medium">
                {entries.length} entries
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <AnalyticsFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            crops={crops}
            classes={classes}
            elevators={elevators}
            towns={towns}
          />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : chartData.length > 0 ? (
            <div className="space-y-6">
              {chartData.map((cropClassData, index) => (
                <motion.div
                  key={cropClassData.cropClassName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <CropClassPanel chartData={cropClassData} defaultExpanded={index === 0} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No data available</h3>
              <p className="text-gray-600">
                Try adjusting your filters or ensure grain entries exist for the selected date range.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
