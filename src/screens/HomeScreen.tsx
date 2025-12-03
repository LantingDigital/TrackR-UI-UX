import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, FlatList, ListRenderItemInfo, Animated, NativeSyntheticEvent, NativeScrollEvent, Dimensions, Pressable, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { SearchBar, ActionPill, NewsCard, SearchOverlay, SearchModal, QuickLogSheet, MorphingActionButton } from '../components';
import { MOCK_NEWS, NewsItem } from '../data/mockNews';

const COLLAPSE_THRESHOLD = 50;
const EXPAND_THRESHOLD = 10;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const GAP = 12;
const STATE_CHANGE_COOLDOWN = 400; // ms - prevents rapid state changes during bounces

// Fixed header heights for smooth animation
const HEADER_HEIGHT_EXPANDED = 132;  // 12 (paddingTop) + 56 (search) + 64 (pills container)
const HEADER_HEIGHT_COLLAPSED = 66;   // 12 (paddingTop) + 42 (search row) + 12 (bottom padding)

// Note: Search modal height is calculated dynamically using safe area insets

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(MOCK_NEWS.filter(item => item.isSaved).map(item => item.id))
  );
  const [searchVisible, setSearchVisible] = useState(false);
  const [quickLogVisible, setQuickLogVisible] = useState(false);
  const isCollapsedRef = useRef(false);
  const lastScrollY = useRef(0);
  const lastStateChangeTime = useRef(0);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);

  // Single animated value that drives all animations (0 = collapsed, 1 = expanded)
  const animProgress = useRef(new Animated.Value(1)).current;

  // Hero morph animation values for search modal (0 = pill, 1 = full card)
  const pillMorphProgress = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Separate animated value for content fade (allows input to fade BEFORE pill shrinks on close)
  const searchContentFade = useRef(new Animated.Value(0)).current;
  // Animated values for action buttons visibility and morph-back effect
  // This allows smooth morph-back when modal closes instead of abrupt jump
  const actionButtonsOpacity = useRef(new Animated.Value(1)).current;
  const actionButtonsScale = useRef(new Animated.Value(1)).current;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    // 1. Ignore negative offsets (top bounce territory)
    if (offsetY <= 0) {
      lastScrollY.current = 0;
      return;
    }

    // 2. Ignore bottom bounce territory
    const maxScrollY = contentHeight.current - viewportHeight.current;
    if (maxScrollY > 0 && offsetY >= maxScrollY) {
      lastScrollY.current = offsetY;
      return;
    }

    // 3. Cooldown check - prevent rapid state changes during any bounce
    const now = Date.now();
    if (now - lastStateChangeTime.current < STATE_CHANGE_COOLDOWN) {
      lastScrollY.current = offsetY;
      return;
    }

    const isScrollingUp = offsetY < lastScrollY.current;
    const scrollDelta = Math.abs(offsetY - lastScrollY.current);

    // Collapse when scrolling down past threshold
    if (offsetY > COLLAPSE_THRESHOLD && !isCollapsedRef.current && !isScrollingUp) {
      isCollapsedRef.current = true;
      lastStateChangeTime.current = Date.now();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(animProgress, {
        toValue: 0,
        useNativeDriver: false,
        damping: 16,      // Higher = less bounce, more controlled
        stiffness: 180,   // Higher = faster
        mass: 0.8,        // Lower = snappier
      }).start();
    }
    // Expand when scrolling up (with minimum delta to avoid jitter)
    else if (isScrollingUp && scrollDelta > 5 && isCollapsedRef.current) {
      isCollapsedRef.current = false;
      lastStateChangeTime.current = Date.now();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(animProgress, {
        toValue: 1,
        useNativeDriver: false,
        damping: 16,      // Higher = less bounce, more controlled
        stiffness: 180,   // Higher = faster
        mass: 0.8,        // Lower = snappier
      }).start();
    }

    lastScrollY.current = offsetY;
  }, [animProgress]);

  const handleSearchPress = useCallback(() => {
    // IMPORTANT: Reset ALL animated values BEFORE triggering React render
    // This prevents flicker caused by race condition where components render
    // with stale animated values before setValue() takes effect
    searchContentFade.setValue(0);
    actionButtonsOpacity.setValue(0);
    actionButtonsScale.setValue(0.5); // Start scaled down for morph-back effect
    pillMorphProgress.setValue(0); // Ensure pill starts at initial position
    backdropOpacity.setValue(0); // Ensure backdrop starts hidden

    // Use requestAnimationFrame to ensure animated values are fully applied
    // to the native side before React renders the new components
    // This prevents the "cold start" flicker on first open
    requestAnimationFrame(() => {
      setSearchVisible(true);

      // Animate the pill expansion, backdrop, and content fade simultaneously
      // Note: searchContentFade uses useNativeDriver: false to match pillMorphProgress
      // (they're used in the same view hierarchy, mixing native drivers causes errors)
      Animated.parallel([
        Animated.spring(pillMorphProgress, {
          toValue: 1,
          damping: 20,
          stiffness: 200,
          mass: 0.9,
          useNativeDriver: false,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Content fades in after pill settles
        Animated.timing(searchContentFade, {
          toValue: 1,
          duration: 200,
          delay: 200, // Start after pill is mostly expanded (at ~70%)
          useNativeDriver: false, // Must match pillMorphProgress driver
        }),
      ]).start();
    });
  }, [pillMorphProgress, backdropOpacity, searchContentFade, actionButtonsOpacity, actionButtonsScale]);

  const handleSearchClose = useCallback(() => {
    Keyboard.dismiss();
    // SEQUENCED close animation: content fades FIRST, then pill shrinks, then buttons morph back
    Animated.sequence([
      // Step 1: Fade out content (input and section cards) FIRST
      Animated.timing(searchContentFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false, // Must match pillMorphProgress driver
      }),
      // Step 2: Then shrink the pill back and fade backdrop + morph action buttons back in
      Animated.parallel([
        Animated.spring(pillMorphProgress, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          mass: 0.9,
          useNativeDriver: false,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        // Morph action buttons back: simple fade + scale timing (no bouncy spring to avoid glitching)
        Animated.sequence([
          Animated.delay(150), // Wait for pill to shrink a bit
          Animated.parallel([
            Animated.timing(actionButtonsOpacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: false,
            }),
            Animated.timing(actionButtonsScale, {
              toValue: 1,
              duration: 250,
              useNativeDriver: false,
            }),
          ]),
        ]),
      ]),
    ]).start(() => {
      setSearchVisible(false);
    });
  }, [pillMorphProgress, backdropOpacity, searchContentFade, actionButtonsOpacity, actionButtonsScale]);

  const handleSearch = useCallback((query: string) => {
    console.log('Searching for:', query);
    setSearchVisible(false);
  }, []);

  const handleLogPress = useCallback(() => {
    setQuickLogVisible(true);
  }, []);

  const handleQuickLogClose = useCallback(() => {
    setQuickLogVisible(false);
  }, []);

  const handleLogComplete = useCallback((coaster: any, seat: any) => {
    console.log('Logged:', coaster.name, 'at seat', seat);
  }, []);

  const handleScanPress = useCallback(() => {
    console.log('Scan pressed');
  }, []);

  const handleBookmarkPress = useCallback((id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCardPress = useCallback((item: NewsItem) => {
    console.log('Card pressed:', item.title);
  }, []);

  const renderNewsCard = useCallback(({ item }: ListRenderItemInfo<NewsItem>) => {
    return (
      <View style={styles.cardWrapper}>
        <NewsCard
          source={item.source}
          title={item.title}
          subtitle={item.subtitle}
          timestamp={item.timestamp}
          imageUrl={{ uri: item.image }}
          isUnread={item.isUnread}
          isBookmarked={bookmarkedIds.has(item.id)}
          onPress={() => handleCardPress(item)}
          onBookmarkPress={() => handleBookmarkPress(item.id)}
        />
      </View>
    );
  }, [bookmarkedIds, handleCardPress, handleBookmarkPress]);

  const keyExtractor = useCallback((item: NewsItem) => item.id, []);

  // Calculate dimensions
  const containerWidth = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
  const pillWidth = (containerWidth - (GAP * 2)) / 3; // Each pill in expanded state
  const circleSize = 42; // Larger circles for better visual presence

  // Calculate collapsed state layout - equal spacing with 5 gaps across SCREEN_WIDTH
  // Layout: [margin] [search] [gap] [⊕] [gap] [🔍] [gap] [📷] [margin]
  const collapsedSearchWidth = SCREEN_WIDTH * 0.50; // 50% of screen width - tighter spacing
  const totalCirclesWidth = circleSize * 3;
  const totalContentWidth = collapsedSearchWidth + totalCirclesWidth;
  const equalGap = (SCREEN_WIDTH - totalContentWidth) / 5; // 5 equal gaps across full screen width

  // Calculate morphing button positions
  // Expanded (pill) positions - center of each pill in the row
  const expandedY = 12 + 56 + 12 + 18; // paddingTop + searchHeight + pillsContainerPaddingTop + half pill height
  const expandedPositions = [
    { x: HORIZONTAL_PADDING + pillWidth / 2, y: expandedY },                          // Log
    { x: HORIZONTAL_PADDING + pillWidth + GAP + pillWidth / 2, y: expandedY },        // Search
    { x: HORIZONTAL_PADDING + pillWidth * 2 + GAP * 2 + pillWidth / 2, y: expandedY }, // Scan
  ];

  // Collapsed (circle) positions - center of each circle next to search bar
  const collapsedY = 12 + 21; // paddingTop + half circle height (aligned with search bar center)
  const collapsedPositions = [
    { x: equalGap + collapsedSearchWidth + equalGap + circleSize / 2, y: collapsedY },                           // Log
    { x: equalGap + collapsedSearchWidth + equalGap + circleSize + equalGap + circleSize / 2, y: collapsedY },   // Search
    { x: equalGap + collapsedSearchWidth + equalGap + circleSize * 2 + equalGap * 2 + circleSize / 2, y: collapsedY }, // Scan
  ];

  // Search bar animations
  const searchBarWidth = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [collapsedSearchWidth, containerWidth], // collapsedSearchWidth when collapsed, full containerWidth when expanded
  });

  const searchBarHeight = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [42, 56], // 42px collapsed (matches circle size), 56px expanded
  });

  // Search bar scale bounce for overshoot effect (subtle pop when collapsed)
  // NOTE: Scale must be exactly 1.0 when expanded (animProgress=1) to match
  // the morphing pill dimensions and prevent size jump when search modal closes
  const searchBarScale = animProgress.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [1.03, 1, 1], // Pop only on collapsed end, 1.0 when expanded
    extrapolate: 'clamp',
  });

  // Fixed header height animation - single source of truth for header size
  const headerHeight = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [HEADER_HEIGHT_COLLAPSED, HEADER_HEIGHT_EXPANDED],
  });

  // Pills row animations - opacity only, container clipping handles height
  const pillsRowOpacity = animProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  // Note: Old circle animations removed - now handled by MorphingActionButton

  // =========================================
  // Hero Morph Search Pill Interpolations
  // =========================================
  // Initial position matches the header search bar (expanded state)
  const pillInitialTop = insets.top + 12; // Safe area + header paddingTop
  const pillInitialLeft = HORIZONTAL_PADDING;
  const pillInitialWidth = containerWidth;
  const pillInitialHeight = 56;
  const pillInitialBorderRadius = 28;

  // Final position when expanded - pill drops down ~48px and becomes search input card
  const pillFinalTop = insets.top + 60; // Drops ~48px from initial position
  const pillFinalLeft = 16;
  const pillFinalWidth = SCREEN_WIDTH - 32;
  const pillFinalHeight = 56; // Just the search input height, NOT full screen (section cards float separately)
  const pillFinalBorderRadius = 16;

  // Morphing pill animated styles - all clamped to prevent overshoot flicker
  const morphingPillTop = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialTop, pillFinalTop],
    extrapolate: 'clamp',
  });

  const morphingPillLeft = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialLeft, pillFinalLeft],
    extrapolate: 'clamp',
  });

  const morphingPillWidth = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialWidth, pillFinalWidth],
    extrapolate: 'clamp',
  });

  const morphingPillHeight = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialHeight, pillFinalHeight],
    extrapolate: 'clamp',
  });

  const morphingPillBorderRadius = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialBorderRadius, pillFinalBorderRadius],
    extrapolate: 'clamp',
  });

  // Search input reveal - only appears at 70%+ of animation (prevents jitter)
  const searchInputOpacity = pillMorphProgress.interpolate({
    inputRange: [0, 0.7, 0.9],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // Section cards reveal - slides up after pill settles
  const sectionCardsOpacity = pillMorphProgress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const sectionCardsTranslateY = pillMorphProgress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [40, 40, 0],
    extrapolate: 'clamp',
  });

  // Placeholder text fades out as pill expands
  const pillPlaceholderOpacity = pillMorphProgress.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Icon crossfade: Globe → Magnifying glass
  // Globe fades out as pill starts morphing (0 → 0.4)
  // Magnifying glass fades in slightly later (0.2 → 0.5)
  // This creates a smooth crossfade instead of an instant icon jump
  const globeIconOpacity = pillMorphProgress.interpolate({
    inputRange: [0, 0.4],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const searchIconOpacity = pillMorphProgress.interpolate({
    inputRange: [0, 0.2, 0.5],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* News Feed - comes first, header floats over it */}
      <FlatList
        data={MOCK_NEWS}
        keyExtractor={keyExtractor}
        renderItem={renderNewsCard}
        contentContainerStyle={[styles.feedContent, { paddingTop: HEADER_HEIGHT_EXPANDED }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={(w, h) => { contentHeight.current = h; }}
        onLayout={(e) => { viewportHeight.current = e.nativeEvent.layout.height; }}
      />

      {/* Sticky Header - absolutely positioned, floats over content */}
      {/* Hidden completely when search is visible (search pill floats independently) */}
      <Animated.View style={[styles.stickyHeader, { height: headerHeight, overflow: 'hidden', position: 'absolute', top: insets.top, left: 0, right: 0, opacity: actionButtonsOpacity }]} pointerEvents={searchVisible ? 'none' : 'auto'}>
        {/* Search Bar Row */}
        <View style={[styles.header, { paddingHorizontal: 0 }]}>
          <Pressable onPress={handleSearchPress}>
            <Animated.View
              style={{
                width: searchBarWidth,
                height: searchBarHeight,
                marginLeft: animProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [equalGap, HORIZONTAL_PADDING], // equalGap when collapsed, 16px when expanded
                }),
                backgroundColor: '#FFFFFF',
                borderRadius: 28,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                shadowColor: '#323232',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.16,
                shadowRadius: 24,
                elevation: 8,
                transform: [{ scale: searchBarScale }],
              }}
            >
              {/* Globe Icon - fixed size to prevent clipping */}
              <View
                style={{
                  width: 20,
                  height: 20,
                  marginRight: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="globe-outline" size={20} color="#999999" />
              </View>
              {/* Placeholder text container */}
              <Animated.View
                style={{
                  flex: 1,
                  height: '100%',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                pointerEvents="none"
              >
                {/* Full placeholder - visible when expanded */}
                <Animated.Text
                  style={{
                    position: 'absolute',
                    fontSize: 16,
                    color: '#999999',
                    opacity: animProgress,
                  }}
                  numberOfLines={1}
                >
                  Search rides, parks, news...
                </Animated.Text>
                {/* Short placeholder - visible when collapsed */}
                <Animated.Text
                  style={{
                    position: 'absolute',
                    fontSize: 16,
                    color: '#999999',
                    opacity: animProgress.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [1, 0, 0],
                    }),
                  }}
                  numberOfLines={1}
                >
                  Search...
                </Animated.Text>
              </Animated.View>
            </Animated.View>
          </Pressable>
        </View>

        {/* Morphing Action Buttons - unified pill/circle that morphs between states */}
        <Animated.View style={[styles.morphingButtonsContainer, { opacity: actionButtonsOpacity, transform: [{ scale: actionButtonsScale }] }]} pointerEvents={searchVisible ? 'none' : 'box-none'}>
          <MorphingActionButton
            icon="add-circle-outline"
            label="Log"
            buttonIndex={0}
            animProgress={animProgress}
            onPress={handleLogPress}
            collapsedX={collapsedPositions[0].x - circleSize / 2}
            expandedX={expandedPositions[0].x - pillWidth / 2}
            collapsedY={collapsedPositions[0].y - circleSize / 2}
            expandedY={expandedPositions[0].y - 18}
          />
          <MorphingActionButton
            icon="search-outline"
            label="Search"
            buttonIndex={1}
            animProgress={animProgress}
            onPress={handleSearchPress}
            collapsedX={collapsedPositions[1].x - circleSize / 2}
            expandedX={expandedPositions[1].x - pillWidth / 2}
            collapsedY={collapsedPositions[1].y - circleSize / 2}
            expandedY={expandedPositions[1].y - 18}
          />
          <MorphingActionButton
            icon="barcode-outline"
            label="Scan"
            buttonIndex={2}
            animProgress={animProgress}
            onPress={handleScanPress}
            collapsedX={collapsedPositions[2].x - circleSize / 2}
            expandedX={expandedPositions[2].x - pillWidth / 2}
            collapsedY={collapsedPositions[2].y - circleSize / 2}
            expandedY={expandedPositions[2].y - 18}
          />
        </Animated.View>
      </Animated.View>

      {/* ============================== */}
      {/* Hero Morph Search Experience */}
      {/* ============================== */}

      {/* Blur Backdrop - fades in simultaneously with pill expansion */}
      {searchVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: backdropOpacity, zIndex: 50 },
          ]}
          pointerEvents={searchVisible ? 'auto' : 'none'}
        >
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}

      {/* Morphing Search Pill - transforms from pill to search input card ONLY */}
      {searchVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: morphingPillTop,
            left: morphingPillLeft,
            width: morphingPillWidth,
            height: morphingPillHeight,
            borderRadius: morphingPillBorderRadius,
            backgroundColor: '#FFFFFF',
            zIndex: 100,
            // Enhanced shadow for better visibility against blur backdrop
            shadowColor: '#323232',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.22,
            shadowRadius: 20,
            elevation: 10,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          {/* Icon container - crossfade between globe and search icons */}
          <View style={{ width: 20, height: 20, marginRight: 8 }}>
            {/* Globe icon - fades out as pill morphs */}
            <Animated.View style={{ position: 'absolute', opacity: globeIconOpacity }}>
              <Ionicons name="globe-outline" size={20} color="#999999" />
            </Animated.View>
            {/* Search icon - fades in as pill morphs */}
            <Animated.View style={{ position: 'absolute', opacity: searchIconOpacity }}>
              <Ionicons name="search" size={20} color="#999999" />
            </Animated.View>
          </View>

          {/* Placeholder text - fades out during morph */}
          <Animated.Text
            style={{
              position: 'absolute',
              left: 44,
              fontSize: 16,
              color: '#999999',
              opacity: pillPlaceholderOpacity,
            }}
          >
            Search rides, parks, news...
          </Animated.Text>

          {/* Actual TextInput - uses searchContentFade for coordinated fade in/out */}
          <Animated.View style={{ flex: 1, opacity: searchContentFade }}>
            <SearchModal
              visible={searchVisible}
              onClose={handleSearchClose}
              onSearch={handleSearch}
              onResultPress={(item) => console.log('Selected:', item.name)}
              morphProgress={pillMorphProgress}
              contentOpacity={sectionCardsOpacity}
              contentTranslateY={sectionCardsTranslateY}
              isEmbedded={true}
              inputOnly={true}
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* Floating Section Cards - render OUTSIDE the pill, directly on blur backdrop */}
      {/* Note: Individual sections have their own staggered cascade animations from SearchModal */}
      {searchVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top + 60 + 56 + 16, // Below the morphed pill (pillFinalTop + pillHeight + gap)
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
            opacity: searchContentFade, // Use searchContentFade for coordinated fade in/out
            // Note: translateY removed - individual sections have their own staggered translateY animations
          }}
          pointerEvents={searchVisible ? 'auto' : 'none'}
        >
          <SearchModal
            visible={searchVisible}
            onClose={handleSearchClose}
            onSearch={handleSearch}
            onResultPress={(item) => console.log('Selected:', item.name)}
            morphProgress={pillMorphProgress}
            contentOpacity={sectionCardsOpacity}
            contentTranslateY={sectionCardsTranslateY}
            isEmbedded={true}
            sectionsOnly={true}
          />
        </Animated.View>
      )}

      {/* Close button - positioned outside the morphing card */}
      {searchVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 16,
            zIndex: 150,
            opacity: pillMorphProgress,
          }}
        >
          <Pressable
            onPress={handleSearchClose}
            hitSlop={20}
            style={{
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
            }}
          >
            <Ionicons name="close" size={28} color="#000000" />
          </Pressable>
        </Animated.View>
      )}

      {/* Quick Log Sheet */}
      <QuickLogSheet
        visible={quickLogVisible}
        onClose={handleQuickLogClose}
        onLogComplete={handleLogComplete}
      />
    </View>
  );
};

// Note: AnimatedCircleButton removed - replaced by MorphingActionButton

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  stickyHeader: {
    backgroundColor: '#F7F7F7',
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  collapsedSearchWrapper: {
    flex: 1,
  },
  pillsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
    overflow: 'hidden',
  },
  morphingButtonsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 132, // HEADER_HEIGHT_EXPANDED
    overflow: 'visible',
  },
  pillWrapper: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cardWrapper: {
    marginBottom: 12,
  },
});
