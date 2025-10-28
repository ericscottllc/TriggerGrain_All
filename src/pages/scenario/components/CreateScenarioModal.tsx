import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useScenarioData } from '../hooks/useScenarioData';
import { useNotifications } from '../../../contexts/NotificationContext';
import { validateScenario } from '../utils/scenarioValidation';
import type { CreateScenarioData, RiskTolerance } from '../types/scenarioTypes';

interface CreateScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateScenarioModal: React.FC<CreateScenarioModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createScenario } = useScenarioData();
  const { success, error: showError } = useNotifications();

  const [crops, setCrops] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [towns, setTowns] = useState<any[]>([]);
  const [elevators, setElevators] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateScenarioData>({
    name: '',
    description: '',
    crop_id: '',
    class_id: '',
    region_id: '',
    town_id: '',
    elevator_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    production_estimate: 0,
    risk_tolerance: 'moderate',
    market_assumptions: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchMasterData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.crop_id) {
      fetchCropClasses(formData.crop_id);
    } else {
      setClasses([]);
      setFormData(prev => ({ ...prev, class_id: '' }));
    }
  }, [formData.crop_id]);

  const fetchMasterData = async () => {
    const [cropsData, regionsData, townsData, elevatorsData] = await Promise.all([
      supabase.from('master_crops').select('*').eq('is_active', true).order('name'),
      supabase.from('master_regions').select('*').eq('is_active', true).order('name'),
      supabase.from('master_towns').select('*').eq('is_active', true).order('name'),
      supabase.from('master_elevators').select('*').eq('is_active', true).order('name')
    ]);

    if (cropsData.data) setCrops(cropsData.data);
    if (regionsData.data) setRegions(regionsData.data);
    if (townsData.data) setTowns(townsData.data);
    if (elevatorsData.data) setElevators(elevatorsData.data);
  };

  const fetchCropClasses = async (cropId: string) => {
    const { data } = await supabase
      .from('crop_classes')
      .select('*')
      .eq('crop_id', cropId)
      .eq('is_active', true)
      .order('name');

    if (data) setClasses(data);
  };

  const handleSubmit = async () => {
    setErrors({});

    const cleanedData: CreateScenarioData = {
      name: formData.name,
      description: formData.description || undefined,
      crop_id: formData.crop_id || undefined,
      class_id: formData.class_id || undefined,
      region_id: formData.region_id || undefined,
      town_id: formData.town_id || undefined,
      elevator_id: formData.elevator_id || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date,
      production_estimate: formData.production_estimate,
      risk_tolerance: formData.risk_tolerance as RiskTolerance,
      market_assumptions: formData.market_assumptions || undefined,
      notes: formData.notes || undefined
    };

    const validation = validateScenario(cleanedData);

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
      await createScenario(cleanedData);
      success('Scenario Created', `"${formData.name}" has been created successfully`);
      handleClose();
    } catch (err) {
      console.error('Error creating scenario:', err);
      showError('Creation Failed', err instanceof Error ? err.message : 'Failed to create scenario');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      crop_id: '',
      class_id: '',
      region_id: '',
      town_id: '',
      elevator_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      production_estimate: 0,
      risk_tolerance: 'moderate',
      market_assumptions: '',
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
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create New Scenario</h2>
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scenario Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="e.g., 2025 Canola Strategy #1"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                    rows={2}
                    placeholder="Brief description of this scenario..."
                  />
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Granularity Selection</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Select as many or few levels as needed. At least one selection is required.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Crop</label>
                      <select
                        value={formData.crop_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, crop_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm"
                      >
                        <option value="">None</option>
                        {crops.map(crop => (
                          <option key={crop.id} value={crop.id}>{crop.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Crop Class</label>
                      <select
                        value={formData.class_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value }))}
                        disabled={!formData.crop_id}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm disabled:bg-gray-100"
                      >
                        <option value="">None</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                      <select
                        value={formData.region_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, region_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm"
                      >
                        <option value="">None</option>
                        {regions.map(region => (
                          <option key={region.id} value={region.id}>{region.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
                      <select
                        value={formData.town_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, town_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm"
                      >
                        <option value="">None</option>
                        {towns.map(town => (
                          <option key={town.id} value={town.id}>{town.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Elevator</label>
                      <select
                        value={formData.elevator_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, elevator_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm"
                      >
                        <option value="">None</option>
                        {elevators.map(elevator => (
                          <option key={elevator.id} value={elevator.id}>{elevator.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {errors.granularity && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.granularity}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green ${errors.start_date ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green ${errors.end_date ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Production Estimate (bushels) *
                  </label>
                  <input
                    type="number"
                    value={formData.production_estimate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, production_estimate: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green ${errors.production_estimate ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="100000"
                  />
                  {errors.production_estimate && (
                    <p className="mt-1 text-sm text-red-600">{errors.production_estimate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Tolerance
                  </label>
                  <select
                    value={formData.risk_tolerance}
                    onChange={(e) => setFormData(prev => ({ ...prev, risk_tolerance: e.target.value as RiskTolerance }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Market Assumptions
                  </label>
                  <textarea
                    value={formData.market_assumptions}
                    onChange={(e) => setFormData(prev => ({ ...prev, market_assumptions: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                    rows={2}
                    placeholder="Expected market conditions, trends..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                    rows={2}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-tg-green text-white rounded-lg hover:bg-tg-green/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Scenario'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
