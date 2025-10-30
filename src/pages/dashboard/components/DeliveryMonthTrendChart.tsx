import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';
import type { DeliveryMonthTrend } from '../types/dashboardTypes';

interface DeliveryMonthTrendChartProps {
  trends: DeliveryMonthTrend[];
}

export const DeliveryMonthTrendChart = ({ trends }: DeliveryMonthTrendChartProps) => {
  const chartData = trends.map(t => ({
    label: `${t.deliveryMonth}/${String(t.deliveryYear).slice(-2)}`,
    avgPrice: t.avgPrice,
    entryCount: t.entryCount
  })).reverse();

  const maxPrice = Math.max(...chartData.map(d => d.avgPrice));
  const minPrice = Math.min(...chartData.map(d => d.avgPrice));

  const getColor = (price: number) => {
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    if (ratio > 0.66) return '#16a34a';
    if (ratio > 0.33) return '#eab308';
    return '#dc2626';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-tg-primary" />
        <h2 className="text-lg font-semibold text-gray-800">Recent Delivery Month Trends</h2>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No delivery month data available</p>
        </div>
      ) : (
        <>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'avgPrice' ? `$${value.toFixed(2)}` : value,
                    name === 'avgPrice' ? 'Avg Price' : 'Entries'
                  ]}
                />
                <Bar dataKey="avgPrice" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.avgPrice)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Highest</p>
              <p className="text-lg font-bold text-green-600">
                ${Math.max(...chartData.map(d => d.avgPrice)).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Average</p>
              <p className="text-lg font-bold text-gray-800">
                ${(chartData.reduce((sum, d) => sum + d.avgPrice, 0) / chartData.length).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Lowest</p>
              <p className="text-lg font-bold text-red-600">
                ${Math.min(...chartData.map(d => d.avgPrice)).toFixed(2)}
              </p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
