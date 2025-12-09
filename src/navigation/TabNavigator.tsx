/**
 * TabNavigator
 *
 * 5-tab navigation structure for TrackR V1:
 * Home | Discover | Play | Activity | Profile
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Pressable, InteractionManager } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { PlayScreen } from '../screens/PlayScreen';
import { ActivityScreen } from '../screens/ActivityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Import store for pending badge
import { getPendingCount, subscribe } from '../stores/rideLogStore';

// Import tab bar context
import { useTabBar } from '../contexts/TabBarContext';

const Tab = createBottomTabNavigator();

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
 * Custom animated tab bar that can slide off-screen
 */
const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const tabBarContext = useTabBar();
  const pendingCount = usePendingCount();

  // Calculate total height including safe area
  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

  // Get animated translate value from context
  const translateY = tabBarContext?.tabBarTranslateY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, totalHeight + 20], // Extra 20 for shadow
  }) || 0;

  return (
    <Animated.View
      style={[
        styles.tabBar,
        {
          height: totalHeight,
          paddingBottom: insets.bottom,
          transform: [{ translateY }],
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined
          ? options.tabBarLabel
          : options.title !== undefined
          ? options.title
          : route.name;

        const isFocused = state.index === index;
        const color = isFocused ? '#CF6769' : '#999999';
        const size = 24;

        // Get tab configuration
        const config = TAB_CONFIG[route.name] || { icon: 'ellipse-outline' };
        const iconName = config.icon;
        const showBadge = config.showBadge && pendingCount > 0;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (isFocused) {
            // Pressing the same tab - reset immediately
            tabBarContext?.resetScreen(route.name);
          } else if (!event.defaultPrevented) {
            // Navigating to a different tab - navigate first, then reset after transition
            navigation.navigate(route.name);
            // Defer the reset until after the navigation transition completes
            InteractionManager.runAfterInteractions(() => {
              tabBarContext?.resetScreen(route.name);
            });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
          >
            <View>
              <Ionicons name={iconName} size={size} color={color} />
              {showBadge && (
                <View style={styles.dotBadge} />
              )}
            </View>
            <Text style={[styles.tabLabel, { color }]}>
              {typeof label === 'string' ? label : route.name}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Play"
        component={PlayScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
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
