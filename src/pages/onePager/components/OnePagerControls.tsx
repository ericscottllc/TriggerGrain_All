import React from 'react';
import { Search, Printer } from 'lucide-react';
import { MasterCropComparison, CropClass } from '../types/onePagerTypes';

interface OnePagerControlsProps {
  cropComparisons: MasterCropComparison[];
  cropClasses: CropClass[];
  availableDates: string[];
  selectedCropComparison: string;
  selectedCropClass: string;
  selectedDate: string;
  loading: boolean;
  hasData: boolean;
  onCropComparisonChange: (value: string) => void;
  onCropClassChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onQuery: () => void;
  onPrint: () => void;
}

export const OnePagerControls: React.FC<OnePagerControlsProps> = ({
  cropComparisons,
  cropClasses,
  availableDates,
  selectedCropComparison,
  selectedCropClass,
  selectedDate,
  loading,
  hasData,
  onCropComparisonChange,
  onCropClassChange,
  onDateChange,
  onQuery,
  onPrint
}) => {
  const formatDateUTC = (dateString: string) => {
    const d = new Date(`${dateString}T00:00:00.000Z`);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric", 
      day: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 print:hidden">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop Comparison
            </label>
            <select
              value={selectedCropComparison}
              onChange={(e) => onCropComparisonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tg-green focus:border-transparent"
            >
              <option value="">Select Crop Comparison</option>
              {cropComparisons.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop Class
            </label>
            <select
              value={selectedCropClass}
              onChange={(e) => onCropClassChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tg-green focus:border-transparent"
            >
              <option value="">Select Crop Class</option>
              {cropClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-tg-green focus:border-transparent"
            >
              <option value="">Select Date</option>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {formatDateUTC(d)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onQuery}
              disabled={!selectedCropComparison || !selectedCropClass || !selectedDate || loading}
              className="w-full bg-tg-primary hover:bg-tg-green text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Query
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={onPrint}
              disabled={loading || !hasData}
              className="w-full bg-tg-green hover:bg-tg-primary text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};