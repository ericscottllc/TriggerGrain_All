import React, { useMemo } from 'react';
import { Button } from '../../../components/Shared/SharedComponents';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, getBasisColor } from '../utils/grainEntryUtils';
import type { GrainEntryRow, MonthYearColumn, ElevatorTownPair } from '../types/grainEntryTypes';

interface GrainEntryTableProps {
  entries: GrainEntryRow[];
  monthYearColumns: MonthYearColumn[];
  availableElevatorTownPairs: ElevatorTownPair[];
  onUpdateCashPrice: (entryId: string, monthYearId: string, value: string) => void;
  onUpdateElevatorTown: (entryId: string, elevatorId: string, townId: string) => void;
  onMonthYearChange: (columnId: string, month: number, year: number) => void;
  onFuturesPriceChange: (columnId: string, price: string) => void;
  onAddManualEntry: () => void;
  onRemoveEntry: (entryId: string) => void;
  allowManualEntry: boolean;
}

export const GrainEntryTable: React.FC<GrainEntryTableProps> = React.memo(({
  entries,
  monthYearColumns,
  availableElevatorTownPairs,
  onUpdateCashPrice,
  onUpdateElevatorTown,
  onMonthYearChange,
  onFuturesPriceChange,
  onAddManualEntry,
  onRemoveEntry,
  allowManualEntry
}) => {
  const uniqueElevators = useMemo(() => {
    return Array.from(new Set(availableElevatorTownPairs.map(pair => pair.elevator_id)))
      .map(elevatorId => availableElevatorTownPairs.find(p => p.elevator_id === elevatorId))
      .filter(Boolean)
      .sort((a, b) => (a?.elevator_name || '').localeCompare(b?.elevator_name || ''));
  }, [availableElevatorTownPairs]);

  const handleMonthYearChange = (columnId: string, field: 'month' | 'year', value: string) => {
    const column = monthYearColumns.find(col => col.id === columnId);
    if (column && value !== '') {
      const numValue = parseInt(value);
      if (!isNaN(numValue)) {
        const newMonth = field === 'month' ? numValue : column.month;
        const newYear = field === 'year' ? numValue : column.year;
        onMonthYearChange(columnId, newMonth, newYear);
      }
    }
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        {/* Month/Year Headers and Futures Prices */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">
                    Elevator
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">
                    Town
                  </th>
                  {monthYearColumns.map((column) => (
                    <th key={column.id} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: '120px' }}>
                      <div className="space-y-1">
                        {/* Month/Year Selectors */}
                        <div className="flex gap-1">
                          <select
                            value={column.month}
                            onChange={(e) => handleMonthYearChange(column.id, 'month', e.target.value)}
                            className="flex-1 px-1 py-0.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                          >
                            {Array.from({ length: 12 }, (_, i) => {
                              const monthNum = i + 1;
                              const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'short' });
                              return (
                                <option key={monthNum} value={monthNum}>
                                  {monthName}
                                </option>
                              );
                            })}
                          </select>
                          <input
                            type="number"
                            value={column.year}
                            onChange={(e) => handleMonthYearChange(column.id, 'year', e.target.value)}
                            className="w-16 px-1 py-0.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                            min="2020"
                            max="2030"
                          />
                        </div>
                        {/* Futures Price Input */}
                        <div>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Futures"
                            value={column.futuresPrice}
                            onChange={(e) => onFuturesPriceChange(column.id, e.target.value)}
                            className="w-full px-1 py-0.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                          />
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    Actions
                  </th>
                </tr>
              </thead>
            </table>
          </div>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            No entries yet. Add elevator/town combinations manually or select a region to auto-populate.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddManualEntry}
            icon={Plus}
          >
            Add Manual Entry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Manual Entry Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddManualEntry}
          icon={Plus}
        >
          Add Manual Entry
        </Button>
      </div>

      {/* Combined Spreadsheet Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">
                  Elevator
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">
                  Town
                </th>
                {monthYearColumns.map((column) => (
                  <th key={column.id} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: '120px' }}>
                    <div className="space-y-1">
                      {/* Month/Year Selectors */}
                      <div className="flex gap-1">
                        <select
                          value={column.month}
                          onChange={(e) => handleMonthYearChange(column.id, 'month', e.target.value)}
                          className="flex-1 px-1 py-0.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                        >
                          {Array.from({ length: 12 }, (_, i) => {
                            const monthNum = i + 1;
                            const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'short' });
                            return (
                              <option key={monthNum} value={monthNum}>
                                {monthName}
                              </option>
                            );
                          })}
                        </select>
                        <input
                          type="number"
                          value={column.year}
                          onChange={(e) => handleMonthYearChange(column.id, 'year', e.target.value)}
                          className="w-16 px-1 py-0.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                          min="2020"
                          max="2030"
                        />
                      </div>
                      {/* Futures Price Input */}
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Futures"
                          value={column.futuresPrice}
                          onChange={(e) => onFuturesPriceChange(column.id, e.target.value)}
                          className="w-full px-1 py-0.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                        />
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-1 border-r border-gray-200">
                    {entry.id.startsWith('manual-') ? (
                      <select
                        value={entry.elevatorId}
                        onChange={(e) => {
                          const selectedPair = availableElevatorTownPairs.find(
                            pair => pair.elevator_id === e.target.value && pair.town_id === entry.townId
                          );
                          if (selectedPair) {
                            onUpdateElevatorTown(entry.id, selectedPair.elevator_id, selectedPair.town_id);
                          } else if (e.target.value) {
                            // If elevator is selected but no matching town, find first available town for this elevator
                            const firstTownForElevator = availableElevatorTownPairs.find(
                              pair => pair.elevator_id === e.target.value
                            );
                            if (firstTownForElevator) {
                              onUpdateElevatorTown(entry.id, firstTownForElevator.elevator_id, firstTownForElevator.town_id);
                            }
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                      >
                        <option value="">Select Elevator</option>
                        {uniqueElevators.map(pair => (
                          <option key={pair?.elevator_id} value={pair?.elevator_id}>
                            {pair?.elevator_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-800">{entry.elevatorName}</span>
                    )}
                  </td>
                  <td className="px-3 py-1 border-r border-gray-200">
                    {entry.id.startsWith('manual-') ? (
                      <select
                        value={entry.townId}
                        onChange={(e) => {
                          const selectedPair = availableElevatorTownPairs.find(
                            pair => pair.town_id === e.target.value && pair.elevator_id === entry.elevatorId
                          );
                          if (selectedPair) {
                            onUpdateElevatorTown(entry.id, selectedPair.elevator_id, selectedPair.town_id);
                          } else if (e.target.value) {
                            // If town is selected but no matching elevator, find first available elevator for this town
                            const firstElevatorForTown = availableElevatorTownPairs.find(
                              pair => pair.town_id === e.target.value
                            );
                            if (firstElevatorForTown) {
                              onUpdateElevatorTown(entry.id, firstElevatorForTown.elevator_id, firstElevatorForTown.town_id);
                            }
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                        disabled={!entry.elevatorId}
                      >
                        <option value="">Select Town</option>
                        {availableElevatorTownPairs
                          .filter(pair => !entry.elevatorId || pair.elevator_id === entry.elevatorId)
                          .sort((a, b) => a.town_name.localeCompare(b.town_name))
                          .map(pair => (
                            <option key={`${pair.elevator_id}-${pair.town_id}`} value={pair.town_id}>
                              {pair.town_name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span className="text-sm text-gray-600">{entry.townName}</span>
                    )}
                  </td>
                  {monthYearColumns.map((column) => (
                    <td key={column.id} className="px-2 py-1 border-r border-gray-200">
                      <div className="space-y-1">
                        {/* Cash Price Input */}
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cash"
                          value={entry.cashPrices[column.id] || ''}
                          onChange={(e) => onUpdateCashPrice(entry.id, column.id, e.target.value)}
                          className="w-full px-1 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-tg-primary/20 focus:border-tg-primary"
                        />
                        {/* Basis Display */}
                        <div className={`text-xs text-center font-medium ${getBasisColor(entry.basis[column.id])}`}>
                          {entry.basis[column.id] !== null && entry.basis[column.id] !== undefined
                            ? formatCurrency(entry.basis[column.id])
                            : '—'
                          }
                        </div>
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-1 text-center">
                    <button
                      onClick={() => onRemoveEntry(entry.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});