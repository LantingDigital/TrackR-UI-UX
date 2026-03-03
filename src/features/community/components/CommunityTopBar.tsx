import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { SPRINGS } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';

export type CommunityTab = 'feed' | 'friends' | 'rankings' | 'play';

interface CommunityTopBarProps {
  activeTab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
  onBack: () => void;
}

const TABS: { key: CommunityTab; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'friends', label: 'Friends' },
  { key: 'rankings', label: 'Rankings' },
  { key: 'play', label: 'Play' },
];

interface TabMeasurement {
  x: number;
  width: number;
}

export const CommunityTopBar = ({ activeTab, onTabChange, onBack }: CommunityTopBarProps) => {
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const buttonLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const labelWidths = useRef<Record<string, number>>({});
  const initialized = useRef(false);

  const moveIndicator = (tabKey: string, animate: boolean) => {
    const btn = buttonLayouts.current[tabKey];
    const labelW = labelWidths.current[tabKey];
    if (!btn || labelW == null) return;
    const targetX = btn.x + (btn.width - labelW) / 2;
    if (animate && initialized.current) {
      indicatorX.value = withSpring(targetX, SPRINGS.responsive);
      indicatorW.value = withSpring(labelW, SPRINGS.responsive);
    } else {
      indicatorX.value = targetX;
      indicatorW.value = labelW;
    }
  };

  useEffect(() => {
    moveIndicator(activeTab, true);
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const handleButtonLayout = (tabKey: string, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    buttonLayouts.current[tabKey] = { x, width };
    // If this is the active tab and we have both measurements, position indicator
    if (tabKey === activeTab && labelWidths.current[tabKey] != null) {
      moveIndicator(tabKey, false);
      initialized.current = true;
    }
  };

  const handleLabelLayout = (tabKey: string, e: LayoutChangeEvent) => {
    labelWidths.current[tabKey] = e.nativeEvent.layout.width;
    // If this is the active tab and we have both measurements, position indicator
    if (tabKey === activeTab && buttonLayouts.current[tabKey]) {
      if (!initialized.current) {
        moveIndicator(tabKey, false);
        initialized.current = true;
      }
      // Don't re-position on label relayout (bold/semibold change) — let the useEffect handle it
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Back arrow */}
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>

        {/* Tab buttons */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                style={styles.tabButton}
                onLayout={(e) => handleButtonLayout(tab.key, e)}
                onPress={() => {
                  haptics.tap();
                  onTabChange(tab.key);
                }}
              >
                <Text
                  onLayout={(e) => handleLabelLayout(tab.key, e)}
                  style={[
                    styles.tabLabel,
                    isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}

          {/* Animated indicator */}
          <Animated.View style={[styles.indicator, indicatorStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
    paddingVertical: spacing.md,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    paddingRight: spacing.lg,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  tabLabel: {
    fontSize: typography.sizes.label,
  },
  tabLabelActive: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  tabLabelInactive: {
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: colors.accent.primary,
  },
});
