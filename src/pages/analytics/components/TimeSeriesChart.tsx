import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface TimeSeriesDataPoint {
  date: string;
  [key: string]: string | number | null;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title: string;
  description?: string;
  showFutures?: boolean;
  showBasis?: boolean;
  defaultExpanded?: boolean;
}

const COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
];

const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  return `$${value.toFixed(2)}`;
};

const formatBasis = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(1)}¢`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateFull = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  title,
  description,
  showFutures = true,
  showBasis = true,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(new Set());

  const dataKeys = React.useMemo(() => {
    if (data.length === 0) return [];
    const keys = Object.keys(data[0]).filter(key => key !== 'date');
    return keys;
  }, [data]);

  const priceKeys = dataKeys.filter(key => key.includes('_price') || key.includes('_cash'));
  const futuresKeys = dataKeys.filter(key => key.includes('_futures') && showFutures);
  const basisKeys = dataKeys.filter(key => key.includes('_basis') && showBasis);

  React.useEffect(() => {
    const initialVisible = new Set<string>();
    priceKeys.slice(0, 5).forEach(key => initialVisible.add(key));
    if (futuresKeys.length > 0) initialVisible.add(futuresKeys[0]);
    setVisibleLines(initialVisible);
  }, [data]);

  const toggleLine = (key: string) => {
    setVisibleLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <p className="font-semibold text-gray-800 mb-2">{formatDateFull(label)}</p>
          {payload
            .filter((entry: any) => visibleLines.has(entry.dataKey))
            .map((entry: any, index: number) => {
              const isBasis = entry.dataKey.includes('_basis');
              const value = isBasis ? formatBasis(entry.value) : formatCurrency(entry.value);

              return (
                <div key={index} className="flex items-center gap-2 text-sm mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600 truncate flex-1">{entry.name}:</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              );
            })}
        </div>
      );
    }
    return null;
  };

  const getLineConfig = (key: string, index: number) => {
    const isBasis = key.includes('_basis');
    const isFutures = key.includes('_futures');

    let name = key.replace(/_price|_cash|_futures|_basis/g, '').replace(/_/g, ' ');
    if (isBasis) name += ' (Basis)';
    if (isFutures) name = 'Futures';

    return {
      key,
      name,
      color: isFutures ? '#1f2937' : COLORS[index % COLORS.length],
      strokeWidth: isFutures ? 3 : isBasis ? 1.5 : 2,
      strokeDasharray: isBasis ? '3 3' : undefined,
      yAxisId: isBasis ? 'right' : 'left',
    };
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No data available for the selected filters</p>
      </div>
    );
  }

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
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {data.length} data points
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 pt-0 border-t border-gray-100">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Toggle Data Series:</p>
            <div className="flex flex-wrap gap-2">
              {[...priceKeys, ...futuresKeys, ...basisKeys].map((key, index) => {
                const config = getLineConfig(key, index);
                const isVisible = visibleLines.has(key);

                return (
                  <button
                    key={key}
                    onClick={() => toggleLine(key)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                      isVisible
                        ? 'border-gray-300 bg-white shadow-sm'
                        : 'border-gray-200 bg-gray-50 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-gray-700">{config.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={500}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 80, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                yAxisId="left"
                label={{
                  value: 'Price ($/bu)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px' },
                }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              {basisKeys.length > 0 && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  label={{
                    value: 'Basis (¢/bu)',
                    angle: 90,
                    position: 'insideRight',
                    style: { fontSize: '12px' },
                  }}
                  tickFormatter={(value) => `${(value * 100).toFixed(0)}¢`}
                  stroke="#f59e0b"
                  style={{ fontSize: '12px' }}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                iconType="line"
                onClick={(e) => toggleLine(e.dataKey as string)}
              />

              {[...priceKeys, ...futuresKeys, ...basisKeys].map((key, index) => {
                const config = getLineConfig(key, index);

                return (
                  <Line
                    key={key}
                    yAxisId={config.yAxisId}
                    type="monotone"
                    dataKey={key}
                    name={config.name}
                    stroke={config.color}
                    strokeWidth={config.strokeWidth}
                    strokeDasharray={config.strokeDasharray}
                    dot={false}
                    activeDot={{ r: 5 }}
                    connectNulls
                    hide={!visibleLines.has(key)}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Date Range</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatDate(data[0].date)} - {formatDate(data[data.length - 1].date)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Data Points</p>
              <p className="text-sm font-semibold text-gray-800">{data.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Visible Series</p>
              <p className="text-sm font-semibold text-gray-800">{visibleLines.size}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
