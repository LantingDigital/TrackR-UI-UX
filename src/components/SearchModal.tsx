import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Animated as RNAnimated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolate as reanimatedInterpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { SearchCarousel } from './SearchCarousel';
import { SearchResultRow, SimpleSearchRow } from './SearchResultRow';
import { RotatingPlaceholder } from './RotatingPlaceholder';
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

// Helper component for animated recent search rows (Reanimated)
const AnimatedRecentRow: React.FC<{
  search: string;
  progress: SharedValue<number>;
  onPress: () => void;
}> = ({ search, progress, onPress }) => {
  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{
      translateX: reanimatedInterpolate(progress.value, [0, 1], [50, 0]),
    }],
  }));

  return (
    <Animated.View style={animStyle}>
      <SimpleSearchRow
        text={search}
        icon="time-outline"
        onPress={onPress}
      />
    </Animated.View>
  );
};

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  onResultPress?: (item: SearchableItem) => void;
  searchBarLayout?: { x: number; y: number; width: number; height: number };
  // New props for embedded mode (hero morph from HomeScreen)
  morphProgress?: SharedValue<number>;
  contentOpacity?: RNAnimated.AnimatedInterpolation<number>;
  contentTranslateY?: RNAnimated.AnimatedInterpolation<number>;
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

  // Shared values for reverse cascade deletion (one per row, max 5)
  const rowAnim0 = useSharedValue(1);
  const rowAnim1 = useSharedValue(1);
  const rowAnim2 = useSharedValue(1);
  const rowAnim3 = useSharedValue(1);
  const rowAnim4 = useSharedValue(1);
  const recentRowAnimations = [rowAnim0, rowAnim1, rowAnim2, rowAnim3, rowAnim4];

  // Shared value for placeholder fade-in (after LayoutAnimation handles card resize)
  const placeholderOpacity = useSharedValue(persistedWasCleared ? 1 : 0);
  const placeholderAnimStyle = useAnimatedStyle(() => ({
    opacity: placeholderOpacity.value,
  }));

  // Autocomplete vs discovery content
  const showAutocomplete = searchQuery.length > 0;
  const autocompleteResults = searchItems(searchQuery);

  // =============================================
  // Staggered Cascade Animation ("Projector Screen")
  // Each section card animates in with a delay, creating
  // a cascading "pull down" effect like a projector screen
  // Uses Reanimated useAnimatedStyle for UI-thread interpolation
  // =============================================
  const defaultMorphProgress = useSharedValue(1);
  const morphProg = externalMorphProgress || defaultMorphProgress;

  // Section 0: start=0.50, end=0.85
  const sectionAnimStyle0 = useAnimatedStyle(() => ({
    opacity: reanimatedInterpolate(morphProg.value, [0, 0.50, 0.85, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
    transform: [{ translateY: reanimatedInterpolate(morphProg.value, [0, 0.50, 0.85, 1], [30, 30, 0, 0], Extrapolation.CLAMP) }],
  }));

  // Section 1: start=0.58, end=0.93
  const sectionAnimStyle1 = useAnimatedStyle(() => ({
    opacity: reanimatedInterpolate(morphProg.value, [0, 0.58, 0.93, 1], [0, 0, 1, 1], Extrapolation.CLAMP),
    transform: [{ translateY: reanimatedInterpolate(morphProg.value, [0, 0.58, 0.93, 1], [40, 40, 0, 0], Extrapolation.CLAMP) }],
  }));

  // Section 2: start=0.66, end capped at 1.0
  const sectionAnimStyle2 = useAnimatedStyle(() => ({
    opacity: reanimatedInterpolate(morphProg.value, [0, 0.66, 1], [0, 0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: reanimatedInterpolate(morphProg.value, [0, 0.66, 1], [50, 50, 0], Extrapolation.CLAMP) }],
  }));

  // Section 3: start=0.74, end capped at 1.0
  const sectionAnimStyle3 = useAnimatedStyle(() => ({
    opacity: reanimatedInterpolate(morphProg.value, [0, 0.74, 1], [0, 0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: reanimatedInterpolate(morphProg.value, [0, 0.74, 1], [60, 60, 0], Extrapolation.CLAMP) }],
  }));

  const sectionAnimatedStyles = [sectionAnimStyle0, sectionAnimStyle1, sectionAnimStyle2, sectionAnimStyle3];

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
    if (isAnimatingClear) return;
    setIsAnimatingClear(true);

    const visibleCount = Math.min(recentSearches.length, 5);

    // Reverse cascade: bottom to top with staggered delay
    for (let i = visibleCount - 1; i >= 0; i--) {
      const reverseIndex = visibleCount - 1 - i;
      recentRowAnimations[i].value = withDelay(
        reverseIndex * 50,
        withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        })
      );
    }

    // After cascade completes, handle cleanup
    const totalDuration = 200 + Math.max(0, visibleCount - 1) * 50 + 50;
    setTimeout(() => {
      LayoutAnimation.configureNext({
        duration: 300,
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.scaleY,
        },
      });

      setRecentSearches([]);
      setWasRecentCleared(true);
      setIsAnimatingClear(false);

      persistedRecentSearches = [];
      persistedWasCleared = true;

      // Reset row values after state clears
      setTimeout(() => {
        recentRowAnimations.forEach(anim => { anim.value = 1; });
      }, 0);

      // Fade in placeholder
      placeholderOpacity.value = 0;
      placeholderOpacity.value = withDelay(100, withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      }));
    }, totalDuration);
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

      // Show rotating placeholder only when input is empty
      const showRotatingPlaceholder = searchQuery.length === 0;

      return (
        <View style={styles.inputOnlyContainer}>
          {/* Rotating placeholder - positioned behind the TextInput */}
          {showRotatingPlaceholder && (
            <View style={styles.rotatingPlaceholderContainer} pointerEvents="none">
              <RotatingPlaceholder
                interval={2500}
                isActive={visible}
                color="#999999"
                fontSize={16}
              />
            </View>
          )}
          <TextInput
            ref={inputRef}
            style={[styles.inputOnlyStyle, { backgroundColor: 'transparent' }]}
            placeholder="" // No static placeholder - we use RotatingPlaceholder instead
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
                        sectionAnimatedStyles[0],
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
                            <AnimatedRecentRow
                              key={`recent-${index}`}
                              search={search}
                              progress={recentRowAnimations[index]}
                              onPress={() => handleRecentSearchPress(search)}
                            />
                          ))}
                        </View>
                      )}

                      {/* Placeholder - only renders after clear is complete, fades in */}
                      {wasRecentCleared && recentSearches.length === 0 && (
                        <Animated.View style={[styles.emptyRecentContainer, placeholderAnimStyle]}>
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
                    sectionAnimatedStyles[recentSearches.length > 0 ? 1 : 0],
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
                    sectionAnimatedStyles[recentSearches.length > 0 ? 2 : 1],
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
                    sectionAnimatedStyles[recentSearches.length > 0 ? 3 : 2],
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
              placeholder="Try 'Millennium Force'..."
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
  rotatingPlaceholderContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 0, // Behind the TextInput
  },
  inputCloseButton: {
    marginLeft: 8,
    padding: 4,
  },
  sectionsOnlyContainer: {
    flex: 1,
  },
});
