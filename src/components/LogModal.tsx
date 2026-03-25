import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
} from 'react-native';
import { GlassHeader } from './GlassHeader';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  interpolate as reanimatedInterpolate,
  Extrapolation,
  withTiming,
} from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { haptics } from '../services/haptics';

import { SearchCarousel } from './SearchCarousel';
import { SimpleSearchRow } from './SearchResultRow';
import {
  NEARBY_RIDES,
  searchItems,
  SearchableItem,
  TRENDING_COASTERS,
  TrendingCoaster,
  getRidesForPark,
  ALL_SEARCHABLE_ITEMS,
} from '../data/mockSearchData';
import { CARD_ART } from '../data/cardArt';
import { useNavigation } from '@react-navigation/native';
import { addQuickLog, getUnratedCoasters, getAllLogs, subscribe as subscribeToStore } from '../stores/rideLogStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LogModalProps {
  visible: boolean;
  onClose: () => void;
  // New props for embedded mode (hero morph from HomeScreen)
  morphProgress?: SharedValue<number>;
  isEmbedded?: boolean;
  // Split rendering (pill = input, sections float separately)
  inputOnly?: boolean;
  sectionsOnly?: boolean;
  // Focus mode props
  onInputFocus?: () => void;
  onQueryChange?: (query: string) => void;
  // Card selection
  onCardSelect?: (item: SearchableItem, cardLayout: { x: number; y: number; width: number; height: number }) => void;
  // Focus input (for sectionsOnly mode to focus the input in inputOnly mode)
  onFocusInput?: () => void;
  // External ref for the input (allows parent to focus it)
  externalInputRef?: React.RefObject<TextInput | null>;
  // Synced query from parent (keeps inputOnly + sectionsOnly in sync)
  externalQuery?: string;
}

