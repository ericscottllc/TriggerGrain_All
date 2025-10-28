import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { useScenarioSales } from '../hooks/useScenarioSales';
import { useNotifications } from '../../../contexts/NotificationContext';
import { AddSaleModal } from './AddSaleModal';
import { formatCurrency, formatVolume, formatPercentage } from '../utils/scenarioCalculations';
import type { Scenario, ScenarioSale } from '../types/scenarioTypes';

interface VirtualSalesManagerProps {
  scenario: Scenario;
  sales: ScenarioSale[];
  onRefresh: () => void;
}

export const VirtualSalesManager: React.FC<VirtualSalesManagerProps> = ({
  scenario,
  sales,
  onRefresh
}) => {
  const { deleteSale } = useScenarioSales(scenario.id);
  const { success, error: showError } = useNotifications();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleDelete = async (sale: ScenarioSale) => {
    if (!confirm(`Delete sale of ${formatVolume(sale.volume_bushels)}?`)) return;

    try {
      await deleteSale(sale.id);
      success('Sale Deleted', 'Virtual sale has been removed');
      onRefresh();
    } catch (err) {
      showError('Delete Failed', err instanceof Error ? err.message : 'Failed to delete sale');
    }
  };

  const sortedSales = [...sales].sort((a, b) =>
    new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Virtual Sales</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90"
        >
          <Plus className="w-4 h-4" />
          Add Sale
        </button>
      </div>

      {sortedSales.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No sales yet</h3>
          <p className="text-gray-600 mb-4">Add your first virtual sale to start tracking performance</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90"
          >
            <Plus className="w-4 h-4" />
            Add Sale
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Production</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Futures</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {formatVolume(sale.volume_bushels)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatPercentage(sale.percentage_of_production)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">
                    {sale.cash_price ? formatCurrency(sale.cash_price) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sale.futures_price ? formatCurrency(sale.futures_price) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sale.basis !== null ? formatCurrency(sale.basis) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sale.elevator_name || '—'}
                    {sale.town_name && ` • ${sale.town_name}`}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(sale)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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

      <AddSaleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        scenario={scenario}
        onSuccess={() => {
          setIsAddModalOpen(false);
          onRefresh();
        }}
      />
    </div>
  );
};
