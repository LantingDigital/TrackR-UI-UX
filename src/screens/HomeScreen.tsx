import React, { useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, View, FlatList, ListRenderItemInfo, Animated, NativeSyntheticEvent, NativeScrollEvent, Dimensions, Pressable, Keyboard, Easing } from 'react-native';
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

// Type for tracking which element triggered the search modal
type SearchOrigin =
  | 'expandedSearchBar'    // Full-width search bar (expanded header)
  | 'searchPill'           // "Search" action pill (expanded header)
  | 'collapsedSearchBar'   // Compact search bar (collapsed header)
  | 'collapsedCircle';     // Circle search button (collapsed header)

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(MOCK_NEWS.filter(item => item.isSaved).map(item => item.id))
  );
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState<SearchOrigin>('expandedSearchBar');
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

  // Sticky search bar animation (0 = normal position, 1 = sticky at top)
  const searchBarStickyProgress = useRef(new Animated.Value(0)).current;
  const isSearchBarSticky = useRef(false); // Track current sticky state to avoid redundant animations

  // Rubber band bounce offset - search bar follows overscroll for elastic feel
  const searchBarBounceOffset = useRef(new Animated.Value(0)).current;

  // Two-stage morph for circle button: circle → pill (stage1), then pill → modal (pillMorphProgress)
  const circleStage1Progress = useRef(new Animated.Value(0)).current;

  // Bounce animation for searchPill origin - controls ONLY vertical position
  // Allows pill to arc upward, peak, then settle with a tiny bounce
  const searchPillBounceProgress = useRef(new Animated.Value(0)).current;

  // Close phase multiplier: 0 = use bounce curve (open), 1 = use linear curve (close)
  // This allows fancy bounce on open but simple linear slide on close
  const closePhaseProgress = useRef(new Animated.Value(0)).current;

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

  // Base function to trigger search modal open animation
  // Called by per-origin press handlers after setting searchOrigin
  const triggerSearchOpen = useCallback((origin: SearchOrigin) => {
    // Set the origin BEFORE animation starts so interpolations use correct values
    setSearchOrigin(origin);

    // ALWAYS reset header to expanded state when showing search modal
    // This ensures consistent exit animation (always returns to expanded search bar)
    isCollapsedRef.current = false;
    Animated.spring(animProgress, {
      toValue: 1,
      useNativeDriver: false,
      damping: 16,
      stiffness: 180,
      mass: 0.8,
    }).start();

    // IMPORTANT: Reset ALL animated values BEFORE triggering React render
    // This prevents flicker caused by race condition where components render
    // with stale animated values before setValue() takes effect
    searchContentFade.setValue(0);
    actionButtonsOpacity.setValue(0);
    actionButtonsScale.setValue(0.5); // Start scaled down for morph-back effect
    pillMorphProgress.setValue(0); // Ensure pill starts at initial position
    backdropOpacity.setValue(0); // Ensure backdrop starts hidden
    circleStage1Progress.setValue(0); // Reset 2-stage animation
    searchPillBounceProgress.setValue(0); // Reset bounce animation
    closePhaseProgress.setValue(0); // Use bounce curve for open

    // Use requestAnimationFrame to ensure animated values are fully applied
    // to the native side before React renders the new components
    // This prevents the "cold start" flicker on first open
    requestAnimationFrame(() => {
      setSearchVisible(true);

      // Check if this is a bounce animation (searchPill, collapsedCircle, or collapsedSearchBar)
      if (origin === 'collapsedCircle' || origin === 'collapsedSearchBar') {
        // CURVED ARC ANIMATION: Element arcs up+left to peak, then descends to land with bounce
        // Uses same physics as searchPill for consistent feel
        Animated.parallel([
          // Expansion: Timing with fast-start easing (80% by peak)
          Animated.timing(pillMorphProgress, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          // Arc + bounce: Spring with same physics as searchPill
          Animated.spring(searchPillBounceProgress, {
            toValue: 1,
            damping: 14,
            stiffness: 42,
            mass: 1.2,
            useNativeDriver: false,
          }),
          // Backdrop fade
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          // Content fades in during landing phase
          Animated.timing(searchContentFade, {
            toValue: 1,
            duration: 250,
            delay: 400,
            useNativeDriver: false,
          }),
        ]).start();
      } else if (origin === 'searchPill') {
        // BOUNCE ANIMATION: Pill arcs upward, expands, then settles with tiny bounce
        // Uses separate animated value (searchPillBounceProgress) for vertical position
        // while pillMorphProgress controls expansion with accelerated timing
        Animated.parallel([
          // Expansion: Timing with fast-start easing (80% by peak)
          Animated.timing(pillMorphProgress, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic), // Fast start, slow finish
            useNativeDriver: false,
          }),
          // Vertical bounce: Spring with overshoot for arc + landing bounce
          // Slowed to ~63% speed for better visibility
          Animated.spring(searchPillBounceProgress, {
            toValue: 1,
            damping: 14,      // Controlled bounce
            stiffness: 42,    // Lower = slower (~800ms total)
            mass: 1.2,        // Heavier, more gradual
            useNativeDriver: false,
          }),
          // Backdrop fade (slightly longer to match slower bounce)
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          // Content fades in during landing phase (starts before bounce fully settles)
          Animated.timing(searchContentFade, {
            toValue: 1,
            duration: 250,
            delay: 400, // Start during landing/overshoot phase for snappier feel
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        // BOUNCE ANIMATION for expandedSearchBar - same polished feel as other origins
        Animated.parallel([
          // Expansion: Timing with fast-start easing (80% by peak)
          Animated.timing(pillMorphProgress, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          // Vertical bounce: Spring with same physics as other origins
          Animated.spring(searchPillBounceProgress, {
            toValue: 1,
            damping: 14,
            stiffness: 42,
            mass: 1.2,
            useNativeDriver: false,
          }),
          // Backdrop fade
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          // Content fades in during landing phase
          Animated.timing(searchContentFade, {
            toValue: 1,
            duration: 250,
            delay: 400,
            useNativeDriver: false,
          }),
        ]).start();
      }
    });
  }, [pillMorphProgress, backdropOpacity, searchContentFade, actionButtonsOpacity, actionButtonsScale, circleStage1Progress, searchPillBounceProgress]);

  // Per-origin press handlers
  // Search bar press - determines origin based on current collapse state
  const handleSearchBarPress = useCallback(() => {
    const origin = isCollapsedRef.current ? 'collapsedSearchBar' : 'expandedSearchBar';
    triggerSearchOpen(origin);
  }, [triggerSearchOpen]);

  // Search action button press - determines origin based on current collapse state
  const handleSearchButtonPress = useCallback(() => {
    const origin = isCollapsedRef.current ? 'collapsedCircle' : 'searchPill';
    triggerSearchOpen(origin);
  }, [triggerSearchOpen]);

  const handleSearchClose = useCallback(() => {
    Keyboard.dismiss();
    // Reset sticky state and bounce offset
    isSearchBarSticky.current = false;
    searchBarStickyProgress.setValue(0);
    searchBarBounceOffset.setValue(0);

    // GUARANTEE header is expanded when returning to home screen
    // This is critical - no matter how user got to modal, they return to expanded header
    isCollapsedRef.current = false;
    animProgress.setValue(1); // Instant - header is behind modal anyway

    // Switch to close phase - this makes interpolations use LINEAR curve instead of bounce
    closePhaseProgress.setValue(1);

    // ALWAYS change origin to expandedSearchBar for close animation
    // This ensures the pill ALWAYS morphs back to the expanded search bar position
    setSearchOrigin('expandedSearchBar');

    // UNIFIED EXIT ANIMATION for all origins
    // Simple LINEAR slide back to origin - no bounce curve on close
    Animated.sequence([
      // Step 1: Fade out content (input and section cards) FIRST
      Animated.timing(searchContentFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
      // Step 2: Then slide the pill back LINEARLY and fade backdrop + morph action buttons
      Animated.parallel([
        // pillMorphProgress drives the LINEAR close animation
        // (closePhaseProgress=1 makes interpolations use this instead of bounce curve)
        Animated.timing(pillMorphProgress, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        // Morph action buttons back: simple fade + scale timing
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
  }, [animProgress, pillMorphProgress, backdropOpacity, searchContentFade, actionButtonsOpacity, actionButtonsScale, searchBarStickyProgress, searchBarBounceOffset, closePhaseProgress]);

  const handleSearch = useCallback((query: string) => {
    console.log('Searching for:', query);
    setSearchVisible(false);
  }, []);

  // Handle scroll position changes from search modal
  // Search bar smoothly follows scroll until it reaches the top position, then stays there
  // Also handles rubber band bounce effect when overscrolling
  const STICKY_SCROLL_DISTANCE = 48; // Distance to scroll before bar reaches top

  const handleSearchScrollPosition = useCallback((
    scrollY: number,
    topOverscroll: number,
    bottomOverscroll: number
  ) => {
    // Calculate sticky progress: 0 = normal position, 1 = sticky at top
    // Clamp between 0 and 1 so it doesn't overshoot
    const progress = Math.min(Math.max(scrollY / STICKY_SCROLL_DISTANCE, 0), 1);
    searchBarStickyProgress.setValue(progress);

    // Rubber band bounce offset (physics-based: opposite direction of overscroll)
    // Top overscroll (pulling down past top) → search bar bounces DOWN (positive offset)
    // Bottom overscroll (pushing past bottom) → search bar bounces UP (negative offset)
    // Damping factors tuned to match rubber band feel
    const bounceOffset = -(topOverscroll * 0.65) - (bottomOverscroll * 0.45);
    searchBarBounceOffset.setValue(bounceOffset);

    // Track sticky state for close button visibility
    isSearchBarSticky.current = progress > 0.5;
  }, [searchBarStickyProgress, searchBarBounceOffset]);

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

  // =========================================
  // Dynamic Origin Position Calculator
  // =========================================
  // Returns initial position based on which element was tapped
  const originPosition = useMemo(() => {
    const PILL_HEIGHT = 36; // Action pill height
    const PILL_BORDER_RADIUS = 18;

    switch (searchOrigin) {
      case 'expandedSearchBar':
        // Full-width search bar at top (current default)
        return {
          top: insets.top + 12,
          left: HORIZONTAL_PADDING,
          width: containerWidth,
          height: 56,
          borderRadius: 28,
        };
      case 'searchPill':
        // "Search" action pill in expanded header (middle pill)
        return {
          top: insets.top + expandedY - 18, // expandedY is center, subtract half height
          left: expandedPositions[1].x - pillWidth / 2,
          width: pillWidth,
          height: PILL_HEIGHT,
          borderRadius: PILL_BORDER_RADIUS,
        };
      case 'collapsedSearchBar':
        // Smaller search bar when header is collapsed
        return {
          top: insets.top + 12,
          left: equalGap,
          width: collapsedSearchWidth,
          height: 42,
          borderRadius: 21,
        };
      case 'collapsedCircle':
        // Circle search button when header is collapsed
        return {
          top: insets.top + collapsedY - circleSize / 2,
          left: collapsedPositions[1].x - circleSize / 2,
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
        };
      default:
        return {
          top: insets.top + 12,
          left: HORIZONTAL_PADDING,
          width: containerWidth,
          height: 56,
          borderRadius: 28,
        };
    }
  }, [searchOrigin, insets.top, containerWidth, pillWidth, expandedY, expandedPositions, equalGap, collapsedSearchWidth, collapsedY, collapsedPositions, circleSize]);

  // =========================================
  // Intermediate Pill Position (for 2-stage circle animation)
  // =========================================
  // When circle expands to pill (stage 1), it should stay at the same center position
  // but with pill dimensions instead of circle dimensions
  const intermediatePillPosition = useMemo(() => {
    const PILL_HEIGHT = 36;
    const PILL_BORDER_RADIUS = 18;
    return {
      top: insets.top + collapsedY - PILL_HEIGHT / 2, // Same center Y as circle
      left: collapsedPositions[1].x - pillWidth / 2,   // Same center X as circle
      width: pillWidth,
      height: PILL_HEIGHT,
      borderRadius: PILL_BORDER_RADIUS,
    };
  }, [insets.top, collapsedY, collapsedPositions, pillWidth]);

  // =========================================
  // Morphing Pill Interpolations
  // =========================================
  // For circle origin: 2-stage animation (circle → pill → modal)
  // For other origins: single-stage animation (origin → modal)

  // TOP POSITION
  // Uses closePhaseProgress to blend between:
  // - OPEN (closePhase=0): Bounce curve with arc
  // - CLOSE (closePhase=1): Simple linear slide

  // Bounce curve for OPEN animation
  const topBounce = (searchOrigin === 'collapsedCircle' || searchOrigin === 'collapsedSearchBar')
    ? searchPillBounceProgress.interpolate({
        inputRange: [0, 0.35, 0.7, 0.85, 1],
        outputRange: [
          originPosition.top,
          pillFinalTop - 100,  // Peak: 100px above final
          pillFinalTop,
          pillFinalTop + 8,    // Overshoot
          pillFinalTop,
        ],
        extrapolate: 'clamp',
      })
    : searchPillBounceProgress.interpolate({
        inputRange: [0, 0.35, 0.7, 0.85, 1],
        outputRange: [
          originPosition.top,
          pillFinalTop - 60,   // Peak: 60px above final
          pillFinalTop,
          pillFinalTop + 8,    // Overshoot
          pillFinalTop,
        ],
        extrapolate: 'clamp',
      });

  // Linear curve for CLOSE animation - ALWAYS returns to expanded search bar position
  // Uses pillInitialTop (expanded search bar) instead of originPosition.top
  const topLinear = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialTop, pillFinalTop],
    extrapolate: 'clamp',
  });

  // Blend: bounce * (1 - closePhase) + linear * closePhase
  const morphingPillTopBase = Animated.add(
    Animated.multiply(topBounce, closePhaseProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    })),
    Animated.multiply(topLinear, closePhaseProgress)
  );

  // Sticky offset: when scrolling in search modal, bar moves back up to header position
  // At stickyProgress=0: offset is 0 (card stays at pillFinalTop)
  // At stickyProgress=1: offset is negative (card moves up to top search bar position)
  // IMPORTANT: Always use pillInitialTop (the expanded search bar position) as the target
  // This ensures identical sticky behavior regardless of which origin triggered the modal
  const stickyTopOffset = searchBarStickyProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, pillInitialTop - pillFinalTop], // Always stick to top search bar position
    extrapolate: 'clamp',
  });

  // Final top position combines morph animation + sticky offset + rubber band bounce
  const morphingPillTop = Animated.add(
    Animated.add(morphingPillTopBase, stickyTopOffset),
    searchBarBounceOffset
  );

  // LEFT POSITION
  // For searchPill: Keep CENTER of pill constant as it expands
  // For collapsedCircle: Move LEFT to center during upward arc, then stay centered

  // Calculate center X of the origin element
  const originCenterX = originPosition.left + originPosition.width / 2;
  // Calculate left positions to keep center constant as width changes
  const peakWidth = originPosition.width + (pillFinalWidth - originPosition.width) * 0.8;
  const peakLeftForSearchPill = originCenterX - peakWidth / 2;
  const finalCenteredLeftForSearchPill = originCenterX - pillFinalWidth / 2;

  // For collapsedCircle: final center is screen center, calculate left to center the expanding element
  const finalCenterX = SCREEN_WIDTH / 2;
  const peakLeftForCircle = finalCenterX - peakWidth / 2;
  const finalCenteredLeftForCircle = pillFinalLeft; // Already centered at 16px from edge

  // LEFT POSITION - Bounce for OPEN, Linear for CLOSE
  const leftBounce = (searchOrigin === 'collapsedCircle' || searchOrigin === 'collapsedSearchBar')
    ? searchPillBounceProgress.interpolate({
        inputRange: [0, 0.35, 0.7, 1],
        outputRange: [
          originPosition.left,
          peakLeftForCircle,
          finalCenteredLeftForCircle,
          finalCenteredLeftForCircle,
        ],
        extrapolate: 'clamp',
      })
    : searchPillBounceProgress.interpolate({
        inputRange: [0, 0.35, 0.7, 1],
        outputRange: [
          originPosition.left,
          peakLeftForSearchPill,
          finalCenteredLeftForSearchPill,
          finalCenteredLeftForSearchPill,
        ],
        extrapolate: 'clamp',
      });

  // Linear curve for CLOSE - ALWAYS returns to expanded search bar position
  const leftLinear = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialLeft, pillFinalLeft],
    extrapolate: 'clamp',
  });

  const morphingPillLeft = Animated.add(
    Animated.multiply(leftBounce, closePhaseProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    })),
    Animated.multiply(leftLinear, closePhaseProgress)
  );

  // WIDTH - Bounce for OPEN, Linear for CLOSE
  const widthBounce = searchPillBounceProgress.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [
      originPosition.width,
      originPosition.width + (pillFinalWidth - originPosition.width) * 0.8,  // Peak: 80%
      pillFinalWidth,
      pillFinalWidth,
    ],
    extrapolate: 'clamp',
  });

  // Linear curve for CLOSE - ALWAYS returns to expanded search bar position
  const widthLinear = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialWidth, pillFinalWidth],
    extrapolate: 'clamp',
  });

  const morphingPillWidth = Animated.add(
    Animated.multiply(widthBounce, closePhaseProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    })),
    Animated.multiply(widthLinear, closePhaseProgress)
  );

  // HEIGHT - Bounce for OPEN, Linear for CLOSE
  const heightBounce = searchPillBounceProgress.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [
      originPosition.height,
      originPosition.height + (pillFinalHeight - originPosition.height) * 0.8,  // Peak: 80%
      pillFinalHeight,
      pillFinalHeight,
    ],
    extrapolate: 'clamp',
  });

  // Linear curve for CLOSE - ALWAYS returns to expanded search bar position
  const heightLinear = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialHeight, pillFinalHeight],
    extrapolate: 'clamp',
  });

  const morphingPillHeight = Animated.add(
    Animated.multiply(heightBounce, closePhaseProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    })),
    Animated.multiply(heightLinear, closePhaseProgress)
  );

  // BORDER RADIUS - Bounce for OPEN, Linear for CLOSE
  const borderRadiusBounce = searchPillBounceProgress.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [
      originPosition.borderRadius,
      originPosition.borderRadius + (pillFinalBorderRadius - originPosition.borderRadius) * 0.8,  // Peak: 80%
      pillFinalBorderRadius,
      pillFinalBorderRadius,
    ],
    extrapolate: 'clamp',
  });

  // Linear curve for CLOSE - ALWAYS returns to expanded search bar position
  const borderRadiusLinear = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pillInitialBorderRadius, pillFinalBorderRadius],
    extrapolate: 'clamp',
  });

  const morphingPillBorderRadius = Animated.add(
    Animated.multiply(borderRadiusBounce, closePhaseProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    })),
    Animated.multiply(borderRadiusLinear, closePhaseProgress)
  );

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

  // Shadow interpolations for smooth transition between home and modal states
  // At pillMorphProgress=0: matches home search bar shadow exactly
  // At pillMorphProgress=1: stronger floating shadow for modal
  const morphingShadowOpacity = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.35], // Home bar shadow → Modal shadow
    extrapolate: 'clamp',
  });

  const morphingShadowRadius = pillMorphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 28],
    extrapolate: 'clamp',
  });

  // Home search bar fades out as morphing pill becomes visible
  // This creates seamless handoff between the two elements
  const homeSearchBarOpacity = pillMorphProgress.interpolate({
    inputRange: [0, 0.15],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Morphing pill fades in as animation begins
  // Slight delay ensures home bar is still visible during initial handoff
  const morphingPillOpacity = pillMorphProgress.interpolate({
    inputRange: [0, 0.05, 0.15],
    outputRange: [0, 0.5, 1],
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
      {/* Search bar and action buttons have SEPARATE opacity controls for smooth morph handoff */}
      <Animated.View style={[styles.stickyHeader, { height: headerHeight, overflow: 'hidden', position: 'absolute', top: insets.top, left: 0, right: 0 }]} pointerEvents={searchVisible ? 'none' : 'auto'}>
        {/* Search Bar Row - fades out as morphing pill takes over */}
        <Animated.View style={[styles.header, { paddingHorizontal: 0, opacity: homeSearchBarOpacity }]}>
          <Pressable onPress={handleSearchBarPress}>
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
        </Animated.View>

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
            onPress={handleSearchButtonPress}
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

      {/* Blur Zone Above Search Bar - blurs content that scrolls into the area above the search bar */}
      {/* Height is dynamic: distance from safe area top to search bar's top edge */}
      {/* Note: Cannot use backdropOpacity here because it uses useNativeDriver: true, */}
      {/* but height uses animated values that require useNativeDriver: false */}
      {searchVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top,
            left: 0,
            right: 0,
            // Height = distance from safe area to search bar top
            height: Animated.subtract(morphingPillTop, insets.top),
            zIndex: 90, // Above section cards (80), below search bar (150)
            overflow: 'hidden',
          }}
          pointerEvents="none"
        >
          <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}

      {/* Morphing Search Pill - transforms from pill to search input card ONLY */}
      {/* Floats ON TOP of all search content with prominent shadow - SOLID WHITE */}
      {/* Uses wrapper view for shadow (overflow: visible) and inner view for content clipping */}
      {/* Shadow animates from home bar style → modal style for smooth transition */}
      {searchVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: morphingPillTop,
            left: morphingPillLeft,
            width: morphingPillWidth,
            height: morphingPillHeight,
            borderRadius: morphingPillBorderRadius,
            zIndex: 150, // Higher than section cards (80) and blur zone (90)
            opacity: morphingPillOpacity, // Fade in as animation starts
            // Shadow animates for smooth transition - matches home bar at start
            shadowColor: '#323232', // Match home bar shadow color
            shadowOffset: { width: 0, height: 8 }, // Static offset (can't animate nested values)
            shadowOpacity: morphingShadowOpacity,
            shadowRadius: morphingShadowRadius,
            elevation: 24,
          }}
        >
          {/* Inner container for content with overflow clipping */}
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF', // Solid white background
              borderRadius: morphingPillBorderRadius,
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
              showCloseButton={true}
            />
          </Animated.View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Floating Section Cards - render OUTSIDE the pill, directly on blur backdrop */}
      {/* Cards scroll UNDER the floating search bar (lower zIndex) */}
      {/* Note: Individual sections have their own staggered cascade animations from SearchModal */}
      {searchVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top, // Start from top of safe area
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 80, // BELOW the morphing pill (100) so content scrolls under it
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
            onScrollPositionChange={handleSearchScrollPosition}
          />
        </Animated.View>
      )}

      {/* Close button - positioned outside the morphing card */}
      {/* Hides when sticky (close button moves inside search bar when sticky) */}
      {searchVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: insets.top + 12,
            right: 16,
            zIndex: 200, // Above the morphing pill (150)
            // Visible when modal is open (pillMorphProgress) AND not sticky (inverse of stickyProgress)
            opacity: Animated.multiply(
              pillMorphProgress,
              searchBarStickyProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              })
            ),
          }}
          pointerEvents={isSearchBarSticky.current ? 'none' : 'auto'}
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
