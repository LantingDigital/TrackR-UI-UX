import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useReducer } from 'react';

// ============================================
// AsyncStorage Key
// ============================================
const STORAGE_KEY = '@app_settings';

// ============================================
// Types
// ============================================
export type RiderType = 'thrills' | 'data' | 'planner' | 'newbie' | null;
export type UnitSystem = 'imperial' | 'metric';
export type PrivacyLevel = 'everyone' | 'friends' | 'private';

type Settings = {
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  hasCompletedOnboarding: boolean;
  riderType: RiderType;
  homeParkName: string | null;
  // Profile
  displayName: string;
  username: string;
  profileImageUri: string | null;
  // Preferences
  unitSystem: UnitSystem;
  // Social / Privacy
  activityVisibility: PrivacyLevel;
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
  // Profile
  displayName: 'Coaster Rider',
  username: '@coasterrider',
  profileImageUri: null,
  // Preferences
  unitSystem: 'imperial',
  // Social / Privacy
  activityVisibility: 'everyone',
};
let initialized = false;

type Listener = () => void;
const listeners = new Set<Listener>();

// Cached snapshot — invalidated on every notify(), rebuilt lazily.
let cachedSnapshot: SettingsSnapshot | null = null;

type SettingsSnapshot = {
  initialized: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  hasCompletedOnboarding: boolean;
  riderType: RiderType;
  homeParkName: string | null;
  displayName: string;
  username: string;
  profileImageUri: string | null;
  unitSystem: UnitSystem;
  activityVisibility: PrivacyLevel;
};

function buildSnapshot(): SettingsSnapshot {
  return {
    initialized,
    hapticsEnabled: settings.hapticsEnabled,
    notificationsEnabled: settings.notificationsEnabled,
    hasCompletedOnboarding: settings.hasCompletedOnboarding,
    riderType: settings.riderType,
    homeParkName: settings.homeParkName,
    displayName: settings.displayName,
    username: settings.username,
    profileImageUri: settings.profileImageUri,
    unitSystem: settings.unitSystem,
    activityVisibility: settings.activityVisibility,
  };
}

function getSnapshot(): SettingsSnapshot {
  if (!cachedSnapshot) {
    cachedSnapshot = buildSnapshot();
  }
  return cachedSnapshot;
}

function notify() {
  cachedSnapshot = null; // Invalidate so next getSnapshot() rebuilds
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

export function setDisplayName(name: string) {
  settings = { ...settings, displayName: name };
  saveSettings();
  notify();
}

export function setUsername(name: string) {
  settings = { ...settings, username: name };
  saveSettings();
  notify();
}

export function setProfileImageUri(uri: string | null) {
  settings = { ...settings, profileImageUri: uri };
  saveSettings();
  notify();
}

export function setUnitSystem(unit: UnitSystem) {
  settings = { ...settings, unitSystem: unit };
  saveSettings();
  notify();
}

export function setActivityVisibility(level: PrivacyLevel) {
  settings = { ...settings, activityVisibility: level };
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

export function getDisplayName(): string {
  return settings.displayName;
}

export function getUsername(): string {
  return settings.username;
}

export function getProfileImageUri(): string | null {
  return settings.profileImageUri;
}

export function getUnitSystem(): UnitSystem {
  return settings.unitSystem;
}

export function getActivityVisibility(): PrivacyLevel {
  return settings.activityVisibility;
}

// ============================================
// React Hook
// ============================================

// Stable actions object — module-level functions never change identity,
// so useCallback wrappers were unnecessary overhead that created new
// refs on every render.
const stableActions = {
  setHapticsEnabled,
  setNotificationsEnabled,
  setOnboardingComplete,
  setRiderType,
  setHomeParkName,
  setDisplayName,
  setUsername,
  setProfileImageUri,
  setUnitSystem,
  setActivityVisibility,
} as const;

export function useSettingsStore() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    init();
    return () => { listeners.delete(forceUpdate); };
  }, []);

  // getSnapshot() returns a cached object that only rebuilds when
  // notify() fires, preventing new object allocations on every render.
  const snapshot = getSnapshot();

  return {
    ...snapshot,
    ...stableActions,
  };
}
