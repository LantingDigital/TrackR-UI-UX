// ============================================
// Trip Planner Sheet — BlurView Bottom Sheet
//
// Orchestrates all 4 phases:
//   1. Selection — pick stops
//   2. Plan Preview — reorder, set budget/mode
//   3. Active Trip — walking/in_line/done
//   4. Trip Complete — stats and celebration
//
// BlurView backdrop (like CoasterSheet).
// Spring slide-up entrance. Pan-to-dismiss.
// ============================================

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { useTabBarContext } from '../../../contexts/TabBarContext';

import { useTripPlannerStore } from './tripPlannerStore';
import {
  generatePlanFromPOIs,
  estimateTotalMin,
  reorderStops,
  createBreakStop,
  insertStopAfter,
} from './planGenerator';
import { computePaceSnapshot } from './paceEngine';
import type { UnifiedParkMapData, ParkPOI } from '../types';
import type { SelectablePOI, TripStop, TripMode, BudgetEstimate, PaceSnapshot } from './types';

// Phase views
import { SelectionView } from './components/SelectionView';
import { PlanView } from './components/PlanView';
import { CoPilotScreen } from './copilot/CoPilotScreen';
import { TripCompleteView } from './components/TripCompleteView';

// POI data
import { KNOTTS_POI } from '../data/knottsPOI';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 0.25;
const DISMISS_VELOCITY = 500;

// ============================================
// Props
// ============================================

interface TripPlannerSheetProps {
  visible: boolean;
  onClose: () => void;
  parkId: string;
  parkName: string;
  mapData: UnifiedParkMapData;
}

// ============================================
// Convert ParkPOI → SelectablePOI
// ============================================

function toSelectablePOI(poi: ParkPOI): SelectablePOI {
  return {
    id: poi.id,
    name: poi.name,
    category: poi.type as SelectablePOI['category'],
    thrillLevel: poi.thrillLevel,
    area: poi.area,
    coasterId: poi.coasterId,
    description: poi.description,
    estimatedWaitMin: poi.waitTimeMinutes,
  };
}

// ============================================
// Phase type
// ============================================

type Phase = 'selection' | 'plan' | 'active' | 'complete';

// ============================================
// Component
// ============================================

