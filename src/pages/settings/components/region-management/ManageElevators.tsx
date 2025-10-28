import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';
import { CreateElevatorModal } from './CreateElevatorModal';

interface Elevator {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EditElevatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  elevator: Elevator | null;
  onSave: () => void;
}

const EditElevatorModal: React.FC<EditElevatorModalProps> = ({ isOpen, onClose, elevator, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const { success, error } = useNotifications();

  useEffect(() => {
    if (elevator) {
      setFormData({
        name: elevator.name,
        code: elevator.code || ''
      });
    }
  }, [elevator]);

  const handleSave = async () => {
    if (!elevator || !formData.name.trim()) return;

    try {
      setLoading(true);
      
      const { error: updateError } = await supabase
        .from('master_elevators')
        .update({
          name: formData.name.trim(),
          code: formData.code.trim() || null
        })
        .eq('id', elevator.id);

      if (updateError) throw updateError;

      success('Elevator updated', 'Elevator has been updated successfully');
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating elevator:', err);
      error('Failed to update elevator', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Elevator</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Elevator Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                placeholder="Enter elevator name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Elevator Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green"
                placeholder="Enter elevator code (optional)"
              />
            </div>

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
};

export const ManageElevators: React.FC = () => {
  const [elevators, setElevators] = useState<Elevator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingElevator, setEditingElevator] = useState<Elevator | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { success, error } = useNotifications();

  const fetchElevators = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('master_elevators')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setElevators(data || []);
    } catch (err) {
      console.error('Error fetching elevators:', err);
      error('Failed to load elevators', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElevators();
  }, []);

  const deleteElevator = async (elevatorId: string) => {
    if (!confirm('Are you sure you want to delete this elevator? This action cannot be undone.')) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('master_elevators')
        .delete()
        .eq('id', elevatorId);

      if (deleteError) throw deleteError;

      setElevators(prev => prev.filter(elevator => elevator.id !== elevatorId));
      success('Elevator deleted', 'Elevator has been deleted successfully');
    } catch (err) {
      console.error('Error deleting elevator:', err);
      error('Failed to delete elevator', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const filteredElevators = elevators.filter(elevator =>
    elevator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (elevator.code && elevator.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with integrated search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-tg-green" />
          <h2 className="text-lg font-semibold text-gray-800">Elevators ({elevators.length})</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search elevators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tg-green text-sm w-64"
            />
          </div>
          <Button
            variant="primary"
            icon={Plus}
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-tg-green hover:bg-tg-green/90"
          >
            Add Elevator
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredElevators.map((elevator, index) => (
              <motion.tr
                key={elevator.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-tg-green" />
                    <span className="font-medium text-gray-900">{elevator.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-gray-600">{elevator.code || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    elevator.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {elevator.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(elevator.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingElevator(elevator)}
                      className="p-1 text-gray-400 hover:text-tg-green transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteElevator(elevator.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredElevators.length === 0 && (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No elevators found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No elevators have been created yet'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateElevatorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={fetchElevators}
      />
      
      <EditElevatorModal
        isOpen={!!editingElevator}
        onClose={() => setEditingElevator(null)}
        elevator={editingElevator}
        onSave={fetchElevators}
      />
    </div>
  );
};