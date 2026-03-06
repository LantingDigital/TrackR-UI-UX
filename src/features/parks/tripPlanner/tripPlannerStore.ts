// ============================================
// Trip Planner Store v4
//
// Module-level state + AsyncStorage + listeners.
// Same pattern as settingsStore.
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer } from 'react';
import { reorderStops, insertStopAfter } from './planGenerator';
import type { UnifiedParkMapData } from '../types';
import type {
  TripPlan,
  TripPlannerState,
  TripStop,
  TripMode,
  PaceSnapshot,
} from './types';

// ============================================
// Constants
// ============================================

const STORAGE_KEY = '@trip_planner_v4';
const MAX_PAST_PLANS = 30;
const MAX_WAIT_LOG_ENTRIES = 500;

// ============================================
// UUID
// ============================================

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================
// Module-Level State
// ============================================

let state: TripPlannerState = {
  currentPlan: null,
  pastPlans: [],
  globalWaitLog: [],
};
let initialized = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ============================================
// Persistence
// ============================================

async function load(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = { ...state, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
}

async function save(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

async function init() {
  if (initialized) return;
  initialized = true;
  await load();
  notify();
}

// ============================================
// Helpers
// ============================================

function updateStop(stopId: string, updater: (stop: TripStop) => TripStop): void {
  if (!state.currentPlan) return;
  state = {
    ...state,
    currentPlan: {
      ...state.currentPlan,
      stops: state.currentPlan.stops.map((s) => (s.id === stopId ? updater(s) : s)),
    },
  };
}

function findNextPendingStop(stops: TripStop[], afterOrder: number): TripStop | undefined {
  return stops
    .filter((s) => s.state === 'pending' && s.order > afterOrder)
    .sort((a, b) => a.order - b.order)[0];
}

function autoAdvance(completedOrder: number): void {
  if (!state.currentPlan) return;

  const next = findNextPendingStop(state.currentPlan.stops, completedOrder);
  if (next) {
    updateStop(next.id, (s) => ({
      ...s,
      state: 'walking',
      walkStartedAt: Date.now(),
    }));
  } else {
    const hasActive = state.currentPlan.stops.some(
      (s) => s.state === 'pending' || s.state === 'walking' || s.state === 'in_line',
    );
    if (!hasActive) {
      state = {
        ...state,
        currentPlan: {
          ...state.currentPlan,
          status: 'completed',
          completedAt: Date.now(),
        },
      };
    }
  }
}

function recordWaitTime(poiId: string, estimatedMin: number, actualMin: number): void {
  if (!state.currentPlan) return;

  const now = Date.now();
  const date = new Date(now);

  state = {
    ...state,
    currentPlan: {
      ...state.currentPlan,
      waitTimeLog: [
        ...state.currentPlan.waitTimeLog,
        { poiId, estimatedMin, actualMin, timestamp: now },
      ],
    },
    globalWaitLog: [
      ...state.globalWaitLog,
      { poiId, actualMin, dayOfWeek: date.getDay(), hourOfDay: date.getHours(), timestamp: now },
    ].slice(-MAX_WAIT_LOG_ENTRIES),
  };
}

function archiveCurrentPlan(): void {
  if (!state.currentPlan) return;
  const pastPlans = [state.currentPlan, ...state.pastPlans].slice(0, MAX_PAST_PLANS);
  state = { ...state, currentPlan: null, pastPlans };
  save();
  notify();
}

// ============================================
// Actions
// ============================================

export function createPlan(
  parkId: string,
  parkName: string,
  stops: TripStop[],
  timeBudgetMin: number,
  mode: TripMode = 'concierge',
): TripPlan {
  const plan: TripPlan = {
    id: generateId(),
    parkId,
    parkName,
    stops,
    mode,
    timeBudgetMin,
    status: 'planning',
    createdAt: Date.now(),
    paceSnapshots: [],
    waitTimeLog: [],
  };
  state = { ...state, currentPlan: plan };
  save();
  notify();
  return plan;
}

export function setMode(mode: TripMode): void {
  if (!state.currentPlan) return;
  state = { ...state, currentPlan: { ...state.currentPlan, mode } };
  save();
  notify();
}

export function startTrip(): void {
  if (!state.currentPlan) return;

  const now = Date.now();
  const stops = [...state.currentPlan.stops];
  const firstPending = stops
    .sort((a, b) => a.order - b.order)
    .find((s) => s.state === 'pending');

  const updatedStops = stops.map((s) => {
    if (firstPending && s.id === firstPending.id) {
      return { ...s, state: 'walking' as const, walkStartedAt: now };
    }
    return s;
  });

  state = {
    ...state,
    currentPlan: {
      ...state.currentPlan,
      status: 'active',
      startedAt: now,
      stops: updatedStops,
    },
  };
  save();
  notify();
}

export function arrivedAtStop(stopId: string): void {
  if (!state.currentPlan) return;

  const now = Date.now();
  updateStop(stopId, (s) => {
    const actualWalkMin = s.walkStartedAt
      ? Math.round((now - s.walkStartedAt) / 60_000 * 10) / 10
      : 0;
    return { ...s, state: 'in_line', lineStartedAt: now, actualWalkMin };
  });
  save();
  notify();
}

export function completeStop(stopId: string): void {
  if (!state.currentPlan) return;

  const now = Date.now();
  const stop = state.currentPlan.stops.find((s) => s.id === stopId);
  if (!stop) return;

  const actualWaitMin = stop.lineStartedAt
    ? Math.round((now - stop.lineStartedAt) / 60_000 * 10) / 10
    : 0;

  updateStop(stopId, (s) => ({
    ...s,
    state: 'done',
    completedAt: now,
    actualWaitMin,
  }));

  if (stop.category === 'ride') {
    recordWaitTime(stop.poiId, stop.estimatedWaitMin, actualWaitMin);
  }

  autoAdvance(stop.order);
  save();
  notify();
}

export function skipStop(stopId: string): void {
  if (!state.currentPlan) return;

  const stop = state.currentPlan.stops.find((s) => s.id === stopId);
  if (!stop) return;

  updateStop(stopId, (s) => ({ ...s, state: 'skipped', skippedAt: Date.now() }));
  autoAdvance(stop.order);
  save();
  notify();
}

export function pauseTrip(): void {
  if (!state.currentPlan || state.currentPlan.status !== 'active') return;
  state = { ...state, currentPlan: { ...state.currentPlan, status: 'paused' } };
  save();
  notify();
}

export function resumeTrip(): void {
  if (!state.currentPlan || state.currentPlan.status !== 'paused') return;
  state = { ...state, currentPlan: { ...state.currentPlan, status: 'active' } };
  save();
  notify();
}

export function abandonTrip(): void {
  if (!state.currentPlan) return;
  state = { ...state, currentPlan: { ...state.currentPlan, status: 'abandoned' } };
  archiveCurrentPlan();
}

export function completeTrip(): void {
  if (!state.currentPlan) return;
  state = { ...state, currentPlan: { ...state.currentPlan, status: 'completed', completedAt: Date.now() } };
  archiveCurrentPlan();
}

export function reorderPlanStops(newOrder: string[], mapData: UnifiedParkMapData | null): void {
  if (!state.currentPlan) return;
  const reordered = reorderStops(state.currentPlan.stops, newOrder, mapData);
  state = { ...state, currentPlan: { ...state.currentPlan, stops: reordered } };
  save();
  notify();
}

export function insertStop(afterStopId: string, newStop: TripStop, mapData: UnifiedParkMapData | null): void {
  if (!state.currentPlan) return;
  const updated = insertStopAfter(state.currentPlan.stops, afterStopId, newStop, mapData);
  state = { ...state, currentPlan: { ...state.currentPlan, stops: updated } };
  save();
  notify();
}

export function recordPaceSnapshot(snapshot: PaceSnapshot): void {
  if (!state.currentPlan) return;
  state = {
    ...state,
    currentPlan: {
      ...state.currentPlan,
      paceSnapshots: [...state.currentPlan.paceSnapshots, snapshot],
    },
  };
  save();
  notify();
}

export function clearHistory(): void {
  state = { ...state, pastPlans: [] };
  save();
  notify();
}

// ============================================
// Getters
// ============================================

export function getCurrentPlan(): TripPlan | null {
  return state.currentPlan;
}

export function getGlobalWaitLog(): TripPlannerState['globalWaitLog'] {
  return state.globalWaitLog;
}

// ============================================
// React Hook
// ============================================

export function useTripPlannerStore() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    init();
    return () => { listeners.delete(forceUpdate); };
  }, []);

  return {
    initialized,
    currentPlan: state.currentPlan,
    pastPlans: state.pastPlans,
    globalWaitLog: state.globalWaitLog,

    createPlan: useCallback(createPlan, []),
    setMode: useCallback(setMode, []),
    startTrip: useCallback(startTrip, []),
    pauseTrip: useCallback(pauseTrip, []),
    resumeTrip: useCallback(resumeTrip, []),
    abandonTrip: useCallback(abandonTrip, []),
    completeTrip: useCallback(completeTrip, []),

    arrivedAtStop: useCallback(arrivedAtStop, []),
    completeStop: useCallback(completeStop, []),
    skipStop: useCallback(skipStop, []),

    reorderPlanStops: useCallback(reorderPlanStops, []),
    insertStop: useCallback(insertStop, []),
    recordPaceSnapshot: useCallback(recordPaceSnapshot, []),
    clearHistory: useCallback(clearHistory, []),
  };
}
