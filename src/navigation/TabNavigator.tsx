/**
 * TabNavigator
 *
 * React Navigation v7 bottom tab navigator with fade animation.
 * Custom AnimatedTabBar preserves the existing tab bar styling.
 *
 * Home | Discover | Play | Activity | Profile
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Reanimated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { PlayScreen } from '../screens/PlayScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Import store for pending badge
import { getPendingCount, subscribe } from '../stores/rideLogStore';

// Import tab bar context
import { useTabBar, TAB_NAMES, TabName } from '../contexts/TabBarContext';

// Tab bar height (used for animation offset)
const TAB_BAR_HEIGHT = 49;

// Tab configuration with icons
const TAB_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; showBadge?: boolean }> = {
  Home: { icon: 'home-outline' },
  Discover: { icon: 'compass-outline' },
  Play: { icon: 'game-controller-outline' },
  Activity: { icon: 'time-outline', showBadge: true },
  Profile: { icon: 'person-outline' },
};

const Tab = createBottomTabNavigator();

/**
 * Custom hook to subscribe to pending log count changes
 */
function usePendingCount(): number {
  const [count, setCount] = useState(getPendingCount());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setCount(getPendingCount());
    });
    return unsubscribe;
  }, []);

  return count;
}

/**
 * Custom animated tab bar — accepts React Navigation v7 tabBar props
 * plus uses TabBarContext for hide/show and reset functionality
 */
const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const tabBarContext = useTabBar();
  const pendingCount = usePendingCount();

  // Calculate total height including safe area
  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

  // Animated translateY from context (Reanimated SharedValue)
  const animatedTabBarStyle = useAnimatedStyle(() => {
    if (!tabBarContext) return {};
    const translateY = interpolate(
      tabBarContext.tabBarTranslateY.value,
      [0, 1],
      [0, totalHeight + 20], // Extra 20 for shadow
    );
    return { transform: [{ translateY }] };
  });

  if (!tabBarContext) return null;

  // Active tab from React Navigation state
  const activeTabName = state.routes[state.index].name as TabName;

  return (
    <Reanimated.View
      style={[
        styles.tabBar,
        {
          height: totalHeight,
          paddingBottom: insets.bottom,
        },
        animatedTabBarStyle,
      ]}
    >
      {TAB_NAMES.map((name, index) => {
        const isFocused = activeTabName === name;
        const color = isFocused ? '#CF6769' : '#999999';
        const size = 24;

        const config = TAB_CONFIG[name] || { icon: 'ellipse-outline' };
        const iconName = config.icon;
        const showBadge = config.showBadge && pendingCount > 0;

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (state.index === index) {
            // Same tab — trigger reset
            tabBarContext.resetScreen(name);
          } else {
            navigation.navigate(name);
          }
        };

        return (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={name}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View>
              <Ionicons name={iconName} size={size} color={color} />
              {showBadge && (
                <View style={styles.dotBadge} />
              )}
            </View>
            <Text style={[styles.tabLabel, { color }]}>
              {name}
            </Text>
          </Pressable>
        );
      })}
    </Reanimated.View>
  );
};

/**
 * Tab navigator using React Navigation v7 with fade animation
 */
export const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        transitionSpec: {
          animation: 'timing',
          config: { duration: 100 },
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Play" component={PlayScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  dotBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CF6769',
  },
});

export default TabNavigator;
