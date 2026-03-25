/**
 * TabNavigator
 *
 * React Navigation v7 bottom tab navigator with fade animation.
 * Custom AnimatedTabBar preserves the existing tab bar styling.
 *
 * Home | Parks | Logbook | Community | Profile
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Reanimated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { LogbookScreen } from '../screens/LogbookScreen';
import { ParksScreen } from '../screens/ParksScreen';
// Community is a transparent modal overlay in RootNavigator, not a tab screen
const CommunityPlaceholder = () => <View style={{ flex: 1 }} />;
import { ProfileScreen } from '../screens/ProfileScreen';

import { haptics } from '../services/haptics';

// Import tab bar context
import { useTabBar, TAB_NAMES, TabName } from '../contexts/TabBarContext';

// Tab bar height (used for animation offset)
const TAB_BAR_HEIGHT = 49;

// Tab configuration with icons
const TAB_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap }> = {
  Home: { icon: 'home-outline' },
  Parks: { icon: 'location-outline' },
  Logbook: { icon: 'book-outline' },
  Community: { icon: 'chatbubbles-outline' },
  Profile: { icon: 'person-outline' },
};

const Tab = createBottomTabNavigator();

/**
 * Custom animated tab bar — accepts React Navigation v7 tabBar props
 * plus uses TabBarContext for hide/show and reset functionality
 */
const AnimatedTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const tabBarContext = useTabBar();

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

        const onPress = () => {
          haptics.tap();
          // Safety: force-show tab bar on any tab press (fixes orphaned hides)
          tabBarContext.forceShowTabBar(0);
          if (name === 'Community') {
            // Open as transparent modal overlay (so Home stays visible behind)
            navigation.navigate('CommunityOverlay');
            return;
          }
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
  const tabBarCtx = useTabBar();

  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      screenListeners={{
        focus: () => {
          // Safety: whenever a tab screen gains focus, ensure tab bar is visible.
          // Catches cases where a pushed screen hid the tab bar but didn't restore it.
          tabBarCtx?.forceShowTabBar(150);
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Parks" component={ParksScreen} />
      <Tab.Screen name="Logbook" component={LogbookScreen} />
      <Tab.Screen name="Community" component={CommunityPlaceholder} />
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
});

export default TabNavigator;
