import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, Trash2, Edit, ChevronUp, ChevronDown, Calendar, MapPin, Building, Brain as Grain, DollarSign, TrendingUp } from 'lucide-react';
import { Card, Button, Modal } from '../../../components/Shared/SharedComponents';
import { QueryFilters } from './QueryFilters';
import { useGrainEntryData } from '../hooks/useGrainEntryData';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import { getMonthName, getMonthNumber, getMonthYearSortValue } from '../utils/grainEntryUtils';
import type { QueryFilters as QueryFiltersType } from '../types/grainEntryTypes';

type SortField = 'date' | 'month_year' | 'region' | 'elevator_town' | 'crop' | 'cash_price' | 'futures' | 'basis';
type SortDirection = 'asc' | 'desc';

export const ViewEntriesTab: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useNotifications();
  const {
    entries,
    cropClasses,
    loading,
    queryLoading,
    hasQueriedEntries,
    fetchGrainEntries,
    updateGrainEntry,
    deleteGrainEntry,
    fetchFilterOptions
  } = useGrainEntryData();

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; entryId: string | null; entryDetails: string }>({
    isOpen: false,
    entryId: null,
    entryDetails: ''
  });
  const [editEntry, setEditEntry] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    crop_id: '',
    class_id: '',
    elevator_id: '',
    town_id: '',
    month: '',
    year: 0,
    cash_price: '',
    futures: '',
    basis: ''
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [filters, setFilters] = useState<QueryFiltersType>({
    dateRange: 'recent',
    cropIds: [],
    classIds: [],
    regionIds: [],
    elevatorIds: [],
    townIds: [],
    limit: 50
  });
  const [filterOptions, setFilterOptions] = useState({
    crops: [],
    elevators: [],
    towns: [],
    regions: []
  });

  // Check if user is admin
  useEffect(() => {
    setIsAdmin(!!user);
  }, [user]);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      const options = await fetchFilterOptions();
      setFilterOptions(options);
    };
    loadFilterOptions();
  }, [fetchFilterOptions]);

  const handleQueryEntries = useCallback(async () => {
    try {
      const count = await fetchGrainEntries(filters);
      success('Success', `Loaded ${count} grain entries`);
    } catch (err) {
      error('Query Failed', 'Failed to load grain entries');
    }
  }, [filters, fetchGrainEntries, success, error]);


  // Sort entries
  const sortedEntries = useMemo(() => {
    if (!entries.length) return [];

    return [...entries].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'month_year':
          aValue = getMonthYearSortValue(a);
          bValue = getMonthYearSortValue(b);
          break;
        case 'region':
          aValue = a.region_name || '';
          bValue = b.region_name || '';
          break;
        case 'elevator_town':
          aValue = `${a.master_elevators?.name || ''} - ${a.master_towns?.name || ''}`;
          bValue = `${b.master_elevators?.name || ''} - ${b.master_towns?.name || ''}`;
          break;
        case 'crop':
          aValue = `${a.master_crops?.name || ''} ${a.crop_classes?.name || ''}`;
          bValue = `${b.master_crops?.name || ''} ${b.crop_classes?.name || ''}`;
          break;
        case 'cash_price':
          aValue = parseFloat(a.cash_price) || 0;
          bValue = parseFloat(b.cash_price) || 0;
          break;
        case 'futures':
          aValue = parseFloat(a.futures) || 0;
          bValue = parseFloat(b.futures) || 0;
          break;
        case 'basis':
          aValue = parseFloat(a.basis) || 0;
          bValue = parseFloat(b.basis) || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [entries, sortField, sortDirection]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const showDeleteConfirmation = useCallback((entry: any) => {
    const entryDetails = `${entry.master_elevators?.name || 'Unknown'} - ${entry.master_towns?.name || 'Unknown'} (${getMonthName(entry.month)} ${entry.year})`;
    setDeleteConfirmation({
      isOpen: true,
      entryId: entry.id,
      entryDetails
    });
  }, []);

  const closeDeleteConfirmation = useCallback(() => {
    setDeleteConfirmation({
      isOpen: false,
      entryId: null,
      entryDetails: ''
    });
  }, []);

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteConfirmation.entryId) return;

    try {
      await deleteGrainEntry(deleteConfirmation.entryId);
      success('Success', 'Entry deleted successfully');
      closeDeleteConfirmation();
    } catch (err) {
      console.error('Error deleting entry:', err);
      error('Delete Failed', 'Failed to delete entry');
    }
  };

  // Open edit modal
  const openEditModal = useCallback((entry: any) => {
    setEditEntry(entry);
    setEditForm({
      date: entry.date,
      crop_id: entry.crop_id,
      class_id: entry.class_id,
      elevator_id: entry.elevator_id,
      town_id: entry.town_id,
      month: entry.month,
      year: entry.year,
      cash_price: entry.cash_price || '',
      futures: entry.futures || '',
      basis: entry.basis || ''
    });
  }, []);

  // Close edit modal
  const closeEditModal = useCallback(() => {
    setEditEntry(null);
    setEditForm({
      date: '',
      crop_id: '',
      class_id: '',
      elevator_id: '',
      town_id: '',
      month: '',
      year: 0,
      cash_price: '',
      futures: '',
      basis: ''
    });
  }, []);

  // Handle edit form changes
  const handleEditChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Confirm edit
  const confirmEdit = async () => {
    if (!editEntry) return;

    try {
      await updateGrainEntry(editEntry.id, {
        date: editForm.date,
        crop_id: editForm.crop_id,
        class_id: editForm.class_id,
        elevator_id: editForm.elevator_id,
        town_id: editForm.town_id,
        month: editForm.month,
        year: editForm.year,
        cash_price: parseFloat(editForm.cash_price) || null,
        futures: parseFloat(editForm.futures) || null,
        basis: parseFloat(editForm.basis) || null
      });

      const count = await fetchGrainEntries(filters);
      success('Success', 'Entry updated successfully');
      closeEditModal();
    } catch (err) {
      console.error('Error updating entry:', err);
      error('Update Failed', 'Failed to update entry');
    }
  };

  // Render sort header
  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode; className?: string }> = ({ field, children, className = "" }) => (
    <th 
      className={`px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors border-r border-gray-200 ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="w-3 h-3" /> : 
            <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4 space-y-4">
      {/* Query Filters */}
      <QueryFilters
        filters={filters}
        onFiltersChange={setFilters}
        onQuery={handleQueryEntries}
        loading={queryLoading}
        crops={filterOptions.crops}
        cropClasses={cropClasses}
        elevators={filterOptions.elevators}
        towns={filterOptions.towns}
        regions={filterOptions.regions}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {!hasQueriedEntries && !queryLoading ? (
          <Card className="p-8 text-center">
            <Grain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Query Data</h3>
            <p className="text-gray-500 mb-4">Configure your filters above and click "Query Data" to load grain entries from the database.</p>
          </Card>
        ) : queryLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-tg-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading grain entries...</p>
            </div>
          </div>

        ) : sortedEntries.length === 0 ? (
          <Card className="p-8 text-center">
            <Grain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Found</h3>
            <p className="text-gray-500 mb-4">No grain entries found matching your current filters.</p>
          </Card>
        ) : (
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-tg-green/10 rounded-xl flex items-center justify-center">
                <Eye className="w-4 h-4 text-tg-green" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Query Results</h2>
                <p className="text-sm text-gray-600">
                  Showing {sortedEntries.length} grain entries
                </p>
              </div>
            </div>
          </div>
        )}

        {sortedEntries.length > 0 && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[1400px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <SortHeader field="date" className="w-24">
                      <Calendar className="w-3 h-3" />
                      Date
                    </SortHeader>
                    <SortHeader field="month_year" className="w-20">
                      <Calendar className="w-3 h-3" />
                      Month
                    </SortHeader>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-16">
                      Year
                    </th>
                    <SortHeader field="region" className="w-24">
                      <MapPin className="w-3 h-3" />
                      Region
                    </SortHeader>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">
                      <Building className="w-3 h-3 inline mr-1" />
                      Elevator
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-24">
                      Town
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-24">
                      <Grain className="w-3 h-3 inline mr-1" />
                      Crop
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-24">
                      Class
                    </th>
                    <SortHeader field="cash_price" className="w-20">
                      <DollarSign className="w-3 h-3" />
                      Cash
                    </SortHeader>
                    <SortHeader field="futures" className="w-20">
                      <TrendingUp className="w-3 h-3" />
                      Futures
                    </SortHeader>
                    <SortHeader field="basis" className="w-20">
                      <TrendingUp className="w-3 h-3" />
                      Basis
                    </SortHeader>
                    {isAdmin && (
                      <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedEntries.map((entry, index) => {
                    return (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.01 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Date */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-800 text-xs">
                            {entry.date}
                          </span>
                        </td>

                        {/* Month */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-600 text-xs">
                            {getMonthName(entry.month)}
                          </span>
                        </td>

                        {/* Year */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-600 text-xs">{entry.year}</span>
                        </td>

                        {/* Region */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-600 text-xs">
                            {entry.region_name || 'N/A'}
                          </span>
                        </td>

                        {/* Elevator */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-600 text-xs font-medium">
                            {entry.master_elevators?.name}
                          </span>
                        </td>

                        {/* Town */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-600 text-xs">
                            {entry.master_towns?.name}
                            {entry.master_towns?.province && (
                              <span className="text-gray-500">, {entry.master_towns.province}</span>
                            )}
                          </span>
                        </td>

                        {/* Crop */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-600 text-xs font-medium">
                            {entry.master_crops?.name}
                          </span>
                        </td>

                        {/* Class */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-600 text-xs">
                            {entry.crop_classes?.name}
                          </span>
                        </td>

                        {/* Cash Price */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="font-medium text-gray-800 text-xs">
                            ${parseFloat(entry.cash_price || 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Futures */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className="text-gray-600 text-xs">
                            ${parseFloat(entry.futures || 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Basis */}
                        <td className="px-2 py-1 border-r border-gray-200">
                          <span className={`font-medium text-xs ${
                            parseFloat(entry.basis || 0) > 0 ? 'text-green-600' : 
                            parseFloat(entry.basis || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {parseFloat(entry.basis || 0) > 0 ? '+' : ''}
                            {parseFloat(entry.basis || 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Actions */}
                        {isAdmin && (
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(entry)}
                                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit entry"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => showDeleteConfirmation(entry)}
                                className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        title="Confirm Delete"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this grain entry?
          </p>
          <div className="bg-gray-50 p-3 rounded-lg mb-6">
            <p className="text-sm font-medium text-gray-800">
              {deleteConfirmation.entryDetails}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={closeDeleteConfirmation}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
            >
              Delete Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        isOpen={!!editEntry}
        onClose={closeEditModal}
        title="Edit Grain Entry"
        size="lg"
      >
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={editForm.date}
                onChange={(e) => handleEditChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              />
            </div>

            {/* Crop */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop
              </label>
              <select
                value={editForm.crop_id}
                onChange={(e) => handleEditChange('crop_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              >
                <option value="">Select Crop</option>
                {filterOptions.crops.map((crop: any) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class
              </label>
              <select
                value={editForm.class_id}
                onChange={(e) => handleEditChange('class_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              >
                <option value="">Select Class</option>
                {cropClasses
                  .filter(cc => cc.crop_id === editForm.crop_id)
                  .map((cropClass: any) => (
                    <option key={cropClass.id} value={cropClass.id}>
                      {cropClass.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Elevator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Elevator
              </label>
              <select
                value={editForm.elevator_id}
                onChange={(e) => handleEditChange('elevator_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              >
                <option value="">Select Elevator</option>
                {filterOptions.elevators.map((elevator: any) => (
                  <option key={elevator.id} value={elevator.id}>
                    {elevator.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Town */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Town
              </label>
              <select
                value={editForm.town_id}
                onChange={(e) => handleEditChange('town_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              >
                <option value="">Select Town</option>
                {filterOptions.towns.map((town: any) => (
                  <option key={town.id} value={town.id}>
                    {town.name}
                    {town.province && `, ${town.province}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={editForm.year}
                onChange={(e) => handleEditChange('year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              />
            </div>

            {/* Cash Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cash Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.cash_price}
                onChange={(e) => handleEditChange('cash_price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              />
            </div>

            {/* Futures */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Futures ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.futures}
                onChange={(e) => handleEditChange('futures', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              />
            </div>

            {/* Basis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Basis
              </label>
              <input
                type="number"
                step="0.01"
                value={editForm.basis}
                onChange={(e) => handleEditChange('basis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tg-green focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};