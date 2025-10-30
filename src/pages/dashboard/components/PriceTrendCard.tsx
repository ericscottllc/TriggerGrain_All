import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PriceTrend } from '../types/dashboardTypes';

interface PriceTrendCardProps {
  trend: PriceTrend;
  index: number;
}

export const PriceTrendCard = ({ trend, index }: PriceTrendCardProps) => {
  const isPositive = trend.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{trend.cropClassName}</h3>
          <p className="text-xs text-gray-500">{trend.cropClassCode}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
          isPositive ? 'bg-green-50' : 'bg-red-50'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3 text-green-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-600" />
          )}
          <span className={`text-xs font-semibold ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}{trend.changePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="h-20 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend.dataPoints}>
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#16a34a' : '#dc2626'}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold text-gray-800">
          ${trend.dataPoints[trend.dataPoints.length - 1]?.price.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500">30-day trend</span>
      </div>
    </motion.div>
  );
};
