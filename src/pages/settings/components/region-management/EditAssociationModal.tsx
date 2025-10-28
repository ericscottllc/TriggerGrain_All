import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Building2, MapPin, Network, Wheat, Layers } from 'lucide-react';
import { Button } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

type AssociationType = 'elevator-town' | 'town-region' | 'region-crop-comparison' | 'elevator-crop' | 'elevator-crop-class';

interface EditAssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AssociationType;
  association: any;
  onSave: () => void;
}

interface SelectOption {
  id: string;
  name: string;
  display?: string;
}

export const EditAssociationModal: React.FC<EditAssociationModalProps> = ({
  isOpen,
  onClose,
  type,
  association,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [options, setOptions] = useState<{
    first: SelectOption[];
    second: SelectOption[];
  }>({ first: [], second: [] });
  const { success, error } = useNotifications();

  const getModalConfig = () => {
    switch (type) {
      case 'elevator-town':
        return {
          title: 'Edit Elevator ↔ Town Association',
          icon: Building2,
          firstLabel: 'Elevator',
          secondLabel: 'Town',
          hasValidDates: true,
          hasSortOrder: false
        };
      case 'town-region':
        return {
          title: 'Edit Town ↔ Region Association',
          icon: MapPin,
          firstLabel: 'Town',
          secondLabel: 'Region',
          hasValidDates: true,
          hasSortOrder: false
        };
      case 'region-crop-comparison':
        return {
          title: 'Edit Region ↔ Crop Comparison Association',
          icon: Network,
          firstLabel: 'Region',
          secondLabel: 'Crop Comparison',
          hasValidDates: true,
          hasSortOrder: false
        };
      case 'elevator-crop':
        return {
          title: 'Edit Elevator ↔ Crop Association',
          icon: Wheat,
          firstLabel: 'Elevator',
          secondLabel: 'Crop',
          hasValidDates: false,
          hasSortOrder: true
        };
      case 'elevator-crop-class':
        return {
          title: 'Edit Elevator ↔ Crop Class Association',
          icon: Layers,
          firstLabel: 'Elevator',
          secondLabel: 'Crop Class',
          hasValidDates: false,
          hasSortOrder: true
        };
      default:
        return {
          title: 'Edit Association',
          icon: Save,
          firstLabel: 'First',
          secondLabel: 'Second',
          hasValidDates: false,
          hasSortOrder: false
        };
    }
  };

  const fetchOptions = async () => {
    try {
      setLoading(true);
      let firstQuery, secondQuery;

      switch (type) {
        case 'elevator-town':
          firstQuery = supabase.from('master_elevators').select('id, name').eq('is_active', true);
          secondQuery = supabase.from('master_towns').select('id, name, province').eq('is_active', true);
          break;
        case 'town-region':
          firstQuery = supabase.from('master_towns').select('id, name, province').eq('is_active', true);
          secondQuery = supabase.from('master_regions').select('id, name').eq('is_active', true);
          break;
        case 'region-crop-comparison':
          firstQuery = supabase.from('master_regions').select('id, name').eq('is_active', true);
          secondQuery = supabase.from('master_crop_comparison').select('id, name').eq('is_active', true);
          break;
        case 'elevator-crop':
          firstQuery = supabase.from('master_elevators').select('id, name').eq('is_active', true);
          secondQuery = supabase.from('master_crops').select('id, name').eq('is_active', true);
          break;
        case 'elevator-crop-class':
          firstQuery = supabase.from('master_elevators').select('id, name').eq('is_active', true);
          secondQuery = supabase.from('crop_classes').select('id, name, master_crops(name)').eq('is_active', true);
          break;
      }

      const [firstResult, secondResult] = await Promise.all([
        firstQuery,
        secondQuery
      ]);

      if (firstResult.error) throw firstResult.error;
      if (secondResult.error) throw secondResult.error;

      const firstOptions = firstResult.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        display: item.province ? `${item.name}, ${item.province}` : item.name
      })) || [];

      const secondOptions = secondResult.data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        display: item.master_crops ? `${item.master_crops.name} - ${item.name}` : item.name
      })) || [];

      setOptions({ first: firstOptions, second: secondOptions });
    } catch (err) {
      console.error('Error fetching options:', err);
      error('Failed to load options', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && association) {
      fetchOptions();
      
      // Initialize form data based on association type
      const initData: any = {
        is_active: association.is_active
      };

      switch (type) {
        case 'elevator-town':
          initData.first_id = association.elevator_id;
          initData.second_id = association.town_id;
          initData.valid_from = association.valid_from;
          initData.valid_to = association.valid_to || '';
          break;
        case 'town-region':
          initData.first_id = association.town_id;
          initData.second_id = association.region_id;
          initData.valid_from = association.valid_from;
          initData.valid_to = association.valid_to || '';
          break;
        case 'region-crop-comparison':
          initData.first_id = association.region_id;
          initData.second_id = association.crop_comparison_id;
          initData.valid_from = association.valid_from;
          initData.valid_to = association.valid_to || '';
          break;
        case 'elevator-crop':
          initData.first_id = association.elevator_id;
          initData.second_id = association.crop_id;
          initData.sort_order = association.sort_order;
          break;
        case 'elevator-crop-class':
          initData.first_id = association.elevator_id;
          initData.second_id = association.class_id;
          initData.sort_order = association.sort_order;
          break;
      }

      setFormData(initData);
    }
  }, [isOpen, association, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_id || !formData.second_id || !association) return;

    try {
      setSaving(true);
      let tableName, updateData;

      switch (type) {
        case 'elevator-town':
          tableName = 'elevator_towns';
          updateData = {
            elevator_id: formData.first_id,
            town_id: formData.second_id,
            valid_from: formData.valid_from,
            valid_to: formData.valid_to || null,
            is_active: formData.is_active
          };
          break;
        case 'town-region':
          tableName = 'town_regions';
          updateData = {
            town_id: formData.first_id,
            region_id: formData.second_id,
            valid_from: formData.valid_from,
            valid_to: formData.valid_to || null,
            is_active: formData.is_active
          };
          break;
        case 'region-crop-comparison':
          tableName = 'region_crop_comparisons';
          updateData = {
            region_id: formData.first_id,
            crop_comparison_id: formData.second_id,
            valid_from: formData.valid_from,
            valid_to: formData.valid_to || null,
            is_active: formData.is_active
          };
          break;
        case 'elevator-crop':
          tableName = 'elevator_crops';
          updateData = {
            elevator_id: formData.first_id,
            crop_id: formData.second_id,
            sort_order: parseInt(formData.sort_order) || 0,
            is_active: formData.is_active
          };
          break;
        case 'elevator-crop-class':
          tableName = 'elevator_crop_classes';
          updateData = {
            elevator_id: formData.first_id,
            class_id: formData.second_id,
            sort_order: parseInt(formData.sort_order) || 0,
            is_active: formData.is_active
          };
          break;
        default:
          throw new Error('Invalid association type');
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', association.id);

      if (updateError) throw updateError;

      success('Association updated', 'Association has been updated successfully');
      onSave();
    } catch (err) {
      console.error('Error updating association:', err);
      error('Failed to update association', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !association) return null;

  const config = getModalConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-tg-green" />
            <h2 className="text-lg font-semibold text-gray-800">{config.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.firstLabel}
              </label>
              <select
                value={formData.first_id || ''}
                onChange={(e) => setFormData({ ...formData, first_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select {config.firstLabel}</option>
                {options.first.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.display || option.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.secondLabel}
              </label>
              <select
                value={formData.second_id || ''}
                onChange={(e) => setFormData({ ...formData, second_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                required
              >
                <option value="">Select {config.secondLabel}</option>
                {options.second.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.display || option.name}
                  </option>
                ))}
              </select>
            </div>

            {config.hasValidDates && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.valid_from || ''}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid To (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.valid_to || ''}
                    onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                  />
                </div>
              </>
            )}

            {config.hasSortOrder && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                  min="0"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={formData.is_active || false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-tg-green border-gray-300 rounded focus:ring-tg-green"
              />
              <label htmlFor="is_active_edit" className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                className="bg-tg-green hover:bg-tg-green/90"
                icon={Save}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};