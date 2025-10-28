import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, TrendingUp, ChevronRight, ChevronDown, Settings, Download } from "lucide-react";
import { useOnePagerData } from "./hooks/useOnePagerData";
import { OnePagerControls, OnePagerHeader, RegionTable } from "./components";
import { extractAvailableMonths, buildOnePagerData, getRegionMaxByMonth } from "./utils/dataProcessing";
import {
  OnePagerConfig,
  OnePagerData as RegionBlock,
  MasterCropComparison,
  CropClass,
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
  const [grainEntries, setGrainEntries] = useState<any[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [controlsExpanded, setControlsExpanded] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Derived labels for the header title.
  const selectedCropClassName =
    cropClasses.find((c) => c.id === selectedCropClass)?.name || "";
  const selectedCropComparisonName =
    cropComparisons.find((c) => c.id === selectedCropComparison)?.name || "";

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

        if (classes.length > 0) setSelectedCropClass(classes[0].id);
        if (comps.length > 0) setSelectedCropComparison(comps[0].id);

        const dates = await getAvailableDates();
        setAvailableDates(dates);
        if (dates.length > 0) setSelectedDate(dates[0]);
      } catch (err) {
        console.error('Error initializing One Pager:', err);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const handleQuery = async () => {
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
  };

  const handleExportPNG = async () => {
    if (onePagerData.length === 0) return;
    
    setIsExporting(true);
    
    try {
      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;
      
      const element = document.getElementById('onepager-content');
      if (!element) {
        throw new Error('One Pager content not found');
      }
      
      // Create a clone of the element for capture to avoid affecting the display
      const clone = element.cloneNode(true) as HTMLElement;
      clone.id = 'onepager-clone';
      
      // Style the clone for proper capture
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.transform = 'none';
      clone.style.width = '816px'; // 8.5 inches at 96 DPI
      clone.style.backgroundColor = '#ffffff';
      
      // Append clone to body
      document.body.appendChild(clone);
      
      // Wait for images to load
      const images = clone.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          // Force reload if src is relative
          if (img.src.startsWith('/')) {
            img.src = window.location.origin + img.src;
          }
        });
      }));
      
      // Capture the clone at high resolution
      const canvas = await html2canvas(clone, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
        backgroundColor: '#ffffff',
        width: 816,
        height: clone.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        imageTimeout: 15000,
        removeContainer: true
      });
      
      // Remove the clone
      document.body.removeChild(clone);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${selectedCropComparisonName}_${selectedCropClassName}_${selectedDate}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Extract available months from the actual data
  const availableMonths = useMemo(() => {
    return extractAvailableMonths(grainEntries);
  }, [grainEntries]);

  /**
   * Build the page data grouped by region, preserving config order.
   */
  const onePagerData: RegionBlock[] = useMemo(() => {
    return buildOnePagerData(configs, grainEntries, selectedCropComparison, selectedCropClass);
  }, [configs, grainEntries, selectedCropComparison, selectedCropClass]);

  const formatDateUTC = (dateString: string) => {
    const d = new Date(`${dateString}T00:00:00.000Z`);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    });
  };

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
                border: "6px solid #acdfeb",
                outline: "2px solid black",
                width: "8.5in",
                transform: "scale(var(--scale-factor))",
                transformOrigin: "center center"
              }}
              ref={(el) => {
                if (el) {
                  // Calculate scale to fit container
                  const container = el.parentElement;
                  if (container) {
                    const containerWidth = container.clientWidth - 48; // Account for padding  
                    const containerHeight = container.clientHeight - 48;
                    const elementWidth = 816; // 8.5in in pixels (96 DPI)
                    const elementHeight = el.scrollHeight;
                    
                    const scaleX = containerWidth / elementWidth;
                    const scaleY = containerHeight / elementHeight;
                    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%
                    
                    el.style.setProperty('--scale-factor', scale.toString());
                  }
                }
              }}
            >
              {/* Professional report layout */}
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

            {/* Print styles */}
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