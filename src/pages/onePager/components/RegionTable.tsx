import React from 'react';
import { OnePagerData } from '../types/onePagerTypes';
import { TABLE_CONFIG, THEME_COLORS } from '../utils/constants';

interface RegionTableProps {
  region: OnePagerData;
  availableMonths: string[];
  regionMaxByMonth: Record<string, number | null>;
}

export const RegionTable: React.FC<RegionTableProps> = ({
  region,
  availableMonths,
  regionMaxByMonth
}) => {
  const formatMoney = (n: number | null | undefined) => {
    if (typeof n !== "number" || Number.isNaN(n)) return "";
    return `$${n.toFixed(2)}`;
  };

  const totalMonthWidth = availableMonths.length * TABLE_CONFIG.MONTH_COLUMN_WIDTH;
  const totalTableWidth = TABLE_CONFIG.BASE_WIDTH + totalMonthWidth;
  const finalTableWidth = Math.min(totalTableWidth, TABLE_CONFIG.MAX_TABLE_WIDTH);

  const adjustedMonthWidth = totalTableWidth > TABLE_CONFIG.MAX_TABLE_WIDTH
    ? Math.floor((TABLE_CONFIG.MAX_TABLE_WIDTH - TABLE_CONFIG.BASE_WIDTH) / availableMonths.length)
    : TABLE_CONFIG.MONTH_COLUMN_WIDTH;

  return (
    <div className="mx-3 mb-3">
      <table
        className="border-collapse avoid-break"
        style={{ 
          tableLayout: 'fixed',
          width: `${finalTableWidth}px`
        }}
      >
        <colgroup>
          <col style={{ width: `${TABLE_CONFIG.ELEVATOR_COLUMN_WIDTH}px` }} />
          <col style={{ width: `${TABLE_CONFIG.TOWN_COLUMN_WIDTH}px` }} />
          {availableMonths.map((month) => (
            <col key={month} style={{ width: `${adjustedMonthWidth}px` }} />
          ))}
        </colgroup>
        <tbody>
        {/* Region header row: region name + month headers */}
        <tr style={{ height: '32px' }}>
          <td
            colSpan={2}
            className="text-black font-bold text-sm"
            style={{
              backgroundColor: THEME_COLORS.PRIMARY_BORDER,
              borderBottom: `2px solid ${THEME_COLORS.BLACK}`,
              borderRight: `2px solid ${THEME_COLORS.BLACK}`,
              textAlign: 'center',
              verticalAlign: 'middle',
              padding: '4px 8px'
            }}
          >
            {region.region}
          </td>
          {availableMonths.map((month) => (
            <td
              key={month}
              className="font-bold text-black text-sm"
              style={{
                backgroundColor: THEME_COLORS.PRIMARY_BORDER,
                borderBottom: `2px solid ${THEME_COLORS.BLACK}`,
                textAlign: 'center',
                verticalAlign: 'middle',
                padding: '4px 8px'
              }}
            >
              {month}
            </td>
          ))}
        </tr>

        {/* Data rows */}
        {region.entries.map((entry, rIdx) => (
          <tr
            key={`${entry.elevator}-${entry.town}-${rIdx}`}
            style={{
              backgroundColor: rIdx % 2 === 0 ? THEME_COLORS.ALTERNATE_ROW : THEME_COLORS.WHITE,
              height: '28px'
            }}
          >
            <td
              className="font-medium text-black text-sm"
              style={{
                verticalAlign: 'middle',
                textAlign: 'left',
                padding: '4px 8px'
              }}
            >
              {entry.elevator}
            </td>
            <td
              className="text-black text-sm"
              style={{
                borderRight: `2px solid ${THEME_COLORS.BLACK}`,
                verticalAlign: 'middle',
                textAlign: 'left',
                padding: '4px 8px'
              }}
            >
              {entry.town}
            </td>

            {availableMonths.map((month) => {
              const price = entry.prices[month];
              const isMax =
                typeof price === "number" &&
                typeof regionMaxByMonth[month] === "number" &&
                price === regionMaxByMonth[month];

              return (
                <td
                  key={month}
                  className="text-black text-sm"
                  style={{
                    fontWeight: isMax ? 700 : 500,
                    backgroundColor: isMax ? THEME_COLORS.PRIMARY_BORDER : undefined,
                    fontVariantNumeric: "tabular-nums",
                    verticalAlign: 'middle',
                    textAlign: 'right',
                    padding: '4px 8px'
                  }}
                >
                  {formatMoney(price)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};