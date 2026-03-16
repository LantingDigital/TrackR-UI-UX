/**
 * LogbookLogSheet — Search-only bottom sheet for finding coasters.
 *
 * After a coaster is selected, delegates to the parent (LogbookScreen)
 * which opens LogConfirmSheet for the unified logging experience.
 *
 * Pattern: BlurView backdrop + Gesture.Pan drag-to-dismiss + staggered entrance.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
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
import { COASTER_INDEX, type CoasterIndexEntry } from '../data/coasterIndex';
import { CARD_ART } from '../data/cardArt';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_VELOCITY = 500;
const MAX_SEARCH_RESULTS = 20;

// ============================================
// Search helper — searches COASTER_INDEX directly
// ============================================

function searchCoasters(query: string): CoasterIndexEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  const prefixMatches: CoasterIndexEntry[] = [];
  const substringMatches: CoasterIndexEntry[] = [];

  for (const coaster of COASTER_INDEX) {
    const nameLower = coaster.name.toLowerCase();
    if (nameLower.startsWith(q)) {
      prefixMatches.push(coaster);
    } else if (
      nameLower.includes(q) ||
      coaster.park.toLowerCase().includes(q)
    ) {
      substringMatches.push(coaster);
    }
    // Early exit once we have enough
    if (prefixMatches.length + substringMatches.length >= MAX_SEARCH_RESULTS) break;
  }

  return [...prefixMatches, ...substringMatches].slice(0, MAX_SEARCH_RESULTS);
}

// ============================================
// LogbookLogSheet
// ============================================

interface LogbookLogSheetProps {
  visible: boolean;
  onClose: () => void;
  onCoasterSelect?: (coaster: CoasterIndexEntry) => void;
}

export function LogbookLogSheet({ visible, onClose, onCoasterSelect }: LogbookLogSheetProps) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const inputRef = useRef<TextInput>(null);
  const [mounted, setMounted] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  // Sheet animation values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const entrance = useSharedValue(0);

  const sheetTop = insets.top + 16;
  const sheetHeight = SCREEN_HEIGHT - sheetTop;

  // State — search only (confirmation handled by parent via LogConfirmSheet)
  const [searchQuery, setSearchQuery] = useState('');

  // Search results
  const searchResults = useMemo(() => searchCoasters(searchQuery), [searchQuery]);

  // ── Open / Close lifecycle ──

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setIsDismissing(false);
      setSearchQuery('');

      tabBar?.hideTabBar();
      haptics.select();

      entrance.value = 0;
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 300 });
      entrance.value = withTiming(1, { duration: 400 });

      // Auto-focus search input after entrance
      setTimeout(() => inputRef.current?.focus(), 400);
    } else if (!visible) {
      if (!isDismissing) {
        tabBar?.showTabBar();
      }
      entrance.value = 0;
      backdropOpacity.value = withTiming(0, { duration: TIMING.backdrop });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: TIMING.normal });
      const timer = setTimeout(() => setMounted(false), TIMING.backdrop);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Keyboard.dismiss();
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

  // ── Gesture: drag-to-dismiss ──

  const panGesture = Gesture.Pan()
    .enabled(visible)
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

  // ── Animated styles ──

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const searchEntranceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.3], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(entrance.value, [0, 0.3], [12, 0], Extrapolation.CLAMP) },
    ],
  }));

  // ── Handlers ──

  const handleCoasterSelect = useCallback((coaster: CoasterIndexEntry) => {
    haptics.select();
    Keyboard.dismiss();
    // Dismiss the search sheet and delegate to parent's LogConfirmSheet
    setIsDismissing(true);
    tabBar?.showTabBar();
    translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
        runOnJS(onCoasterSelect!)(coaster);
      }
    });
    backdropOpacity.value = withTiming(0, { duration: 250 });
  }, [onClose, onCoasterSelect, sheetHeight, tabBar]);

  // ── Render ──

  if (!mounted) return null;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Blur backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropAnimStyle]}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
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
          onPress={() => { haptics.tap(); dismiss(); }}
          style={styles.closeBtn}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={sheetTop}
        >
          <Animated.View style={[styles.phaseContainer, searchEntranceStyle]}>
            {/* Title */}
            <Text style={styles.sheetTitle}>Log a Ride</Text>

            {/* Search input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.text.meta} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search coasters..."
                placeholderTextColor={colors.text.meta}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  haptics.tick();
                }}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => {
                    haptics.tap();
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color={colors.text.meta} />
                </Pressable>
              )}
            </View>

            {/* Results */}
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {searchQuery.length > 0 && searchResults.length === 0 && (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={32} color={colors.text.meta} />
                  <Text style={styles.noResultsText}>No coasters found</Text>
                </View>
              )}

              {searchQuery.length === 0 && (
                <View style={styles.searchHint}>
                  <Ionicons name="trail-sign-outline" size={32} color={colors.text.meta} />
                  <Text style={styles.searchHintText}>
                    Search for a coaster to log your ride
                  </Text>
                </View>
              )}

              {searchResults.map((coaster) => (
                <Pressable
                  key={coaster.id}
                  onPress={() => handleCoasterSelect(coaster)}
                  style={({ pressed }) => [
                    styles.resultRow,
                    pressed && styles.resultRowPressed,
                  ]}
                >
                  {CARD_ART[coaster.id] ? (
                    <Image
                      source={CARD_ART[coaster.id]}
                      style={styles.resultArt}
                    />
                  ) : (
                    <View style={[styles.resultArt, styles.resultArtPlaceholder]}>
                      <Ionicons name="flash" size={16} color={colors.text.meta} />
                    </View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {coaster.name}
                    </Text>
                    <Text style={styles.resultPark} numberOfLines={1}>
                      {coaster.park}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={colors.accent.primary} />
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
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
    backgroundColor: colors.background.page,
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
    top: spacing.base,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...shadows.small,
  },
  keyboardAvoid: {
    flex: 1,
  },

  // ── Phase container ──
  phaseContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  // ── Title ──
  sheetTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },

  // ── Search bar ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: radius.searchBar,
    paddingHorizontal: spacing.lg,
    height: 48,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
    paddingVertical: 0,
  },

  // ── Search results ──
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: spacing.xxxl,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.interactive.separator,
  },
  resultRowPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  resultArt: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.background.imagePlaceholder,
  },
  resultArtPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    marginLeft: spacing.base,
    marginRight: spacing.base,
  },
  resultName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  resultPark: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  noResultsText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
    marginTop: spacing.base,
  },
  searchHint: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  searchHintText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
    marginTop: spacing.base,
    textAlign: 'center',
    maxWidth: 240,
  },

});
