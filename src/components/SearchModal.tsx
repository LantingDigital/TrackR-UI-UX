import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Easing,
  LayoutAnimation,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SearchCarousel } from './SearchCarousel';
import { SearchResultRow, SimpleSearchRow } from './SearchResultRow';
import {
  NEARBY_RIDES,
  NEARBY_PARKS,
  RECENT_SEARCHES,
  TRENDING_SEARCHES,
  searchItems,
  SearchableItem,
} from '../data/mockSearchData';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Module-level state to persist cleared status across component re-mounts
// Resets only when app is restarted (hot reload also resets it)
let persistedRecentSearches: string[] | null = null;
let persistedWasCleared = false;

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  onResultPress?: (item: SearchableItem) => void;
  searchBarLayout?: { x: number; y: number; width: number; height: number };
  // New props for embedded mode (hero morph from HomeScreen)
  morphProgress?: Animated.Value;
  contentOpacity?: Animated.AnimatedInterpolation<number>;
  contentTranslateY?: Animated.AnimatedInterpolation<number>;
  isEmbedded?: boolean;
  // New props for split rendering (pill = input, sections float separately)
  inputOnly?: boolean;    // Only render the search input (for inside the morphing pill)
  sectionsOnly?: boolean; // Only render section cards (for floating on blur backdrop)
  // Sticky search bar props
  onScrollPositionChange?: (scrollY: number, topOverscroll: number, bottomOverscroll: number) => void; // Reports scroll position and overscroll to parent
  isSticky?: boolean;     // Whether the search bar is in sticky mode (affects close button)
  showCloseButton?: boolean; // Whether to show close/clear button inside input
  // Focus mode props
  onInputFocus?: () => void; // Called when search input is focused
  onQueryChange?: (query: string) => void; // Called when search query changes (for dropdown autocomplete)
}

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  onClose,
  onSearch,
  onResultPress,
  searchBarLayout,
  morphProgress: externalMorphProgress,
  contentOpacity: externalContentOpacity,
  contentTranslateY: externalContentTranslateY,
  isEmbedded = false,
  inputOnly = false,
  sectionsOnly = false,
  onScrollPositionChange,
  isSticky = false,
  showCloseButton = false,
  onInputFocus,
  onQueryChange,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  // Initialize from persisted state (survives component re-mounts until app restart)
  const [recentSearches, setRecentSearches] = useState<string[]>(
    persistedRecentSearches !== null ? persistedRecentSearches : RECENT_SEARCHES
  );
  const [wasRecentCleared, setWasRecentCleared] = useState(persistedWasCleared);
  const [isAnimatingClear, setIsAnimatingClear] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animated values for reverse cascade deletion (one per row, max 5)
  const recentRowAnimations = useRef<Animated.Value[]>([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  // Animated value for placeholder fade-in (after LayoutAnimation handles card resize)
  // Initialize to 1 if already cleared (so placeholder shows immediately on re-mount)
  const placeholderOpacity = useRef(new Animated.Value(persistedWasCleared ? 1 : 0)).current;

  // Autocomplete vs discovery content
  const showAutocomplete = searchQuery.length > 0;
  const autocompleteResults = searchItems(searchQuery);

  // =============================================
  // Staggered Cascade Animation ("Projector Screen")
  // Each section card animates in with a delay, creating
  // a cascading "pull down" effect like a projector screen
  // Using useMemo to create STABLE interpolation objects (fixes flickering)
  // =============================================
  const sectionAnimations = useMemo(() => {
    if (!externalMorphProgress) {
      // Return static values when no animation
      return [0, 1, 2, 3].map(() => ({ opacity: 1, translateY: 0 }));
    }

    // Stagger timing: each section starts 0.08 later in the animation progress
    const staggerDelay = 0.08;
    const animationDuration = 0.35;
    const baseStart = 0.50;

    return [0, 1, 2, 3].map((sectionIndex) => {
      const sectionStart = baseStart + (sectionIndex * staggerDelay);
      const sectionEnd = Math.min(sectionStart + animationDuration, 1);

      const opacity = externalMorphProgress.interpolate({
        inputRange: [0, sectionStart, sectionEnd, 1],
        outputRange: [0, 0, 1, 1],
        extrapolate: 'clamp',
      });

      const translateY = externalMorphProgress.interpolate({
        inputRange: [0, sectionStart, sectionEnd, 1],
        outputRange: [30 + (sectionIndex * 10), 30 + (sectionIndex * 10), 0, 0],
        extrapolate: 'clamp',
      });

      return { opacity, translateY };
    });
  }, [externalMorphProgress]);

  // Reset search query when becoming visible (embedded mode)
  // Note: We no longer auto-focus the input - user must tap to enter focus mode
  useEffect(() => {
    if (visible && isEmbedded) {
      setSearchQuery('');
      onQueryChange?.(''); // Reset parent's query state too
    }
  }, [visible, isEmbedded, onQueryChange]);

  // Simple close handler - NO animation logic, just calls parent's onClose
  // HomeScreen handles all animation orchestration
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 10);
        return updated;
      });
      onSearch?.(searchQuery);
      handleClose();
    }
  }, [searchQuery, onSearch, handleClose]);

  const handleRecentSearchPress = useCallback((search: string) => {
    setSearchQuery(search);
  }, []);

  const handleClearRecent = useCallback(() => {
    if (isAnimatingClear) return; // Prevent double-tap
    setIsAnimatingClear(true);

    // Get the number of visible rows (max 5)
    const visibleCount = Math.min(recentSearches.length, 5);

    // Create reverse cascade animation (bottom to top)
    // Each row animates out with staggered delay
    const rowAnimations = [];
    for (let i = visibleCount - 1; i >= 0; i--) {
      const reverseIndex = visibleCount - 1 - i; // 0 for last item, 1 for second-to-last, etc.
      rowAnimations.push(
        Animated.timing(recentRowAnimations[i], {
          toValue: 0,
          duration: 200,
          delay: reverseIndex * 50, // Stagger from bottom to top
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );
    }

    // Animation sequence:
    // 1. Rows cascade out (reverse stagger)
    // 2. LayoutAnimation handles card resize, then placeholder fades in
    Animated.parallel(rowAnimations).start(() => {
      // After rows animate out, use LayoutAnimation for smooth card resize
      LayoutAnimation.configureNext({
        duration: 300,
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.scaleY,
        },
      });

      // Update state FIRST - this removes rows from DOM before we reset animations
      setRecentSearches([]);
      setWasRecentCleared(true);
      setIsAnimatingClear(false);

      // Persist to module-level state (survives re-mounts until app restart)
      persistedRecentSearches = [];
      persistedWasCleared = true;

      // Reset row animation values AFTER state clears (rows are gone, no blink)
      setTimeout(() => {
        recentRowAnimations.forEach(anim => anim.setValue(1));
      }, 0);

      // Fade in placeholder after a brief delay for layout to settle
      placeholderOpacity.setValue(0);
      Animated.timing(placeholderOpacity, {
        toValue: 1,
        duration: 250,
        delay: 100, // Small delay to let layout animation start
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [isAnimatingClear, recentSearches.length, recentRowAnimations, placeholderOpacity]);

  const handleResultPress = useCallback((item: SearchableItem) => {
    onResultPress?.(item);
    handleClose();
  }, [onResultPress, handleClose]);

  // Carousel card tap shows toast instead of navigating
  const handleCarouselCardPress = useCallback((item: SearchableItem) => {
    Alert.alert('Coming Soon', `${item.name} details page is coming soon!`);
  }, []);

  // Handle scroll position changes for sticky search bar and rubber band bounce
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const maxScrollY = Math.max(0, contentHeight - layoutHeight);

    // Top overscroll (scrollY < 0) - negative value when pulling down past top
    const topOverscroll = scrollY < 0 ? scrollY : 0;

    // Bottom overscroll (scrollY > maxScrollY) - positive value when pushing past bottom
    const bottomOverscroll = scrollY > maxScrollY ? scrollY - maxScrollY : 0;

    onScrollPositionChange?.(scrollY, topOverscroll, bottomOverscroll);
  }, [onScrollPositionChange]);

  // Handle close/clear button press (clears text first, then closes if empty)
  const handleCloseOrClear = useCallback(() => {
    if (searchQuery.length > 0) {
      setSearchQuery('');
    } else {
      onClose();
    }
  }, [searchQuery, onClose]);

  if (!visible) return null;

  // =============================================
  // EMBEDDED MODE: Split rendering for hero morph
  // inputOnly: Just the TextInput (inside morphing pill)
  // sectionsOnly: Just the section cards (floating on blur)
  // =============================================
  if (isEmbedded) {
    // INPUT ONLY MODE: Just render the TextInput for inside the morphing pill
    if (inputOnly) {
      const handleTextChange = (text: string) => {
        setSearchQuery(text);
        onQueryChange?.(text);
      };

      return (
        <View style={styles.inputOnlyContainer}>
          <TextInput
            ref={inputRef}
            style={styles.inputOnlyStyle}
            placeholder="Search rides, parks, news..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={handleTextChange}
            onSubmitEditing={handleSearch}
            onFocus={onInputFocus}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      );
    }

    // SECTIONS ONLY MODE: Just the floating section cards (on blur backdrop)
    // Content scrolls UNDER the floating search bar, so we need top padding
    if (sectionsOnly) {
      // Top padding: search bar position (60) + height (56) + gap (16) = 132
      // This ensures content starts below the search bar
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {showAutocomplete ? (
              // Autocomplete results - render as floating card
              <View style={styles.section}>
                {autocompleteResults.length > 0 ? (
                  autocompleteResults.map(item => (
                    <SearchResultRow
                      key={item.id}
                      item={item}
                      onPress={() => handleResultPress(item)}
                    />
                  ))
                ) : (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>No results found</Text>
                  </View>
                )}
              </View>
            ) : (
              // Discovery content - floating section cards with staggered cascade animation
              <>
                {/* Recent Searches - Section 0 */}
                {/* Show section if there are searches OR if user cleared them (to show placeholder) */}
                {(recentSearches.length > 0 || wasRecentCleared) && (
                  <>
                    <Animated.View
                      style={[
                        styles.section,
                        {
                          opacity: sectionAnimations[0].opacity,
                          transform: [{ translateY: sectionAnimations[0].translateY }],
                        },
                      ]}
                    >
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Searches</Text>
                        {recentSearches.length > 0 && (
                          <Pressable onPress={handleClearRecent} disabled={isAnimatingClear}>
                            <Text style={[styles.clearButton, isAnimatingClear && { opacity: 0.5 }]}>Clear All</Text>
                          </Pressable>
                        )}
                      </View>

                      {/* Show recent searches with reverse cascade animation */}
                      {/* Rows only render when there are searches (LayoutAnimation handles resize) */}
                      {recentSearches.length > 0 && (
                        <View>
                          {recentSearches.slice(0, 5).map((search, index) => (
                            <Animated.View
                              key={`recent-${index}`}
                              style={{
                                opacity: recentRowAnimations[index],
                                transform: [{
                                  translateX: recentRowAnimations[index].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0], // Slide out to the right
                                  }),
                                }],
                              }}
                            >
                              <SimpleSearchRow
                                text={search}
                                icon="time-outline"
                                onPress={() => handleRecentSearchPress(search)}
                              />
                            </Animated.View>
                          ))}
                        </View>
                      )}

                      {/* Placeholder - only renders after clear is complete, fades in */}
                      {wasRecentCleared && recentSearches.length === 0 && (
                        <Animated.View style={[styles.emptyRecentContainer, { opacity: placeholderOpacity }]}>
                          <Text style={styles.emptyRecentText}>No recent searches</Text>
                        </Animated.View>
                      )}
                    </Animated.View>
                    <View style={styles.frostedGap} />
                  </>
                )}

                {/* Nearby Rides Carousel - Section 1 (or 0 if no recent searches) */}
                <Animated.View
                  style={[
                    styles.section,
                    {
                      opacity: sectionAnimations[recentSearches.length > 0 ? 1 : 0].opacity,
                      transform: [{ translateY: sectionAnimations[recentSearches.length > 0 ? 1 : 0].translateY }],
                    },
                  ]}
                >
                  <SearchCarousel
                    title="Nearby Rides"
                    items={NEARBY_RIDES}
                    onItemPress={handleCarouselCardPress}
                  />
                </Animated.View>
                <View style={styles.frostedGap} />

                {/* Nearby Parks Carousel - Section 2 (or 1 if no recent searches) */}
                <Animated.View
                  style={[
                    styles.section,
                    {
                      opacity: sectionAnimations[recentSearches.length > 0 ? 2 : 1].opacity,
                      transform: [{ translateY: sectionAnimations[recentSearches.length > 0 ? 2 : 1].translateY }],
                    },
                  ]}
                >
                  <SearchCarousel
                    title="Nearby Parks"
                    items={NEARBY_PARKS}
                    onItemPress={handleCarouselCardPress}
                  />
                </Animated.View>
                <View style={styles.frostedGap} />

                {/* Trending - Section 3 (or 2 if no recent searches) */}
                <Animated.View
                  style={[
                    styles.section,
                    {
                      opacity: sectionAnimations[recentSearches.length > 0 ? 3 : 2].opacity,
                      transform: [{ translateY: sectionAnimations[recentSearches.length > 0 ? 3 : 2].translateY }],
                    },
                  ]}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Trending</Text>
                  </View>
                  {TRENDING_SEARCHES.map((search, index) => (
                    <SimpleSearchRow
                      key={`trending-${index}`}
                      text={search}
                      icon="trending-up-outline"
                      onPress={() => handleRecentSearchPress(search)}
                    />
                  ))}
                </Animated.View>
              </>
            )}

            {/* Bottom padding for keyboard */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    // FULL EMBEDDED MODE (legacy): Both input and sections together
    const contentOpacityStyle = externalContentOpacity || 1;
    const contentTranslateYStyle = externalContentTranslateY || 0;
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.embeddedContainer}
      >
        {/* Search input at top */}
        <View style={styles.embeddedSearchContainer}>
          <View style={styles.embeddedSearchInput}>
            <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search rides, parks, news..."
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={20} color="#CCCCCC" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Scrollable content with slide-in animation (from HomeScreen) */}
        <Animated.ScrollView
          style={[
            styles.embeddedContent,
            {
              opacity: contentOpacityStyle,
              transform: [{ translateY: contentTranslateYStyle }],
            },
          ]}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showAutocomplete ? (
            // Autocomplete results
            <View>
              {autocompleteResults.length > 0 ? (
                autocompleteResults.map(item => (
                  <SearchResultRow
                    key={item.id}
                    item={item}
                    onPress={() => handleResultPress(item)}
                  />
                ))
              ) : (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              )}
            </View>
          ) : (
            // Discovery content
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Recent Searches</Text>
                      <Pressable onPress={handleClearRecent}>
                        <Text style={styles.clearButton}>Clear All</Text>
                      </Pressable>
                    </View>
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <SimpleSearchRow
                        key={`recent-${index}`}
                        text={search}
                        icon="time-outline"
                        onPress={() => handleRecentSearchPress(search)}
                      />
                    ))}
                  </View>
                  <View style={styles.frostedGap} />
                </>
              )}

              {/* Nearby Rides Carousel */}
              <View style={styles.section}>
                <SearchCarousel
                  title="Nearby Rides"
                  items={NEARBY_RIDES}
                  onItemPress={handleCarouselCardPress}
                />
              </View>

              <View style={styles.frostedGap} />

              {/* Nearby Parks Carousel */}
              <View style={styles.section}>
                <SearchCarousel
                  title="Nearby Parks"
                  items={NEARBY_PARKS}
                  onItemPress={handleCarouselCardPress}
                />
              </View>

              <View style={styles.frostedGap} />

              {/* Trending */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trending</Text>
                </View>
                {TRENDING_SEARCHES.map((search, index) => (
                  <SimpleSearchRow
                    key={`trending-${index}`}
                    text={search}
                    icon="trending-up-outline"
                    onPress={() => handleRecentSearchPress(search)}
                  />
                ))}
              </View>
            </>
          )}

          {/* Bottom padding for keyboard */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // =============================================
  // STANDALONE MODE: Not supported - use embedded mode
  // All animation orchestration handled by HomeScreen
  // =============================================
  return null;
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  searchCard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    zIndex: 50,
    justifyContent: 'center',
  },
  cardHeader: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 8, // Reduced from 16 for tighter layout
    paddingVertical: 16,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  clearButton: {
    fontSize: 14,
    color: '#CF6769',
    fontWeight: '500',
  },
  frostedGap: {
    height: 16,
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666666',
  },
  // Empty recent searches placeholder
  emptyRecentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#999999',
    fontWeight: '300',
  },
  // Embedded mode styles (for hero morph from HomeScreen)
  embeddedContainer: {
    flex: 1,
  },
  embeddedSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  embeddedSearchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  embeddedContent: {
    flex: 1,
  },
  // Split rendering styles (inputOnly / sectionsOnly modes)
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
  inputCloseButton: {
    marginLeft: 8,
    padding: 4,
  },
  sectionsOnlyContainer: {
    flex: 1,
  },
});