export function TripPlannerSheet({
  visible,
  onClose,
  parkId,
  parkName,
  mapData,
}: TripPlannerSheetProps) {
  const insets = useSafeAreaInsets();
  const { hideTabBar, showTabBar } = useTabBarContext();
  const store = useTripPlannerStore();

  // ---- Determine initial phase from store state ----
  const getInitialPhase = (): Phase => {
    if (!store.currentPlan) return 'selection';
    if (store.currentPlan.status === 'completed') return 'complete';
    if (store.currentPlan.status === 'active' || store.currentPlan.status === 'paused') return 'active';
    if (store.currentPlan.status === 'planning') return 'plan';
    return 'selection';
  };

  const [phase, setPhase] = useState<Phase>(getInitialPhase);

  // ---- Selection state ----
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ---- Plan preview state ----
  const [timeBudgetMin, setTimeBudgetMin] = useState(180); // default 3h
  const [mode, setMode] = useState<TripMode>('concierge');
  const [planStops, setPlanStops] = useState<TripStop[]>([]);
  const [estimate, setEstimate] = useState<BudgetEstimate>({
    totalMin: 0, budgetMin: 180, overByMin: 0, isOverBudget: false,
  });

  // ---- Pace tracking ----
  const [paceSnapshot, setPaceSnapshot] = useState<PaceSnapshot | null>(null);

  // ---- Available POIs ----
  const selectablePOIs = useMemo(() => KNOTTS_POI.map(toSelectablePOI), []);

  // ---- Sheet animation ----
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      hideTabBar();
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
      // Restore phase from store
      setPhase(getInitialPhase());
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, SPRINGS.responsive);
      backdropOpacity.value = withTiming(0, { duration: TIMING.fast });
      showTabBar();
    }
  }, [visible]);

  // ---- Pan-to-dismiss (disabled during active co-pilot phase) ----
  const panGesture = Gesture.Pan()
    .enabled(phase !== 'active')
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      const shouldDismiss =
        e.translationY > SCREEN_HEIGHT * DISMISS_THRESHOLD ||
        e.velocityY > DISMISS_VELOCITY;

      if (shouldDismiss) {
        translateY.value = withSpring(SCREEN_HEIGHT, SPRINGS.responsive);
        backdropOpacity.value = withTiming(0, { duration: TIMING.fast });
        runOnJS(handleClose)();
      } else {
        translateY.value = withSpring(0, SPRINGS.responsive);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // ---- Close handler ----
  const handleClose = useCallback(() => {
    showTabBar();
    onClose();
  }, [onClose, showTabBar]);

  // ---- Pace polling ----
  useEffect(() => {
    if (phase !== 'active' || !store.currentPlan) return;

    const tick = () => {
      if (store.currentPlan && store.currentPlan.status === 'active') {
        const snapshot = computePaceSnapshot(store.currentPlan);
        setPaceSnapshot(snapshot);
      }
    };

    tick();
    const interval = setInterval(tick, 30_000); // every 30s
    return () => clearInterval(interval);
  }, [phase, store.currentPlan?.status]);

  // ============================================
  // Phase handlers
  // ============================================

  // Selection → Plan
  const handleSelectionNext = useCallback(() => {
    const selected = selectablePOIs.filter((p) => selectedIds.has(p.id));
    const result = generatePlanFromPOIs(selected, mapData, timeBudgetMin, store.globalWaitLog);
    setPlanStops(result.stops);
    setEstimate(result.estimate);
    haptics.select();
    setPhase('plan');
  }, [selectedIds, selectablePOIs, mapData, timeBudgetMin, store.globalWaitLog]);

  // Toggle POI selection
  const handleToggle = useCallback((poiId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(poiId)) next.delete(poiId);
      else next.add(poiId);
      return next;
    });
  }, []);

  // Budget change → regenerate estimate
  const handleBudgetChange = useCallback((min: number) => {
    setTimeBudgetMin(min);
    const totalMin = estimateTotalMin(planStops);
    const overByMin = min > 0 ? Math.max(0, Math.round(totalMin - min)) : 0;
    setEstimate({
      totalMin: Math.round(totalMin),
      budgetMin: min,
      overByMin,
      isOverBudget: min > 0 && totalMin > min,
    });
  }, [planStops]);

  // Mode toggle
  const handleModeToggle = useCallback(() => {
    setMode((m) => (m === 'concierge' ? 'speed_run' : 'concierge'));
  }, []);

  // Reorder stops
  const handleReorder = useCallback((newOrder: string[]) => {
    const reordered = reorderStops(planStops, newOrder, mapData);
    setPlanStops(reordered);
    const totalMin = estimateTotalMin(reordered);
    const overByMin = timeBudgetMin > 0 ? Math.max(0, Math.round(totalMin - timeBudgetMin)) : 0;
    setEstimate({
      totalMin: Math.round(totalMin),
      budgetMin: timeBudgetMin,
      overByMin,
      isOverBudget: timeBudgetMin > 0 && totalMin > timeBudgetMin,
    });
  }, [planStops, mapData, timeBudgetMin]);

  // Remove stop from plan
  const handleRemoveStop = useCallback((stopId: string) => {
    setPlanStops((prev) => {
      const updated = prev.filter((s) => s.id !== stopId).map((s, i) => ({ ...s, order: i }));
      const totalMin = estimateTotalMin(updated);
      const overByMin = timeBudgetMin > 0 ? Math.max(0, Math.round(totalMin - timeBudgetMin)) : 0;
      setEstimate({
        totalMin: Math.round(totalMin),
        budgetMin: timeBudgetMin,
        overByMin,
        isOverBudget: timeBudgetMin > 0 && totalMin > timeBudgetMin,
      });
      return updated;
    });
  }, [timeBudgetMin]);

  // Start trip
  const handleStartTrip = useCallback(() => {
    store.createPlan(parkId, parkName, planStops, timeBudgetMin, mode);
    store.startTrip();
    setPhase('active');
  }, [store, parkId, parkName, planStops, timeBudgetMin, mode]);

  // Active trip handlers
  const handleArrivedAtStop = useCallback((stopId: string) => {
    store.arrivedAtStop(stopId);
  }, [store]);

  const handleCompleteStop = useCallback((stopId: string) => {
    store.completeStop(stopId);
  }, [store]);

  const handleSkipStop = useCallback((stopId: string) => {
    store.skipStop(stopId);
  }, [store]);

  const handlePauseTrip = useCallback(() => {
    store.pauseTrip();
  }, [store]);

  const handleResumeTrip = useCallback(() => {
    store.resumeTrip();
  }, [store]);

  const handleAbandonTrip = useCallback(() => {
    store.abandonTrip();
    handleClose();
  }, [store, handleClose]);

  const handleAddBreak = useCallback(() => {
    if (!store.currentPlan) return;
    const currentStop = store.currentPlan.stops.find((s) => s.state === 'walking' || s.state === 'in_line');
    if (currentStop) {
      const breakStop = createBreakStop(10);
      store.insertStop(currentStop.id, breakStop, mapData);
    }
  }, [store, mapData]);

  const handleViewSummary = useCallback(() => {
    store.completeTrip();
    setPhase('complete');
  }, [store]);

  const handleTripDone = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // Back from plan to selection
  const handleBackToSelection = useCallback(() => {
    setPhase('selection');
  }, []);

  // ============================================
  // Render
  // ============================================

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Blur backdrop (hidden during co-pilot active phase) */}
      {phase !== 'active' && (
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
            <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Animated.View>
      )}

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheet,
            phase !== 'active' && { paddingTop: insets.top },
            { paddingBottom: insets.bottom },
            phase === 'active' && styles.sheetFullscreen,
            sheetStyle,
          ]}
        >
          {/* Drag handle (hidden during co-pilot) */}
          {phase !== 'active' && (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          )}

          {/* Navigation header (back button for plan phase) */}
          {phase === 'plan' && (
            <View style={styles.navHeader}>
              <Pressable onPress={handleBackToSelection} hitSlop={8} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
              </Pressable>
            </View>
          )}

          {/* Phase content */}
          {phase === 'selection' && (
            <SelectionView
              parkName={parkName}
              pois={selectablePOIs}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onNext={handleSelectionNext}
            />
          )}

          {phase === 'plan' && (
            <PlanView
              stops={planStops}
              timeBudgetMin={timeBudgetMin}
              estimate={estimate}
              mode={mode}
              onBudgetChange={handleBudgetChange}
              onModeToggle={handleModeToggle}
              onReorder={handleReorder}
              onRemoveStop={handleRemoveStop}
              onStart={handleStartTrip}
            />
          )}

          {phase === 'active' && store.currentPlan && (
            <CoPilotScreen
              plan={store.currentPlan}
              mapData={mapData}
              onArrivedAtStop={handleArrivedAtStop}
              onCompleteStop={handleCompleteStop}
              onSkipStop={handleSkipStop}
              onPauseTrip={handlePauseTrip}
              onAbandonTrip={handleAbandonTrip}
              onAddBreak={handleAddBreak}
              onViewSummary={handleViewSummary}
              onClose={handleClose}
            />
          )}

          {phase === 'complete' && store.currentPlan && (
            <TripCompleteView
              plan={store.currentPlan}
              onDone={handleTripDone}
            />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.page,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
  },
  sheetFullscreen: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
  },
  navHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
