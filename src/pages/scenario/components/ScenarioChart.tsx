import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ScatterChart, ZAxis } from 'recharts';
import type { Scenario, ScenarioSale, ScenarioRecommendation } from '../types/scenarioTypes';

interface ScenarioChartProps {
  scenario: Scenario;
  sales: ScenarioSale[];
  recommendations: ScenarioRecommendation[];
}

export const ScenarioChart: React.FC<ScenarioChartProps> = ({
  scenario,
  sales,
  recommendations
}) => {
  const sortedSales = [...sales].sort((a, b) =>
    new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime()
  );

  let cumulativePercentage = 0;
  const salesChartData = sortedSales.map(sale => {
    cumulativePercentage += sale.percentage_of_production;
    return {
      date: new Date(sale.sale_date).toLocaleDateString(),
      percentage: cumulativePercentage,
      price: sale.cash_price || 0
    };
  });

  const recChartData = recommendations
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
    .map(rec => ({
      date: new Date(rec.target_date).toLocaleDateString(),
      target: rec.target_percentage_sold
    }));

  const priceChartData = sortedSales.map(sale => ({
    date: new Date(sale.sale_date).toLocaleDateString(),
    price: sale.cash_price || 0
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Percentage Sold Over Time</h3>
        {salesChartData.length === 0 && recChartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No sales or recommendations to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
              <YAxis label={{ value: '% Sold', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {salesChartData.length > 0 && (
                <Line
                  data={salesChartData}
                  type="monotone"
                  dataKey="percentage"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Actual % Sold"
                  dot={{ fill: '#22c55e', r: 4 }}
                />
              )}
              {recChartData.length > 0 && (
                <Line
                  data={recChartData}
                  type="monotone"
                  dataKey="target"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Target % Sold"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {priceChartData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sale Prices</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={priceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#10b981"
                strokeWidth={2}
                name="Cash Price"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
