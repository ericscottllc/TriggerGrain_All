import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, Plus, Edit, Trash2, Search, MapPin, Building2, Wheat, Layers, Link } from 'lucide-react';
import { Button } from '../../../../components/Shared/SharedComponents';
import { supabase } from '../../../../lib/supabase';
import { useNotifications } from '../../../../contexts/NotificationContext';
import { CreateAssociationModal } from './CreateAssociationModal';
import { EditAssociationModal } from './EditAssociationModal';

// Types for the associations
interface ElevatorTown {
  id: string;
  elevator_id: string;
  town_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  master_elevators: { name: string };
  master_towns: { name: string; province: string | null };
}

interface TownRegion {
  id: string;
  town_id: string;
  region_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  master_towns: { name: string; province: string | null };
  master_regions: { name: string };
}

interface RegionCropComparison {
  id: string;
  region_id: string;
  crop_comparison_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  master_regions: { name: string };
  master_crop_comparison: { name: string };
}

interface ElevatorCrop {
  id: string;
  elevator_id: string;
  crop_id: string;
  sort_order: number;
  is_active: boolean;
  master_elevators: { name: string };
  master_crops: { name: string };
}

interface ElevatorCropClass {
  id: string;
  elevator_id: string;
  class_id: string;
  sort_order: number;
  is_active: boolean;
  master_elevators: { name: string };
  crop_classes: { name: string; master_crops: { name: string } };
}

type AssociationType = 'elevator-town' | 'town-region' | 'region-crop-comparison' | 'elevator-crop' | 'elevator-crop-class';

