import React from 'react';
import { Filter, Database, RefreshCw, Clock } from 'lucide-react';
import type { AnalyticsFilters, MasterCrop, CropClass, MasterElevator, MasterTown } from '../types/analyticsTypes';
import { getCacheAge } from '../utils/cacheUtils';

interface AnalyticsFiltersProps {
  filters: Partial<AnalyticsFilters>;
  onFiltersChange: (filters: Partial<AnalyticsFilters>) => void;
  crops: MasterCrop[];
  classes: CropClass[];
  elevators: MasterElevator[];
  towns: MasterTown[];
  comparisonMode?: 'single' | 'multi';
  onComparisonModeChange?: (mode: 'single' | 'multi') => void;
  onQueryData?: () => void;
  querying?: boolean;
  usingCache?: boolean;
  cacheTimestamp?: number | null;
  totalCachedEntries?: number;
}

export const AnalyticsFiltersPanel: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFiltersChange,
  crops,
  classes,
  elevators,
  towns,
  comparisonMode = 'single',
  onComparisonModeChange,
  onQueryData,
  querying = false,
  usingCache = false,
  cacheTimestamp = null,
  totalCachedEntries = 0,
}) => {
  const handleDateRangeChange = (dateRange: AnalyticsFilters['dateRange']) => {
    onFiltersChange({ ...filters, dateRange });
  };

  const handleMultiSelectChange = (field: keyof AnalyticsFilters, value: string) => {
    const currentValues = (filters[field] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFiltersChange({ ...filters, [field]: newValues });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: '30dates',
      crop_ids: [],
      class_ids: [],
      elevator_ids: [],
      town_ids: [],
      region_ids: [],
    });
  };

  const cacheAge = cacheTimestamp ? getCacheAge() : null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-tg-green" />
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
          </div>
          {onComparisonModeChange && (
            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
              <span className="text-sm font-medium text-gray-700">View Mode:</span>
              <button
                onClick={() => onComparisonModeChange('single')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  comparisonMode === 'single'
                    ? 'bg-tg-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Single
              </button>
              <button
                onClick={() => onComparisonModeChange('multi')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  comparisonMode === 'multi'
                    ? 'bg-tg-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Compare
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {usingCache && cacheAge && (
            <div className="flex items-center gap-2 px-3 py-1 bg-tg-green/10 rounded-lg">
              <Database className="w-4 h-4 text-tg-green" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-tg-green">
                  {totalCachedEntries.toLocaleString()} entries cached
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>Updated {cacheAge}</span>
                </div>
              </div>
            </div>
          )}
          {onQueryData && (
            <button
              onClick={onQueryData}
              disabled={querying}
              className="flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {querying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Querying...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Query Data</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-tg-green hover:text-tg-green/80 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <select
            value={filters.dateRange || '30dates'}
            onChange={(e) => handleDateRangeChange(e.target.value as AnalyticsFilters['dateRange'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent"
          >
            <option value="30dates">Last 30 Dates</option>
            <option value="60dates">Last 60 Dates</option>
            <option value="90dates">Last 90 Dates</option>
            <option value="180dates">Last 180 Dates</option>
            <option value="365dates">Last 365 Dates</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Crops</label>
          <div className="border border-gray-300 rounded-lg max-h-32 overflow-y-auto p-2 space-y-1">
            {crops.map(crop => (
              <label key={crop.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.crop_ids?.includes(crop.id) || false}
                  onChange={() => handleMultiSelectChange('crop_ids', crop.id)}
                  className="rounded text-tg-green focus:ring-tg-green"
                />
                <span className="text-gray-700">{crop.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
          <div className="border border-gray-300 rounded-lg max-h-32 overflow-y-auto p-2 space-y-1">
            {classes.map(cls => (
              <label key={cls.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.class_ids?.includes(cls.id) || false}
                  onChange={() => handleMultiSelectChange('class_ids', cls.id)}
                  className="rounded text-tg-green focus:ring-tg-green"
                />
                <span className="text-gray-700">{cls.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Elevators</label>
          <div className="border border-gray-300 rounded-lg max-h-32 overflow-y-auto p-2 space-y-1">
            {elevators.map(elevator => (
              <label key={elevator.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.elevator_ids?.includes(elevator.id) || false}
                  onChange={() => handleMultiSelectChange('elevator_ids', elevator.id)}
                  className="rounded text-tg-green focus:ring-tg-green"
                />
                <span className="text-gray-700">{elevator.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Towns</label>
          <div className="border border-gray-300 rounded-lg max-h-32 overflow-y-auto p-2 space-y-1">
            {towns.map(town => (
              <label key={town.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={filters.town_ids?.includes(town.id) || false}
                  onChange={() => handleMultiSelectChange('town_ids', town.id)}
                  className="rounded text-tg-green focus:ring-tg-green"
                />
                <span className="text-gray-700">{town.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
