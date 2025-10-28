import { GrainEntry, OnePagerConfig, OnePagerData } from '../types/onePagerTypes';

/**
 * Extract unique months from grain entries data
 */
export const extractAvailableMonths = (grainEntries: GrainEntry[]): string[] => {
  const monthsSet = new Set<string>();
  
  grainEntries.forEach(entry => {
    if (entry.month && entry.month.trim()) {
      monthsSet.add(entry.month.trim());
    }
  });
  
  // Convert to array and sort chronologically by month + year
  const months = Array.from(monthsSet).sort((a, b) => {
    // Parse month and year from strings like "Aug 2025", "Jan 2026"
    const parseMonthYear = (monthStr: string) => {
      const parts = monthStr.trim().split(' ');
      if (parts.length !== 2) return { month: 0, year: 0 }; // fallback
      
      const monthName = parts[0];
      const year = parseInt(parts[1], 10);
      
      // Map month names to numbers (0-11 for proper sorting)
      const monthMap: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const month = monthMap[monthName] ?? 0;
      return { month, year };
    };
    
    const aDate = parseMonthYear(a);
    const bDate = parseMonthYear(b);
    
    // Sort by year first, then by month
    if (aDate.year !== bDate.year) {
      return aDate.year - bDate.year;
    }
    return aDate.month - bDate.month;
  });
  
  return months;
};

/**
 * Build the page data grouped by region, preserving config order
 */
export const buildOnePagerData = (
  configs: OnePagerConfig[],
  grainEntries: GrainEntry[],
  selectedCropComparison: string,
  selectedCropClass: string
): OnePagerData[] => {
  if (!selectedCropClass || !selectedCropComparison) return [];
  if (grainEntries.length === 0) return [];

  // Filter configs for the chosen comparison
  const relevant = configs.filter((c) => c.crop_comparison_id === selectedCropComparison);

  // Group configs by region while preserving insertion order
  const regionMap = new Map<string, OnePagerConfig[]>();
  for (const cfg of relevant) {
    const region = cfg.region?.name || "Unknown Region";
    if (!regionMap.has(region)) regionMap.set(region, []);
    regionMap.get(region)!.push(cfg);
  }

  const blocks: OnePagerData[] = [];
  for (const [region, regionCfgs] of regionMap.entries()) {
    const entriesForRegion = regionCfgs
      .map((cfg) => {
        // Filter matching entries for elevator+town+class
        const rel = grainEntries.filter(
          (e) =>
            e.elevator_id === cfg.elevator_id &&
            e.town_id === cfg.town_id &&
            e.class_id === selectedCropClass
        );
        
        // Build month price map using actual month values from data
        const prices: Record<string, number | null> = {};
        for (const e of rel) {
          const monthKey = e.month?.trim();
          if (!monthKey) continue;
          if (typeof e.cash_price === "number") {
            prices[monthKey] = e.cash_price;
          }
        }
        
        return {
          elevator: cfg.elevator?.name || "",
          town: cfg.town?.name || "",
          prices,
        };
      })
      .filter((entry) => {
        // Only include entries that have at least one price value
        return Object.values(entry.prices).some(price => typeof price === "number");
      });

    // Only include regions that have at least one entry with data
    if (entriesForRegion.length > 0) {
      blocks.push({ region, entries: entriesForRegion });
    }
  }
  
  return blocks;
};

/**
 * Calculate per-region max price for each month (used for highlight cells)
 */
export const getRegionMaxByMonth = (
  regionEntries: OnePagerData["entries"],
  availableMonths: string[]
): Record<string, number | null> => {
  const regionMax: Record<string, number | null> = {};
  
  for (const month of availableMonths) {
    let max: number | null = null;
    for (const entry of regionEntries) {
      const price = entry.prices[month];
      if (typeof price === "number") {
        max = max === null ? price : Math.max(max, price);
      }
    }
    regionMax[month] = max;
  }
  
  return regionMax;
};