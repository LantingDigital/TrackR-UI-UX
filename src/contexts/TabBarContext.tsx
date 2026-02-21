/**
 * Tab Bar Context
 *
 * Provides tab bar visibility control, screen reset functionality,
 * and shared state for the custom animated tab bar.
 */

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// Tab names and types
export const TAB_NAMES = ['Home', 'Discover', 'Play', 'Activity', 'Profile'] as const;
export type TabName = (typeof TAB_NAMES)[number];

// Type for screen reset handlers
type ScreenResetHandler = () => void;

interface TabBarContextValue {
  // Tab bar visibility — SharedValue (0 = visible, 1 = hidden)
  tabBarTranslateY: SharedValue<number>;
  hideTabBar: (duration?: number) => void;
  showTabBar: (duration?: number) => void;

  // Screen reset
  registerResetHandler: (screenName: string, handler: ScreenResetHandler) => void;
  unregisterResetHandler: (screenName: string) => void;
  resetScreen: (screenName: string) => void;
  resetAllScreens: () => void;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

interface TabBarProviderProps {
  children: ReactNode;
}

export const TabBarProvider: React.FC<TabBarProviderProps> = ({ children }) => {
  // Tab bar visibility: 0 = visible, 1 = hidden
  const tabBarTranslateY = useSharedValue(0);

  // Map of screen names to their reset handlers
  const resetHandlers = useRef<Map<string, ScreenResetHandler>>(new Map());

  const hideTabBar = useCallback((duration: number = 300) => {
    tabBarTranslateY.value = withTiming(1, { duration });
  }, [tabBarTranslateY]);

  const showTabBar = useCallback((duration: number = 300) => {
    tabBarTranslateY.value = withTiming(0, { duration });
  }, [tabBarTranslateY]);

  const registerResetHandler = useCallback((screenName: string, handler: ScreenResetHandler) => {
    resetHandlers.current.set(screenName, handler);
  }, []);

  const unregisterResetHandler = useCallback((screenName: string) => {
    resetHandlers.current.delete(screenName);
  }, []);

  const resetScreen = useCallback((screenName: string) => {
    const handler = resetHandlers.current.get(screenName);
    if (handler) {
      handler();
    }
  }, []);

  const resetAllScreens = useCallback(() => {
    resetHandlers.current.forEach((handler) => handler());
  }, []);

  const value: TabBarContextValue = {
    tabBarTranslateY,
    hideTabBar,
    showTabBar,
    registerResetHandler,
    unregisterResetHandler,
    resetScreen,
    resetAllScreens,
  };

  return (
    <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>
  );
};

/**
 * Hook to access tab bar context
 * Returns null if used outside TabBarProvider (safe for optional usage)
 */
export const useTabBar = (): TabBarContextValue | null => {
  return useContext(TabBarContext);
};

/**
 * Hook to access tab bar context with error if not in provider
 */
export const useTabBarContext = (): TabBarContextValue => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBarContext must be used within a TabBarProvider');
  }
  return context;
};
