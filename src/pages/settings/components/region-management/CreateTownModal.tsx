import React, { useState } from 'react';
import { Modal, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface CreateTownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const CreateTownModal: React.FC<CreateTownModalProps> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    province: ''
  });
  const { success, error } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setLoading(true);
      
      const { error: insertError } = await supabase
        .from('master_towns')
        .insert({
          name: formData.name.trim(),
          province: formData.province.trim() || null
        });

      if (insertError) throw insertError;

      success('Town created', 'New town has been created successfully');
      setFormData({ name: '', province: '' });
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error('Error creating town:', err);
      error('Failed to create town', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', province: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Town">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Town Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter town name"
          required
          fullWidth
        />
        
        <Input
          label="Province"
          value={formData.province}
          onChange={(e) => setFormData({ ...formData, province: e.target.value })}
          placeholder="Enter province (optional)"
          fullWidth
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button variant="secondary" type="submit" loading={loading}>
            Create Town
          </Button>
        </div>
      </form>
    </Modal>
  );
};