import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Activity,
  Plus,
  BarChart3,
  Trash2,
  Play,
  Pause,
  CheckCircle
} from 'lucide-react';
import { useScenarioData } from '../hooks/useScenarioData';
import { useScenarioSales } from '../hooks/useScenarioSales';
import { useScenarioEvaluation } from '../hooks/useScenarioEvaluation';
import { useNotifications } from '../../../contexts/NotificationContext';
import { VirtualSalesManager } from './VirtualSalesManager';
import { RecommendationManager } from './RecommendationManager';
import { ScenarioChart } from './ScenarioChart';
import { EvaluationPanel } from './EvaluationPanel';
import {
  formatCurrency,
  formatVolume,
  formatPercentage,
  getScenarioHealthStatus
} from '../utils/scenarioCalculations';
import type { Scenario } from '../types/scenarioTypes';

export const ScenarioDashboard = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { getScenario, updateScenarioStatus, deleteScenario } = useScenarioData();
  const { sales, recommendations, fetchSales, fetchRecommendations } = useScenarioSales(scenarioId);
  const { evaluations, evaluateScenario, fetchEvaluations } = useScenarioEvaluation();
  const { success, error: showError } = useNotifications();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'recommendations' | 'evaluations'>('overview');
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    if (scenarioId) {
      loadScenario();
    }
  }, [scenarioId]);

  const loadScenario = async () => {
    if (!scenarioId) return;

    setLoading(true);
    try {
      const data = await getScenario(scenarioId);
      setScenario(data);
      await Promise.all([
        fetchSales(scenarioId),
        fetchRecommendations(scenarioId),
        fetchEvaluations(scenarioId)
      ]);
    } catch (err) {
      console.error('Error loading scenario:', err);
      showError('Failed to load scenario', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: Scenario['status']) => {
    if (!scenarioId) return;

    try {
      await updateScenarioStatus(scenarioId, newStatus);
      await loadScenario();
      success('Status Updated', `Scenario status changed to ${newStatus}`);
    } catch (err) {
      showError('Failed to update status', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDelete = async () => {
    if (!scenarioId || !scenario) return;

    if (!confirm(`Are you sure you want to delete "${scenario.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteScenario(scenarioId);
      success('Scenario Deleted', `"${scenario.name}" has been deleted`);
      navigate('/scenario');
    } catch (err) {
      showError('Failed to delete scenario', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleEvaluate = async () => {
    if (!scenario) return;

    setEvaluating(true);
    try {
      await evaluateScenario(scenario, sales, recommendations, false);
      await loadScenario();
      success('Evaluation Complete', 'Scenario has been evaluated');
    } catch (err) {
      showError('Evaluation Failed', err instanceof Error ? err.message : 'Failed to evaluate scenario');
    } finally {
      setEvaluating(false);
    }
  };

  const handleFinalEvaluate = async () => {
    if (!scenario) return;

    if (!confirm('This will mark the scenario as evaluated and close it. Continue?')) {
      return;
    }

    setEvaluating(true);
    try {
      await evaluateScenario(scenario, sales, recommendations, true);
      await loadScenario();
      success('Final Evaluation Complete', 'Scenario has been closed and evaluated');
    } catch (err) {
      showError('Evaluation Failed', err instanceof Error ? err.message : 'Failed to evaluate scenario');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Scenario not found</p>
          <button
            onClick={() => navigate('/scenario')}
            className="mt-4 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90"
          >
            Back to Scenarios
          </button>
        </div>
      </div>
    );
  }

  const healthStatus = getScenarioHealthStatus(
    (scenario as any).percentage_sold || 0,
    recommendations
  );

  const getHealthColor = () => {
    switch (healthStatus) {
      case 'ahead': return 'text-green-600';
      case 'on-track': return 'text-blue-600';
      case 'behind': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: Scenario['status']) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-yellow-100 text-yellow-800';
      case 'evaluated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/scenario')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{scenario.name}</h1>
              <p className="text-sm text-gray-500">
                {scenario.crop_name}
                {scenario.class_name && ` • ${scenario.class_name}`}
                {scenario.region_name && ` • ${scenario.region_name}`}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(scenario.status)}`}>
              {scenario.status}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Production</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                {formatVolume(scenario.production_estimate)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium">% Sold</span>
              </div>
              <p className={`text-lg font-semibold ${getHealthColor()}`}>
                {formatPercentage((scenario as any).percentage_sold || 0)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Avg Price</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">
                {(scenario as any).average_price > 0
                  ? formatCurrency((scenario as any).average_price)
                  : '—'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Revenue</span>
              </div>
              <p className="text-lg font-semibold text-green-600">
                {(scenario as any).total_revenue > 0
                  ? formatCurrency((scenario as any).total_revenue, 0)
                  : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-tg-green text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'sales'
                  ? 'bg-tg-green text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sales ({sales.length})
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'recommendations'
                  ? 'bg-tg-green text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Recommendations ({recommendations.length})
            </button>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'evaluations'
                  ? 'bg-tg-green text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Evaluations ({evaluations.length})
            </button>

            <div className="flex-1" />

            {scenario.status !== 'evaluated' && (
              <button
                onClick={handleEvaluate}
                disabled={evaluating}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <BarChart3 className="w-4 h-4" />
                Evaluate
              </button>
            )}

            {scenario.status === 'active' && (
              <button
                onClick={() => handleStatusChange('closed')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Pause className="w-4 h-4" />
                Close
              </button>
            )}

            {scenario.status === 'planning' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
                Activate
              </button>
            )}

            {scenario.status === 'closed' && (
              <button
                onClick={handleFinalEvaluate}
                disabled={evaluating}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Final Evaluation
              </button>
            )}

            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <ScenarioChart
                scenario={scenario}
                sales={sales}
                recommendations={recommendations}
              />

              {scenario.description && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-600">{scenario.description}</p>
                </div>
              )}

              {scenario.market_assumptions && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Market Assumptions</h3>
                  <p className="text-gray-600">{scenario.market_assumptions}</p>
                </div>
              )}

              {scenario.notes && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
                  <p className="text-gray-600">{scenario.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <VirtualSalesManager
              scenario={scenario}
              sales={sales}
              onRefresh={loadScenario}
            />
          )}

          {activeTab === 'recommendations' && (
            <RecommendationManager
              scenario={scenario}
              recommendations={recommendations}
              onRefresh={loadScenario}
            />
          )}

          {activeTab === 'evaluations' && (
            <EvaluationPanel
              scenario={scenario}
              evaluations={evaluations}
              onRefresh={loadScenario}
            />
          )}
        </div>
      </div>
    </div>
  );
};
