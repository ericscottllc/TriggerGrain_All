import React, { useState } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';
import { useScenarioSales } from '../hooks/useScenarioSales';
import { useNotifications } from '../../../contexts/NotificationContext';
import { formatPercentage } from '../utils/scenarioCalculations';
import type { Scenario, ScenarioRecommendation, CreateRecommendationData } from '../types/scenarioTypes';

interface RecommendationManagerProps {
  scenario: Scenario;
  recommendations: ScenarioRecommendation[];
  onRefresh: () => void;
}

export const RecommendationManager: React.FC<RecommendationManagerProps> = ({
  scenario,
  recommendations,
  onRefresh
}) => {
  const { createRecommendation, deleteRecommendation } = useScenarioSales(scenario.id);
  const { success, error: showError } = useNotifications();
  const [isAdding, setIsAdding] = useState(false);
  const [newRec, setNewRec] = useState<CreateRecommendationData>({
    scenario_id: scenario.id,
    target_date: '',
    target_percentage_sold: 0,
    notes: ''
  });

  const handleAdd = async () => {
    if (!newRec.target_date || newRec.target_percentage_sold <= 0) {
      showError('Validation Error', 'Please enter date and target percentage');
      return;
    }

    try {
      await createRecommendation(newRec);
      success('Recommendation Added', 'Target has been set');
      setNewRec({
        scenario_id: scenario.id,
        target_date: '',
        target_percentage_sold: 0,
        notes: ''
      });
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      showError('Failed to add recommendation', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleDelete = async (recId: string) => {
    if (!confirm('Delete this recommendation?')) return;

    try {
      await deleteRecommendation(recId);
      success('Recommendation Deleted', 'Target has been removed');
      onRefresh();
    } catch (err) {
      showError('Delete Failed', err instanceof Error ? err.message : 'Failed to delete recommendation');
    }
  };

  const sortedRecs = [...recommendations].sort((a, b) =>
    new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Recommendation Targets</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90"
          >
            <Plus className="w-4 h-4" />
            Add Target
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Target</h3>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Date</label>
              <input
                type="date"
                value={newRec.target_date}
                onChange={(e) => setNewRec(prev => ({ ...prev, target_date: e.target.value }))}
                min={scenario.start_date}
                max={scenario.end_date}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target % Sold</label>
              <input
                type="number"
                value={newRec.target_percentage_sold || ''}
                onChange={(e) => setNewRec(prev => ({ ...prev, target_percentage_sold: parseFloat(e.target.value) || 0 }))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="50"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 px-3 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90 text-sm"
              >
                Add
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {sortedRecs.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No targets set</h3>
          <p className="text-gray-600">Add recommendation targets to track selling progress</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target % Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedRecs.map(rec => (
                <tr key={rec.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(rec.target_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-tg-green">
                    {formatPercentage(rec.target_percentage_sold)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {rec.notes || '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
