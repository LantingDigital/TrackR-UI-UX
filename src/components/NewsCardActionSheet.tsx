/**
 * NewsCardActionSheet — Bottom sheet for news card long-press actions.
 * Mirrors CardActionSheet visual language (BlurView backdrop, spring entrance,
 * header + source badge, primary/secondary buttons).
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Share } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS } from '../constants/animations';
import { haptics } from '../services/haptics';
import { useTabBar } from '../contexts/TabBarContext';
import { toggleSave, isSaved } from '../stores/savedArticlesStore';
import { NewsItem } from '../data/mockNews';

// ============================================
// Types
// ============================================

interface NewsCardActionSheetProps {
  article: NewsItem | null;
  visible: boolean;
  onClose: () => void;
  onDismissStart?: () => void;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
}

const SHEET_DISMISS_OFFSET = 400;
const BUTTON_HEIGHT = 56;

// ============================================
// Component
// ============================================

export function NewsCardActionSheet({
  article,
  visible,
  onClose,
  onDismissStart,
  onThumbsUp,
  onThumbsDown,
}: NewsCardActionSheetProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const translateY = useSharedValue(SHEET_DISMISS_OFFSET);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && article) {
      tabBar?.hideTabBar();
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [visible, article]);

  // Safety net: always restore tab bar if component unmounts while sheet is open
  useEffect(() => {
    return () => {
      tabBar?.showTabBar();
    };
  }, [tabBar]);

  const dismiss = useCallback((callback?: () => void) => {
    // Fire immediately so the card can spring back in parallel with the sheet dismissing
    onDismissStart?.();
    // Show tab bar immediately, not after animation — prevents tab bar disappearing
    // if the component unmounts before the animation completes
    tabBar?.showTabBar();

    translateY.value = withTiming(SHEET_DISMISS_OFFSET, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
      if (finished) {
        if (callback) {
          runOnJS(callback)();
        } else {
          runOnJS(onClose)();
        }
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, onDismissStart, tabBar, translateY, backdropOpacity]);

  const handleSave = useCallback(() => {
    if (!article) return;
    haptics.tap();
    toggleSave(article.id);
    // Auto-close the sheet after toggling save
    dismiss();
  }, [article, dismiss]);

  const handleShare = useCallback(async () => {
    if (!article) return;
    haptics.tap();
    try {
      await Share.share({
        message: `Check out this article: ${article.title} — via TrackR`,
      });
    } catch {
      // User cancelled share — no action needed
    }
  }, [article]);

  const handleThumbsUp = useCallback(() => {
    if (!article) return;
    haptics.tap();
    dismiss(() => {
      onThumbsUp();
      onClose();
    });
  }, [article, dismiss, onThumbsUp, onClose]);

  const handleThumbsDown = useCallback(() => {
    if (!article) return;
    haptics.tap();
    dismiss(() => {
      onThumbsDown();
      onClose();
    });
  }, [article, dismiss, onThumbsDown, onClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!article) return null;

  const saved = isSaved(article.id);

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop — BlurView */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              haptics.tap();
              dismiss();
            }}
          />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.xl },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {article.title}
          </Text>
          <View style={styles.meta}>
            <View style={styles.sourceBadge}>
              <View style={styles.sourceDot} />
              <Text style={styles.sourceText}>{article.source}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Actions */}
        <View style={styles.actions}>
          {/* Save Article — PRIMARY */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionPrimary,
              pressed && styles.actionPrimaryPressed,
            ]}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={colors.text.inverse}
              />
            </View>
            <Text style={styles.actionPrimaryText}>
              {saved ? 'Unsave Article' : 'Save Article'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.text.inverse}
              style={styles.chevron}
            />
          </Pressable>

          {/* Share Article — SECONDARY */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.actionRow,
              styles.actionSecondary,
              pressed && styles.actionSecondaryPressed,
            ]}
          >
            <View style={[styles.actionIconWrap, styles.actionIconSecondary]}>
              <Ionicons
                name="share-outline"
                size={18}
                color={colors.accent.primary}
              />
            </View>
            <Text style={styles.actionSecondaryText}>Share Article</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.meta}
              style={styles.chevron}
            />
          </Pressable>

          {/* Divider between buttons and thumbs */}
          <View style={styles.thumbsDivider} />

          {/* Thumbs row */}
          <View style={styles.thumbsRow}>
            {/* Thumbs Up */}
            <Pressable
              onPress={handleThumbsUp}
              style={({ pressed }) => [
                styles.thumbButton,
                styles.thumbsUpButton,
                pressed && styles.thumbsUpPressed,
              ]}
            >
              <Ionicons
                name="thumbs-up-outline"
                size={20}
                color={colors.status.success}
              />
              <Text style={styles.thumbsUpText}>I like this</Text>
            </Pressable>

            {/* Thumbs Down */}
            <Pressable
              onPress={handleThumbsDown}
              style={({ pressed }) => [
                styles.thumbButton,
                styles.thumbsDownButton,
                pressed && styles.thumbsDownPressed,
              ]}
            >
              <Ionicons
                name="thumbs-down-outline"
                size={20}
                color={colors.status.error}
              />
              <Text style={styles.thumbsDownText}>Not for me</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

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
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border.subtle,
  },

  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.hero * typography.lineHeights.tight,
    marginBottom: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    backgroundColor: colors.accent.primaryLight,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
  },
  sourceText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
  },

  actions: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  chevron: {
    marginLeft: 'auto',
  },

  actionPrimary: {
    backgroundColor: colors.accent.primary,
  },
  actionPrimaryPressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
  },
  actionPrimaryText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  actionSecondary: {
    backgroundColor: colors.background.input,
  },
  actionSecondaryPressed: {
    backgroundColor: colors.border.subtle,
  },
  actionIconSecondary: {
    backgroundColor: colors.accent.primaryLight,
  },
  actionSecondaryText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  thumbsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.xs,
  },

  thumbsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumbButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: BUTTON_HEIGHT,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  thumbsUpButton: {
    backgroundColor: 'rgba(40, 167, 69, 0.08)',
  },
  thumbsUpPressed: {
    backgroundColor: 'rgba(40, 167, 69, 0.16)',
  },
  thumbsUpText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.status.success,
  },
  thumbsDownButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.08)',
  },
  thumbsDownPressed: {
    backgroundColor: 'rgba(220, 53, 69, 0.16)',
  },
  thumbsDownText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.status.error,
  },
});
