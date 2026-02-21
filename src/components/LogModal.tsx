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
  Alert,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  interpolate as reanimatedInterpolate,
  Extrapolation,
} from 'react-native-reanimated';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
import { addQuickLog, getPendingLogs, getAllLogs, subscribe as subscribeToStore } from '../stores/rideLogStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Module-level state for recently logged coasters
let recentlyLoggedCoasters: SearchableItem[] = [];

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
  externalInputRef?: React.RefObject<TextInput>;
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
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRatings, setPendingRatings] = useState<SearchableItem[]>([]);
  const [hasAnyLogs, setHasAnyLogs] = useState(false);
  const [lastParkName, setLastParkName] = useState<string>('');
  const [mostRiddenCoasters, setMostRiddenCoasters] = useState<SearchableItem[]>([]);
  const inputRef = useRef<TextInput>(null);
  const prevPendingCountRef = useRef(0);

  // Subscribe to store changes to get pending ratings, last park, and most ridden
  useEffect(() => {
    const updateLogData = () => {
      const pendingLogs = getPendingLogs();
      const allLogs = getAllLogs();

      // Track if user has any logs at all
      setHasAnyLogs(allLogs.length > 0);

      // 1. Pending Ratings - deduplicate by coaster ID (unique rides only)
      const seenCoasterIds = new Set<string>();
      const uniquePendingLogs = pendingLogs.filter(log => {
        if (seenCoasterIds.has(log.coasterId)) {
          return false;
        }
        seenCoasterIds.add(log.coasterId);
        return true;
      });

      const pendingItems: SearchableItem[] = uniquePendingLogs.slice(0, 5).map((log) => ({
        id: log.coasterId,
        name: log.coasterName,
        image: ALL_SEARCHABLE_ITEMS.find(r => r.id === log.coasterId)?.image ||
               'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400',
        type: 'ride' as const,
        subtitle: log.parkName,
      }));

      // Trigger LayoutAnimation when pending count changes
      if (pendingItems.length !== prevPendingCountRef.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        prevPendingCountRef.current = pendingItems.length;
      }

      setPendingRatings(pendingItems);

      // 2. Last Park Name - from most recent log
      if (allLogs.length > 0) {
        // Sort by timestamp descending to get most recent
        const sortedLogs = [...allLogs].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLastParkName(sortedLogs[0].parkName);
      } else {
        // Default to Busch Gardens Tampa for demo
        setLastParkName('Busch Gardens Tampa');
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
  const showAutocomplete = searchQuery.length > 0;
  const autocompleteResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    // Filter to only rides for logging
    return searchItems(searchQuery).filter(item => item.type === 'ride');
  }, [searchQuery]);

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

  // Handle pending rating tap - show toast since rating flow is not built yet
  const handlePendingRatingPress = useCallback((item: SearchableItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Coming Soon',
      `Rating flow for "${item.name}" is not yet available.`,
      [{ text: 'OK' }]
    );
  }, []);

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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCardSelect?.(item, cardLayout);
  }, [onCardSelect]);

  // Handle dropdown item press
  const handleDropdownItemPress = useCallback((item: SearchableItem) => {
    const cardLayout = {
      x: SCREEN_WIDTH / 2 - 60,
      y: SCREEN_HEIGHT / 2 - 60,
      width: 120,
      height: 120,
    };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
            placeholderTextColor="#999999"
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
          >
            {showAutocomplete ? (
              // Autocomplete results - render as floating card
              <View style={styles.section}>
                {autocompleteResults.length > 0 ? (
                  autocompleteResults.map(item => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleDropdownItemPress(item)}
                      style={({ pressed }) => [
                        styles.autocompleteRow,
                        pressed && { backgroundColor: 'rgba(0,0,0,0.04)' },
                      ]}
                    >
                      <Image
                        source={{ uri: item.image }}
                        style={styles.autocompleteImage}
                      />
                      <View style={styles.autocompleteTextContainer}>
                        <Text style={styles.autocompleteTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.autocompleteSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <Ionicons name="add-circle" size={24} color="#CF6769" />
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>No coasters found</Text>
                  </View>
                )}
              </View>
            ) : (
              // Discovery content - 4 floating section cards
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
                        <Ionicons name="add-circle-outline" size={32} color="#CF6769" />
                      </View>
                      <Text style={styles.emptyStateTitle}>No coasters logged yet</Text>
                      <Text style={styles.emptyStateSubtitle}>Start tracking your ride credits!</Text>
                      <Pressable
                        style={styles.emptyStateCTA}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onFocusInput?.();
                        }}
                      >
                        <Text style={styles.emptyStateCTAText}>Add your first ride</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  )}

                  {/* State 2: Complete - Has logs but all rated */}
                  {hasAnyLogs && pendingRatings.length === 0 && (
                    <View style={styles.completeStateContainer}>
                      <View style={styles.completeStateIcon}>
                        <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
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
                        onPress={() => handlePendingRatingPress(pendingRatings[0])}
                      >
                        <View style={styles.pendingBannerContent}>
                          <Ionicons name="star" size={18} color="#F9A825" />
                          <Text style={styles.pendingBannerText}>
                            {pendingRatings.length} {pendingRatings.length === 1 ? 'ride' : 'rides'} awaiting your rating
                          </Text>
                        </View>
                        <View style={styles.pendingBannerCTA}>
                          <Text style={styles.pendingBannerCTAText}>Rate All</Text>
                          <Ionicons name="chevron-forward" size={16} color="#F9A825" />
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
                          pressed && { backgroundColor: 'rgba(0,0,0,0.04)' },
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
            )}

            {/* Bottom padding for keyboard */}
            <View style={{ height: 100 }} />
          </ScrollView>
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
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  sectionsOnlyContainer: {
    flex: 1,
  },
  embeddedContent: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 8,
    paddingVertical: 16,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
  },
  frostedGap: {
    height: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  // Pending Ratings Banner styles
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  pendingBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  pendingBannerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBannerCTAText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9A825',
    marginRight: 2,
  },
  // Empty State styles
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyStateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(207, 103, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  emptyStateCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CF6769',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  emptyStateCTAText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Complete State styles
  completeStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  completeStateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completeStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  completeStateSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666666',
  },
  // Autocomplete row styles
  autocompleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  autocompleteImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  autocompleteTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  autocompleteTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  autocompleteSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  // Trending row styles
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  trendingRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CF6769',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  trendingRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendingInfo: {
    flex: 1,
  },
  trendingName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  trendingPark: {
    fontSize: 13,
    color: '#666666',
  },
  trendingCount: {
    alignItems: 'flex-end',
  },
  trendingCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#CF6769',
  },
  trendingCountLabel: {
    fontSize: 11,
    color: '#999999',
  },
});