export const ManageAssociations: React.FC = () => {
  const [activeAssociationType, setActiveAssociationType] = useState<AssociationType>('elevator-town');
  const [associations, setAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssociation, setEditingAssociation] = useState<any>(null);
  const { success, error } = useNotifications();

  const associationTypes = [
    { id: 'elevator-town', title: 'Elevator ↔ Town', icon: Link, color: 'text-blue-600' },
    { id: 'town-region', title: 'Town ↔ Region', icon: MapPin, color: 'text-green-600' },
    { id: 'region-crop-comparison', title: 'Region ↔ Crop Comparison', icon: Wheat, color: 'text-yellow-600' },
    { id: 'elevator-crop', title: 'Elevator ↔ Crop', icon: Building2, color: 'text-purple-600' },
    { id: 'elevator-crop-class', title: 'Elevator ↔ Crop Class', icon: Layers, color: 'text-red-600' }
  ];

  const fetchAssociations = async () => {
    try {
      setLoading(true);
      let query;
      
      switch (activeAssociationType) {
        case 'elevator-town':
          query = supabase
            .from('elevator_towns')
            .select('*, master_elevators(name), master_towns(name, province)')
            .order('created_at', { ascending: false });
          break;
        case 'town-region':
          query = supabase
            .from('town_regions')
            .select('*, master_towns(name, province), master_regions(name)')
            .order('created_at', { ascending: false });
          break;
        case 'region-crop-comparison':
          query = supabase
            .from('region_crop_comparisons')
            .select('*, master_regions(name), master_crop_comparison(name)')
            .order('created_at', { ascending: false });
          break;
        case 'elevator-crop':
          query = supabase
            .from('elevator_crops')
            .select('*, master_elevators(name), master_crops(name)')
            .order('sort_order', { ascending: true });
          break;
        case 'elevator-crop-class':
          query = supabase
            .from('elevator_crop_classes')
            .select('*, master_elevators(name), crop_classes(name, master_crops(name))')
            .order('sort_order', { ascending: true });
          break;
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setAssociations(data || []);
    } catch (err) {
      console.error('Error fetching associations:', err);
      error('Failed to load associations', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
  }, [activeAssociationType]);

  const deleteAssociation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this association?')) return;
    
    try {
      const tableName = activeAssociationType.replace('-', '_');
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      await fetchAssociations();
      success('Association deleted', 'Association has been deleted successfully');
    } catch (err) {
      console.error('Error deleting association:', err);
      error('Failed to delete association', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const getTableColumns = () => {
    switch (activeAssociationType) {
      case 'elevator-town':
        return ['Elevator', 'Town', 'Valid From', 'Status', 'Actions'];
      case 'town-region':
        return ['Town', 'Region', 'Valid From', 'Status', 'Actions'];
      case 'region-crop-comparison':
        return ['Region', 'Crop Comparison', 'Valid From', 'Status', 'Actions'];
      case 'elevator-crop':
        return ['Elevator', 'Crop', 'Sort Order', 'Status', 'Actions'];
      case 'elevator-crop-class':
        return ['Elevator', 'Crop Class', 'Sort Order', 'Status', 'Actions'];
      default:
        return [];
    }
  };

  const renderTableRow = (association: any, index: number) => {
    const activeType = associationTypes.find(t => t.id === activeAssociationType);
    
    const getCellContent = (columnIndex: number) => {
      switch (activeAssociationType) {
        case 'elevator-town':
          switch (columnIndex) {
            case 0: return (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{association.master_elevators?.name || 'Unknown'}</span>
              </div>
            );
            case 1: return (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>{association.master_towns?.name || 'Unknown'}{association.master_towns?.province && `, ${association.master_towns.province}`}</span>
              </div>
            );
            case 2: return new Date(association.valid_from).toLocaleDateString();
          }
          break;
        case 'town-region':
          switch (columnIndex) {
            case 0: return (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">{association.master_towns?.name || 'Unknown'}{association.master_towns?.province && `, ${association.master_towns.province}`}</span>
              </div>
            );
            case 1: return (
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-600" />
                <span>{association.master_regions?.name || 'Unknown'}</span>
              </div>
            );
            case 2: return new Date(association.valid_from).toLocaleDateString();
          }
          break;
        case 'region-crop-comparison':
          switch (columnIndex) {
            case 0: return (
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-purple-600" />
                <span className="font-medium">{association.master_regions?.name || 'Unknown'}</span>
              </div>
            );
            case 1: return (
              <div className="flex items-center gap-2">
                <Wheat className="w-4 h-4 text-yellow-600" />
                <span>{association.master_crop_comparison?.name || 'Unknown'}</span>
              </div>
            );
            case 2: return new Date(association.valid_from).toLocaleDateString();
          }
          break;
        case 'elevator-crop':
          switch (columnIndex) {
            case 0: return (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{association.master_elevators?.name || 'Unknown'}</span>
              </div>
            );
            case 1: return (
              <div className="flex items-center gap-2">
                <Wheat className="w-4 h-4 text-yellow-600" />
                <span>{association.master_crops?.name || 'Unknown'}</span>
              </div>
            );
            case 2: return <span className="font-mono text-sm">{association.sort_order}</span>;
          }
          break;
        case 'elevator-crop-class':
          switch (columnIndex) {
            case 0: return (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{association.master_elevators?.name || 'Unknown'}</span>
              </div>
            );
            case 1: return (
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-600" />
                <span>{association.crop_classes ? `${association.crop_classes.master_crops?.name} - ${association.crop_classes.name}` : 'Unknown'}</span>
              </div>
            );
            case 2: return <span className="font-mono text-sm">{association.sort_order}</span>;
          }
          break;
      }
      return null;
    };

    return (
      <motion.tr
        key={association.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className="hover:bg-gray-50"
      >
        {getTableColumns().slice(0, -2).map((_, colIndex) => (
          <td key={colIndex} className="px-4 py-3">
            {getCellContent(colIndex)}
          </td>
        ))}
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            association.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {association.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setEditingAssociation(association);
              }}
              className="p-1 text-gray-400 hover:text-tg-green transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteAssociation(association.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>
    );
  };

  const filteredAssociations = associations.filter(association => {
    const searchLower = searchTerm.toLowerCase();
    switch (activeAssociationType) {
      case 'elevator-town':
        return (association.master_elevators?.name || '').toLowerCase().includes(searchLower) ||
               (association.master_towns?.name || '').toLowerCase().includes(searchLower);
      case 'town-region':
        return (association.master_towns?.name || '').toLowerCase().includes(searchLower) ||
               (association.master_regions?.name || '').toLowerCase().includes(searchLower);
      case 'region-crop-comparison':
        return (association.master_regions?.name || '').toLowerCase().includes(searchLower) ||
               (association.master_crop_comparison?.name || '').toLowerCase().includes(searchLower);
      case 'elevator-crop':
        return (association.master_elevators?.name || '').toLowerCase().includes(searchLower) ||
               (association.master_crops?.name || '').toLowerCase().includes(searchLower);
      case 'elevator-crop-class':
        return (association.master_elevators?.name || '').toLowerCase().includes(searchLower) ||
               (association.crop_classes?.name || '').toLowerCase().includes(searchLower) ||
               (association.crop_classes?.master_crops?.name || '').toLowerCase().includes(searchLower);
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Association Type Selector */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
        {associationTypes.map((type) => {
          const Icon = type.icon;
          const isActive = activeAssociationType === type.id;
          
          return (
            <motion.button
              key={type.id}
              onClick={() => setActiveAssociationType(type.id as AssociationType)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white text-tg-green shadow-sm border border-tg-green/20'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-tg-green' : type.color}`} />
              <span>{type.title}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Header with integrated search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-tg-green" />
          <h2 className="text-lg font-semibold text-gray-800">
            {associationTypes.find(t => t.id === activeAssociationType)?.title} ({associations.length})
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${associationTypes.find(t => t.id === activeAssociationType)?.title.toLowerCase()}...`}
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
            Add Association
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {getTableColumns().map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    index === getTableColumns().length - 1 ? 'text-right' : 'text-left'
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAssociations.map((association, index) => renderTableRow(association, index))}
          </tbody>
        </table>

        {filteredAssociations.length === 0 && (
          <div className="p-8 text-center">
            <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No associations found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : `No ${associationTypes.find(t => t.id === activeAssociationType)?.title.toLowerCase()} associations have been created yet`}
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateAssociationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        type={activeAssociationType}
        onSave={() => {
          fetchAssociations();
          setShowCreateModal(false);
        }}
      />

      {/* Edit Modal */}
      <EditAssociationModal
        isOpen={!!editingAssociation}
        onClose={() => setEditingAssociation(null)}
        type={activeAssociationType}
        association={editingAssociation}
        onSave={() => {
          fetchAssociations();
          setEditingAssociation(null);
        }}
      />
    </div>
  );
};