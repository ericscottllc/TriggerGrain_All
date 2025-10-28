import React, { useState } from 'react';
import { Modal, Button, Input } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';

interface CreateRegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const CreateRegionModal: React.FC<CreateRegionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const { success, error } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setLoading(true);
      
      const { error: insertError } = await supabase
        .from('master_regions')
        .insert({
          name: formData.name.trim(),
          code: formData.code.trim() || null
        });

      if (insertError) throw insertError;

      success('Region created', 'New region has been created successfully');
      setFormData({ name: '', code: '' });
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error('Error creating region:', err);
      error('Failed to create region', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', code: '' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Region">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Input
          label="Region Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter region name"
          required
          fullWidth
        />
        
        <Input
          label="Region Code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="Enter region code (optional)"
          fullWidth
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button variant="secondary" type="submit" loading={loading}>
            Create Region
          </Button>
        </div>
      </form>
    </Modal>
  );
};