/**
 * Tab Bar Context
 *
 * Provides tab bar visibility control for full-screen experiences.
 * Used to hide the tab bar during confirmation modals, etc.
 */

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { Animated } from 'react-native';

interface TabBarContextValue {
  // Animated value for tab bar position (0 = visible, 1 = hidden)
  tabBarTranslateY: Animated.Value;
  // Hide the tab bar with animation
  hideTabBar: (duration?: number) => void;
  // Show the tab bar with animation
  showTabBar: (duration?: number) => void;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

interface TabBarProviderProps {
  children: ReactNode;
}

export const TabBarProvider: React.FC<TabBarProviderProps> = ({ children }) => {
  // Animated value: 0 = visible, 1 = hidden (translated down)
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  const hideTabBar = useCallback((duration: number = 300) => {
    Animated.timing(tabBarTranslateY, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [tabBarTranslateY]);

  const showTabBar = useCallback((duration: number = 300) => {
    Animated.timing(tabBarTranslateY, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [tabBarTranslateY]);

  const value: TabBarContextValue = {
    tabBarTranslateY,
    hideTabBar,
    showTabBar,
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
