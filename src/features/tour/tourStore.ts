// ============================================
// Guided Tour — Persistent Store
//
// Module-level state + AsyncStorage + listeners
// (same pattern as settingsStore.ts)
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useReducer } from 'react';

const STORAGE_KEY = '@tour_state';

// ============================================
// Module-Level State
// ============================================

let tourState = { hasSeenTour: false };
let tourInitialized = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ============================================
// Persistence
// ============================================

async function loadTourState(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      tourState = { ...tourState, ...JSON.parse(raw) };
    }
  } catch {}
}

async function saveTourState(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tourState));
  } catch {}
}

// ============================================
// Init
// ============================================

async function init() {
  if (tourInitialized) return;
  tourInitialized = true;
  await loadTourState();
  notify();
}

// ============================================
// Actions
// ============================================

export function setTourSeen() {
  tourState = { ...tourState, hasSeenTour: true };
  saveTourState();
  notify();
}

export function resetTourSeen() {
  tourState = { ...tourState, hasSeenTour: false };
  saveTourState();
  notify();
}

// ============================================
// Plain Getter
// ============================================

export function getHasSeenTour(): boolean {
  return tourState.hasSeenTour;
}

// ============================================
// React Hook
// ============================================

export function useTourStore() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    init();
    return () => { listeners.delete(forceUpdate); };
  }, []);

  return {
    hasSeenTour: tourState.hasSeenTour,
    setTourSeen,
    resetTourSeen,
  };
}
