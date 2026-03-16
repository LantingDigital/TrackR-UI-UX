/**
 * Auth Store — Zustand
 *
 * Manages authentication state. Automatically subscribes to Firebase
 * auth state changes so the store always reflects the current user.
 *
 * Usage in React: `const { user, isAuthenticated } = useAuthStore();`
 * Usage outside React: `getAuthUser()`, `getIsAuthenticated()`
 */

import { create } from 'zustand';
import { AuthUser } from '../types/auth';
import { onAuthStateChanged } from '../services/firebase/auth';

// ============================================
// Types
// ============================================

interface AuthState {
  /** Current authenticated user, or null if signed out */
  user: AuthUser | null;
  /** Convenience boolean derived from user !== null */
  isAuthenticated: boolean;
  /** True while checking initial auth state on app launch */
  isLoading: boolean;
  /** Last auth error message, if any */
  error: string | null;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// ============================================
// Store
// ============================================

const useStore = create<AuthStore>()((set) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: user !== null,
      isLoading: false,
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

// ============================================
// Auth State Listener
// ============================================

/**
 * Subscribe to Firebase auth state changes on module load.
 * This keeps the store in sync automatically — no provider component needed.
 * The unsubscribe function is stored in case cleanup is ever needed.
 */
const unsubscribeAuth = onAuthStateChanged((user) => {
  useStore.getState().setUser(user);
});

export { unsubscribeAuth };

// ============================================
// Standalone Getters (for use outside React)
// ============================================

export function getAuthUser(): AuthUser | null {
  return useStore.getState().user;
}

export function getIsAuthenticated(): boolean {
  return useStore.getState().isAuthenticated;
}

export function getIsAuthLoading(): boolean {
  return useStore.getState().isLoading;
}

export function getAuthError(): string | null {
  return useStore.getState().error;
}

// Standalone action wrappers
export const setAuthUser = useStore.getState().setUser;
export const setAuthLoading = useStore.getState().setLoading;
export const setAuthError = useStore.getState().setError;
export const clearAuthError = useStore.getState().clearError;

// ============================================
// React Hook
// ============================================

/**
 * Hook to use auth store in React components.
 */
export function useAuthStore() {
  const state = useStore();

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    setUser: state.setUser,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  };
}
