import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer } from 'react';

// ============================================
// AsyncStorage Key
// ============================================
const STORAGE_KEY = '@app_settings';

// ============================================
// Types
// ============================================
export type RiderType = 'thrills' | 'data' | 'planner' | 'newbie' | null;

type Settings = {
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  hasCompletedOnboarding: boolean;
  riderType: RiderType;
  homeParkName: string | null;
};

// ============================================
// Module-Level State
// ============================================
let settings: Settings = {
  hapticsEnabled: true,
  notificationsEnabled: false,
  hasCompletedOnboarding: false,
  riderType: null,
  homeParkName: null,
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
async function loadSettings(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      settings = { ...settings, ...JSON.parse(raw) };
    }
  } catch {}
}

async function saveSettings(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

// ============================================
// Init
// ============================================
async function init() {
  if (initialized) return;
  initialized = true;
  await loadSettings();
  notify();
}

// ============================================
// Plain Getters (for use outside React — e.g. haptics.ts)
// ============================================
export function getHapticsEnabled(): boolean {
  return settings.hapticsEnabled;
}

// ============================================
// Actions
// ============================================
export function setHapticsEnabled(value: boolean) {
  settings = { ...settings, hapticsEnabled: value };
  saveSettings();
  notify();
}

export function setNotificationsEnabled(value: boolean) {
  settings = { ...settings, notificationsEnabled: value };
  saveSettings();
  notify();
}

export function setOnboardingComplete() {
  settings = { ...settings, hasCompletedOnboarding: true };
  saveSettings();
  notify();
}

export function setRiderType(type: RiderType) {
  settings = { ...settings, riderType: type };
  saveSettings();
  notify();
}

export function setHomeParkName(name: string | null) {
  settings = { ...settings, homeParkName: name };
  saveSettings();
  notify();
}

export function resetOnboarding() {
  settings = { ...settings, hasCompletedOnboarding: false, riderType: null };
  saveSettings();
  notify();
}

// ============================================
// Plain Getters
// ============================================
export function getHasCompletedOnboarding(): boolean {
  return settings.hasCompletedOnboarding;
}

export function getHomeParkName(): string | null {
  return settings.homeParkName;
}

// ============================================
// React Hook
// ============================================
export function useSettingsStore() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    init();
    return () => { listeners.delete(forceUpdate); };
  }, []);

  return {
    initialized,
    hapticsEnabled: settings.hapticsEnabled,
    notificationsEnabled: settings.notificationsEnabled,
    hasCompletedOnboarding: settings.hasCompletedOnboarding,
    riderType: settings.riderType,
    homeParkName: settings.homeParkName,
    setHapticsEnabled: useCallback(setHapticsEnabled, []),
    setNotificationsEnabled: useCallback(setNotificationsEnabled, []),
    setOnboardingComplete: useCallback(setOnboardingComplete, []),
    setRiderType: useCallback(setRiderType, []),
    setHomeParkName: useCallback(setHomeParkName, []),
  };
}
