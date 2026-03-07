import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { POIActionSheet } from '../components/POIActionSheet';
import { CoasterSheet } from '../components/CoasterSheet';
import { getPOIById } from '../data/poiNameMap';
import { getEnrichedCoaster } from '../data/coasterDetailData';
import { ParkPOI, EnrichedCoaster } from '../types';

// ============================================
// Context
// ============================================

interface POIActionContextValue {
  openPOI: (poiId: string) => void;
  openCoasterSheet: (poiId: string) => void;
  registerMapHandler: (handler: (poi: ParkPOI) => void) => void;
}

const POIActionCtx = createContext<POIActionContextValue | null>(null);

// ============================================
// Provider
// ============================================

export function POIActionProvider({ children }: { children: React.ReactNode }) {
  const [selectedPOI, setSelectedPOI] = useState<ParkPOI | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  const [detailCoaster, setDetailCoaster] = useState<EnrichedCoaster | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Track all timers for cleanup on unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const safeTimeout = useCallback((cb: () => void, ms: number) => {
    const t = setTimeout(cb, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  // Cleanup all pending timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  // Map handler registered by ParksScreen
  const mapHandlerRef = useRef<((poi: ParkPOI) => void) | null>(null);

  const registerMapHandler = useCallback((handler: (poi: ParkPOI) => void) => {
    mapHandlerRef.current = handler;
  }, []);

  // ---- Open action sheet for any POI ----
  const openPOI = useCallback((poiId: string) => {
    const poi = getPOIById(poiId);
    if (!poi) return;
    setSelectedPOI(poi);
    setActionSheetVisible(true);
  }, []);

  // ---- Action sheet close ----
  const closeActionSheet = useCallback(() => {
    setActionSheetVisible(false);
    safeTimeout(() => setSelectedPOI(null), 300);
  }, [safeTimeout]);

  // ---- View Details (coaster stat card) ----
  const handleViewDetails = useCallback(() => {
    if (!selectedPOI) return;
    const coaster = getEnrichedCoaster(selectedPOI.coasterId || selectedPOI.id);
    if (!coaster) return;

    setActionSheetVisible(false);
    safeTimeout(() => {
      setDetailCoaster(coaster);
      setDetailVisible(true);
    }, 300);
  }, [selectedPOI, safeTimeout]);

  // ---- Open coaster sheet directly (used by map info card) ----
  const openCoasterSheet = useCallback((poiId: string) => {
    const poi = getPOIById(poiId);
    if (!poi) return;
    const coaster = getEnrichedCoaster(poi.coasterId || poi.id);
    if (!coaster) return;
    setDetailCoaster(coaster);
    setDetailVisible(true);
  }, []);

  // ---- View on Map ----
  const handleViewOnMap = useCallback(() => {
    if (!selectedPOI) return;
    setActionSheetVisible(false);
    safeTimeout(() => {
      mapHandlerRef.current?.(selectedPOI);
      setSelectedPOI(null);
    }, 300);
  }, [selectedPOI, safeTimeout]);

  // ---- Close detail sheet ----
  const closeDetailSheet = useCallback(() => {
    setDetailVisible(false);
    safeTimeout(() => setDetailCoaster(null), 400);
  }, [safeTimeout]);

  const value = useMemo<POIActionContextValue>(
    () => ({ openPOI, openCoasterSheet, registerMapHandler }),
    [openPOI, openCoasterSheet, registerMapHandler],
  );

  return (
    <POIActionCtx.Provider value={value}>
      {children}
      <POIActionSheet
        poi={selectedPOI}
        visible={actionSheetVisible}
        onClose={closeActionSheet}
        onViewDetails={handleViewDetails}
        onViewOnMap={handleViewOnMap}
      />
      <CoasterSheet
        coaster={detailCoaster}
        visible={detailVisible}
        onClose={closeDetailSheet}
      />
    </POIActionCtx.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function usePOIAction(): POIActionContextValue {
  const ctx = useContext(POIActionCtx);
  if (!ctx) {
    throw new Error('usePOIAction must be used within POIActionProvider');
  }
  return ctx;
}
