// ============================================
// Trip Planner Modal v3
//
// 4-phase orchestrator:
//   Phase 1: Select POIs (rides, food, shows, etc.)
//   Phase 2: Preview Plan (draggable timeline, budget, mode)
//   Phase 3: Execute Trip (single immersive ExecuteView)
//   Phase 4: Summary (completion stats)
// ============================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { TIMING } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { useTabBar } from '../../../contexts/TabBarContext';

// Data imports
import { COASTER_INDEX } from '../../../data/coasterIndex';
import type { UnifiedParkMapData, ParkPOI } from '../types';

// Store + engines
import { useTripPlannerStore, insertStop } from './tripPlannerStore';
import {
  generatePlanFromPOIs,
  estimateTotalMin,
  createBreakStop,
} from './planGenerator';
import { computePaceSnapshot, generateSuggestion, getBudgetWarning } from './paceEngine';
import type {
  TripStop,
  SelectablePOI,
  TripMode,
  POICategory,
  PaceSnapshot,
} from './types';

// Components
import { POISelectionList } from './components/POISelectionList';
import { PlanPreview } from './components/PlanPreview';
import { ExecuteView } from './components/ExecuteView';
import { TripSummary } from './components/TripSummary';

// ============================================
// Constants
// ============================================

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.95;

type Phase = 'select' | 'preview' | 'execute' | 'summary';

// ============================================
// Props
// ============================================

interface TripPlannerModalProps {
  visible: boolean;
  onClose: () => void;
  parkId: string;
  parkName: string;
  mapData?: UnifiedParkMapData | null;
}

// ============================================
// POI → SelectablePOI converter
// ============================================

function poiToSelectable(poi: ParkPOI): SelectablePOI {
  return {
    id: poi.id,
    name: poi.name,
    category: poi.type as POICategory,
    thrillLevel: poi.thrillLevel,
    area: poi.area,
    coasterId: poi.coasterId,
    menuDescription: poi.menuDescription,
    description: poi.description,
  };
}

function coasterToSelectable(c: typeof COASTER_INDEX[0]): SelectablePOI {
  return {
    id: c.id,
    name: c.name,
    category: 'ride' as POICategory,
    coasterId: c.id,
  };
}

// ============================================
// Modal Component
// ============================================

