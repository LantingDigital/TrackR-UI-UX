import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Animated, Pressable } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens (placeholder for now)
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { LogScreen } from '../screens/LogScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Import store for pending badge
import { getPendingCount, subscribe } from '../stores/rideLogStore';

// Import tab bar context
import { useTabBar } from '../contexts/TabBarContext';

const Tab = createBottomTabNavigator();

// Tab bar height (used for animation offset)
const TAB_BAR_HEIGHT = 49;

/**
 * Custom hook to subscribe to pending log count changes
 */
function usePendingCount(): number {
  const [count, setCount] = useState(getPendingCount());

  useEffect(() => {
    // Subscribe to store changes
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

        // Get the icon for each tab
        let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
        let showBadge = false;

        switch (route.name) {
          case 'Home':
            iconName = 'home-outline';
            break;
          case 'Search':
            iconName = 'search-outline';
            break;
          case 'Log':
            iconName = 'add-circle-outline';
            showBadge = pendingCount > 0;
            break;
          case 'Discover':
            iconName = 'compass-outline';
            break;
          case 'Profile':
            iconName = 'person-outline';
            break;
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
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
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </Text>
                </View>
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
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Log"
        component={LogScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="add-circle-outline" size={size} color={color} />
              {pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </Text>
                </View>
              )}
            </View>
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#CF6769',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
