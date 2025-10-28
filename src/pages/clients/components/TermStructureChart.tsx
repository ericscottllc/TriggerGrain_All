import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TermStructureDataPoint {
  deliveryMonth: string;
  deliverySort: number;
  futures: number | null;
  basis: number | null;
  [key: string]: string | number | null;
}

interface TermStructureChartProps {
  data: TermStructureDataPoint[];
  locationKeys: string[];
  title: string;
  selectedDate: string;
  height?: number;
}

const LOCATION_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
];

export const TermStructureChart: React.FC<TermStructureChartProps> = ({
  data,
  locationKeys,
  title,
  selectedDate,
  height = 500,
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isBasis = entry.dataKey.includes('_basis');
            const value = isBasis
              ? `${(entry.value * 100).toFixed(1)}¢/bu`
              : `$${entry.value.toFixed(2)}/bu`;

            return (
              <div key={index} className="flex items-center gap-2 text-sm mb-1">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 truncate">{entry.name}:</span>
                <span className="font-medium text-gray-800">{value}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">
          As of {formatDate(selectedDate)} - Prices across delivery months
        </p>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="deliveryMonth"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            label={{ value: 'Price ($/bu)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Basis (¢/bu)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}¢`}
            stroke="#f59e0b"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
            iconType="line"
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="futures"
            name="Futures"
            stroke="#1f2937"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />

          {locationKeys.map((location, index) => (
            <Line
              key={`${location}_cash`}
              yAxisId="left"
              type="monotone"
              dataKey={`${location}_cash`}
              name={`${location}`}
              stroke={LOCATION_COLORS[index % LOCATION_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              strokeDasharray="5 5"
            />
          ))}

          {locationKeys.map((location, index) => (
            <Line
              key={`${location}_basis`}
              yAxisId="right"
              type="monotone"
              dataKey={`${location}_basis`}
              name={`${location} Basis`}
              stroke={LOCATION_COLORS[index % LOCATION_COLORS.length]}
              strokeWidth={1.5}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              opacity={0.6}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>• Solid black line = Futures curve</p>
        <p>• Dashed colored lines = Local cash prices by elevator</p>
        <p>• Thin colored lines (right axis) = Basis by elevator</p>
      </div>
    </div>
  );
};
