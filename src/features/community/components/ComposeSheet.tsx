/**
 * ComposeSheet — Bottom sheet for post creation
 *
 * Step 1: 2×2 type selector grid
 * Step 2: Selected compose form
 * Pan-dismiss gesture, BlurView backdrop, spring entry.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { ComposeReview } from './ComposeReview';
import { ComposeTripReport } from './ComposeTripReport';
import { ComposeRankedList } from './ComposeRankedList';
import { ComposeBucketList } from './ComposeBucketList';
import type { PostType } from '../types/community';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;
const DISMISS_VELOCITY = 500;

interface ComposeSheetProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Type selector cards ────────────────────────────────────

const POST_TYPES: { type: PostType; icon: string; label: string; description: string }[] = [
  { type: 'review', icon: 'star-outline', label: 'Review', description: 'Rate and review a coaster' },
  { type: 'trip_report', icon: 'document-text-outline', label: 'Trip Report', description: 'Share your park visit' },
  { type: 'ranked_list', icon: 'list-outline', label: 'Ranked List', description: 'Top coasters list' },
  { type: 'bucket_list', icon: 'checkbox-outline', label: 'Bucket List', description: 'Must-ride checklist' },
];

function TypeCard({ type, icon, label, description, onPress }: {
  type: PostType;
  icon: string;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.typeCard} onPress={onPress}>
      <View style={styles.typeIconCircle}>
        <Ionicons name={icon as any} size={24} color={colors.accent.primary} />
      </View>
      <Text style={styles.typeLabel}>{label}</Text>
      <Text style={styles.typeDesc}>{description}</Text>
    </Pressable>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function ComposeSheet({ visible, onClose }: ComposeSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setSelectedType(null);
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose]);

  const panGesture = Gesture.Pan()
    .enabled(visible)
    .activeOffsetY([-12, 12])
    .failOffsetX([-12, 12])
    .onUpdate((e) => {
      'worklet';
      translateY.value = Math.max(0, e.translationY);
      backdropOpacity.value = interpolate(
        translateY.value,
        [0, SHEET_HEIGHT * 0.4],
        [1, 0],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((e) => {
      'worklet';
      if (translateY.value > SHEET_HEIGHT * 0.25 || e.velocityY > DISMISS_VELOCITY) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
      } else {
        translateY.value = withSpring(0, SPRINGS.responsive);
        backdropOpacity.value = withTiming(1, { duration: 250 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleTypeSelect = useCallback((type: PostType) => {
    haptics.tap();
    setSelectedType(type);
  }, []);

  const handleComplete = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleBack = useCallback(() => {
    haptics.tap();
    setSelectedType(null);
  }, []);

  const stepTitle = selectedType
    ? POST_TYPES.find((t) => t.type === selectedType)?.label ?? 'New Post'
    : 'New Post';

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { height: SHEET_HEIGHT }, sheetStyle]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={SCREEN_HEIGHT - SHEET_HEIGHT}
        >
          {/* Handle */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={styles.handleRow}>
              <View style={styles.handle} />
            </Animated.View>
          </GestureDetector>

          {/* Header */}
          <View style={styles.header}>
            {selectedType ? (
              <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
              </Pressable>
            ) : (
              <View style={styles.backBtn} />
            )}
            <Text style={styles.headerTitle}>{stepTitle}</Text>
            <Pressable onPress={dismiss} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text.meta} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          {/* Content */}
          <View style={[styles.body, { paddingBottom: insets.bottom + spacing.lg }]}>
            {!selectedType ? (
              /* Step 1: Type selector */
              <View style={styles.typeGrid}>
                {POST_TYPES.map((t) => (
                  <TypeCard
                    key={t.type}
                    {...t}
                    onPress={() => handleTypeSelect(t.type)}
                  />
                ))}
              </View>
            ) : (
              /* Step 2: Compose form */
              <>
                {selectedType === 'review' && <ComposeReview onComplete={handleComplete} />}
                {selectedType === 'trip_report' && <ComposeTripReport onComplete={handleComplete} />}
                {selectedType === 'ranked_list' && <ComposeRankedList onComplete={handleComplete} />}
                {selectedType === 'bucket_list' && <ComposeBucketList onComplete={handleComplete} />}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    ...shadows.modal,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  closeBtn: {
    width: 32,
    alignItems: 'flex-end',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.lg,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  // Type selector grid
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  typeCard: {
    width: '47%',
    backgroundColor: colors.background.page,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
  },
  typeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  typeLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  typeDesc: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    textAlign: 'center',
    lineHeight: 16,
  },
});
