import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Calendar, Brain as Grain, Building, MapPin, RotateCcw } from 'lucide-react';
import { Button, Card, Input } from '../../../components/Shared/SharedComponents';
import type { QueryFilters } from '../types/grainEntryTypes';

interface QueryFiltersProps {
  filters: QueryFilters;
  onFiltersChange: (filters: QueryFilters) => void;
  onQuery: () => void;
  loading: boolean;
  crops: Array<{ id: string; name: string; code?: string }>;
  cropClasses: Array<{ id: string; name: string; code?: string; crop_id: string }>;
  elevators: Array<{ id: string; name: string }>;
  towns: Array<{ id: string; name: string; province?: string }>;
  regions: Array<{ id: string; name: string }>;
}

export const QueryFilters: React.FC<QueryFiltersProps> = ({
  filters,
  onFiltersChange,
  onQuery,
  loading,
  crops,
  cropClasses,
  elevators,
  towns,
  regions
}) => {
  // Filter crop classes based on selected crops
  const availableClasses = cropClasses.filter(cls => 
    filters.cropIds.length === 0 || filters.cropIds.includes(cls.crop_id)
  );

  const handleFilterChange = (key: keyof QueryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Clear class selection if crops change
    if (key === 'cropIds') {
      newFilters.classIds = [];
    }
    
    onFiltersChange(newFilters);
  };

  const handleMultiSelectChange = (key: keyof QueryFilters, value: string, checked: boolean) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = checked 
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    handleFilterChange(key, newValues);
  };

  const resetFilters = () => {
    onFiltersChange({
      dateRange: 'recent',
      cropIds: [],
      classIds: [],
      regionIds: [],
      elevatorIds: [],
      townIds: [],
      limit: 50
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange !== 'recent') count++;
    if (filters.cropIds.length > 0) count++;
    if (filters.classIds.length > 0) count++;
    if (filters.regionIds.length > 0) count++;
    if (filters.elevatorIds.length > 0) count++;
    if (filters.townIds.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card className="mb-4">
      <div className="p-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-tg-green" />
              <h3 className="text-lg font-semibold text-gray-800">Query Filters</h3>
              {activeFilterCount > 0 && (
                <span className="bg-tg-green text-white text-xs px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              icon={RotateCcw}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={onQuery}
              loading={loading}
              icon={Grain}
            >
              {loading ? 'Querying...' : 'Query Data'}
            </Button>
          </div>
        </div>

        {/* Filters Grid - 3 columns, 2 rows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Row 1 */}
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green/20 focus:border-tg-green text-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
            
            {/* Entry Limit for Recent */}
            {filters.dateRange === 'recent' && (
              <div className="mt-2">
                <Input
                  type="number"
                  placeholder="Number of entries"
                  value={filters.limit || 50}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 50)}
                  size="sm"
                  min="1"
                  max="1000"
                />
              </div>
            )}
            
            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div className="mt-2 space-y-2">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  size="sm"
                />
                <Input
                  type="date"
                  placeholder="End Date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Crops Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Grain className="w-4 h-4 inline mr-1" />
              Crops ({filters.cropIds.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {crops.map((crop) => (
                <label key={crop.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.cropIds.includes(crop.id)}
                    onChange={(e) => handleMultiSelectChange('cropIds', crop.id, e.target.checked)}
                    className="w-3 h-3 text-tg-green bg-gray-100 border-gray-300 rounded focus:ring-tg-green focus:ring-1"
                  />
                  <span>{crop.name} {crop.code && `(${crop.code})`}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Crop Classes Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crop Classes ({filters.classIds.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {availableClasses.map((cls) => (
                <label key={cls.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.classIds.includes(cls.id)}
                    onChange={(e) => handleMultiSelectChange('classIds', cls.id, e.target.checked)}
                    className="w-3 h-3 text-tg-green bg-gray-100 border-gray-300 rounded focus:ring-tg-green focus:ring-1"
                  />
                  <span>{cls.name} {cls.code && `(${cls.code})`}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Row 2 */}
          {/* Regions Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Regions ({filters.regionIds.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {regions.map((region) => (
                <label key={region.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.regionIds.includes(region.id)}
                    onChange={(e) => handleMultiSelectChange('regionIds', region.id, e.target.checked)}
                    className="w-3 h-3 text-tg-green bg-gray-100 border-gray-300 rounded focus:ring-tg-green focus:ring-1"
                  />
                  <span>{region.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Elevators Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              Elevators ({filters.elevatorIds.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {elevators.map((elevator) => (
                <label key={elevator.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.elevatorIds.includes(elevator.id)}
                    onChange={(e) => handleMultiSelectChange('elevatorIds', elevator.id, e.target.checked)}
                    className="w-3 h-3 text-tg-green bg-gray-100 border-gray-300 rounded focus:ring-tg-green focus:ring-1"
                  />
                  <span>{elevator.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Towns Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Towns ({filters.townIds.length} selected)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {towns.map((town) => (
                <label key={town.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filters.townIds.includes(town.id)}
                    onChange={(e) => handleMultiSelectChange('townIds', town.id, e.target.checked)}
                    className="w-3 h-3 text-tg-green bg-gray-100 border-gray-300 rounded focus:ring-tg-green focus:ring-1"
                  />
                  <span>{town.name}{town.province && `, ${town.province}`}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};