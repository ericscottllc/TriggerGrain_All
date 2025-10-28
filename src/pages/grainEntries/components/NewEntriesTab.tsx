import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Calendar, MapPin } from 'lucide-react';
import { Button, Input, Card } from '../../../components/Shared/SharedComponents';
import { useNotifications } from '../../../contexts/NotificationContext';
import { GrainEntryForm } from './GrainEntryForm';
import { GrainEntryTable } from './GrainEntryTable';
import { useGrainEntryData } from '../hooks/useGrainEntryData';
import { initializeMonthYearColumns, updateSubsequentMonths, calculateBasis, sortElevatorTownPairs } from '../utils/grainEntryUtils';
import type { GrainEntryRow, GrainEntryFormData, MonthYearColumn } from '../types/grainEntryTypes';

export const NewEntriesTab: React.FC = () => {
  const { success, error } = useNotifications();
  const {
    cropClasses,
    regions,
    elevatorTownPairs,
    setElevatorTownPairs,
    loading,
    fetchElevatorTownPairs,
    saveGrainEntries,
    fetchRegions
  } = useGrainEntryData();

  const [formData, setFormData] = useState<GrainEntryFormData>({
    date: new Date().toLocaleDateString('en-CA'), // Today's date in YYYY-MM-DD format
    cropClassId: '',
    regionId: ''
  });

  const [monthYearColumns, setMonthYearColumns] = useState<MonthYearColumn[]>(() => initializeMonthYearColumns(6));
  const [entryRows, setEntryRows] = useState<GrainEntryRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletedRowIds, setDeletedRowIds] = useState<Set<string>>(new Set());

  // Fetch elevator/town pairs when region changes
  useEffect(() => {
    if (formData.regionId || formData.cropClassId) {
      fetchElevatorTownPairs(formData.regionId || undefined, formData.cropClassId || undefined);
    } else {
      // Clear elevator/town pairs if neither region nor crop class is selected
      setElevatorTownPairs([]);
    }
  }, [formData.regionId, formData.cropClassId, fetchElevatorTownPairs]);

  // Generate entry rows when elevator/town pairs change (only if no existing rows)
  useEffect(() => {
    if (elevatorTownPairs.length > 0 && entryRows.length === 0) {
      generateEntryRows();
    } else {
      // Clear deleted rows when no elevator/town pairs
      setDeletedRowIds(new Set());
    }
  }, [elevatorTownPairs, entryRows.length]);

  // Fetch regions when crop class changes
  useEffect(() => {
    if (formData.cropClassId) {
      fetchRegions(formData.cropClassId);
      // Reset region selection when crop class changes
      setFormData(prev => ({ ...prev, regionId: '' }));
    } else {
      // If no crop class selected, fetch all regions
      fetchRegions();
    }
  }, [formData.cropClassId, fetchRegions]);

  // Regenerate rows when region changes (clear existing rows first)
  useEffect(() => {
    setEntryRows([]);
    setDeletedRowIds(new Set());
  }, [formData.regionId, formData.cropClassId]);

  const generateEntryRows = useCallback(() => {
    const rows: GrainEntryRow[] = [];
    const sortedPairs = sortElevatorTownPairs(elevatorTownPairs);

    sortedPairs.forEach((pair) => {
      const rowId = `${pair.elevator_id}-${pair.town_id}`;

      if (deletedRowIds.has(rowId)) {
        return;
      }

      const cashPrices: { [monthYearId: string]: string } = {};
      const basis: { [monthYearId: string]: number | null } = {};

      monthYearColumns.forEach(column => {
        cashPrices[column.id] = '';
        basis[column.id] = null;
      });

      rows.push({
        id: rowId,
        elevatorId: pair.elevator_id,
        elevatorName: pair.elevator_name,
        townId: pair.town_id,
        townName: pair.town_name,
        cashPrices,
        basis
      });
    });

    setEntryRows(rows);
  }, [elevatorTownPairs, deletedRowIds, monthYearColumns]);

  const handleMonthYearChange = useCallback((columnId: string, month: number, year: number) => {
    setMonthYearColumns(prev => {
      const updatedColumns = prev.map(col => {
        if (col.id === columnId) {
          const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' });
          return { ...col, month, year, monthName };
        }
        return col;
      });

      return updateSubsequentMonths(updatedColumns, columnId, month, year);
    });
  }, []);

  const handleFuturesPriceChange = useCallback((columnId: string, price: string) => {
    setMonthYearColumns(prev => prev.map(col =>
      col.id === columnId ? { ...col, futuresPrice: price } : col
    ));

    setEntryRows(prev => prev.map(row => {
      const cashPrice = row.cashPrices[columnId] || '';
      const newBasis = calculateBasis(cashPrice, price);

      return {
        ...row,
        basis: {
          ...row.basis,
          [columnId]: newBasis
        }
      };
    }));
  }, []);

  const handleCashPriceChange = useCallback((entryId: string, monthYearId: string, value: string) => {
    setEntryRows(prev => prev.map(row => {
      if (row.id === entryId) {
        const column = monthYearColumns.find(col => col.id === monthYearId);
        const newBasis = calculateBasis(value, column?.futuresPrice || '');

        return {
          ...row,
          cashPrices: { ...row.cashPrices, [monthYearId]: value },
          basis: { ...row.basis, [monthYearId]: newBasis }
        };
      }
      return row;
    }));
  }, [monthYearColumns]);

  const handleAddManualEntry = useCallback(() => {
    const newId = `manual-${Date.now()}`;
    const cashPrices: { [monthYearId: string]: string } = {};
    const basis: { [monthYearId: string]: number | null } = {};

    monthYearColumns.forEach(column => {
      cashPrices[column.id] = '';
      basis[column.id] = null;
    });

    const newEntry: GrainEntryRow = {
      id: newId,
      elevatorId: '',
      elevatorName: '',
      townId: '',
      townName: '',
      cashPrices,
      basis
    };

    setEntryRows(prev => [...prev, newEntry]);
  }, [monthYearColumns]);

  const handleUpdateElevatorTown = useCallback((entryId: string, elevatorId: string, townId: string) => {
    setEntryRows(prev => prev.map(row => {
      if (row.id === entryId) {
        const elevatorPair = elevatorTownPairs.find(pair =>
          pair.elevator_id === elevatorId && pair.town_id === townId
        );

        return {
          ...row,
          elevatorId,
          townId,
          elevatorName: elevatorPair?.elevator_name || '',
          townName: elevatorPair?.town_name || ''
        };
      }
      return row;
    }));
  }, [elevatorTownPairs]);

  const handleRemoveEntry = useCallback((entryId: string) => {
    setEntryRows(prev => prev.filter(row => row.id !== entryId));
    setDeletedRowIds(prev => new Set([...prev, entryId]));
  }, []);

  const handleSaveEntries = async () => {
    if (!formData.cropClassId) {
      error('Validation Error', 'Please select a crop class before saving.');
      return;
    }

    if (entryRows.length === 0) {
      error('Validation Error', 'No entries to save. Please select a region and generate entries.');
      return;
    }

    // Collect all valid entries across all months
    const validEntries: any[] = [];
    
    entryRows.forEach(row => {
      monthYearColumns.forEach(column => {
        const cashPrice = row.cashPrices[column.id];
        const futuresPrice = column.futuresPrice;
        
        if (cashPrice && cashPrice.trim() !== '' && futuresPrice && futuresPrice.trim() !== '') {
          validEntries.push({
            elevatorId: row.elevatorId,
            townId: row.townId,
            month: column.month,
            year: column.year,
            monthName: column.monthName,
            futuresPrice: parseFloat(futuresPrice),
            cashPrice: parseFloat(cashPrice),
            basis: row.basis[column.id] || 0
          });
        }
      });
    });

    if (validEntries.length === 0) {
      error('Validation Error', 'Please enter at least one price before saving.');
      return;
    }

    setSaving(true);
    try {
      await saveGrainEntries({
        date: formData.date,
        cropClassId: formData.cropClassId,
        entries: validEntries
      });

      success('Success', `Successfully saved ${validEntries.length} grain entries.`);
      
      // Reset form
      setEntryRows([]);
      setDeletedRowIds(new Set());
      setFormData(prev => ({
        ...prev,
        regionId: '',
        cropClassId: ''
      }));
      setMonthYearColumns(initializeMonthYearColumns());
    } catch (err) {
      console.error('Error saving grain entries:', err);
      error('Save Failed', 'Failed to save grain entries. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const clearAllEntries = () => {
    setEntryRows([]);
    setDeletedRowIds(new Set());
    setFormData(prev => ({
      ...prev,
      regionId: '',
      cropClassId: ''
    }));
    setMonthYearColumns(initializeMonthYearColumns());
  };

  return (
    <div className="w-full p-4 space-y-4">
      {/* Form Section */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-tg-green" />
          <h2 className="text-xl font-semibold text-gray-800">Entry Details</h2>
        </div>

        <GrainEntryForm
          formData={formData}
          onFormDataChange={setFormData}
          cropClasses={cropClasses}
          regions={regions}
          loading={loading}
        />
      </Card>

      {/* Data Entry Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-tg-green" />
            <h2 className="text-xl font-semibold text-gray-800">Price Entries</h2>
            <span className="text-sm text-gray-500">({entryRows.length} entries)</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllEntries}
              icon={Trash2}
            >
              Clear All
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveEntries}
              loading={saving}
              icon={Save}
            >
              Save Entries
            </Button>
          </div>
        </div>

        <GrainEntryTable
          entries={entryRows}
          monthYearColumns={monthYearColumns}
          availableElevatorTownPairs={elevatorTownPairs}
          onUpdateCashPrice={handleCashPriceChange}
          onUpdateElevatorTown={handleUpdateElevatorTown}
          onMonthYearChange={handleMonthYearChange}
          onFuturesPriceChange={handleFuturesPriceChange}
          onAddManualEntry={handleAddManualEntry}
          onRemoveEntry={handleRemoveEntry}
          allowManualEntry={true}
        />
      </Card>
    </div>
  );
};