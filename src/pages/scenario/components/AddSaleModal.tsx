import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useScenarioSales } from '../hooks/useScenarioSales';
import { useNotifications } from '../../../contexts/NotificationContext';
import { validateSale } from '../utils/scenarioValidation';
import type { Scenario, CreateSaleData, PriceType } from '../types/scenarioTypes';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  onSuccess: () => void;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({
  isOpen,
  onClose,
  scenario,
  onSuccess
}) => {
  const { createSale, sales } = useScenarioSales(scenario.id);
  const { success: showSuccess, error: showError } = useNotifications();

  const [formData, setFormData] = useState<CreateSaleData>({
    scenario_id: scenario.id,
    sale_date: new Date().toISOString().split('T')[0],
    volume_bushels: 0,
    price_type: 'manual',
    cash_price: 0,
    futures_price: 0,
    basis: 0,
    contract_month: '',
    notes: ''
  });

  const [elevators, setElevators] = useState<any[]>([]);
  const [towns, setTowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchElevatorsAndTowns();
    }
  }, [isOpen]);

  const fetchElevatorsAndTowns = async () => {
    const [elevatorsData, townsData] = await Promise.all([
      supabase.from('master_elevators').select('*').eq('is_active', true).order('name'),
      supabase.from('master_towns').select('*').eq('is_active', true).order('name')
    ]);

    if (elevatorsData.data) setElevators(elevatorsData.data);
    if (townsData.data) setTowns(townsData.data);
  };

  const handleSubmit = async () => {
    setErrors({});

    const validation = validateSale(formData, scenario.production_estimate, sales);

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setLoading(true);

    try {
      await createSale(formData);
      showSuccess('Sale Added', 'Virtual sale has been created');
      onSuccess();
      handleClose();
    } catch (err) {
      showError('Failed to add sale', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      scenario_id: scenario.id,
      sale_date: new Date().toISOString().split('T')[0],
      volume_bushels: 0,
      price_type: 'manual',
      cash_price: 0,
      futures_price: 0,
      basis: 0,
      contract_month: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Add Virtual Sale</h2>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-140px)] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sale Date *</label>
                  <input
                    type="date"
                    value={formData.sale_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, sale_date: e.target.value }))}
                    min={scenario.start_date}
                    max={scenario.end_date}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green ${errors.sale_date ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {errors.sale_date && <p className="mt-1 text-sm text-red-600">{errors.sale_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Volume (bushels) *</label>
                  <input
                    type="number"
                    value={formData.volume_bushels || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, volume_bushels: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green ${errors.volume_bushels ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="10000"
                  />
                  {errors.volume_bushels && <p className="mt-1 text-sm text-red-600">{errors.volume_bushels}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cash Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cash_price || ''}
                    onChange={(e) => {
                      const cash = parseFloat(e.target.value) || 0;
                      const basis = formData.futures_price ? cash - formData.futures_price : 0;
                      setFormData(prev => ({ ...prev, cash_price: cash, basis }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green ${errors.cash_price ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="12.50"
                  />
                  {errors.cash_price && <p className="mt-1 text-sm text-red-600">{errors.cash_price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Futures Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.futures_price || ''}
                    onChange={(e) => {
                      const futures = parseFloat(e.target.value) || 0;
                      const basis = formData.cash_price ? formData.cash_price - futures : 0;
                      setFormData(prev => ({ ...prev, futures_price: futures, basis }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                    placeholder="12.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Basis</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basis || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Elevator</label>
                  <select
                    value={formData.elevator_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, elevator_id: e.target.value || undefined }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                  >
                    <option value="">None</option>
                    {elevators.map(elevator => (
                      <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Town</label>
                  <select
                    value={formData.town_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, town_id: e.target.value || undefined }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                  >
                    <option value="">None</option>
                    {towns.map(town => (
                      <option key={town.id} value={town.id}>{town.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contract Month</label>
                <input
                  type="text"
                  value={formData.contract_month || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contract_month: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                  placeholder="e.g., March, May, November"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                  rows={2}
                  placeholder="Additional notes about this sale..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Sale'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
