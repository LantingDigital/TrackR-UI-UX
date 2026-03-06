// ============================================
// Co-Pilot Screen — Full-screen trip orchestrator
//
// Replaces ActiveTripView when trip is active.
// Composes: StopProgressBar, CoPilotHeader,
// NextMoveCard, CoPilotMap, UpcomingStopStrip.
// ============================================

import React, { memo, useMemo, useEffect, useCallback, useRef, useState } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';

import { colors } from '../../../../theme/colors';
import { spacing } from '../../../../theme/spacing';
import { useTabBarContext } from '../../../../contexts/TabBarContext';
import { computePaceSnapshot } from '../paceEngine';

import { StopProgressBar } from './StopProgressBar';
import { CoPilotHeader } from './CoPilotHeader';
import { NextMoveCard } from './NextMoveCard';
import { UpcomingStopStrip } from './UpcomingStopStrip';
import { CoPilotMap } from './CoPilotMap';
import type { TripPlan, TripStop, PaceSnapshot } from '../types';
import type { UnifiedParkMapData, ParkPOI } from '../../types';

// ============================================
// Props
// ============================================

interface CoPilotScreenProps {
  plan: TripPlan;
  mapData: UnifiedParkMapData;
  onCompleteStop: (stopId: string) => void;
  onSkipStop: (stopId: string) => void;
  onArrivedAtStop: (stopId: string) => void;
  onPauseTrip: () => void;
  onAbandonTrip: () => void;
  onAddBreak: () => void;
  onViewSummary: () => void;
  onClose: () => void;
}

// ============================================
// Component
// ============================================

function CoPilotScreenInner({
  plan,
  mapData,
  onCompleteStop,
  onSkipStop,
  onArrivedAtStop,
  onPauseTrip,
  onAbandonTrip,
  onAddBreak,
  onViewSummary,
  onClose,
}: CoPilotScreenProps) {
  const tabBar = useTabBarContext();
  const paceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [paceSnapshot, setPaceSnapshot] = useState<PaceSnapshot | null>(null);

  // Build POI lookup map once
  const poiMap = useMemo<Map<string, ParkPOI>>(
    () => new Map(mapData.pois.map((p) => [p.id, p])),
    [mapData.pois],
  );

  // Hide tab bar on mount
  useEffect(() => {
    tabBar.hideTabBar();
    return () => tabBar.showTabBar();
  }, []);

  // Pace polling every 30s
  useEffect(() => {
    const tick = () => {
      if (plan.status === 'active' && plan.startedAt) {
        setPaceSnapshot(computePaceSnapshot(plan));
      }
    };
    tick();
    paceIntervalRef.current = setInterval(tick, 30_000);
    return () => {
      if (paceIntervalRef.current) clearInterval(paceIntervalRef.current);
    };
  }, [plan.stops, plan.status, plan.startedAt]);

  // Derive current stop
  const currentStop = useMemo<TripStop | null>(() => {
    return (
      plan.stops.find((s) => s.state === 'walking' || s.state === 'in_line') ??
      plan.stops.find((s) => s.state === 'pending') ??
      null
    );
  }, [plan.stops]);

  // Count completed
  const completedCount = useMemo(
    () => plan.stops.filter((s) => s.state === 'done' || s.state === 'skipped').length,
    [plan.stops],
  );

  // Handle "all done" — transition to summary
  useEffect(() => {
    if (currentStop === null && completedCount > 0) {
      const timer = setTimeout(onViewSummary, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStop, completedCount]);

  if (!currentStop) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <StopProgressBar
        completedCount={completedCount}
        totalStops={plan.stops.length}
      />

      <CoPilotHeader
        completedCount={completedCount}
        totalStops={plan.stops.length}
        paceSnapshot={paceSnapshot}
        onClose={onClose}
        onPause={onPauseTrip}
        onAbandon={onAbandonTrip}
        onAddBreak={onAddBreak}
      />

      <NextMoveCard
        stop={currentStop}
        poiMap={poiMap}
        onArrived={onArrivedAtStop}
        onDone={onCompleteStop}
        onSkip={onSkipStop}
      />

      <CoPilotMap
        plan={plan}
        currentStop={currentStop}
        poiMap={poiMap}
        mapData={mapData}
      />

      <UpcomingStopStrip stops={plan.stops} poiMap={poiMap} />
    </View>
  );
}

export const CoPilotScreen = memo(CoPilotScreenInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
});
