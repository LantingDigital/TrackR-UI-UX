import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
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
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useTabBar } from '../contexts/TabBarContext';
import { haptics } from '../services/haptics';
import { NewsItem } from '../data/mockNews';
import { isSaved, toggleSave } from '../stores/savedArticlesStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;
const IMAGE_HEIGHT = 200;

// ============================================
// ArticleSheet
// ============================================

interface ArticleSheetProps {
  article: NewsItem | null;
  visible: boolean;
  onClose: () => void;
}

export function ArticleSheet({ article, visible, onClose }: ArticleSheetProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const scrollRef = useRef<ScrollView>(null);
  const [mounted, setMounted] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const [canInteract, setCanInteract] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const openLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageOpacity = useSharedValue(0);
  const imageFadeStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const entrance = useSharedValue(0);

  const sheetTop = insets.top + 16;
  const sheetHeight = SCREEN_HEIGHT - sheetTop;

  // ── Open / close effect ──
  useEffect(() => {
    if (visible && article) {
      setMounted(true);
      setIsDismissing(false);
      setCanInteract(false);
      setImageError(false);
      setImageLoaded(false);
      imageOpacity.value = 0;
      tabBar?.hideTabBar();
      haptics.select();
      entrance.value = 0;
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 300 });
      entrance.value = withTiming(1, { duration: 400 });
      // Unlock interaction after open animation completes
      if (openLockTimer.current) clearTimeout(openLockTimer.current);
      openLockTimer.current = setTimeout(() => setCanInteract(true), 450);
    } else if (!visible) {
      setCanInteract(false);
      if (openLockTimer.current) { clearTimeout(openLockTimer.current); openLockTimer.current = null; }
      if (!isDismissing) {
        tabBar?.showTabBar();
      }
      entrance.value = 0;
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible, article]);

  // ── Dismiss ──
  const dismiss = useCallback(() => {
    setIsDismissing(true);
    tabBar?.showTabBar();
    entrance.value = 0;
    translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [onClose, sheetHeight, tabBar]);

  const showTabBarJS = useCallback(() => {
    setIsDismissing(true);
    tabBar?.showTabBar();
  }, [tabBar]);

  // ── Pan gesture ──
  const panGesture = Gesture.Pan()
    .enabled(visible && canInteract)
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
        runOnJS(showTabBarJS)();
        translateY.value = withTiming(sheetHeight, { duration: 250 }, (finished) => {
          if (finished) runOnJS(onClose)();
        });
        backdropOpacity.value = withTiming(0, { duration: 250 });
      } else {
        translateY.value = withSpring(0, SPRINGS.responsive);
        backdropOpacity.value = withSpring(1);
      }
    });

  // ── Staggered entrance styles ──

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.15], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0, 0.15], [12, 0], Extrapolation.CLAMP) }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.05, 0.25], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.05, 0.25], [16, 0], Extrapolation.CLAMP) }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0.15, 0.35], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(entrance.value, [0.15, 0.35], [16, 0], Extrapolation.CLAMP) }],
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Bookmark state + animation
  const bookmarkScale = useSharedValue(1);
  const bookmarkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bookmarkScale.value }],
  }));
  const articleSaved = article ? isSaved(article.id) : false;

  const handleBookmark = useCallback(() => {
    if (!article) return;
    haptics.select();
    bookmarkScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );
    toggleSave(article.id);
  }, [article, bookmarkScale]);

  if (!mounted || !article) return null;

  // Build meta line: "Source · 2h ago · 4 min read"
  const metaParts: string[] = [article.source];
  if (article.timestamp) metaParts.push(article.timestamp);
  if (article.readTimeMinutes) metaParts.push(`${article.readTimeMinutes} min read`);
  const metaLine = metaParts.join(' \u00B7 ');

  const hasImage = article.image && !imageError;

  // Split content into paragraphs for proper spacing
  const paragraphs = article.content
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={canInteract ? dismiss : undefined} />
        </BlurView>
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.container,
          { top: sheetTop, height: sheetHeight },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={styles.handleArea}>
            <View style={styles.handle} />
          </Animated.View>
        </GestureDetector>

        {/* Close button */}
        <Pressable
          onPress={canInteract ? () => { haptics.tap(); dismiss(); } : undefined}
          style={styles.closeBtn}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>

        {/* Scrollable content */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header: meta line + title + author */}
          <Animated.View style={headerStyle}>
            <Text style={styles.metaLine}>{metaLine}</Text>
            <Text style={styles.articleTitle}>{article.title}</Text>
            {article.author && (
              <Text style={styles.authorLine}>by {article.author}</Text>
            )}
          </Animated.View>

          {/* Hero image */}
          {hasImage && (
            <Animated.View style={[styles.imageSection, imageStyle]}>
              <View style={styles.imageCard}>
                {!imageLoaded && (
                  <View style={styles.imageSpinner}>
                    <ActivityIndicator size="small" color={colors.text.meta} />
                  </View>
                )}
                <Animated.View style={[imageFadeStyle, { height: IMAGE_HEIGHT, overflow: 'hidden' }]}>
                  <Image
                    source={{ uri: article.image }}
                    style={styles.heroImage}
                    resizeMode="cover"
                    onLoad={() => {
                      setImageLoaded(true);
                      imageOpacity.value = withTiming(1, { duration: 300 });
                    }}
                    onError={() => setImageError(true)}
                  />
                </Animated.View>
              </View>
            </Animated.View>
          )}

          {/* Article body */}
          <Animated.View style={[styles.bodySection, bodyStyle]}>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} style={styles.bodyText}>
                {paragraph}
              </Text>
            ))}
          </Animated.View>

          {/* Bottom safe area padding */}
          <View style={{ height: insets.bottom + spacing.xxxl + 60 }} />
        </ScrollView>

        {/* Floating bookmark button */}
        <Animated.View style={[styles.fabContainer, { bottom: insets.bottom + spacing.lg }]}>
          <Pressable
            onPress={handleBookmark}
            style={styles.fab}
          >
            <Animated.View style={bookmarkAnimStyle}>
              <Ionicons
                name={articleSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={articleSaved ? colors.accent.primary : colors.text.primary}
              />
            </Animated.View>
          </Pressable>
        </Animated.View>
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
    zIndex: 300,
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal,
    borderTopRightRadius: radius.modal,
    overflow: 'hidden',
    ...shadows.modal,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: spacing.xl,
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
    top: spacing.base,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: radius.closeButton,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.small,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },

  // -- Header --
  metaLine: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginBottom: spacing.md,
  },
  articleTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  authorLine: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },

  // -- Hero Image --
  imageSection: {
    marginTop: spacing.xl,
  },
  imageCard: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.background.imagePlaceholder,
    ...shadows.small,
  },
  imageSpinner: {
    ...StyleSheet.absoluteFillObject,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },

  // -- Body --
  bodySection: {
    marginTop: spacing.xl,
  },
  bodyText: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  // -- Floating bookmark button --
  fabContainer: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 20,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.card,
  },
});
