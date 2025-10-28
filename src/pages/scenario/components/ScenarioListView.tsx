import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Workflow, Plus, Search, TrendingUp, Calendar, Target, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScenarioData } from '../hooks/useScenarioData';
import { CreateScenarioModal } from './CreateScenarioModal';
import { formatCurrency, formatVolume, formatPercentage, getScenarioHealthStatus } from '../utils/scenarioCalculations';
import type { ScenarioStatus } from '../types/scenarioTypes';

export const ScenarioListView = () => {
  const navigate = useNavigate();
  const { scenarios, loading } = useScenarioData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      const matchesSearch = searchTerm === '' ||
        scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scenario.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scenario.crop_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || scenario.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [scenarios, searchTerm, statusFilter]);

  const getStatusColor = (status: ScenarioStatus) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-yellow-100 text-yellow-800';
      case 'evaluated':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthStatusColor = (status: ReturnType<typeof getScenarioHealthStatus>) => {
    switch (status) {
      case 'ahead':
        return 'text-green-600';
      case 'on-track':
        return 'text-blue-600';
      case 'behind':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-tg-green rounded-xl flex items-center justify-center">
                <Workflow className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Scenarios</h1>
                <p className="text-sm text-gray-500">
                  Model and analyze virtual grain marketing strategies
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Scenario
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search scenarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ScenarioStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="evaluated">Evaluated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {filteredScenarios.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No scenarios found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first scenario to start modeling marketing strategies'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Scenario
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScenarios.map((scenario, index) => {
                const healthStatus = getScenarioHealthStatus(
                  scenario.percentage_sold,
                  [],
                  new Date()
                );

                return (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => navigate(`/scenario/${scenario.id}`)}
                    className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {scenario.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {scenario.crop_name}
                          {scenario.class_name && ` • ${scenario.class_name}`}
                          {scenario.region_name && ` • ${scenario.region_name}`}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(scenario.status)}`}>
                        {scenario.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Production</span>
                        <span className="text-sm font-medium text-gray-800">
                          {formatVolume(scenario.production_estimate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">% Sold</span>
                        <span className={`text-sm font-medium ${getHealthStatusColor(healthStatus)}`}>
                          {formatPercentage(scenario.percentage_sold)}
                        </span>
                      </div>

                      {scenario.average_price > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Avg Price</span>
                          <span className="text-sm font-medium text-gray-800">
                            {formatCurrency(scenario.average_price)}
                          </span>
                        </div>
                      )}

                      {scenario.total_revenue > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Revenue</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(scenario.total_revenue, 0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(scenario.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Target className="w-3 h-3" />
                        <span>{scenario.sales_count} sales</span>
                      </div>
                    </div>

                    {scenario.latest_evaluation && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Performance Score</span>
                          <span className="text-xs font-medium text-tg-green">
                            {scenario.latest_evaluation.performance_score?.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {filteredScenarios.length > 0 && (
            <div className="mt-6 text-sm text-gray-500 text-center">
              Showing {filteredScenarios.length} of {scenarios.length} scenarios
            </div>
          )}
        </div>
      </div>

      <CreateScenarioModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
