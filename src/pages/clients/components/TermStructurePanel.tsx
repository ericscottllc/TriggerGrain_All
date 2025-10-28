import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TermStructureChart } from './TermStructureChart';
import type { CropClassTermStructure } from '../utils/chartDataTransform';

interface TermStructurePanelProps {
  termStructure: CropClassTermStructure;
}

export const TermStructurePanel: React.FC<TermStructurePanelProps> = ({ termStructure }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    termStructure.dates[termStructure.dates.length - 1] || ''
  );

  const currentData = selectedDate
    ? termStructure.termStructureByDate.get(selectedDate)
    : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
          <h3 className="text-lg font-semibold text-gray-800">
            {termStructure.cropClassName}
          </h3>
        </div>
        <div className="text-sm text-gray-600">
          {termStructure.dates.length} date{termStructure.dates.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 border-t border-gray-100">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {termStructure.dates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          </div>

          {currentData && (
            <TermStructureChart
              data={currentData.data}
              locationKeys={currentData.locationKeys}
              title={`${termStructure.cropClassName} - Term Structure`}
              selectedDate={selectedDate}
              height={500}
            />
          )}

          {!currentData && (
            <div className="text-center py-8 text-gray-500">
              No data available for the selected date
            </div>
          )}
        </div>
      )}
    </div>
  );
};
