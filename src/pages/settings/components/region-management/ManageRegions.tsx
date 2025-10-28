import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '../../../../components/Shared/SharedComponents';
import { useNotifications } from '../../../../contexts/NotificationContext';
import { CreateRegionModal } from './CreateRegionModal';
import { GenericEditModal } from '../shared/GenericEditModal';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { EmptyState } from '../shared/EmptyState';
import { useDataFetch } from '../../hooks/useDataFetch';
import { filterBySearchTerm } from '../../utils/filterUtils';
import { deleteItem } from '../../utils/deleteUtils';

interface Region {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export const ManageRegions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { success, error } = useNotifications();

  const { data: regions, loading, refetch: fetchRegions } = useDataFetch<Region>({
    tableName: 'master_regions',
    orderBy: { column: 'name', ascending: true },
    errorMessage: 'Failed to load regions'
  });

  const toggleRegionStatus = async (regionId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('master_regions')
        .update({ is_active: !currentStatus })
        .eq('id', regionId);

      if (updateError) throw updateError;

      setRegions(prev => prev.map(region => 
        region.id === regionId ? { ...region, is_active: !currentStatus } : region
      ));

      success('Region updated', `Region ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Error updating region:', err);
      error('Failed to update region', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteRegion = async (regionId: string) => {
    const result = await deleteItem(
      'master_regions',
      regionId,
      'Are you sure you want to delete this region? This action cannot be undone.'
    );

    if (result.success) {
      await fetchRegions();
      success('Region deleted', 'Region has been deleted successfully');
    } else if (result.error) {
      error('Failed to delete region', result.error.message);
    }
  };

  const filteredRegions = filterBySearchTerm(regions, searchTerm, ['name', 'code']);

  if (loading) {
    return <LoadingSpinner color="tg-green" />;
  }

  return (
    <div className="space-y-4">
      {/* Header with integrated search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Map className="w-5 h-5 text-tg-green" />
          <h2 className="text-lg font-semibold text-gray-800">Regions ({regions.length})</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search regions..."
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
            Add Region
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
            {filteredRegions.map((region, index) => (
              <motion.tr
                key={region.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-tg-green" />
                    <span className="font-medium text-gray-900">{region.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-gray-600">{region.code || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    region.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {region.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(region.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingRegion(region)}
                      className="p-1 text-gray-400 hover:text-tg-green transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteRegion(region.id)}
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

        {filteredRegions.length === 0 && (
          <EmptyState
            icon={Map}
            title="No regions found"
            description={searchTerm ? 'Try adjusting your search terms' : 'No regions have been created yet'}
          />
        )}
      </div>

      {/* Modals */}
      <CreateRegionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={fetchRegions}
      />

      <GenericEditModal
        isOpen={!!editingRegion}
        onClose={() => setEditingRegion(null)}
        item={editingRegion}
        onSave={fetchRegions}
        tableName="master_regions"
        title="Region"
        fields={[
          { name: 'name', label: 'Region Name', placeholder: 'Enter region name', required: true },
          { name: 'code', label: 'Region Code', placeholder: 'Enter region code (optional)' }
        ]}
      />
    </div>
  );
};