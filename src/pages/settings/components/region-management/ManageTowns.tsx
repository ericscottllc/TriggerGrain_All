import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '../../../../components/Shared/SharedComponents';
import { useNotifications } from '../../../../contexts/NotificationContext';
import { CreateTownModal } from './CreateTownModal';
import { GenericEditModal } from '../shared/GenericEditModal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { useDataFetch } from '../../hooks/useDataFetch';
import { filterBySearchTerm } from '../../utils/filterUtils';
import { deleteItem } from '../../utils/deleteUtils';

interface Town {
  id: string;
  name: string;
  province: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export const ManageTowns: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTown, setEditingTown] = useState<Town | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { success, error } = useNotifications();

  const { data: towns, loading, refetch: fetchTowns } = useDataFetch<Town>({
    tableName: 'master_towns',
    orderBy: { column: 'name', ascending: true },
    errorMessage: 'Failed to load towns'
  });

  const deleteTown = async (townId: string) => {
    const result = await deleteItem(
      'master_towns',
      townId,
      'Are you sure you want to delete this town? This action cannot be undone.'
    );

    if (result.success) {
      await fetchTowns();
      success('Town deleted', 'Town has been deleted successfully');
    } else if (result.error) {
      error('Failed to delete town', result.error.message);
    }
  };

  const filteredTowns = filterBySearchTerm(towns, searchTerm, ['name', 'province']);

  if (loading) {
    return <LoadingSpinner color="tg-green" />;
  }

  return (
    <div className="space-y-4">
      {/* Header with integrated search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-tg-green" />
          <h2 className="text-lg font-semibold text-gray-800">Towns ({towns.length})</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search towns..."
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
            Add Town
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Province</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTowns.map((town, index) => (
              <motion.tr
                key={town.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-tg-green" />
                    <span className="font-medium text-gray-900">{town.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">{town.province || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    town.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {town.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(town.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingTown(town)}
                      className="p-1 text-gray-400 hover:text-tg-green transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTown(town.id)}
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

        {filteredTowns.length === 0 && (
          <EmptyState
            icon={MapPin}
            title="No towns found"
            description={searchTerm ? 'Try adjusting your search terms' : 'No towns have been created yet'}
          />
        )}
      </div>

      {/* Modals */}
      <CreateTownModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={fetchTowns}
      />

      <GenericEditModal
        isOpen={!!editingTown}
        onClose={() => setEditingTown(null)}
        item={editingTown}
        onSave={fetchTowns}
        tableName="master_towns"
        title="Town"
        fields={[
          { name: 'name', label: 'Town Name', placeholder: 'Enter town name', required: true },
          { name: 'province', label: 'Province', placeholder: 'Enter province (optional)' }
        ]}
      />
    </div>
  );
};