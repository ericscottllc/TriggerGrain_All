import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/Shared/SharedComponents';
import { useNotifications } from '../../../../contexts/NotificationContext';
import { supabase } from '../../../../lib/supabase';

interface FormField {
  name: string;
  label: string;
  type?: 'text' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

interface GenericEditModalProps<T extends { id: string }> {
  isOpen: boolean;
  onClose: () => void;
  item: T | null;
  onSave: () => void;
  tableName: string;
  title: string;
  fields: FormField[];
  focusRingColor?: string;
}

export function GenericEditModal<T extends { id: string; [key: string]: any }>({
  isOpen,
  onClose,
  item,
  onSave,
  tableName,
  title,
  fields,
  focusRingColor = 'tg-green'
}: GenericEditModalProps<T>) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { success, error } = useNotifications();

  useEffect(() => {
    if (item) {
      const initialData: Record<string, string> = {};
      fields.forEach(field => {
        initialData[field.name] = item[field.name] || '';
      });
      setFormData(initialData);
    }
  }, [item, fields]);

  const handleSave = async () => {
    if (!item) return;

    const requiredFields = fields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !formData[f.name]?.trim());
    if (missingFields.length > 0) return;

    try {
      setLoading(true);

      const updateData: Record<string, string | null> = {};
      fields.forEach(field => {
        updateData[field.name] = formData[field.name]?.trim() || null;
      });

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', item.id);

      if (updateError) throw updateError;

      success(`${title} updated`, `${title} has been updated successfully`);
      onSave();
      onClose();
    } catch (err) {
      console.error(`Error updating ${title.toLowerCase()}:`, err);
      error(`Failed to update ${title.toLowerCase()}`, err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit {title}</h2>

          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${focusRingColor}`}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-${focusRingColor}`}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="secondary" onClick={handleSave} loading={loading}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
