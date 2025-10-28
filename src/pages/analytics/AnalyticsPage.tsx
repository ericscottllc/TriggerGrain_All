import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, BarChart3, LineChart } from 'lucide-react';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import { AnalyticsFiltersPanel } from './components/AnalyticsFilters';
import { TermStructurePanel } from './components/TermStructurePanel';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { StatisticsSummary } from './components/StatisticsSummary';
import {
  transformAnalyticsDataForTermStructure,
  transformDataForTimeSeries,
  transformDataByCropClass,
  transformDataByLocation,
  getDateRange,
} from './utils/analyticsTransform';
import type { AnalyticsFilters } from './types/analyticsTypes';

export const AnalyticsPage = () => {
  const { entries, crops, classes, elevators, towns, loading, fetchEntries, fetchMetadata } = useAnalyticsData();
  const [filters, setFilters] = useState<Partial<AnalyticsFilters>>({
    dateRange: '90dates',
    crop_ids: [],
    class_ids: [],
    elevator_ids: [],
    town_ids: [],
    region_ids: [],
  });
  const [comparisonMode, setComparisonMode] = useState<'single' | 'multi'>('single');
  const [activeView, setActiveView] = useState<'overview' | 'by-crop' | 'by-location' | 'term-structure'>('overview');

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  useEffect(() => {
    fetchEntries(filters);
  }, [filters, fetchEntries]);

  const termStructureData = useMemo(() => {
    return transformAnalyticsDataForTermStructure(entries);
  }, [entries]);

  const timeSeriesData = useMemo(() => {
    return transformDataForTimeSeries(entries);
  }, [entries]);

  const cropClassData = useMemo(() => {
    return transformDataByCropClass(entries);
  }, [entries]);

  const locationData = useMemo(() => {
    return transformDataByLocation(entries);
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
            comparisonMode={comparisonMode}
            onComparisonModeChange={setComparisonMode}
          />

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-tg-green" />
              <h3 className="text-lg font-semibold text-gray-800 mr-4">View</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeView === 'overview'
                      ? 'bg-tg-green text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('by-crop')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeView === 'by-crop'
                      ? 'bg-tg-green text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  By Crop
                </button>
                <button
                  onClick={() => setActiveView('by-location')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeView === 'by-location'
                      ? 'bg-tg-green text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  By Location
                </button>
                <button
                  onClick={() => setActiveView('term-structure')}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    activeView === 'term-structure'
                      ? 'bg-tg-green text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Term Structure
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length > 0 ? (
            <div className="space-y-6">
              {activeView === 'overview' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StatisticsSummary entries={entries} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <TimeSeriesChart
                      data={timeSeriesData}
                      title="Price Trends Over Time"
                      description="Cash prices, futures, and basis across all selected data"
                      showFutures={true}
                      showBasis={true}
                    />
                  </motion.div>
                </>
              )}

              {activeView === 'by-crop' && (
                <div className="space-y-6">
                  {cropClassData.map((cropData, index) => (
                    <motion.div
                      key={cropData.cropClassName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <TimeSeriesChart
                        data={cropData.data}
                        title={`${cropData.cropClassName} - Price Analysis`}
                        description="Historical price trends by location"
                        showFutures={true}
                        showBasis={true}
                        defaultExpanded={index === 0}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {activeView === 'by-location' && (
                <div className="space-y-6">
                  {locationData.map((locData, index) => (
                    <motion.div
                      key={locData.locationName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <TimeSeriesChart
                        data={locData.data}
                        title={`${locData.locationName} - Price Analysis`}
                        description="Historical price trends for this location"
                        showFutures={true}
                        showBasis={true}
                        defaultExpanded={index === 0}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {activeView === 'term-structure' && (
                <div className="space-y-6">
                  {termStructureData.map((cropTermStructure, index) => (
                    <motion.div
                      key={cropTermStructure.cropClassName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <TermStructurePanel
                        termStructure={cropTermStructure}
                        defaultExpanded={index === 0}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
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
