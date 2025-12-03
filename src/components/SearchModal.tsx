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
} from 'react-native';
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
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(RECENT_SEARCHES);
  const inputRef = useRef<TextInput>(null);

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

  // Reset search and focus input when becoming visible (embedded mode)
  useEffect(() => {
    if (visible && isEmbedded) {
      setSearchQuery('');
      // Focus input after pill morph completes (controlled by HomeScreen)
      setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
    }
  }, [visible, isEmbedded]);

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
    setRecentSearches([]);
  }, []);

  const handleResultPress = useCallback((item: SearchableItem) => {
    onResultPress?.(item);
    handleClose();
  }, [onResultPress, handleClose]);

  // Carousel card tap shows toast instead of navigating
  const handleCarouselCardPress = useCallback((item: SearchableItem) => {
    Alert.alert('Coming Soon', `${item.name} details page is coming soon!`);
  }, []);

  if (!visible) return null;

  // =============================================
  // EMBEDDED MODE: Split rendering for hero morph
  // inputOnly: Just the TextInput (inside morphing pill)
  // sectionsOnly: Just the section cards (floating on blur)
  // =============================================
  if (isEmbedded) {
    // INPUT ONLY MODE: Just render the TextInput for inside the morphing pill
    if (inputOnly) {
      return (
        <TextInput
          ref={inputRef}
          style={styles.inputOnlyStyle}
          placeholder="Search rides, parks, news..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
      );
    }

    // SECTIONS ONLY MODE: Just the floating section cards (on blur backdrop)
    if (sectionsOnly) {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sectionsOnlyContainer}
        >
          <ScrollView
            style={styles.embeddedContent}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
                {recentSearches.length > 0 && (
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
  inputOnlyStyle: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  sectionsOnlyContainer: {
    flex: 1,
  },
});
