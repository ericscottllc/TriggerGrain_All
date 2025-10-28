import React from 'react';
import { BarChart3, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { formatCurrency, formatVolume, formatPercentage } from '../utils/scenarioCalculations';
import type { Scenario, ScenarioEvaluation } from '../types/scenarioTypes';

interface EvaluationPanelProps {
  scenario: Scenario;
  evaluations: ScenarioEvaluation[];
  onRefresh: () => void;
}

export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({
  scenario,
  evaluations
}) => {
  const sortedEvaluations = [...evaluations].sort((a, b) =>
    new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime()
  );

  const getPerformanceColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (variance?: number) => {
    if (!variance) return AlertCircle;
    return variance > 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Performance Evaluations</h2>
      </div>

      {sortedEvaluations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No evaluations yet</h3>
          <p className="text-gray-600">Run an evaluation to assess scenario performance</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedEvaluations.map(evaluation => {
            const VarianceIcon = getVarianceIcon(evaluation.variance_from_recommendation);

            return (
              <div key={evaluation.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Evaluation - {new Date(evaluation.evaluation_date).toLocaleDateString()}
                    </h3>
                    {evaluation.is_final && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        Final Evaluation
                      </span>
                    )}
                  </div>
                  {evaluation.performance_score !== undefined && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Performance Score</div>
                      <div className={`text-2xl font-bold ${getPerformanceColor(evaluation.performance_score)}`}>
                        {evaluation.performance_score.toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">% Sold</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formatPercentage(evaluation.percentage_sold)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Volume Sold</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formatVolume(evaluation.total_volume_sold)}
                    </div>
                  </div>

                  {evaluation.average_price_achieved && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Avg Price</div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(evaluation.average_price_achieved)}
                      </div>
                    </div>
                  )}

                  {evaluation.market_average_price && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Market Avg</div>
                      <div className="text-lg font-semibold text-gray-600">
                        {formatCurrency(evaluation.market_average_price)}
                      </div>
                    </div>
                  )}
                </div>

                {(evaluation.market_high_price || evaluation.market_low_price) && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {evaluation.market_high_price && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Market High</div>
                        <div className="text-base font-semibold text-green-600">
                          {formatCurrency(evaluation.market_high_price)}
                        </div>
                      </div>
                    )}

                    {evaluation.market_low_price && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Market Low</div>
                        <div className="text-base font-semibold text-red-600">
                          {formatCurrency(evaluation.market_low_price)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {evaluation.variance_from_recommendation !== undefined && (
                  <div className="flex items-center gap-2 mb-4">
                    <VarianceIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {Math.abs(evaluation.variance_from_recommendation).toFixed(1)}%
                      {evaluation.variance_from_recommendation > 0 ? ' ahead of' : ' behind'} recommendation
                    </span>
                  </div>
                )}

                {evaluation.opportunities_missed > 0 && (
                  <div className="flex items-center gap-2 mb-4 text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      {evaluation.opportunities_missed} high-price opportunities missed
                    </span>
                  </div>
                )}

                {(evaluation.total_revenue || evaluation.unrealized_value) && (
                  <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-gray-100">
                    {evaluation.total_revenue && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Realized Revenue</div>
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(evaluation.total_revenue, 0)}
                        </div>
                      </div>
                    )}

                    {evaluation.unrealized_value && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Unrealized Value</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(evaluation.unrealized_value, 0)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {evaluation.evaluation_notes && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-700 mb-2">Analysis</div>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {evaluation.evaluation_notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
