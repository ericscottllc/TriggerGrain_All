import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, ChevronDown, Settings, Download } from "lucide-react";
import { useOnePagerData } from "./hooks/useOnePagerData";
import { OnePagerHeader, RegionTable } from "./components";
import { extractAvailableMonths, buildOnePagerData, getRegionMaxByMonth } from "./utils/dataProcessing";
import { formatDateUTC } from "./utils/dateUtils";
import { exportToPNG } from "./utils/exportUtils";
import { applyScaleFactor } from "./utils/scalingUtils";
import { EXPORT_CONFIG } from "./utils/constants";
import {
  OnePagerConfig,
  OnePagerData as RegionBlock,
  MasterCropComparison,
  CropClass,
  GrainEntry,
} from "./types/onePagerTypes";

export const OnePagerPage: React.FC = () => {
  const {
    loading,
    error,
    getOnePagerConfigs,
    getMasterCropComparisons,
    getCropClasses,
    getGrainEntriesForQuery,
    getAvailableDates,
  } = useOnePagerData();

  const [configs, setConfigs] = useState<OnePagerConfig[]>([]);
  const [cropClasses, setCropClasses] = useState<CropClass[]>([]);
  const [cropComparisons, setCropComparisons] = useState<MasterCropComparison[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedCropClass, setSelectedCropClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCropComparison, setSelectedCropComparison] = useState<string>("");
  const [grainEntries, setGrainEntries] = useState<GrainEntry[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const selectedCropClassName = useMemo(
    () => cropClasses.find((c) => c.id === selectedCropClass)?.name || "",
    [cropClasses, selectedCropClass]
  );

  const selectedCropComparisonName = useMemo(
    () => cropComparisons.find((c) => c.id === selectedCropComparison)?.name || "",
    [cropComparisons, selectedCropComparison]
  );

  useEffect(() => {
    (async () => {
      try {
        setInitializing(true);
        const [cfgs, classes, comps] = await Promise.all([
          getOnePagerConfigs(),
          getCropClasses(),
          getMasterCropComparisons(),
        ]);
        setConfigs(cfgs);
        setCropClasses(classes);
        setCropComparisons(comps);

        if (comps.length > 0) setSelectedCropComparison(comps[0].id);

        // Set crop class and load dates for that class
        if (classes.length > 0) {
          const firstClassId = classes[0].id;
          setSelectedCropClass(firstClassId);
          const dates = await getAvailableDates(firstClassId);
          setAvailableDates(dates);
          if (dates.length > 0) setSelectedDate(dates[0]);
        }
      } catch (err) {
        console.error('Error initializing One Pager:', err);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // Reload dates when crop class changes
  useEffect(() => {
    if (selectedCropClass && !initializing) {
      (async () => {
        const dates = await getAvailableDates(selectedCropClass);
        setAvailableDates(dates);
        // Reset selected date if it's not in the new list
        if (dates.length > 0) {
          if (!dates.includes(selectedDate)) {
            setSelectedDate(dates[0]);
          }
        } else {
          setSelectedDate("");
        }
      })();
    }
  }, [selectedCropClass]);

  const availableMonths = useMemo(() => {
    return extractAvailableMonths(grainEntries);
  }, [grainEntries]);

  const onePagerData: RegionBlock[] = useMemo(() => {
    return buildOnePagerData(configs, grainEntries, selectedCropComparison, selectedCropClass);
  }, [configs, grainEntries, selectedCropComparison, selectedCropClass]);

  const handleQuery = useCallback(async () => {
    if (!selectedDate || !selectedCropClass || !selectedCropComparison) {
      alert("Please select Crop Comparison, Crop Class, and Date before querying.");
      return;
    }
    setHasQueried(true);
    const entries = await getGrainEntriesForQuery(
      selectedDate,
      selectedCropClass,
      selectedCropComparison
    );
    setGrainEntries(entries);
  }, [selectedDate, selectedCropClass, selectedCropComparison, getGrainEntriesForQuery]);

  const handleExportPNG = useCallback(async () => {
    if (onePagerData.length === 0) return;

    setIsExporting(true);

    try {
      const filename = `${selectedCropComparisonName}_${selectedCropClassName}_${selectedDate}.png`;
      await exportToPNG('onepager-content', filename);
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [onePagerData.length, selectedCropComparisonName, selectedCropClassName, selectedDate]);

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col">
      {/* Header with title and controls */}
      <div className="flex items-center gap-3 mb-4 bg-white px-6 py-3 print:hidden">
        <div className="w-10 h-10 bg-tg-green rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">One Pager</h1>
          <p className="text-sm text-gray-500">Regional grain price comparison reports</p>
        </div>
      </div>

      {/* Canvas with Floating Controls */}
      <div className="flex-1 overflow-hidden relative print:p-0" id="dashboard-content">
        {/* Floating Controls Panel */}
        <div className="absolute top-4 right-4 z-10 print:hidden">
          <motion.div 
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            initial={false}
            animate={{ 
              width: controlsExpanded ? 320 : 48,
              height: controlsExpanded ? "auto" : 48
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Collapsible Header */}
            <button
              onClick={() => setControlsExpanded(!controlsExpanded)}
              className={`w-full flex items-center ${controlsExpanded ? 'justify-between p-4' : 'justify-center p-3'} hover:bg-gray-50 transition-colors`}
            >
              {controlsExpanded ? (
                <>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-800">Report Controls</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </>
              ) : (
                <Settings className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Expandable Content */}
            {controlsExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="p-4 pt-0 space-y-3"
              >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Crop Comparison
                </label>
                <select
                  value={selectedCropComparison}
                  onChange={(e) => setSelectedCropComparison(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-tg-green focus:border-transparent"
                >
                  <option value="">Select Crop Comparison</option>
                  {cropComparisons.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Crop Class
                </label>
                <select
                  value={selectedCropClass}
                  onChange={(e) => setSelectedCropClass(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-tg-green focus:border-transparent"
                >
                  <option value="">Select Crop Class</option>
                  {cropClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-tg-green focus:border-transparent"
                >
                  <option value="">Select Date</option>
                  {availableDates.map((d) => (
                    <option key={d} value={d}>
                      {formatDateUTC(d)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleQuery}
                  disabled={!selectedCropComparison || !selectedCropClass || !selectedDate || loading}
                  className="flex-1 bg-tg-primary hover:bg-tg-green text-white font-medium py-1.5 px-3 rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  {loading ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      Query
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleExportPNG}
                  disabled={loading || onePagerData.length === 0}
                  className="flex-1 bg-tg-green hover:bg-tg-primary text-white font-medium py-1.5 px-3 rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 relative"
                >
                  {isExporting ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  {isExporting ? 'Exporting...' : 'Export PNG'}
                </button>
              </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="h-full p-6 pr-24">
        {onePagerData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto h-full flex items-center justify-center"
          >
            <div
              className="bg-white transform-gpu origin-center"
              id="onepager-content"
              style={{
                border: `${EXPORT_CONFIG.BORDER_WIDTH}px solid ${EXPORT_CONFIG.BORDER_COLOR}`,
                outline: `${EXPORT_CONFIG.OUTLINE_WIDTH}px solid ${EXPORT_CONFIG.OUTLINE_COLOR}`,
                width: `${EXPORT_CONFIG.PAGE_WIDTH_INCHES}in`,
                transform: "scale(var(--scale-factor))",
                transformOrigin: "center center"
              }}
              ref={applyScaleFactor}
            >
              <div>
                {/* Header */}
                <OnePagerHeader
                  selectedCropClassName={selectedCropClassName}
                  selectedCropComparisonName={selectedCropComparisonName}
                  selectedDate={selectedDate}
                />

                {/* Region Tables */}
                <div className="p-2">
                  {onePagerData.map((region, idx) => {
                    const regionMaxByMonth = getRegionMaxByMonth(region.entries, availableMonths);

                    return (
                      <RegionTable
                        key={`${region.region}-${idx}`}
                        region={region}
                        availableMonths={availableMonths}
                        regionMaxByMonth={regionMaxByMonth}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <style>{`
              @page { size: Letter portrait; margin: 0.25in; }
              @media print {
                * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                #dashboard-content { padding: 0 !important; }
              }
              .avoid-break { break-inside: avoid; page-break-inside: avoid; }
            `}</style>
          </motion.div>
        )}

        {/* Empty State - No Data After Query */}
        {hasQueried && onePagerData.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm"
          >
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">
              No grain entries found for <strong>{selectedCropClassName}</strong> on{" "}
              <strong>{selectedDate ? formatDateUTC(selectedDate) : ""}</strong>.
            </p>
          </motion.div>
        )}

        {/* Initializing Loader */}
        {initializing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tg-green mx-auto mb-4"></div>
            <p className="text-gray-500">Loading configuration...</p>
          </motion.div>
        )}

        {/* Query Loader */}
        {!initializing && loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tg-green mx-auto mb-4"></div>
            <p className="text-gray-500">Loading grain entries...</p>
          </motion.div>
        )}

        {/* Initial State */}
        {!initializing && !hasQueried && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm"
          >
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Query</h3>
            <p className="text-gray-600">
              Select a crop comparison, crop class, and date, then click "Query" to generate your
              one-pager report.
            </p>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
};