export const LogModal: React.FC<LogModalProps> = ({
  visible,
  onClose,
  morphProgress: externalMorphProgress,
  isEmbedded = false,
  inputOnly = false,
  sectionsOnly = false,
  onInputFocus,
  onQueryChange,
  onCardSelect,
  onFocusInput,
  externalInputRef,
  externalQuery,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRatings, setPendingRatings] = useState<SearchableItem[]>([]);
  const [hasAnyLogs, setHasAnyLogs] = useState(false);
  const [lastParkName, setLastParkName] = useState<string>('');
  const [mostRiddenCoasters, setMostRiddenCoasters] = useState<SearchableItem[]>([]);
  const inputRef = useRef<TextInput>(null);

  // Sync internal query with external query (keeps inputOnly + sectionsOnly in sync)
  useEffect(() => {
    if (externalQuery !== undefined && externalQuery !== searchQuery) {
      setSearchQuery(externalQuery);
    }
  }, [externalQuery]);

  // Subscribe to store changes to get pending ratings, last park, and most ridden
  useEffect(() => {
    const updateLogData = () => {
      const unratedCoasters = getUnratedCoasters();
      const allLogs = getAllLogs();

      // Track if user has any logs at all
      setHasAnyLogs(allLogs.length > 0);

      // 1. Pending Ratings - coasters with logs but no rating
      const pendingItems: SearchableItem[] = unratedCoasters.slice(0, 5).map((c) => ({
        id: c.coasterId,
        name: c.coasterName,
        image: ALL_SEARCHABLE_ITEMS.find(r => r.id === c.coasterId)?.image ||
               'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400',
        type: 'ride' as const,
        subtitle: c.parkName,
      }));

      setPendingRatings(pendingItems);

      // 2. Last Park Name - from most recent log
      if (allLogs.length > 0) {
        // Sort by timestamp descending to get most recent
        const sortedLogs = [...allLogs].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLastParkName(sortedLogs[0].parkName);
      } else {
        // No logs — don't show park-specific section
        setLastParkName(null);
      }

      // 3. Most Ridden - aggregate by coaster and sum ride counts
      const rideCountMap = new Map<string, { count: number; name: string; park: string }>();
      allLogs.forEach(log => {
        const existing = rideCountMap.get(log.coasterId);
        if (existing) {
          existing.count += log.rideCount;
        } else {
          rideCountMap.set(log.coasterId, {
            count: log.rideCount,
            name: log.coasterName,
            park: log.parkName,
          });
        }
      });

      // Sort by count and take top 5
      const sortedRides = Array.from(rideCountMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

      const mostRidden: SearchableItem[] = sortedRides.map(([coasterId, data]) => ({
        id: coasterId,
        name: data.name,
        image: ALL_SEARCHABLE_ITEMS.find(r => r.id === coasterId)?.image ||
               'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400',
        type: 'ride' as const,
        subtitle: data.park,
      }));
      setMostRiddenCoasters(mostRidden);
    };

    updateLogData();
    const unsubscribe = subscribeToStore(updateLogData);
    return unsubscribe;
  }, []);

  // Get rides for the last visited park
  const lastParkRides = useMemo(() => {
    if (!lastParkName) return NEARBY_RIDES;
    return getRidesForPark(lastParkName);
  }, [lastParkName]);

  // Autocomplete vs discovery content
  // In sectionsOnly mode, use externalQuery directly (avoids useEffect sync delay
  // that can cause the crossfade detection to miss the transition by one frame)
  const effectiveQuery = (sectionsOnly && externalQuery !== undefined) ? externalQuery : searchQuery;
  const showAutocomplete = effectiveQuery.length > 0;
  const autocompleteResults = useMemo(() => {
    if (!effectiveQuery.trim()) return [];
    return searchItems(effectiveQuery).filter(item => item.type === 'ride');
  }, [effectiveQuery]);

  // Crossfade: cache last results + fade out overlay when query clears
  const cachedResultsRef = useRef<SearchableItem[]>([]);
  const [fadingOut, setFadingOut] = useState(false);
  const autocompleteFade = useSharedValue(1);
  const autocompleteFadeStyle = useAnimatedStyle(() => ({
    opacity: autocompleteFade.value,
  }));

  // Keep cached results up to date while searching
  if (autocompleteResults.length > 0) {
    cachedResultsRef.current = autocompleteResults;
  }

  // Detect autocomplete → discovery transition
  // Uses render-time ref to keep overlay alive (prevents one-frame unmount blink)
  // then useEffect to start the actual fade animation
  const prevShowAutocomplete = useRef(showAutocomplete);
  const justTransitioned = useRef(false);

  // Synchronous check: if showAutocomplete just went false, mark overlay to stay alive
  // This prevents the gap between "showAutocomplete = false" and "fadingOut = true"
  if (prevShowAutocomplete.current && !showAutocomplete && !fadingOut && cachedResultsRef.current.length > 0) {
    justTransitioned.current = true;
  }

  useEffect(() => {
    const wasVisible = prevShowAutocomplete.current;
    prevShowAutocomplete.current = showAutocomplete;

    if (wasVisible && !showAutocomplete && cachedResultsRef.current.length > 0) {
      // Query just cleared — start fade out of cached results
      setFadingOut(true);
      justTransitioned.current = false;
      autocompleteFade.value = 1;
      autocompleteFade.value = withTiming(0, { duration: 800 });

      // Clean up after animation completes
      const timer = setTimeout(() => {
        setFadingOut(false);
        cachedResultsRef.current = [];
      }, 850);
      return () => clearTimeout(timer);
    }

    // Cancel fade if user started typing again while fade was running
    if (showAutocomplete && fadingOut) {
      setFadingOut(false);
      autocompleteFade.value = 1;
    }

    justTransitioned.current = false;
  }, [showAutocomplete]);

  // Staggered Cascade Animation (same as SearchModal) - now supports 4 sections
  // Uses Reanimated useAnimatedStyle for UI-thread driven animations
  const fallbackProgress = useSharedValue(1);
  const morphProg = externalMorphProgress ?? fallbackProgress;

  const staggerDelay = 0.06;
  const animationDuration = 0.30;
  const baseStart = 0.50;

  const section0Style = useAnimatedStyle(() => {
    const start = baseStart + (0 * staggerDelay);
    const end = Math.min(start + animationDuration, 1);
    return {
      opacity: reanimatedInterpolate(morphProg.value, [0, start, end, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
      transform: [{ translateY: reanimatedInterpolate(morphProg.value, [0, start, end, 1], [30, 30, 0, 0], Extrapolation.CLAMP) }],
    };
  });

  const section1Style = useAnimatedStyle(() => {
    const start = baseStart + (1 * staggerDelay);
    const end = Math.min(start + animationDuration, 1);
    return {
      opacity: reanimatedInterpolate(morphProg.value, [0, start, end, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
      transform: [{ translateY: reanimatedInterpolate(morphProg.value, [0, start, end, 1], [38, 38, 0, 0], Extrapolation.CLAMP) }],
    };
  });

  const section2Style = useAnimatedStyle(() => {
    const start = baseStart + (2 * staggerDelay);
    const end = Math.min(start + animationDuration, 1);
    return {
      opacity: reanimatedInterpolate(morphProg.value, [0, start, end, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
      transform: [{ translateY: reanimatedInterpolate(morphProg.value, [0, start, end, 1], [46, 46, 0, 0], Extrapolation.CLAMP) }],
    };
  });

  const section3Style = useAnimatedStyle(() => {
    const start = baseStart + (3 * staggerDelay);
    const end = Math.min(start + animationDuration, 1);
    return {
      opacity: reanimatedInterpolate(morphProg.value, [0, start, end, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
      transform: [{ translateY: reanimatedInterpolate(morphProg.value, [0, start, end, 1], [54, 54, 0, 0], Extrapolation.CLAMP) }],
    };
  });

  const sectionAnimatedStyles = [section0Style, section1Style, section2Style, section3Style];

  // Handle pending rating tap — trigger rating flow via onCardSelect
  const handlePendingRatingPress = useCallback((item: SearchableItem) => {
    haptics.tap();

    const cardLayout = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      width: 120,
      height: 120,
    };

    onCardSelect?.(item, cardLayout);
  }, [onCardSelect]);

  // Handle "Rate All" — close modal and navigate to RateRides screen
  const handleRateAll = useCallback(() => {
    if (pendingRatings.length === 0) return;
    haptics.select();
    onClose();
    setTimeout(() => {
      navigation.navigate('RateRides');
    }, 150);
  }, [pendingRatings, onClose, navigation]);

  // Handle trending coaster tap - open confirmation card
  const handleTrendingPress = useCallback((coaster: TrendingCoaster) => {
    // Convert trending coaster to SearchableItem for the confirmation card
    const item: SearchableItem = {
      id: `trending-${coaster.rank}`,
      name: coaster.name,
      image: coaster.image,
      type: 'ride',
      subtitle: coaster.park,
    };

    const cardLayout = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      width: 120,
      height: 120,
    };

    haptics.select();
    onCardSelect?.(item, cardLayout);
  }, [onCardSelect]);

  // Reset search query when becoming visible
  useEffect(() => {
    if (visible && isEmbedded) {
      setSearchQuery('');
      onQueryChange?.('');
    }
  }, [visible, isEmbedded, onQueryChange]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  // Handle card press - measure position and trigger confirmation
  const handleCardPress = useCallback((item: SearchableItem, event?: any) => {
    // Get approximate card position (will be refined with actual measurement)
    const cardLayout = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      width: 120,
      height: 120,
    };

    haptics.select();
    onCardSelect?.(item, cardLayout);
  }, [onCardSelect]);

  // Handle dropdown item press
  const handleDropdownItemPress = useCallback((item: SearchableItem) => {
    Keyboard.dismiss();
    const cardLayout = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      width: 120,
      height: 120,
    };

    haptics.select();
    onCardSelect?.(item, cardLayout);
  }, [onCardSelect]);

  if (!visible) return null;

  // EMBEDDED MODE: Split rendering for hero morph
  if (isEmbedded) {
    // INPUT ONLY MODE: Just the TextInput for inside the morphing pill
    if (inputOnly) {
      const handleTextChange = (text: string) => {
        setSearchQuery(text);
        onQueryChange?.(text);
      };

      // Use external ref if provided, otherwise use internal ref
      const textInputRef = externalInputRef || inputRef;

      return (
        <View style={styles.inputOnlyContainer}>
          <TextInput
            ref={textInputRef}
            style={styles.inputOnlyStyle}
            placeholder="Find a coaster to log..."
            placeholderTextColor={colors.text.meta}
            value={searchQuery}
            onChangeText={handleTextChange}
            onFocus={onInputFocus}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      );
    }

    // SECTIONS ONLY MODE: Floating section cards on blur backdrop
    if (sectionsOnly) {
      const searchBarPadding = 60 + 56 + 16;

      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sectionsOnlyContainer}
        >
          <ScrollView
            style={styles.embeddedContent}
            contentContainerStyle={[styles.contentContainer, { paddingTop: searchBarPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Wrapper for discovery + autocomplete overlay */}
            <View style={{ position: 'relative' }}>

            {/* Discovery sections — always rendered underneath */}
            <View pointerEvents={showAutocomplete ? 'none' : 'auto'}>
              <>
                {/* Section 1: Status Card - Always visible, three states */}
                <Animated.View
                  style={[
                    styles.section,
                    sectionAnimatedStyles[0],
                  ]}
                >
                  {/* State 1: Empty - No logs at all */}
                  {!hasAnyLogs && (
                    <View style={styles.emptyStateContainer}>
                      <View style={styles.emptyStateIcon}>
                        <Ionicons name="add-circle-outline" size={32} color={colors.accent.primary} />
                      </View>
                      <Text style={styles.emptyStateTitle}>No coasters logged yet</Text>
                      <Text style={styles.emptyStateSubtitle}>Start tracking your ride credits!</Text>
                      <Pressable
                        style={styles.emptyStateCTA}
                        onPress={() => {
                          haptics.tap();
                          onFocusInput?.();
                        }}
                      >
                        <Text style={styles.emptyStateCTAText}>Add your first ride</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.text.inverse} />
                      </Pressable>
                    </View>
                  )}

                  {/* State 2: Complete - Has logs but all rated */}
                  {hasAnyLogs && pendingRatings.length === 0 && (
                    <View style={styles.completeStateContainer}>
                      <View style={styles.completeStateIcon}>
                        <Ionicons name="checkmark-circle" size={32} color={colors.status.successSoft} />
                      </View>
                      <Text style={styles.completeStateTitle}>All caught up!</Text>
                      <Text style={styles.completeStateSubtitle}>Your rides are fully rated</Text>
                    </View>
                  )}

                  {/* State 3: Pending - Has unrated rides */}
                  {hasAnyLogs && pendingRatings.length > 0 && (
                    <>
                      {/* Amber Summary Banner */}
                      <Pressable
                        style={styles.pendingBanner}
                        onPress={handleRateAll}
                      >
                        <View style={styles.pendingBannerContent}>
                          <Ionicons name="star" size={18} color={colors.status.warning} />
                          <Text style={styles.pendingBannerText}>
                            {pendingRatings.length} {pendingRatings.length === 1 ? 'ride' : 'rides'} awaiting your rating
                          </Text>
                        </View>
                        <View style={styles.pendingBannerCTA}>
                          <Text style={styles.pendingBannerCTAText}>Rate All</Text>
                          <Ionicons name="chevron-forward" size={16} color={colors.status.warning} />
                        </View>
                      </Pressable>

                      {/* Ride List */}
                      <View>
                        {pendingRatings.map((item, index) => (
                          <SimpleSearchRow
                            key={`pending-${item.id}-${index}`}
                            text={item.subtitle ? `${item.name} • ${item.subtitle}` : item.name}
                            icon="time-outline"
                            onPress={() => handlePendingRatingPress(item)}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </Animated.View>
                <View style={styles.frostedGap} />

                {/* Section 2: More from [Last Park] - adapts to last logged park */}
                <Animated.View
                  style={[
                    styles.section,
                    sectionAnimatedStyles[1],
                  ]}
                >
                  <SearchCarousel
                    title={lastParkName ? `More from ${lastParkName}` : 'Nearby Rides'}
                    items={lastParkRides}
                    onItemPress={handleCardPress}
                  />
                </Animated.View>
                <View style={styles.frostedGap} />

                {/* Section 3: Your Most Ridden - frequently re-ridden coasters */}
                {mostRiddenCoasters.length > 0 ? (
                  <>
                    <Animated.View
                      style={[
                        styles.section,
                        sectionAnimatedStyles[pendingRatings.length > 0 ? 2 : 1],
                      ]}
                    >
                      <SearchCarousel
                        title="Your Most Ridden"
                        items={mostRiddenCoasters}
                        onItemPress={handleCardPress}
                      />
                    </Animated.View>
                    <View style={styles.frostedGap} />
                  </>
                ) : (
                  // Mock favorites when no logs exist
                  <>
                    <Animated.View
                      style={[
                        styles.section,
                        sectionAnimatedStyles[pendingRatings.length > 0 ? 2 : 1],
                      ]}
                    >
                      <SearchCarousel
                        title="Popular Favorites"
                        items={NEARBY_RIDES.slice(0, 5)}
                        onItemPress={handleCardPress}
                      />
                    </Animated.View>
                    <View style={styles.frostedGap} />
                  </>
                )}

                {/* Section 4: Trending - global leaderboard */}
                <Animated.View
                  style={[
                    styles.section,
                    sectionAnimatedStyles[pendingRatings.length > 0 ? 3 : 2],
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending This Week</Text>
                  </View>
                  <View>
                    {TRENDING_COASTERS.map((coaster) => (
                      <Pressable
                        key={`trending-${coaster.rank}`}
                        onPress={() => handleTrendingPress(coaster)}
                        style={({ pressed }) => [
                          styles.trendingRow,
                          pressed && styles.rowPressed,
                        ]}
                      >
                        <View style={styles.trendingRank}>
                          <Text style={styles.trendingRankText}>{coaster.rank}</Text>
                        </View>
                        <View style={styles.trendingInfo}>
                          <Text style={styles.trendingName} numberOfLines={1}>{coaster.name}</Text>
                          <Text style={styles.trendingPark} numberOfLines={1}>{coaster.park}</Text>
                        </View>
                        <View style={styles.trendingCount}>
                          <Text style={styles.trendingCountText}>{coaster.logCount}</Text>
                          <Text style={styles.trendingCountLabel}>logs</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              </>
            </View>

            {/* Autocomplete overlay — fades out when query clears, using cached results */}
            {/* justTransitioned keeps overlay alive for the one frame between showAutocomplete=false and fadingOut=true */}
            {(showAutocomplete || fadingOut || justTransitioned.current) && (
              <Animated.View
                style={[
                  { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
                  (fadingOut || justTransitioned.current) ? autocompleteFadeStyle : undefined,
                ]}
                pointerEvents={(fadingOut || justTransitioned.current) ? 'none' : 'auto'}
              >
                <View style={styles.section}>
                  {(showAutocomplete ? autocompleteResults : cachedResultsRef.current).length > 0 ? (
                    (showAutocomplete ? autocompleteResults : cachedResultsRef.current).map(item => (
                      <Pressable
                        key={item.id}
                        onPress={() => handleDropdownItemPress(item)}
                        style={({ pressed }) => [
                          styles.autocompleteRow,
                          pressed && styles.rowPressed,
                        ]}
                      >
                        {CARD_ART[item.id] ? (
                          <Image
                            source={CARD_ART[item.id]}
                            style={styles.autocompleteImage}
                          />
                        ) : (
                          <View style={[styles.autocompleteImage, styles.autocompletePlaceholder]}>
                            <Ionicons
                              name={item.type === 'ride' ? 'flash' : 'location'}
                              size={16}
                              color={colors.text.meta}
                            />
                          </View>
                        )}
                        <View style={styles.autocompleteTextContainer}>
                          <Text style={styles.autocompleteTitle} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.autocompleteSubtitle} numberOfLines={1}>
                            {item.subtitle}
                          </Text>
                        </View>
                        <Ionicons name="add-circle" size={24} color={colors.accent.primary} />
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.noResults}>
                      <Text style={styles.noResultsText}>No coasters found</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            </View>{/* end relative wrapper */}

            {/* Bottom padding for keyboard */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Fog — real GlassHeader component */}
          <GlassHeader headerHeight={50} fadeDistance={60} zIndex={40} />
        </KeyboardAvoidingView>
      );
    }

    // FULL EMBEDDED MODE (legacy)
    return null;
  }

  // STANDALONE MODE: Not supported
  return null;
};

const styles = StyleSheet.create({
  inputOnlyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputOnlyStyle: {
    flex: 1,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  sectionsOnlyContainer: {
    flex: 1,
  },
  embeddedContent: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.md,
  },
  section: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    ...shadows.section,
  },
  frostedGap: {
    height: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  // Pending Ratings Banner styles
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.banner.warningBg,
    borderWidth: 1,
    borderColor: colors.banner.warningBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg - 2,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  pendingBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingBannerText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.banner.warningText,
    marginLeft: spacing.md,
  },
  pendingBannerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBannerCTAText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.status.warning,
    marginRight: 2,
  },
  // Row press state
  rowPressed: {
    backgroundColor: colors.interactive.pressed,
  },
  // Empty State styles
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  emptyStateCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.modal,
    gap: spacing.md,
  },
  emptyStateCTAText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  // Complete State styles
  completeStateContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  completeStateIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  completeStateTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  completeStateSubtitle: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: typography.sizes.input,
    color: colors.text.secondary,
  },
  // Autocomplete row styles
  autocompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.interactive.separator,
  },
  autocompleteImage: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.background.imagePlaceholder,
  },
  autocompletePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  autocompleteTextContainer: {
    flex: 1,
    marginLeft: spacing.base,
  },
  autocompleteTitle: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  autocompleteSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  // Trending row styles
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.interactive.separator,
  },
  trendingRank: {
    width: 28,
    height: 28,
    borderRadius: radius.trendingRank,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  trendingRankText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingName: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  trendingPark: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  trendingCount: {
    alignItems: 'flex-end',
  },
  trendingCountText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  trendingCountLabel: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
});

