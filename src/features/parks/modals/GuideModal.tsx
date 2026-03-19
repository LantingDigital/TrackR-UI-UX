import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
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
import { SheetFog } from '../../../components/SheetFog';
import { ParkGuide } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

// Fixed header area: handleRow(19) + header(icon + title + meta ≈ 131)
const HEADER_AREA_HEIGHT = 150;

interface GuideModalProps {
  visible: boolean;
  guide: ParkGuide | null;
  onClose: () => void;
}

export function GuideModal({ visible, guide, onClose }: GuideModalProps) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && guide) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: TIMING.backdrop });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible, guide]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted || !guide) return null;

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

        {/* Close button */}
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.text.primary} />
        </Pressable>

        {/* Guide header */}
        <View style={styles.header}>
          <Text style={styles.icon}>{guide.icon}</Text>
          <Text style={styles.title}>{guide.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>
                {guide.category.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.readTime}>
              {guide.readTimeMinutes} min read
            </Text>
          </View>
        </View>

        {/* Fog gradient — fades content as it scrolls under the header */}
        <SheetFog headerHeight={HEADER_AREA_HEIGHT} />

        {/* Content */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.body}>{guide.content}</Text>
        </ScrollView>
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
    overflow: 'hidden',
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
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.xl,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  title: {
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
    paddingVertical: spacing.lg,
  },
  body: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
});