export function TripPlannerModal({
  visible,
  onClose,
  parkId,
  parkName,
  mapData = null,
}: TripPlannerModalProps) {
  const insets = useSafeAreaInsets();
  const store = useTripPlannerStore();
  const tabBar = useTabBar();

  // ---- Mount/unmount ----
  const [mounted, setMounted] = useState(false);

  // ---- Animation shared values ----
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const phaseOpacity = useSharedValue(1);
  const entrance = useSharedValue(0);

  // ---- Phase state ----
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [timeBudget, setTimeBudget] = useState(180);
  const [previewStops, setPreviewStops] = useState<TripStop[]>([]);
  const [mode, setMode] = useState<TripMode>('concierge');
  const [reorderWarning, setReorderWarning] = useState<string | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [paceSnapshot, setPaceSnapshot] = useState<PaceSnapshot | null>(null);
  const paceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Build POI list ----
  const allPOIs: SelectablePOI[] = useMemo(() => {
    if (mapData?.pois && mapData.pois.length > 0) {
      return mapData.pois
        .filter((p) => !p.underConstruction)
        .map(poiToSelectable);
    }
    return COASTER_INDEX
      .filter((c) => c.park === parkName)
      .sort((a, b) => a.popularityRank - b.popularityRank)
      .map(coasterToSelectable);
  }, [mapData, parkName]);

  // ---- Open / close ----
  useEffect(() => {
    if (visible) {
      setMounted(true);
      tabBar?.hideTabBar();

      const plan = store.currentPlan;
      const resuming = plan &&
        (plan.status === 'active' || plan.status === 'paused' || plan.status === 'planning') &&
        plan.parkId === parkId;

      if (resuming) {
        if (plan!.status === 'completed') {
          setPhase('summary');
        } else {
          setPhase('execute');
          setMode(plan!.mode);
        }
      } else {
        setPhase('select');
        setSelectedIds(new Set());
        setSearchQuery('');
        setTimeBudget(180);
        setMode('concierge');
      }

      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
      entrance.value = 0;
      entrance.value = withDelay(200, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
      haptics.select();
    } else {
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      tabBar?.showTabBar();
      stopPaceTracking();
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // ---- Pace tracking interval ----
  const startPaceTracking = useCallback(() => {
    stopPaceTracking();
    paceIntervalRef.current = setInterval(() => {
      const plan = store.currentPlan;
      if (!plan || plan.status !== 'active') return;
      const snapshot = computePaceSnapshot(plan);
      setPaceSnapshot(snapshot);
      store.recordPaceSnapshot(snapshot);

      const suggestion = generateSuggestion(plan, snapshot, allPOIs);
      if (suggestion && !plan.currentSuggestion?.dismissed) {
        store.setSuggestion(suggestion);
      }
    }, 30_000);
  }, [store, allPOIs]);

  const stopPaceTracking = useCallback(() => {
    if (paceIntervalRef.current) {
      clearInterval(paceIntervalRef.current);
      paceIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === 'execute' && store.currentPlan?.status === 'active') {
      startPaceTracking();
      const snapshot = computePaceSnapshot(store.currentPlan);
      setPaceSnapshot(snapshot);
    } else {
      stopPaceTracking();
    }
    return stopPaceTracking;
  }, [phase, store.currentPlan?.status]);

  // ---- Close handler ----
  const handleClose = useCallback(() => {
    haptics.tap();
    tabBar?.showTabBar();
    backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, backdropOpacity, translateY, tabBar]);

  // ---- Phase transitions ----
  const goToPhase = useCallback((next: Phase) => {
    phaseOpacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setPhase)(next);
      phaseOpacity.value = withTiming(1, { duration: 200 });
    });
    entrance.value = 0;
    entrance.value = withDelay(200, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, [phaseOpacity, entrance]);

  // ---- Animated styles ----
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const phaseStyle = useAnimatedStyle(() => ({
    opacity: phaseOpacity.value,
  }));
  const stagger1 = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.3, 0.6], [0, 0, 1]),
    transform: [{ translateY: interpolate(entrance.value, [0, 0.3, 0.6], [16, 16, 0]) }],
  }));
  const stagger2 = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.4, 0.7], [0, 0, 1]),
    transform: [{ translateY: interpolate(entrance.value, [0, 0.4, 0.7], [16, 16, 0]) }],
  }));

  // ============================================
  // Phase 1: Select POIs
  // ============================================

  const togglePOI = useCallback((id: string) => {
    haptics.tap();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAllRides = useCallback(() => {
    haptics.tap();
    const rideIds = allPOIs.filter((p) => p.category === 'ride').map((p) => p.id);
    const allSelected = rideIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        rideIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        rideIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [allPOIs, selectedIds]);

  const handleNext = useCallback(() => {
    Keyboard.dismiss();
    haptics.select();
    const selected = allPOIs.filter((p) => selectedIds.has(p.id));
    const stops = generatePlanFromPOIs(selected, mapData, timeBudget, store.globalWaitLog);
    setPreviewStops(stops);
    setBudgetWarning(getBudgetWarning(stops, timeBudget));
    goToPhase('preview');
  }, [allPOIs, selectedIds, timeBudget, mapData, store.globalWaitLog, goToPhase]);

  // ============================================
  // Phase 2: Preview
  // ============================================

  const handleBudgetChange = useCallback((budget: number) => {
    haptics.tick();
    setTimeBudget(budget);
    const selected = allPOIs.filter((p) => selectedIds.has(p.id));
    const stops = generatePlanFromPOIs(selected, mapData, budget, store.globalWaitLog);
    setPreviewStops(stops);
    setBudgetWarning(getBudgetWarning(stops, budget));
  }, [allPOIs, selectedIds, mapData, store.globalWaitLog]);

  const handleReorder = useCallback((newOrder: string[]) => {
    const oldTotal = estimateTotalMin(previewStops);
    const stopMap = new Map(previewStops.map((s) => [s.id, s]));
    const newStops = newOrder
      .map((id) => stopMap.get(id))
      .filter((s): s is TripStop => s != null)
      .map((s, i) => ({ ...s, order: i }));

    const newTotal = estimateTotalMin(newStops);
    const diff = newTotal - oldTotal;
    if (diff > 5) {
      setReorderWarning(`This order adds ~${Math.round(diff)} min`);
      setTimeout(() => setReorderWarning(null), 3000);
    }
    setPreviewStops(newStops);
    setBudgetWarning(getBudgetWarning(newStops, timeBudget));
  }, [previewStops, timeBudget]);

  const handleModeToggle = useCallback(() => {
    const newMode = mode === 'concierge' ? 'speed_run' : 'concierge';
    setMode(newMode);
  }, [mode]);

  const handleStartTrip = useCallback(() => {
    haptics.success();
    store.createPlan(parkId, parkName, previewStops, timeBudget, mode);
    store.startTrip();
    goToPhase('execute');
  }, [store, parkId, parkName, previewStops, timeBudget, mode, goToPhase]);

  const handleEditStops = useCallback(() => {
    goToPhase('select');
  }, [goToPhase]);

  // ============================================
  // Phase 3: Execute (delegated to ExecuteView)
  // ============================================

  const activePlan = store.currentPlan;

  const handleEndTrip = useCallback(() => {
    haptics.heavy();
    store.abandonTrip();
    handleClose();
  }, [store, handleClose]);

  const handleAddBreak = useCallback(() => {
    if (!activePlan) return;
    // Find current active stop to insert after
    const currentStop = activePlan.stops.find((s) => s.state === 'walking' || s.state === 'in_line');
    if (!currentStop) return;
    const breakStop = createBreakStop(10);
    insertStop(currentStop.id, breakStop, mapData);
    haptics.select();
  }, [activePlan, mapData]);

  const handlePauseTrip = useCallback(() => {
    haptics.tap();
    store.pauseTrip();
  }, [store]);

  const handleResumeTrip = useCallback(() => {
    haptics.tap();
    store.resumeTrip();
  }, [store]);

  // Auto-transition to summary when trip completes
  useEffect(() => {
    if (activePlan?.status === 'completed' && phase === 'execute') {
      haptics.success();
      goToPhase('summary');
    }
  }, [activePlan?.status, phase, goToPhase]);

  // ============================================
  // Phase 4: Summary
  // ============================================

  const handleSummaryDone = useCallback(() => {
    haptics.tap();
    handleClose();
  }, [handleClose]);

  // ---- Render gate ----
  if (!mounted) return null;

  // ---- Header (hidden during execute — ExecuteView has its own) ----
  const showHeader = phase !== 'execute';
  const headerTitle = phase === 'select'
    ? 'Plan Your Trip'
    : phase === 'preview'
      ? 'Your Plan'
      : 'Trip Complete';

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.lg },
          contentStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Header (select, preview, summary only) */}
        {showHeader && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{headerTitle}</Text>
              <Text style={styles.headerSubtitle}>{parkName}</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </Pressable>
          </View>
        )}

        {/* Phase content */}
        <Animated.View style={[styles.content, phaseStyle]}>
          {/* Phase 1: Select */}
          {phase === 'select' && (
            <View style={styles.phaseContainer}>
              <Animated.View style={[styles.flex1, stagger1]}>
                <POISelectionList
                  pois={allPOIs}
                  selectedIds={selectedIds}
                  onToggle={togglePOI}
                  onSelectAllRides={handleSelectAllRides}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              </Animated.View>
              <Animated.View style={[styles.bottomBar, stagger2]}>
                {selectedIds.size > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedIds.size}</Text>
                  </View>
                )}
                <Pressable
                  onPress={handleNext}
                  disabled={selectedIds.size === 0}
                  style={[styles.primaryBtn, selectedIds.size === 0 && styles.primaryBtnDisabled]}
                >
                  <Text style={[styles.primaryBtnText, selectedIds.size === 0 && styles.primaryBtnTextDisabled]}>
                    Next
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          )}

          {/* Phase 2: Preview */}
          {phase === 'preview' && (
            <Animated.View style={[styles.phaseContainer, stagger1]}>
              <PlanPreview
                stops={previewStops}
                timeBudgetMin={timeBudget}
                onBudgetChange={handleBudgetChange}
                onReorder={handleReorder}
                onStart={handleStartTrip}
                onEditStops={handleEditStops}
                totalMin={estimateTotalMin(previewStops)}
                budgetWarning={budgetWarning || reorderWarning}
                mode={mode}
                onModeToggle={handleModeToggle}
              />
            </Animated.View>
          )}

          {/* Phase 3: Execute — single component */}
          {phase === 'execute' && activePlan && (
            <ExecuteView
              plan={activePlan}
              paceSnapshot={paceSnapshot}
              onArrivedAtStop={(id) => { haptics.select(); store.arrivedAtStop(id); }}
              onCompleteStop={(id) => { haptics.success(); store.completeStop(id); }}
              onSkipStop={(id) => { haptics.tap(); store.skipStop(id); }}
              onPauseTrip={handlePauseTrip}
              onResumeTrip={handleResumeTrip}
              onAbandonTrip={handleEndTrip}
              onAddBreak={handleAddBreak}
              onPhaseComplete={() => goToPhase('summary')}
              onClose={handleClose}
            />
          )}

          {/* Phase 4: Summary */}
          {phase === 'summary' && activePlan && (
            <TripSummary plan={activePlan} onDone={handleSummaryDone} />
          )}
          {phase === 'summary' && !activePlan && store.pastPlans.length > 0 && (
            <TripSummary plan={store.pastPlans[0]} onDone={handleSummaryDone} />
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  phaseContainer: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  badge: {
    backgroundColor: colors.accent.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  badgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  primaryBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    marginLeft: 'auto',
  },
  primaryBtnDisabled: {
    backgroundColor: colors.border.subtle,
  },
  primaryBtnText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  primaryBtnTextDisabled: {
    color: colors.text.meta,
  },
});
