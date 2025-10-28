import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AnalyticsChart } from './AnalyticsChart';
import type { CropClassChartData } from '../utils/analyticsTransform';

interface CropClassPanelProps {
  chartData: CropClassChartData;
  defaultExpanded?: boolean;
}

export const CropClassPanel: React.FC<CropClassPanelProps> = ({
  chartData,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors"
      >
        <h2 className="text-xl font-bold text-gray-800">{chartData.cropClassName}</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isExpanded && (
        <div className="p-4">
          <AnalyticsChart
            data={chartData.chartData}
            series={chartData.series}
            title={`${chartData.cropClassName} Price Trends`}
            height={450}
          />
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Chart Legend</h4>
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                  <span className="font-medium">Price</span>
                </div>
                <p>Cash price offered by elevators</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                  <span className="font-medium">Futures</span>
                </div>
                <p>Futures market price</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <span className="font-medium">Basis</span>
                </div>
                <p>Difference between cash and futures</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
