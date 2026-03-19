/**
 * SavedArticlesScreen
 *
 * Condensed list of bookmarked articles. Each row shows a small thumbnail,
 * title (1 line), source + timestamp, and an unsave button. Tapping a row
 * opens the ArticleSheet. Staggered fade-in entrance via Reanimated.
 *
 * Unsave flow: tap bookmark -> confirmation sheet with countdown -> animated row removal.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ListRenderItemInfo,
  Dimensions,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { TIMING, SPRINGS } from '../constants/animations';
import { useSpringPress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';
import { useSavedArticlesStore, toggleSave } from '../stores/savedArticlesStore';
import { NewsItem } from '../data/mockNews';
import { ArticleSheet } from '../components/ArticleSheet';
import { FogHeader } from '../components/FogHeader';
import { EmptyState } from '../components/EmptyState';

const HEADER_HEIGHT = 52;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_DISMISS_OFFSET = 400;

// ============================================
// Animated Row Wrapper (handles removal animation)
// ============================================

const AnimatedRowWrapper = React.memo(({
  isRemoving,
  onRemovalComplete,
  children,
}: {
  isRemoving: boolean;
  onRemovalComplete: () => void;
  children: React.ReactNode;
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const height = useSharedValue<number | undefined>(undefined);
  const measuredHeight = useRef(0);

  const handleLayout = useCallback((e: any) => {
    measuredHeight.current = e.nativeEvent.layout.height;
  }, []);

  useEffect(() => {
    if (isRemoving) {
      scale.value = withTiming(0.8, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      // Set to measured height first, then animate to 0
      height.value = measuredHeight.current;
      height.value = withDelay(
        100,
        withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onRemovalComplete)();
        }),
      );
    }
  }, [isRemoving]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    ...(height.value !== undefined ? { height: height.value, overflow: 'hidden' as const } : {}),
  }));

  return (
    <Animated.View style={animStyle} onLayout={handleLayout}>
      {children}
    </Animated.View>
  );
});

// ============================================
// UnsaveConfirmationSheet
// ============================================

interface UnsaveConfirmationSheetProps {
  article: NewsItem | null;
  visible: boolean;
  onCancel: () => void;
  onConfirmRemove: () => void;
}

const UnsaveConfirmationSheet = React.memo<UnsaveConfirmationSheetProps>(({
  article,
  visible,
  onCancel,
  onConfirmRemove,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_DISMISS_OFFSET);
  const backdropOpacity = useSharedValue(0);
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoRemovedRef = useRef(false);

  // Entrance / exit animation
  useEffect(() => {
    if (visible && article) {
      hasAutoRemovedRef.current = false;
      setCountdown(5);
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });

      // Start countdown
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            countdownRef.current = null;
            if (!hasAutoRemovedRef.current) {
              hasAutoRemovedRef.current = true;
              // Use setTimeout to avoid state update during render
              setTimeout(() => onConfirmRemove(), 0);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [visible, article]);

  const animateOut = useCallback((cb: () => void) => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 });
    backdropOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) runOnJS(cb)();
    });
  }, [translateY, backdropOpacity]);

  const handleCancel = useCallback(() => {
    haptics.tap();
    animateOut(onCancel);
  }, [animateOut, onCancel]);

  const handleRemoveNow = useCallback(() => {
    haptics.select();
    hasAutoRemovedRef.current = true;
    animateOut(onConfirmRemove);
  }, [animateOut, onConfirmRemove]);

  const handleBackdropPress = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible && !article) return null;

  return (
    <View style={sheetStyles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
          />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[
        sheetStyles.sheet,
        { paddingBottom: insets.bottom + spacing.lg },
        sheetStyle,
      ]}>
        {/* Handle */}
        <View style={sheetStyles.handleRow}>
          <View style={sheetStyles.handle} />
        </View>

        {/* Title */}
        <Text style={sheetStyles.title}>Remove from saved?</Text>
        <Text style={sheetStyles.subtitle}>You can save it again from the feed</Text>

        {/* Countdown */}
        <Text style={sheetStyles.countdown}>
          Auto-removing in {countdown}s
        </Text>

        {/* Buttons */}
        <View style={sheetStyles.buttonRow}>
          <Pressable style={sheetStyles.cancelButton} onPress={handleCancel}>
            <Text style={sheetStyles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={sheetStyles.removeButton} onPress={handleRemoveNow}>
            <Text style={sheetStyles.removeText}>Remove Now</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
});

const sheetStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    paddingHorizontal: spacing.lg,
    ...shadows.modal,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.base,
    paddingBottom: spacing.lg,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.border.subtle,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  countdown: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  removeButton: {
    flex: 1,
    height: 52,
    borderRadius: radius.button,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: '#DC2626',
  },
});

// ============================================
// LongPressActionSheet
// ============================================

interface LongPressActionSheetProps {
  article: NewsItem | null;
  visible: boolean;
  onClose: () => void;
  onRemove: (article: NewsItem) => void;
}

const LongPressActionSheet = React.memo<LongPressActionSheetProps>(({
  article,
  visible,
  onClose,
  onRemove,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_DISMISS_OFFSET);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && article) {
      translateY.value = withSpring(0, SPRINGS.responsive);
      backdropOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [visible, article]);

  const dismiss = useCallback((callback?: () => void) => {
    translateY.value = withTiming(SHEET_DISMISS_OFFSET, { duration: 250 }, (finished) => {
      if (finished) {
        if (callback) {
          runOnJS(callback)();
        } else {
          runOnJS(onClose)();
        }
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }, [onClose, translateY, backdropOpacity]);

  const handleRemove = useCallback(() => {
    if (!article) return;
    haptics.tap();
    dismiss(() => onRemove(article));
  }, [article, dismiss, onRemove]);

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

  const handleBackdropPress = useCallback(() => {
    haptics.tap();
    dismiss();
  }, [dismiss]);

  const lpSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const lpBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!article) return null;

  return (
    <View style={longPressStyles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, lpBackdropStyle]}>
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
          />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          longPressStyles.sheet,
          { paddingBottom: insets.bottom + spacing.xl },
          lpSheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={longPressStyles.handleRow}>
          <View style={longPressStyles.handle} />
        </View>

        {/* Header */}
        <View style={longPressStyles.header}>
          <Text style={longPressStyles.title} numberOfLines={2}>
            {article.title}
          </Text>
          <View style={longPressStyles.meta}>
            <View style={longPressStyles.sourceBadge}>
              <View style={longPressStyles.sourceDot} />
              <Text style={longPressStyles.sourceText}>{article.source}</Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={longPressStyles.divider} />

        {/* Actions */}
        <View style={longPressStyles.actions}>
          {/* Remove from Saved — PRIMARY */}
          <Pressable
            onPress={handleRemove}
            style={({ pressed }) => [
              longPressStyles.actionRow,
              longPressStyles.actionPrimary,
              pressed && longPressStyles.actionPrimaryPressed,
            ]}
          >
            <View style={longPressStyles.actionIconWrap}>
              <Ionicons name="trash-outline" size={18} color={colors.text.inverse} />
            </View>
            <Text style={longPressStyles.actionPrimaryText}>Remove from Saved</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.text.inverse}
              style={longPressStyles.chevron}
            />
          </Pressable>

          {/* Share Article — SECONDARY */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              longPressStyles.actionRow,
              longPressStyles.actionSecondary,
              pressed && longPressStyles.actionSecondaryPressed,
            ]}
          >
            <View style={[longPressStyles.actionIconWrap, longPressStyles.actionIconSecondary]}>
              <Ionicons name="share-outline" size={18} color={colors.accent.primary} />
            </View>
            <Text style={longPressStyles.actionSecondaryText}>Share Article</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.text.meta}
              style={longPressStyles.chevron}
            />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
});

const longPressStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    paddingHorizontal: spacing.lg,
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
});

// ============================================
// Row sub-component
// ============================================

interface SavedArticleRowProps {
  item: NewsItem;
  index: number;
  isRemoving: boolean;
  onPress: (item: NewsItem) => void;
  onLongPress: (item: NewsItem) => void;
  onUnsave: (item: NewsItem) => void;
  onRemovalComplete: () => void;
}

