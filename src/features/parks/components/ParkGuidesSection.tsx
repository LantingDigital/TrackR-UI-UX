import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCardPress } from '../../../hooks/useSpringPress';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { ParkGuide } from '../types';
import { LinkedText } from './LinkedText';
import { usePOIAction } from '../context/POIActionContext';
import { useTabBar } from '../../../contexts/TabBarContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_WIDTH = 240;
const CARD_HEIGHT = 120;
const DISMISS_VELOCITY = 500;

// ============================================
// GuideCard — Card with proper shadows
// ============================================

function GuideCard({
  guide,
  index,
  onPress,
}: {
  guide: ParkGuide;
  index: number;
  onPress: () => void;
}) {
  const { pressHandlers, animatedStyle: pressStyle } = useCardPress();

  const entryProgress = useSharedValue(0);

  useEffect(() => {
    entryProgress.value = withDelay(
      index * TIMING.stagger,
      withSpring(1, SPRINGS.responsive),
    );
  }, []);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryProgress.value,
    transform: [{ translateY: (1 - entryProgress.value) * 16 }],
  }));

  return (
    <Pressable onPress={onPress} {...pressHandlers}>
      <Animated.View style={[cardStyles.wrapper, pressStyle, entryStyle]}>
        {/* Shadow layer — not clipped by overflow:hidden */}
        <View style={cardStyles.shadowLayer} />
        {/* Card content */}
        <View style={cardStyles.card}>
          <Text style={cardStyles.icon}>{guide.icon}</Text>
          <Text style={cardStyles.title} numberOfLines={1}>
            {guide.title}
          </Text>
          <Text style={cardStyles.preview} numberOfLines={1}>
            {guide.preview}
          </Text>
          <View style={cardStyles.footer}>
            <View style={cardStyles.categoryPill}>
              <Text style={cardStyles.categoryText}>
                {guide.category.toUpperCase()}
              </Text>
            </View>
            <Text style={cardStyles.readTime}>
              {guide.readTimeMinutes} min read
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ============================================
// GuideBottomSheet — Drag-to-dismiss sheet
// ============================================

export function GuideBottomSheet({
  guide,
  visible,
  onClose,
}: {
  guide: ParkGuide | null;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { openPOI } = usePOIAction();
  const tabBar = useTabBar();
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const sheetTop = insets.top + 16;
  const sheetHeight = SCREEN_HEIGHT - sheetTop;

  // Animate in/out when visible changes
  useEffect(() => {
    if (visible && guide) {
      setMounted(true);
      tabBar?.hideTabBar();
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else if (!visible) {
      tabBar?.showTabBar();
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible, guide]);

  // Dismiss — animate out, then notify parent
  const dismiss = useCallback(() => {
    tabBar?.showTabBar();
    translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [onClose, sheetHeight, tabBar]);

  // Pan gesture on the drag handle
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      translateY.value = Math.max(0, e.translationY);
      backdropOpacity.value = interpolate(
        translateY.value,
        [0, sheetHeight * 0.4],
        [1, 0],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((e) => {
      'worklet';
      if (
        translateY.value > sheetHeight * 0.25 ||
        e.velocityY > DISMISS_VELOCITY
      ) {
        // Dismiss — show tab bar immediately
        if (tabBar?.showTabBar) runOnJS(tabBar.showTabBar)();
        translateY.value = withTiming(sheetHeight, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
      } else {
        // Snap back
        translateY.value = withSpring(0, SPRINGS.responsive);
        backdropOpacity.value = withSpring(1);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted || !guide) return null;

  return (
    <View style={overlayStyles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          sheetStyles.container,
          { top: sheetTop, height: sheetHeight },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={sheetStyles.handleArea}>
            <View style={sheetStyles.handle} />
          </Animated.View>
        </GestureDetector>

        {/* Close button — outside gesture detector to avoid conflicts */}
        <Pressable onPress={dismiss} style={sheetStyles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.text.primary} />
        </Pressable>

        {/* Guide header */}
        <View style={sheetStyles.header}>
          <Text style={sheetStyles.headerIcon}>{guide.icon}</Text>
          <Text style={sheetStyles.headerTitle}>{guide.title}</Text>
          <View style={sheetStyles.metaRow}>
            <View style={sheetStyles.categoryPill}>
              <Text style={sheetStyles.categoryText}>
                {guide.category.toUpperCase()}
              </Text>
            </View>
            <Text style={sheetStyles.readTime}>
              {guide.readTimeMinutes} min read
            </Text>
          </View>
        </View>

        {/* Scrollable body */}
        <ScrollView
          style={sheetStyles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            sheetStyles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
        >
          <LinkedText text={guide.content} onPOIPress={openPOI} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ============================================
// ParkGuidesSection
// ============================================

interface ParkGuidesSectionProps {
  guides: ParkGuide[];
  onGuidePress: (guide: ParkGuide) => void;
}

export function ParkGuidesSection({ guides, onGuidePress }: ParkGuidesSectionProps) {
  return (
    <View>
      <View style={sectionStyles.header}>
        <Text style={sectionStyles.heading}>Park Guides</Text>
        <View style={sectionStyles.countBadge}>
          <Text style={sectionStyles.countText}>{guides.length}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        snapToInterval={CARD_WIDTH + spacing.base}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sectionStyles.scrollContent}
      >
        {guides.map((guide, index) => (
          <GuideCard
            key={guide.id}
            guide={guide}
            index={index}
            onPress={() => onGuidePress(guide)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================
// Styles — Section
// ============================================

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.base,
  },
  heading: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  countBadge: {
    marginLeft: spacing.md,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});

// ============================================
// Styles — Card
// ============================================

const cardStyles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: spacing.base,
  },
  shadowLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    ...shadows.small,
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  preview: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  readTime: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
});

// ============================================
// Styles — Overlay
// ============================================

const overlayStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 150,
  },
});

// ============================================
// Styles — Bottom sheet
// ============================================

const sheetStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...shadows.modal,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
  },
  headerIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryPill: {
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.md,
  },
  categoryText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
    letterSpacing: 0.5,
  },
  readTime: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  body: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
});
