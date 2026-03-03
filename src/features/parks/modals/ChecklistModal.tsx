import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  LayoutAnimation,
  ListRenderItemInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { TIMING } from '../../../constants/animations';
import { CoastleCoaster } from '../../coastle/types/coastle';
import { ChecklistRow } from '../components/ChecklistRow';
import { usePOIAction } from '../context/POIActionContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;
const ROW_HEIGHT = 52;

type Tab = 'today' | 'allTime';

interface ChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  parkName: string;
  coasters: CoastleCoaster[];
}

export function ChecklistModal({
  visible,
  onClose,
  parkName,
  coasters,
}: ChecklistModalProps) {
  const insets = useSafeAreaInsets();
  const { openPOI } = usePOIAction();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [todayChecked, setTodayChecked] = useState<Set<string>>(new Set());

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setTodayChecked(new Set());
      setActiveTab('today');
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const switchTab = useCallback((tab: Tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  }, []);

  const toggleCoaster = useCallback((id: string) => {
    setTodayChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const checkedCount = todayChecked.size;
  const totalCount = coasters.length;

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  const keyExtractor = useCallback((item: CoastleCoaster) => item.id, []);

  const renderTodayItem = useCallback(
    ({ item }: ListRenderItemInfo<CoastleCoaster>) => (
      <ChecklistRow
        name={item.name}
        heightFt={item.heightFt}
        speedMph={item.speedMph}
        checked={todayChecked.has(item.id)}
        onToggle={() => toggleCoaster(item.id)}
        onNamePress={() => openPOI(item.id)}
      />
    ),
    [todayChecked, toggleCoaster, openPOI],
  );

  const renderAllTimeItem = useCallback(
    ({ item }: ListRenderItemInfo<CoastleCoaster>) => (
      <ChecklistRow
        name={item.name}
        heightFt={item.heightFt}
        speedMph={item.speedMph}
        checked={false}
        onToggle={() => {}}
        onNamePress={() => openPOI(item.id)}
      />
    ),
    [openPOI],
  );

  const emptyAllTime = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Credits tracking coming soon</Text>
      </View>
    ),
    [],
  );

  if (!mounted) return null;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.lg },
          contentStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ride Checklist</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Summary */}
        <Text style={styles.summary}>
          {checkedCount} / {totalCount} completed
        </Text>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => switchTab('today')}
            style={[
              styles.tab,
              activeTab === 'today' && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'today' && styles.tabTextActive,
              ]}
            >
              Today's Visit
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchTab('allTime')}
            style={[
              styles.tab,
              activeTab === 'allTime' && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'allTime' && styles.tabTextActive,
              ]}
            >
              All-Time Credits
            </Text>
          </Pressable>
        </View>

        {/* List */}
        {activeTab === 'today' ? (
          <FlatList
            data={coasters}
            renderItem={renderTodayItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <FlatList
            data={coasters}
            renderItem={renderAllTimeItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyAllTime}
            ListHeaderComponent={emptyAllTime}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base,
    gap: spacing.md,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background.input,
  },
  tabActive: {
    backgroundColor: colors.accent.primary,
  },
  tabText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.text.inverse,
  },
  emptyState: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
  },
});