const SavedArticleRow = React.memo<SavedArticleRowProps>(({ item, index, isRemoving, onPress, onLongPress, onUnsave, onRemovalComplete }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.98 });

  // Staggered entrance
  const rowOpacity = useSharedValue(0);
  const rowTranslateY = useSharedValue(12);

  useEffect(() => {
    const delay = index * TIMING.stagger;
    rowOpacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    rowTranslateY.value = withDelay(delay, withTiming(0, { duration: TIMING.normal }));
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: rowOpacity.value,
    transform: [{ translateY: rowTranslateY.value }],
  }));

  // Unsave button scale animation
  const unsaveScale = useSharedValue(1);
  const unsaveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: unsaveScale.value }],
  }));

  const handleUnsave = useCallback(() => {
    haptics.select();
    unsaveScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );
    onUnsave(item);
  }, [item, onUnsave, unsaveScale]);

  const handlePress = useCallback(() => {
    haptics.tap();
    onPress(item);
  }, [item, onPress]);

  const handleLongPress = useCallback(() => {
    haptics.select();
    onLongPress(item);
  }, [item, onLongPress]);

  return (
    <AnimatedRowWrapper isRemoving={isRemoving} onRemovalComplete={onRemovalComplete}>
      <Animated.View style={[entranceStyle]}>
        <Animated.View style={animatedStyle}>
          <Pressable
            style={styles.row}
            onPress={handlePress}
            onLongPress={handleLongPress}
            delayLongPress={300}
            onPressIn={pressHandlers.onPressIn}
            onPressOut={pressHandlers.onPressOut}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.thumbnail}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.source}  ·  {item.timestamp}
              </Text>
            </View>
            <Pressable
              style={styles.unsaveButton}
              onPress={(e) => {
                e.stopPropagation();
                handleUnsave();
              }}
              hitSlop={8}
            >
              <Animated.View style={unsaveAnimStyle}>
                <Ionicons name="bookmark" size={20} color={colors.accent.primary} />
              </Animated.View>
            </Pressable>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </AnimatedRowWrapper>
  );
});

// ============================================
// SavedArticlesScreen
// ============================================

