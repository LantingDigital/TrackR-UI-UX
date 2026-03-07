/**
 * LogbookLogSheet — Bottom sheet for logging rides directly from the Logbook screen.
 *
 * Pattern: BlurView backdrop + Gesture.Pan drag-to-dismiss + staggered entrance.
 * Reference: CoasterSheet.tsx for bottom sheet mechanics.
 *
 * Flow:
 *  1. Search input at top to find coasters by name
 *  2. Search results as user types (from COASTER_INDEX)
 *  3. Tap a coaster -> quick log form (date, ride count, notes)
 *  4. "Log Ride" button saves via addQuickLog
 *  5. Brief success feedback, then sheet closes
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
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
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
import { addQuickLog } from '../stores/rideLogStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
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
}

type SheetPhase = 'search' | 'form' | 'success';

export function LogbookLogSheet({ visible, onClose }: LogbookLogSheetProps) {
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

  // State
  const [phase, setPhase] = useState<SheetPhase>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoaster, setSelectedCoaster] = useState<CoasterIndexEntry | null>(null);
  const [rideDate, setRideDate] = useState<string>(''); // display string
  const [rideCount, setRideCount] = useState(1);
  const [notes, setNotes] = useState('');

  // Search results
  const searchResults = useMemo(() => searchCoasters(searchQuery), [searchQuery]);

  // Form entrance animation
  const formEntrance = useSharedValue(0);

  // Success feedback animation
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);

  // ── Today's date as default ──
  const todayString = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  // ── Open / Close lifecycle ──

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setIsDismissing(false);
      setPhase('search');
      setSearchQuery('');
      setSelectedCoaster(null);
      setRideDate('');
      setRideCount(1);
      setNotes('');
      formEntrance.value = 0;
      successScale.value = 0;
      successOpacity.value = 0;

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

  const formAnimStyle = useAnimatedStyle(() => ({
    opacity: formEntrance.value,
    transform: [
      { translateY: interpolate(formEntrance.value, [0, 1], [16, 0]) },
    ],
  }));

  const successAnimStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }));

  // ── Handlers ──

  const handleCoasterSelect = useCallback((coaster: CoasterIndexEntry) => {
    haptics.select();
    Keyboard.dismiss();
    setSelectedCoaster(coaster);
    setPhase('form');
    setRideDate(todayString);
    setRideCount(1);
    setNotes('');

    // Animate form in
    formEntrance.value = 0;
    formEntrance.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
  }, [todayString, formEntrance]);

  const handleBackToSearch = useCallback(() => {
    haptics.tap();
    setPhase('search');
    setSelectedCoaster(null);
    formEntrance.value = 0;
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [formEntrance]);

  const handleIncrementCount = useCallback(() => {
    haptics.tick();
    setRideCount((c) => c + 1);
  }, []);

  const handleDecrementCount = useCallback(() => {
    haptics.tick();
    setRideCount((c) => Math.max(1, c - 1));
  }, []);

  const handleLogRide = useCallback(() => {
    if (!selectedCoaster) return;

    haptics.success();

    // Log the ride(s) via the store
    for (let i = 0; i < rideCount; i++) {
      addQuickLog({
        id: selectedCoaster.id,
        name: selectedCoaster.name,
        parkName: selectedCoaster.park,
      });
    }

    // Show success feedback
    setPhase('success');
    successScale.value = withSpring(1, { damping: 18, stiffness: 200, mass: 0.8 });
    successOpacity.value = withTiming(1, { duration: 200 });

    // Auto-dismiss after a brief pause
    setTimeout(() => {
      dismiss();
    }, 900);
  }, [selectedCoaster, rideCount, dismiss, successScale, successOpacity]);

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
          {/* ── Search Phase ── */}
          {phase === 'search' && (
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

                {searchResults.map((coaster, index) => (
                  <Pressable
                    key={coaster.id}
                    onPress={() => handleCoasterSelect(coaster)}
                    style={({ pressed }) => [
                      styles.resultRow,
                      pressed && styles.resultRowPressed,
                    ]}
                  >
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
          )}

          {/* ── Form Phase ── */}
          {phase === 'form' && selectedCoaster && (
            <Animated.View style={[styles.phaseContainer, formAnimStyle]}>
              {/* Back button + title */}
              <View style={styles.formHeader}>
                <Pressable onPress={handleBackToSearch} style={styles.backButton} hitSlop={8}>
                  <Ionicons name="chevron-back" size={22} color={colors.accent.primary} />
                </Pressable>
                <Text style={styles.sheetTitle}>Log Ride</Text>
                <View style={styles.backButtonSpacer} />
              </View>

              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Selected coaster card */}
                <View style={styles.selectedCard}>
                  <View style={styles.selectedIconCircle}>
                    <Ionicons name="train-outline" size={20} color={colors.accent.primary} />
                  </View>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName} numberOfLines={1}>
                      {selectedCoaster.name}
                    </Text>
                    <Text style={styles.selectedPark} numberOfLines={1}>
                      {selectedCoaster.park}
                    </Text>
                  </View>
                </View>

                {/* Date field */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <View style={styles.fieldValueRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.fieldValueText}>{rideDate || todayString}</Text>
                  </View>
                </View>

                {/* Ride count */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Rides</Text>
                  <View style={styles.counterRow}>
                    <Pressable
                      onPress={handleDecrementCount}
                      style={[
                        styles.counterButton,
                        rideCount <= 1 && styles.counterButtonDisabled,
                      ]}
                      disabled={rideCount <= 1}
                    >
                      <Ionicons
                        name="remove"
                        size={20}
                        color={rideCount <= 1 ? colors.text.meta : colors.accent.primary}
                      />
                    </Pressable>
                    <Text style={styles.counterValue}>{rideCount}</Text>
                    <Pressable onPress={handleIncrementCount} style={styles.counterButton}>
                      <Ionicons name="add" size={20} color={colors.accent.primary} />
                    </Pressable>
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Notes (optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Front row, great night ride..."
                    placeholderTextColor={colors.text.meta}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>

                {/* Log button */}
                <Pressable
                  onPress={handleLogRide}
                  style={({ pressed }) => [
                    styles.logButton,
                    pressed && styles.logButtonPressed,
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
                  <Text style={styles.logButtonText}>
                    Log {rideCount > 1 ? `${rideCount} Rides` : 'Ride'}
                  </Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          )}

          {/* ── Success Phase ── */}
          {phase === 'success' && (
            <Animated.View style={[styles.successContainer, successAnimStyle]}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={40} color={colors.status.successSoft} />
              </View>
              <Text style={styles.successText}>Ride Logged!</Text>
              {selectedCoaster && (
                <Text style={styles.successSubtext}>{selectedCoaster.name}</Text>
              )}
            </Animated.View>
          )}
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
  resultInfo: {
    flex: 1,
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

  // ── Form ──
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  backButtonSpacer: {
    width: 32 + spacing.md,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingBottom: spacing.xxxl * 2,
  },

  // ── Selected coaster card ──
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    ...shadows.small,
  },
  selectedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  selectedPark: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },

  // ── Form fields ──
  formField: {
    marginBottom: spacing.xl,
  },
  fieldLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    gap: spacing.md,
    ...shadows.small,
  },
  fieldValueText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },

  // ── Counter ──
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    ...shadows.small,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonDisabled: {
    opacity: 0.4,
  },
  counterValue: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    minWidth: 40,
    textAlign: 'center',
  },

  // ── Notes ──
  notesInput: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    minHeight: 80,
    ...shadows.small,
  },

  // ── Log button ──
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    marginTop: spacing.base,
    ...shadows.card,
    shadowColor: colors.accent.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  logButtonPressed: {
    backgroundColor: colors.interactive.pressedAccentDark,
  },
  logButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },

  // ── Success ──
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxxl * 3,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successText: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  successSubtext: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },
});
