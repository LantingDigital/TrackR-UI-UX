/**
 * Settings Store — Zustand + AsyncStorage persistence
 *
 * Profile-visible fields will sync to Firestore in M1.
 * Device-local prefs (haptics, units, onboarding flag) stay in AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Types
// ============================================

export type RiderType = 'thrills' | 'data' | 'planner' | 'newbie' | null;
export type UnitSystem = 'imperial' | 'metric';
export type PrivacyLevel = 'everyone' | 'friends' | 'private';

interface SettingsState {
  // Device prefs (local only)
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  hasCompletedOnboarding: boolean;
  designSamplerMode: boolean;
  unitSystem: UnitSystem;

  // Profile fields (will sync to Firestore)
  riderType: RiderType;
  homeParkName: string | null;
  displayName: string;
  username: string;
  profileImageUri: string | null;
  activityVisibility: PrivacyLevel;
}

interface SettingsActions {
  setHapticsEnabled: (value: boolean) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setOnboardingComplete: () => void;
  setRiderType: (type: RiderType) => void;
  setHomeParkName: (name: string | null) => void;
  setDisplayName: (name: string) => void;
  setUsername: (name: string) => void;
  setProfileImageUri: (uri: string | null) => void;
  setUnitSystem: (unit: UnitSystem) => void;
  setActivityVisibility: (level: PrivacyLevel) => void;
  resetOnboarding: () => void;
  showDesignSampler: () => void;
  hideDesignSampler: () => void;

  // Firestore sync action (called by sync layer, not UI)
  _setProfileFromFirestore: (profile: Partial<SettingsState>) => void;
}

type SettingsStore = SettingsState & SettingsActions;

// ============================================
// Store
// ============================================

const useStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Defaults
      hapticsEnabled: true,
      notificationsEnabled: false,
      hasCompletedOnboarding: false,
      designSamplerMode: false,
      unitSystem: 'imperial' as UnitSystem,
      riderType: null,
      homeParkName: null,
      displayName: 'Coaster Rider',
      username: 'coasterrider',
      profileImageUri: null,
      activityVisibility: 'everyone' as PrivacyLevel,

      // Actions
      setHapticsEnabled: (value) => set({ hapticsEnabled: value }),
      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      setRiderType: (type) => set({ riderType: type }),
      setHomeParkName: (name) => set({ homeParkName: name }),
      setDisplayName: (name) => set({ displayName: name }),
      setUsername: (name) => set({ username: name }),
      setProfileImageUri: (uri) => set({ profileImageUri: uri }),
      setUnitSystem: (unit) => set({ unitSystem: unit }),
      setActivityVisibility: (level) => set({ activityVisibility: level }),
      resetOnboarding: () =>
        set({ hasCompletedOnboarding: false, riderType: null, designSamplerMode: false }),
      showDesignSampler: () =>
        set({ hasCompletedOnboarding: false, designSamplerMode: true }),
      hideDesignSampler: () =>
        set({ hasCompletedOnboarding: true, designSamplerMode: false }),

      // Firestore sync — merge profile fields from Firestore into store
      _setProfileFromFirestore: (profile) => set(profile),
    }),
    {
      name: '@app_settings', // Same AsyncStorage key as before
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist state, not actions
      partialize: (state) => ({
        hapticsEnabled: state.hapticsEnabled,
        notificationsEnabled: state.notificationsEnabled,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        designSamplerMode: state.designSamplerMode,
        unitSystem: state.unitSystem,
        riderType: state.riderType,
        homeParkName: state.homeParkName,
        displayName: state.displayName,
        username: state.username,
        profileImageUri: state.profileImageUri,
        activityVisibility: state.activityVisibility,
      }),
    }
  )
);

// ============================================
// Standalone Getters (for use outside React)
// ============================================

export function getHapticsEnabled(): boolean {
  return useStore.getState().hapticsEnabled;
}

export function getHasCompletedOnboarding(): boolean {
  return useStore.getState().hasCompletedOnboarding;
}

export function getHomeParkName(): string | null {
  return useStore.getState().homeParkName;
}

export function getDisplayName(): string {
  return useStore.getState().displayName;
}

export function getUsername(): string {
  return useStore.getState().username;
}

export function getProfileImageUri(): string | null {
  return useStore.getState().profileImageUri;
}

export function getUnitSystem(): UnitSystem {
  return useStore.getState().unitSystem;
}

export function getActivityVisibility(): PrivacyLevel {
  return useStore.getState().activityVisibility;
}

// Raw store access (for sync layer only — not for UI)
export const _settingsStoreInternal = useStore;

// Standalone action wrappers (for use outside React)
export const setHapticsEnabled = useStore.getState().setHapticsEnabled;
export const setNotificationsEnabled = useStore.getState().setNotificationsEnabled;
export const setOnboardingComplete = useStore.getState().setOnboardingComplete;
export const setRiderType = useStore.getState().setRiderType;
export const setHomeParkName = useStore.getState().setHomeParkName;
export const setDisplayName = useStore.getState().setDisplayName;
export const setUsername = useStore.getState().setUsername;
export const setProfileImageUri = useStore.getState().setProfileImageUri;
export const setUnitSystem = useStore.getState().setUnitSystem;
export const setActivityVisibility = useStore.getState().setActivityVisibility;
export const resetOnboarding = useStore.getState().resetOnboarding;
export const showDesignSampler = useStore.getState().showDesignSampler;
export const hideDesignSampler = useStore.getState().hideDesignSampler;

// ============================================
// React Hook
// ============================================

/**
 * Hook to use settings store in React components.
 * API-compatible with the original module-level store.
 */
export function useSettingsStore() {
  const state = useStore();

  return {
    // Zustand persist handles hydration; always report as initialized
    initialized: true,
    hapticsEnabled: state.hapticsEnabled,
    notificationsEnabled: state.notificationsEnabled,
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    designSamplerMode: state.designSamplerMode,
    riderType: state.riderType,
    homeParkName: state.homeParkName,
    displayName: state.displayName,
    username: state.username,
    profileImageUri: state.profileImageUri,
    unitSystem: state.unitSystem,
    activityVisibility: state.activityVisibility,
    // Actions
    setHapticsEnabled: state.setHapticsEnabled,
    setNotificationsEnabled: state.setNotificationsEnabled,
    setOnboardingComplete: state.setOnboardingComplete,
    setRiderType: state.setRiderType,
    setHomeParkName: state.setHomeParkName,
    setDisplayName: state.setDisplayName,
    setUsername: state.setUsername,
    setProfileImageUri: state.setProfileImageUri,
    setUnitSystem: state.setUnitSystem,
    setActivityVisibility: state.setActivityVisibility,
  };
}