export const SavedArticlesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { getSavedArticles } = useSavedArticlesStore();
  const savedArticles = getSavedArticles();

  // Article sheet state
  const [articleSheetVisible, setArticleSheetVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  // Unsave confirmation state
  const [unsaveTarget, setUnsaveTarget] = useState<NewsItem | null>(null);
  const [unsaveSheetVisible, setUnsaveSheetVisible] = useState(false);
  const [removingRowId, setRemovingRowId] = useState<string | null>(null);

  // Long-press action sheet state
  const [longPressArticle, setLongPressArticle] = useState<NewsItem | null>(null);
  const [longPressSheetVisible, setLongPressSheetVisible] = useState(false);

  // Empty state fade-out animation
  const emptyOpacity = useSharedValue(savedArticles.length === 0 ? 1 : 0);
  const emptyScale = useSharedValue(savedArticles.length === 0 ? 1 : 0.95);
  const prevCountRef = useRef(savedArticles.length);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    prevCountRef.current = savedArticles.length;

    if (prevCount === 0 && savedArticles.length > 0) {
      // Transitioning from empty to having items — fade out empty state
      emptyOpacity.value = withTiming(0, { duration: 200 });
      emptyScale.value = withTiming(0.95, { duration: 200 });
    } else if (savedArticles.length === 0 && prevCount > 0) {
      // Transitioning from having items to empty — fade in empty state
      emptyOpacity.value = withTiming(1, { duration: 300 });
      emptyScale.value = withTiming(1, { duration: 300 });
    }
  }, [savedArticles.length]);

  const emptyAnimStyle = useAnimatedStyle(() => ({
    opacity: emptyOpacity.value,
    transform: [{ scale: emptyScale.value }],
  }));

  const handleArticlePress = useCallback((item: NewsItem) => {
    setSelectedArticle(item);
    setArticleSheetVisible(true);
  }, []);

  const handleLongPress = useCallback((item: NewsItem) => {
    setLongPressArticle(item);
    setLongPressSheetVisible(true);
  }, []);

  const handleLongPressClose = useCallback(() => {
    setLongPressSheetVisible(false);
    setTimeout(() => setLongPressArticle(null), 300);
  }, []);

  const handleLongPressRemove = useCallback((article: NewsItem) => {
    // Trigger the unsave confirmation flow
    setUnsaveTarget(article);
    setUnsaveSheetVisible(true);
  }, []);

  const handleUnsave = useCallback((item: NewsItem) => {
    setUnsaveTarget(item);
    setUnsaveSheetVisible(true);
  }, []);

  const handleUnsaveCancel = useCallback(() => {
    setUnsaveSheetVisible(false);
    setTimeout(() => setUnsaveTarget(null), 300);
  }, []);

  const handleUnsaveConfirm = useCallback(() => {
    setUnsaveSheetVisible(false);
    if (unsaveTarget) {
      // Start row removal animation
      setRemovingRowId(unsaveTarget.id);
    }
  }, [unsaveTarget]);

  const handleRowRemovalComplete = useCallback(() => {
    if (removingRowId) {
      toggleSave(removingRowId);
      setRemovingRowId(null);
      setUnsaveTarget(null);
    }
  }, [removingRowId]);

  const handleBack = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  const backPress = useSpringPress();

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<NewsItem>) => (
    <SavedArticleRow
      item={item}
      index={index}
      isRemoving={removingRowId === item.id}
      onPress={handleArticlePress}
      onLongPress={handleLongPress}
      onUnsave={handleUnsave}
      onRemovalComplete={handleRowRemovalComplete}
    />
  ), [handleArticlePress, handleLongPress, handleUnsave, removingRowId, handleRowRemovalComplete]);

  const keyExtractor = useCallback((item: NewsItem) => item.id, []);

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Content */}
      {savedArticles.length === 0 ? (
        <Animated.View style={[styles.emptyState, { paddingTop: headerTotalHeight }, emptyAnimStyle]}>
          <EmptyState
            icon="bookmark-outline"
            title="No saved articles yet"
            subtitle="Tap the bookmark icon on any article to save it here for easy access later"
            ctaLabel="Browse Articles"
            ctaIcon="newspaper-outline"
            onCtaPress={handleBack}
          />
        </Animated.View>
      ) : (
        <FlatList
          data={savedArticles}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerTotalHeight + spacing.base, paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — floats above fog */}
      <View style={[styles.header, { top: insets.top }]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={handleBack}
        >
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Saved Articles</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Article Sheet */}
      <ArticleSheet
        article={selectedArticle}
        visible={articleSheetVisible}
        onClose={() => {
          setArticleSheetVisible(false);
          setTimeout(() => setSelectedArticle(null), 400);
        }}
      />

      {/* Long-Press Action Sheet */}
      {(longPressSheetVisible || longPressArticle) && (
        <LongPressActionSheet
          article={longPressArticle}
          visible={longPressSheetVisible}
          onClose={handleLongPressClose}
          onRemove={handleLongPressRemove}
        />
      )}

      {/* Unsave Confirmation Sheet */}
      {(unsaveSheetVisible || unsaveTarget) && (
        <UnsaveConfirmationSheet
          article={unsaveTarget}
          visible={unsaveSheetVisible}
          onCancel={handleUnsaveCancel}
          onConfirmRemove={handleUnsaveConfirm}
        />
      )}
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // Header
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: HEADER_HEIGHT,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadows.small,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  rowContent: {
    flex: 1,
    marginLeft: spacing.base,
    marginRight: spacing.md,
  },
  rowTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  rowMeta: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
  unsaveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Separator
  separator: {
    height: spacing.md,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: 60, // Compensate for header height to visually center
  },
  emptyGroup: {
    alignItems: 'center',
    marginTop: -spacing.xxxl, // Shift slightly above mathematical center
  },
  emptyTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
});

export default SavedArticlesScreen;
