import React from 'react';
import { OnePagerData } from '../types/onePagerTypes';

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

  // Calculate dynamic column widths based on available months
  const baseWidth = 300; // Fixed width for elevator + town columns (150px each)
  const monthColumnWidth = 100; // Width per month column
  const totalMonthWidth = availableMonths.length * monthColumnWidth;
  const totalTableWidth = baseWidth + totalMonthWidth;
  
  // Ensure table doesn't exceed container width (8.5in = ~816px with margins)
  const maxTableWidth = 750; // Leave room for margins
  const finalTableWidth = Math.min(totalTableWidth, maxTableWidth);
  
  // Adjust month column width if needed
  const adjustedMonthWidth = totalTableWidth > maxTableWidth 
    ? Math.floor((maxTableWidth - baseWidth) / availableMonths.length)
    : monthColumnWidth;

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
          <col style={{ width: '150px' }} />
          <col style={{ width: '150px' }} />
          {availableMonths.map((month) => (
            <col key={month} style={{ width: `${adjustedMonthWidth}px` }} />
          ))}
        </colgroup>
        <tbody>
        {/* Region header row: region name + month headers */}
        <tr>
          <td
            colSpan={2}
            className="text-black font-bold text-center px-2 py-1 text-sm"
            style={{
              backgroundColor: "#acdfeb",
              borderBottom: "2px solid black",
              borderRight: "2px solid black",
            }}
          >
            {region.region}
          </td>
          {availableMonths.map((month) => (
            <td
              key={month}
              className="font-bold text-center px-2 py-1 text-black text-sm"
              style={{
                backgroundColor: "#acdfeb",
                borderBottom: "2px solid black",
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
            style={{ backgroundColor: rIdx % 2 === 0 ? "#f9f9f9" : "white" }}
          >
            <td
              className="px-2 py-1 font-medium text-black text-sm"
              style={{
                verticalAlign: 'middle',
                textAlign: 'left'
              }}
            >
              {entry.elevator}
            </td>
            <td
              className="px-2 py-1 text-black text-sm"
              style={{ 
                borderRight: "2px solid black",
                verticalAlign: 'middle',
                textAlign: 'left'
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
                  className="px-2 py-1 text-right text-black text-sm"
                  style={{
                    fontWeight: isMax ? 700 : 500,
                    backgroundColor: isMax ? "#acdfeb" : undefined,
                    fontVariantNumeric: "tabular-nums",
                    verticalAlign: 'middle',
                    textAlign: 'right'
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