import { motion } from 'framer-motion';
import { Award, AlertCircle } from 'lucide-react';
import type { ElevatorPerformance } from '../types/dashboardTypes';

interface ElevatorPerformanceTableProps {
  elevators: ElevatorPerformance[];
  type: 'top' | 'bottom';
}

export const ElevatorPerformanceTable = ({ elevators, type }: ElevatorPerformanceTableProps) => {
  const isTop = type === 'top';
  const grouped = elevators.reduce((acc, elev) => {
    const key = `${elev.cropClassId}-${elev.regionId}`;
    if (!acc[key]) {
      acc[key] = {
        cropClassName: elev.cropClassName,
        regionName: elev.regionName,
        elevators: []
      };
    }
    acc[key].elevators.push(elev);
    return acc;
  }, {} as Record<string, { cropClassName: string; regionName: string; elevators: ElevatorPerformance[] }>);

  const sections = Object.values(grouped).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        {isTop ? (
          <Award className="w-5 h-5 text-green-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-orange-600" />
        )}
        <h2 className="text-lg font-semibold text-gray-800">
          {isTop ? 'Top 5' : 'Bottom 5'} Elevators by Crop Class & Region
        </h2>
      </div>

      {sections.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="border-l-4 border-gray-200 pl-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-700">{section.cropClassName}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-sm text-gray-600">{section.regionName}</span>
              </div>
              <div className="space-y-2">
                {section.elevators.slice(0, 5).map((elev, idx) => (
                  <div
                    key={`${elev.elevatorId}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isTop ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{elev.elevatorName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">${elev.avgPrice.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{elev.entryCount} entries</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
