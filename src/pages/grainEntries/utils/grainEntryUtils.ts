export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '';
  return value.toFixed(2);
};

export const calculateBasis = (cashPrice: number | string, futuresPrice: number | string): number | null => {
  const cash = typeof cashPrice === 'string' ? parseFloat(cashPrice) : cashPrice;
  const futures = typeof futuresPrice === 'string' ? parseFloat(futuresPrice) : futuresPrice;

  if (isNaN(cash) || isNaN(futures)) return null;
  return cash - futures;
};

export const getBasisColor = (basis: number | null): string => {
  if (basis === null || isNaN(basis)) return 'text-gray-400';
  if (basis > 0) return 'text-green-600';
  if (basis < 0) return 'text-red-600';
  return 'text-gray-600';
};

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

export const getMonthName = (month: string | number): string => {
  if (typeof month === 'string') {
    if (MONTH_NAMES.includes(month as any)) return month;
    const monthNum = parseInt(month) - 1;
    return MONTH_NAMES[monthNum] || month;
  }

  const monthNum = parseInt(month.toString()) - 1;
  return MONTH_NAMES[monthNum] || month.toString();
};

export const getMonthNumber = (monthName: string): number => {
  const index = MONTH_NAMES.indexOf(monthName as any);
  return index !== -1 ? index + 1 : parseInt(monthName) || 1;
};

export const getMonthYearSortValue = (entry: { month: string | number; year: number }): number => {
  const year = parseInt(entry.year.toString()) || 0;
  const month = typeof entry.month === 'string' ? getMonthNumber(entry.month) : parseInt(entry.month.toString()) || 0;
  return year * 100 + month;
};

export const sortElevatorTownPairs = <T extends { elevator_name: string; town_name: string }>(pairs: T[]): T[] => {
  return [...pairs].sort((a, b) => {
    const elevatorCompare = a.elevator_name.localeCompare(b.elevator_name);
    if (elevatorCompare !== 0) return elevatorCompare;
    return a.town_name.localeCompare(b.town_name);
  });
};

export interface MonthYearColumn {
  id: string;
  month: number;
  year: number;
  monthName: string;
  futuresPrice: string;
}

export const initializeMonthYearColumns = (count: number = 6): MonthYearColumn[] => {
  const currentDate = new Date();
  const columns: MonthYearColumn[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'short' });

    columns.push({
      id: `month-${i}`,
      month,
      year,
      monthName,
      futuresPrice: ''
    });
  }

  return columns;
};

export const updateSubsequentMonths = (
  columns: MonthYearColumn[],
  columnId: string,
  month: number,
  year: number
): MonthYearColumn[] => {
  const columnIndex = columns.findIndex(c => c.id === columnId);
  if (columnIndex === -1) return columns;

  const newColumns = [...columns];

  for (let i = columnIndex + 1; i < newColumns.length; i++) {
    const monthsToAdd = i - columnIndex;
    const baseDate = new Date(year, month - 1, 1);
    const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthsToAdd, 1);
    const nextMonth = nextDate.getMonth() + 1;
    const nextYear = nextDate.getFullYear();
    const nextMonthName = nextDate.toLocaleString('default', { month: 'short' });

    newColumns[i] = {
      ...newColumns[i],
      month: nextMonth,
      year: nextYear,
      monthName: nextMonthName
    };
  }

  return newColumns;
};
