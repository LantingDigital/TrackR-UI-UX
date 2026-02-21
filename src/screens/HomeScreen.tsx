import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { StyleSheet, View, FlatList, ListRenderItemInfo, Animated, Dimensions, Pressable, Keyboard, Easing, Text, ScrollView, TextInput, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabFocus } from '../hooks/useTabFocus';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
// Reanimated for smooth UI-thread animations (per CLAUDE.md: ALWAYS use Reanimated)
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing as ReanimatedEasing,
} from 'react-native-reanimated';

import { SearchBar, ActionPill, NewsCard, SearchOverlay, SearchModal, MorphingActionButton } from '../components';
import { MorphingPill, MorphingPillRef } from '../components/MorphingPill';
import { LogModal } from '../components/LogModal';
import { LogConfirmationCard } from '../components/LogConfirmationCard';
import { RatingModal } from '../components/RatingModal';
import { WalletCardStack, ScanModal, QuickActionsMenu, GateModeOverlay } from '../components/wallet';
import { Ticket } from '../types/wallet';
import { useWallet } from '../hooks/useWallet';
import { useTabBar } from '../contexts/TabBarContext';
import { MOCK_NEWS, NewsItem } from '../data/mockNews';
import { RECENT_SEARCHES, searchItems, getTypeIcon, SearchableItem, NEARBY_RIDES, ALL_SEARCHABLE_ITEMS } from '../data/mockSearchData';
import { RideLog, completeRating } from '../stores/rideLogStore';

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
  const [logVisible, setLogVisible] = useState(false);
  const [logOrigin, setLogOrigin] = useState<'logPill' | 'logCircle'>('logPill');
  const [scanOrigin, setScanOrigin] = useState<'scanPill' | 'scanCircle'>('scanPill');
  const [walletVisible, setWalletVisible] = useState(false);
  // Log confirmation card state
  const [selectedCoaster, setSelectedCoaster] = useState<SearchableItem | null>(null);
  const [coasterPosition, setCoasterPosition] = useState({ x: 0, y: 0, width: 120, height: 120 });
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  // Rating modal state (for Rate Now flow from LogConfirmationCard)
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingLog, setRatingLog] = useState<RideLog | null>(null);
  const [ratingImageUrl, setRatingImageUrl] = useState('');

  // Quick actions menu state (for pass long press)
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);
  const [selectedQuickActionTicket, setSelectedQuickActionTicket] = useState<Ticket | null>(null);
  // Gate mode state (for scan action from quick menu)
  const [gateModeVisible, setGateModeVisible] = useState(false);
  const [gateModeTicket, setGateModeTicket] = useState<Ticket | null>(null);

  // Modal animation lock — blocks all touches during open/close animations
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const isModalAnimatingRef = useRef(false);

  // Wallet context
  const { stackTickets, setDefaultTicket, markTicketUsed, toggleFavorite, deleteTicket, favoriteTickets, tickets } = useWallet();

  // Tab bar context for screen reset functionality
  const tabBarContext = useTabBar();

  // Animation lock handlers — set/unset touch-blocking overlay during modal animations
  const handleModalAnimStart = useCallback(() => {
    isModalAnimatingRef.current = true;
    setIsModalAnimating(true);
  }, []);

  const handleModalAnimEnd = useCallback(() => {
    isModalAnimatingRef.current = false;
    setIsModalAnimating(false);
  }, []);

  // Scroll state as shared values (accessible from scroll worklet on UI thread)
  const isCollapsed = useSharedValue(0); // 0 = expanded, 1 = collapsed
  const lastScrollYShared = useSharedValue(0);
  const lastStateChangeTimeShared = useSharedValue(0);
  const contentHeightShared = useSharedValue(0);
  const viewportHeightShared = useSharedValue(0);

  // Tracks which element triggered the search MorphingPill (mutable ref for callbacks)
  // Bar origins: pill covers search bar → "pill IS the search bar" pattern
  // Button origins: pill covers button → "hide pill after close" pattern
  const searchOriginRef = useRef<'expandedSearchBar' | 'collapsedSearchBar' | 'searchPill' | 'collapsedCircle'>('expandedSearchBar');
  // Ref for the log modal input (allows focusing from sectionsOnly mode)
  const logInputRef = useRef<TextInput>(null);
  // Ref for MorphingPill (allows triggering open from home search bar tap)
  const morphingPillRef = useRef<MorphingPillRef>(null);
  // Ref for Log MorphingPill (allows triggering open from log button tap)
  const logMorphingPillRef = useRef<MorphingPillRef>(null);
  // Ref for Scan MorphingPill (allows triggering open from scan button tap)
  const scanMorphingPillRef = useRef<MorphingPillRef>(null);
  // Ref for FlatList (allows scroll to top on Home tab tap)
  const flatListRef = useRef<FlatList>(null);

  // Note: animProgress/animProgressKey/animProgressRef removed
  // — replaced by Reanimated reanimatedProgress shared value

  // REANIMATED: Shared value for UI-thread animations (fixes lag after tab switch)
  const reanimatedProgress = useSharedValue(1);

  // REANIMATED: Separate shared values for each button (enables stagger effect)
  const buttonProgress0 = useSharedValue(1); // Log button
  const buttonProgress1 = useSharedValue(1); // Search button
  const buttonProgress2 = useSharedValue(1); // Scan button

  // Scroll-driven pill hiding: when scroll triggers expand/collapse, pills must hide
  // so the real buttons' animations are visible. Reset to 0 in each pill's onOpen.
  const logPillScrollHidden = useSharedValue(0);
  const searchPillScrollHidden = useSharedValue(0);
  const scanPillScrollHidden = useSharedValue(0);

  // Pill wrapper z-index: 10 at rest (same as stickyHeader, but AFTER it in DOM order
  // so pills render on top — no search bar shadow overcast on pill, no pill shadow on buttons).
  // 200 when modal is open (above backdrop/fog). Driven by shared values for UI-thread
  // synchronization — React state would cause a 2-3 frame delay, creating visible pop.
  const logPillZIndex = useSharedValue(10);
  const searchPillZIndex = useSharedValue(10);
  const scanPillZIndex = useSharedValue(10);

  // Close-in-progress flags: 1 during MorphingPill-driven close animation, 0 otherwise.
  // Used by z-index animated styles to drop pill below buttons when backdrop has faded,
  // preventing shadow overlay during the final phase of the close animation.
  const logIsClosing = useSharedValue(0);
  const searchIsClosing = useSharedValue(0);
  const scanIsClosing = useSharedValue(0);


  // Spring config for buttons
  const BUTTON_SPRING_CONFIG = {
    damping: 18,
    stiffness: 180,
    mass: 1,
  };

  // Fog gradient dimensions (fixed height, animated via transform)
  // Using scaleY + translateY instead of animated height prevents the 12-stop
  // LinearGradient from being redrawn every frame. The GPU scales the pre-rendered
  // gradient texture instead — dramatically cheaper.
  const FOG_EXPANDED_HEIGHT = 50 + insets.top + HEADER_HEIGHT_EXPANDED + 200;
  const FOG_COLLAPSED_HEIGHT = 50 + insets.top + HEADER_HEIGHT_COLLAPSED + 200;
  const FOG_SCALE_COLLAPSED = FOG_COLLAPSED_HEIGHT / FOG_EXPANDED_HEIGHT;

  const fogGradientAnimatedStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(
      reanimatedProgress.value,
      [0, 1],
      [FOG_SCALE_COLLAPSED, 1]
    );
    // Pin top edge: compensate for center-origin scaling
    const translateY = -FOG_EXPANDED_HEIGHT * (1 - scaleY) / 2;

    return {
      transform: [
        { translateY },
        { scaleY },
      ],
    };
  });

  // REANIMATED: Search bar animated style (runs on UI thread)
  // Static values calculated inline since they don't depend on other hooks
  const REANIMATED_CONTAINER_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
  const REANIMATED_COLLAPSED_SEARCH_WIDTH = SCREEN_WIDTH * 0.50;
  const REANIMATED_CIRCLE_SIZE = 42;
  const REANIMATED_TOTAL_CIRCLES_WIDTH = REANIMATED_CIRCLE_SIZE * 3;
  const REANIMATED_TOTAL_CONTENT_WIDTH = REANIMATED_COLLAPSED_SEARCH_WIDTH + REANIMATED_TOTAL_CIRCLES_WIDTH;
  const REANIMATED_REMAINING_SPACE = SCREEN_WIDTH - REANIMATED_TOTAL_CONTENT_WIDTH;
  const REANIMATED_EQUAL_GAP = REANIMATED_REMAINING_SPACE / 4;

  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(
      reanimatedProgress.value,
      [0, 1],
      [REANIMATED_COLLAPSED_SEARCH_WIDTH, REANIMATED_CONTAINER_WIDTH]
    ),
    height: interpolate(
      reanimatedProgress.value,
      [0, 1],
      [42, 56]
    ),
    marginLeft: interpolate(
      reanimatedProgress.value,
      [0, 1],
      [REANIMATED_EQUAL_GAP, HORIZONTAL_PADDING]
    ),
  }));

  // REANIMATED: Search bar text opacity styles
  const searchBarFullTextStyle = useAnimatedStyle(() => ({
    opacity: reanimatedProgress.value,
  }));

  const searchBarShortTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      reanimatedProgress.value,
      [0, 0.3, 1],
      [1, 0, 0],
      Extrapolation.CLAMP
    ),
  }));

  // Hero morph animation values for search modal (0 = pill, 1 = full card)
  const pillMorphProgress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  // Separate shared value for content fade (allows input to fade BEFORE pill shrinks on close)
  const searchContentFade = useSharedValue(0);
  // Shared values for action buttons visibility and morph-back effect
  // This allows smooth morph-back when modal closes instead of abrupt jump
  const actionButtonsOpacity = useSharedValue(1);
  const actionButtonsScale = useSharedValue(1);
  // Search bar visibility during morphs (hides when any modal opens, fades back on close)
  const searchBarMorphOpacity = useSharedValue(1);

  // Button opacity shared values (Reanimated — UI thread, no JS bridge overhead)
  // scale/translateX/translateY removed — they were never animated (always 1/0/0)
  const logButtonOpacity = useSharedValue(1);
  const searchButtonOpacity = useSharedValue(1);
  const scanButtonOpacity = useSharedValue(1);

  // Note: circleStage1Progress removed — only used by deleted old morphing pill code

  // Note: staggeredButtonProgress removed — replaced by Reanimated buttonProgress0/1/2 with withDelay stagger

  // Note: searchPillBounceProgress, closePhaseProgress removed — only used by deleted old morphing pill code

  // Search focus state: tracks whether the search input is focused
  // When focused, search bar slides up, section cards fade out, dropdown appears
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchFocusProgress = useSharedValue(0);

  // =========================================
  // Log Modal Animation Values (Reanimated — UI thread)
  // =========================================
  const logMorphProgress = useSharedValue(0);
  const logBackdropOpacity = useSharedValue(0);
  const logContentFade = useSharedValue(0);

  // Log focus state
  const [isLogFocused, setIsLogFocused] = useState(false);
  const logFocusProgress = useSharedValue(0);

  // =========================================
  // Scan Modal Animation Values (Reanimated — UI thread)
  // =========================================
  const scanBackdropOpacity = useSharedValue(0);
  const scanContentFade = useSharedValue(0);

  // Search query state for dropdown autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Log query state for dropdown autocomplete
  const [logQuery, setLogQuery] = useState('');
  const [debouncedLogQuery, setDebouncedLogQuery] = useState('');
  const logDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scan query state for pass filtering
  const [scanQuery, setScanQuery] = useState('');
  const [debouncedScanQuery, setDebouncedScanQuery] = useState('');
  const scanDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Staggered cascade animation for dropdown items
  const dropdownItemAnimations = useRef<Animated.Value[]>([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Note: triggerButtonStagger, staggerTimeoutsRef, staggerAnimsRef removed
  // — Reanimated buttonProgress0/1/2 with withDelay handle stagger natively

  // =========================================
  // PERF FIX: Force remount buttons when screen regains focus
  // =========================================
  // When navigating away and back, animated values can get into a corrupted state.
  // Using a remount key forces the MorphingActionButton components to fully remount,
  // which resets all their internal state and animated values.
  const [buttonRemountKey, setButtonRemountKey] = useState(0);
  // Track if we're ready for animations (shared value — accessible from scroll worklet)
  const isReadyForAnimations = useSharedValue(1); // 1 = ready, 0 = not ready

  // Focus handler — called when Home tab gains focus (pager animation complete)
  const handleTabFocus = useCallback(() => {
    // Pager animation is already complete — use rAF instead of InteractionManager
    requestAnimationFrame(() => {
      isReadyForAnimations.value = 1;

      // Force remount buttons to clear any corrupted state
      setButtonRemountKey(prev => prev + 1);

      // Reset collapse state and Reanimated progress to expanded
      isCollapsed.value = 0;
      reanimatedProgress.value = 1;
      buttonProgress0.value = 1;
      buttonProgress1.value = 1;
      buttonProgress2.value = 1;
    });
  }, []);

  // Blur handler — called immediately when switching away from Home tab
  const handleTabBlur = useCallback(() => {
    // Reset search modal (instant — no animations)
    if (morphingPillRef.current?.isOpen || morphingPillRef.current?.isAnimating) {
      pillMorphProgress.value = 0;
      searchContentFade.value = 0;
      backdropOpacity.value = 0;
      searchPillZIndex.value = 10;
      searchIsClosing.value = 0;
      searchPillScrollHidden.value = 1;
      searchButtonOpacity.value = 1;
      searchBarMorphOpacity.value = 1;
      setSearchVisible(false);
      setIsSearchFocused(false);
      setSearchQuery('');
      setDebouncedQuery('');
    }

    // Reset log modal
    if (logMorphingPillRef.current?.isOpen || logMorphingPillRef.current?.isAnimating) {
      logMorphProgress.value = 0;
      logContentFade.value = 0;
      logBackdropOpacity.value = 0;
      logPillZIndex.value = 10;
      logIsClosing.value = 0;
      logPillScrollHidden.value = 1;
      logButtonOpacity.value = 1;
      setLogVisible(false);
      setIsLogFocused(false);
      setLogQuery('');
      setDebouncedLogQuery('');
    }

    // Reset scan/wallet modal
    if (scanMorphingPillRef.current?.isOpen || scanMorphingPillRef.current?.isAnimating) {
      scanContentFade.value = 0;
      scanBackdropOpacity.value = 0;
      scanPillZIndex.value = 10;
      scanIsClosing.value = 0;
      scanPillScrollHidden.value = 1;
      scanButtonOpacity.value = 1;
      setWalletVisible(false);
    }

    // Reset sub-modals
    setConfirmationVisible(false);
    setSelectedCoaster(null);
    setRatingModalVisible(false);
    setRatingLog(null);
    setRatingImageUrl('');

    // Clear animation lock
    isModalAnimatingRef.current = false;
    setIsModalAnimating(false);

    // Mark not ready for animations while away
    isReadyForAnimations.value = 0;
  }, []);

  // Register focus/blur handlers with the tab pager system
  useTabFocus('Home', handleTabFocus, handleTabBlur);

  // Interaction handle ref — defers FlatList cell rendering during scroll animation
  const scrollInteractionRef = useRef<ReturnType<typeof InteractionManager.createInteractionHandle> | null>(null);
  const scrollInteractionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Haptics + interaction deferral wrapper for scroll worklet (must run on JS thread)
  const triggerScrollHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Register interaction handle — tells React Native to defer non-critical work
    // (FlatList cell rendering, deferred callbacks) during the spring animation
    if (scrollInteractionRef.current !== null) {
      InteractionManager.clearInteractionHandle(scrollInteractionRef.current);
    }
    if (scrollInteractionTimerRef.current !== null) {
      clearTimeout(scrollInteractionTimerRef.current);
    }
    scrollInteractionRef.current = InteractionManager.createInteractionHandle();
    scrollInteractionTimerRef.current = setTimeout(() => {
      if (scrollInteractionRef.current !== null) {
        InteractionManager.clearInteractionHandle(scrollInteractionRef.current);
        scrollInteractionRef.current = null;
      }
    }, 500); // Spring settles in ~400ms + buffer
  }, []);

  // REANIMATED: Scroll handler runs entirely on UI thread — no JS bridge crossing.
  // This eliminates the ~60/sec bridge overhead that caused FPS drops during
  // collapse/expand animations. All shared value reads/writes happen on UI thread.
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const offsetY = event.contentOffset.y;

      // 0. Skip animations if navigation interactions haven't completed yet
      if (!isReadyForAnimations.value) {
        lastScrollYShared.value = offsetY;
        return;
      }

      // 1. Ignore negative offsets (top bounce territory)
      if (offsetY <= 0) {
        lastScrollYShared.value = 0;
        return;
      }

      // 2. Ignore bottom bounce territory
      const maxScrollY = contentHeightShared.value - viewportHeightShared.value;
      if (maxScrollY > 0 && offsetY >= maxScrollY) {
        lastScrollYShared.value = offsetY;
        return;
      }

      // 3. Cooldown check - prevent rapid state changes during any bounce
      const now = Date.now();
      if (now - lastStateChangeTimeShared.value < STATE_CHANGE_COOLDOWN) {
        lastScrollYShared.value = offsetY;
        return;
      }

      const isScrollingUp = offsetY < lastScrollYShared.value;
      const scrollDelta = Math.abs(offsetY - lastScrollYShared.value);

      // Collapse when scrolling down past threshold
      if (offsetY > COLLAPSE_THRESHOLD && !isCollapsed.value && !isScrollingUp) {
        isCollapsed.value = 1;
        lastStateChangeTimeShared.value = now;
        runOnJS(triggerScrollHaptic)();
        // Hide any frozen pills so real buttons/search bar can animate
        logPillScrollHidden.value = 1;
        searchPillScrollHidden.value = 1;
        scanPillScrollHidden.value = 1;
        logPillZIndex.value = 10;
        searchPillZIndex.value = 10;
        scanPillZIndex.value = 10;
        logIsClosing.value = 0;
        searchIsClosing.value = 0;
        scanIsClosing.value = 0;
        logButtonOpacity.value = 1;
        searchButtonOpacity.value = 1;
        scanButtonOpacity.value = 1;
        searchBarMorphOpacity.value = 1; // Show real search bar (pill hidden)
        // All animations run on UI thread
        reanimatedProgress.value = withSpring(0, BUTTON_SPRING_CONFIG);
        buttonProgress0.value = withSpring(0, BUTTON_SPRING_CONFIG);
        buttonProgress1.value = withDelay(50, withSpring(0, BUTTON_SPRING_CONFIG));
        buttonProgress2.value = withDelay(100, withSpring(0, BUTTON_SPRING_CONFIG));
      }
      // Expand when scrolling up (with minimum delta to avoid jitter)
      else if (isScrollingUp && scrollDelta > 5 && isCollapsed.value) {
        isCollapsed.value = 0;
        lastStateChangeTimeShared.value = now;
        runOnJS(triggerScrollHaptic)();
        // Hide any frozen pills so real buttons/search bar can animate
        logPillScrollHidden.value = 1;
        searchPillScrollHidden.value = 1;
        scanPillScrollHidden.value = 1;
        logPillZIndex.value = 10;
        searchPillZIndex.value = 10;
        scanPillZIndex.value = 10;
        logIsClosing.value = 0;
        searchIsClosing.value = 0;
        scanIsClosing.value = 0;
        logButtonOpacity.value = 1;
        searchButtonOpacity.value = 1;
        scanButtonOpacity.value = 1;
        searchBarMorphOpacity.value = 1; // Show real search bar (pill hidden)
        // All animations run on UI thread
        reanimatedProgress.value = withSpring(1, BUTTON_SPRING_CONFIG);
        buttonProgress0.value = withSpring(1, BUTTON_SPRING_CONFIG);
        buttonProgress1.value = withDelay(50, withSpring(1, BUTTON_SPRING_CONFIG));
        buttonProgress2.value = withDelay(100, withSpring(1, BUTTON_SPRING_CONFIG));
      }

      lastScrollYShared.value = offsetY;
    },
  });

  // Helper function to animate action buttons during modal open
  // Origin button crossfades with morphing pill, other buttons animate toward origin
  // Note: triggerSearchOpen removed — MorphingPill handles open animation internally
  // The MorphingPill's onOpen callback coordinates external elements (backdrop, content fade)

  // Per-origin press handlers
  // Search bar press - determines origin based on current collapse state
  const handleSearchBarPress = useCallback(() => {
    if (isModalAnimatingRef.current) return;
    // Pre-hide frozen pill at previous position (prevents visible jump if switching origins)
    // e.g. pill was at button position from a previous button-origin close
    searchPillScrollHidden.value = 1;
    searchBarMorphOpacity.value = 1; // Show real search bar while pill transitions
    searchButtonOpacity.value = 1; // Show real button (pill is hiding)

    // Set origin based on current collapse state BEFORE opening
    const origin = isCollapsed.value ? 'collapsedSearchBar' : 'expandedSearchBar';
    setSearchOrigin(origin);
    searchOriginRef.current = origin; // Update ref immediately for callback access

    // Use requestAnimationFrame to ensure state update is processed before open
    requestAnimationFrame(() => {
      if (morphingPillRef.current) {
        morphingPillRef.current.open();
      }
    });
  }, []);

  // Search action button press - determines origin based on current collapse state
  const handleSearchButtonPress = useCallback(() => {
    if (isModalAnimatingRef.current) return;
    // Pre-hide frozen pill at previous position (prevents visible jump if switching origins)
    // e.g. pill was at search bar position from a previous bar-origin close
    searchPillScrollHidden.value = 1;
    searchBarMorphOpacity.value = 1; // Show real search bar (pill is hiding)
    searchButtonOpacity.value = 1; // Show real button until pill takes over

    // Set origin based on current collapse state BEFORE opening
    const origin = isCollapsed.value ? 'collapsedCircle' : 'searchPill';
    setSearchOrigin(origin);
    searchOriginRef.current = origin; // Update ref immediately for callback access

    // Use requestAnimationFrame to ensure state update is processed before open
    requestAnimationFrame(() => {
      if (morphingPillRef.current) {
        morphingPillRef.current.open();
      }
    });
  }, []);

  const handleSearchClose = useCallback(() => {
    Keyboard.dismiss();

    // Reset focus state immediately so modal starts fresh next time
    setIsSearchFocused(false);
    searchFocusProgress.value = 0;
    setSearchQuery('');
    setDebouncedQuery('');

    // GUARANTEE header is expanded when returning to home screen
    // This is critical - no matter how user got to modal, they return to expanded header
    isCollapsed.value = 0;
    reanimatedProgress.value = 1; // Instant - header is behind modal anyway
    buttonProgress0.value = 1;
    buttonProgress1.value = 1;
    buttonProgress2.value = 1;

    // ALWAYS change origin to expandedSearchBar for close animation
    // This ensures the pill ALWAYS morphs back to the expanded search bar position
    setSearchOrigin('expandedSearchBar');
    searchOriginRef.current = 'expandedSearchBar'; // Keep ref in sync for callbacks

    // Restore all real elements immediately (before animation — we're on JS thread)
    searchButtonOpacity.value = 1;
    searchBarMorphOpacity.value = 1;

    // UNIFIED EXIT ANIMATION for all origins
    // Step 1: Fade out content first (150ms), then run parallel animations
    searchContentFade.value = withTiming(0, { duration: 150 }, () => {
      // Step 2: Slide pill back + fade backdrop
      pillMorphProgress.value = withTiming(0, {
        duration: 300,
        easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
      });
      backdropOpacity.value = withTiming(0, { duration: 250 });
      // Hide frozen pill (real elements already visible from above)
      searchPillScrollHidden.value = 1;
      searchPillZIndex.value = 10;
      runOnJS(setSearchVisible)(false);
    });
  }, []);

  // Search focus handlers - animate search bar up/down and toggle dropdown
  const handleSearchFocus = useCallback(() => {
    setIsSearchFocused(true);
    searchFocusProgress.value = withTiming(1, {
      duration: 250,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });
  }, []);

  const handleSearchUnfocus = useCallback(() => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
    searchFocusProgress.value = withTiming(0, {
      duration: 250,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });
  }, []);

  // X button handler: unfocus first, then close modal
  const handleXButtonPress = useCallback(() => {
    if (isSearchFocused) {
      handleSearchUnfocus();
    } else {
      handleSearchClose();
    }
  }, [isSearchFocused, handleSearchUnfocus, handleSearchClose]);

  // Backdrop tap handler: unfocus when focused, do nothing when unfocused
  const handleBackdropPress = useCallback(() => {
    if (isSearchFocused) {
      handleSearchUnfocus();
    }
    // Don't close modal on backdrop tap when unfocused
  }, [isSearchFocused, handleSearchUnfocus]);

  // Handle search query changes from SearchModal
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Debounce effect for autocomplete - only update after 300ms typing pause
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Handle scan query changes from ScanModal
  const handleScanQueryChange = useCallback((query: string) => {
    setScanQuery(query);
  }, []);

  // ===== Quick Actions Menu Handlers =====

  // Handle long press on a pass card - show quick actions menu
  const handlePassLongPress = useCallback((ticket: Ticket) => {
    setSelectedQuickActionTicket(ticket);
    setQuickActionsVisible(true);
  }, []);

  // Close quick actions menu
  const handleCloseQuickActions = useCallback(() => {
    setQuickActionsVisible(false);
    setSelectedQuickActionTicket(null);
  }, []);

  // Quick action: Scan (open gate mode)
  const handleQuickActionScan = useCallback((ticket: Ticket) => {
    setGateModeTicket(ticket);
    setGateModeVisible(true);
    markTicketUsed(ticket.id);
  }, [markTicketUsed]);

  // Quick action: Toggle favorite
  const handleQuickActionToggleFavorite = useCallback(async (ticket: Ticket) => {
    try {
      await toggleFavorite(ticket.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [toggleFavorite]);

  // Quick action: Edit (placeholder - would navigate to edit screen)
  const handleQuickActionEdit = useCallback((ticket: Ticket) => {
    console.log('Edit ticket:', ticket.id);
    // TODO: Navigate to edit pass screen
  }, []);

  // Quick action: Delete
  const handleQuickActionDelete = useCallback(async (ticket: Ticket) => {
    try {
      await deleteTicket(ticket.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [deleteTicket]);

  // Close gate mode
  const handleCloseGateMode = useCallback(() => {
    setGateModeVisible(false);
    setGateModeTicket(null);
  }, []);

  // Check if favorites limit is reached (max 3)
  const favoritesLimitReached = useMemo(() => {
    return favoriteTickets.length >= 3;
  }, [favoriteTickets]);

  // Debounce effect for scan pass filtering - only update after 200ms typing pause
  // (Shorter than search since filtering is local and fast)
  useEffect(() => {
    if (scanDebounceTimerRef.current) {
      clearTimeout(scanDebounceTimerRef.current);
    }
    scanDebounceTimerRef.current = setTimeout(() => {
      setDebouncedScanQuery(scanQuery);
    }, 200);

    return () => {
      if (scanDebounceTimerRef.current) {
        clearTimeout(scanDebounceTimerRef.current);
      }
    };
  }, [scanQuery]);

  // Trigger staggered cascade animation when dropdown becomes visible or content changes
  useEffect(() => {
    if (isSearchFocused) {
      // Reset all item animations
      dropdownItemAnimations.forEach(anim => anim.setValue(0));

      // Stagger animate each item (50ms delay between items)
      const staggeredAnimations = dropdownItemAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          delay: index * 50,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      );

      Animated.parallel(staggeredAnimations).start();
    }
  }, [isSearchFocused, debouncedQuery, dropdownItemAnimations]);

  // Get dropdown items - recent searches when empty, autocomplete results when typing
  const dropdownItems = useMemo(() => {
    if (debouncedQuery.trim()) {
      // Autocomplete mode - show matching items
      return searchItems(debouncedQuery).slice(0, 8);
    } else {
      // Recent searches mode - convert string[] to SearchableItem[] format
      return RECENT_SEARCHES.slice(0, 5).map((name, index) => {
        // Try to find a matching item in NEARBY_RIDES for richer data
        const matchingRide = NEARBY_RIDES.find(r => r.name === name);
        return matchingRide || {
          id: `recent-${index}`,
          name,
          image: '',
          type: 'ride' as const,
          subtitle: 'Recent search',
        };
      });
    }
  }, [debouncedQuery]);

  const handleSearch = useCallback((query: string) => {
    console.log('Searching for:', query);
    setSearchVisible(false);
  }, []);

  // =========================================
  // Log Modal Handlers
  // =========================================
  const handleLogPress = useCallback(() => {
    if (isModalAnimatingRef.current) return;
    // Set origin based on current collapse state BEFORE opening
    const origin = isCollapsed.value ? 'logCircle' : 'logPill';
    setLogOrigin(origin);

    // Use requestAnimationFrame to ensure state update is processed before open
    requestAnimationFrame(() => {
      if (logMorphingPillRef.current) {
        logMorphingPillRef.current.open();
      }
    });
  }, []);

  const handleLogClose = useCallback(() => {
    Keyboard.dismiss();
    setIsLogFocused(false);
    logFocusProgress.value = 0;
    setLogQuery('');
    setDebouncedLogQuery('');

    isCollapsed.value = 0;
    reanimatedProgress.value = 1; // Instant - header is behind modal anyway
    buttonProgress0.value = 1;
    buttonProgress1.value = 1;
    buttonProgress2.value = 1;
    setLogOrigin('logPill');

    // Step 1: Fade out content (150ms), then parallel morph + backdrop
    logContentFade.value = withTiming(0, { duration: 150 }, () => {
      logMorphProgress.value = withTiming(0, {
        duration: 300,
        easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
      });
      logBackdropOpacity.value = withTiming(0, { duration: 250 }, () => {
        logPillZIndex.value = 10;
        runOnJS(setLogVisible)(false);
      });
    });

  }, []);

  // Log focus handlers (Reanimated — UI thread)
  const handleLogFocus = useCallback(() => {
    setIsLogFocused(true);
    logFocusProgress.value = withTiming(1, {
      duration: 250,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });
  }, []);

  const handleLogUnfocus = useCallback(() => {
    Keyboard.dismiss();
    setIsLogFocused(false);
    logFocusProgress.value = withTiming(0, {
      duration: 250,
      easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
    });
  }, []);

  // Log X button handler: unfocus first, then close modal
  const handleLogXButtonPress = useCallback(() => {
    if (isLogFocused) {
      handleLogUnfocus();
    } else {
      // Use MorphingPill's close method
      logMorphingPillRef.current?.close();
    }
  }, [isLogFocused, handleLogUnfocus]);

  // Log backdrop tap handler
  const handleLogBackdropPress = useCallback(() => {
    if (isLogFocused) {
      handleLogUnfocus();
    }
  }, [isLogFocused, handleLogUnfocus]);

  // Handle focus input request from sectionsOnly mode (e.g., "Add your first ride" button)
  const handleLogInputFocus = useCallback(() => {
    logInputRef.current?.focus();
    handleLogFocus();
  }, [handleLogFocus]);

  // Handle log query changes
  const handleLogQueryChange = useCallback((query: string) => {
    setLogQuery(query);
  }, []);

  // Handle card selection from LogModal
  const handleLogCardSelect = useCallback((item: SearchableItem, cardLayout: { x: number; y: number; width: number; height: number }) => {
    setSelectedCoaster(item);
    setCoasterPosition(cardLayout);
    setConfirmationVisible(true);
  }, []);

  // Handle confirmation card close (back/cancel)
  const handleConfirmationClose = useCallback(() => {
    setConfirmationVisible(false);
    setSelectedCoaster(null);
  }, []);

  // Handle successful log completion - stay on Log modal
  const handleLogComplete = useCallback(() => {
    setConfirmationVisible(false);
    setSelectedCoaster(null);
    // Keep the Log modal open so user can log more rides
  }, []);

  // Handle Rate Now from LogConfirmationCard
  const handleRateNow = useCallback((item: SearchableItem, newLog: RideLog) => {
    // Store the log and image for the RatingModal
    setRatingLog(newLog);
    setRatingImageUrl(item.image || 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400');

    // Wait 300ms for the confirmation card slide-out animation
    setTimeout(() => {
      setRatingModalVisible(true);
      tabBarContext?.hideTabBar(200);
    }, 300);
  }, [tabBarContext]);

  // Handle RatingModal close
  const handleRatingModalClose = useCallback(() => {
    setRatingModalVisible(false);
    setRatingLog(null);
    setRatingImageUrl('');
    tabBarContext?.showTabBar(200);
  }, [tabBarContext]);

  // Handle RatingModal complete
  const handleRatingComplete = useCallback((log: RideLog, ratings: Record<string, number>) => {
    completeRating(log.id, ratings);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRatingModalVisible(false);
    setRatingLog(null);
    setRatingImageUrl('');
    tabBarContext?.showTabBar(200);
  }, [tabBarContext]);

  const handleScanPress = useCallback(() => {
    if (isModalAnimatingRef.current) return;
    // Set origin based on current collapse state BEFORE opening
    const origin = isCollapsed.value ? 'scanCircle' : 'scanPill';
    setScanOrigin(origin);

    // Use requestAnimationFrame to ensure state update is processed before open
    requestAnimationFrame(() => {
      if (scanMorphingPillRef.current) {
        scanMorphingPillRef.current.open();
      }
    });
  }, []);

  const handleWalletClose = useCallback(() => {
    scanPillZIndex.value = 10;
    setWalletVisible(false);
  }, []);

  const handleWalletAddTicket = useCallback(() => {
    // Close wallet properly using MorphingPill's close method
    // This ensures the search bar animates back and state is cleaned up
    scanMorphingPillRef.current?.close();
    // TODO: Navigate to Profile screen's wallet section
    console.log('Navigate to Profile to add ticket');
  }, []);

  // Register reset handler for Home screen - animates modals closed when tab is pressed
  // Home tab acts as X button - closes any open modal and scrolls to top
  useEffect(() => {
    const resetHandler = () => {
      // Close modals with animation using MorphingPill refs
      if (searchVisible && morphingPillRef.current) {
        morphingPillRef.current.close();
      } else if (logVisible && logMorphingPillRef.current) {
        logMorphingPillRef.current.close();
      } else if (walletVisible && scanMorphingPillRef.current) {
        scanMorphingPillRef.current.close();
      }

      // Reset confirmation card (this is a sub-modal, close instantly)
      if (confirmationVisible) {
        setConfirmationVisible(false);
        setSelectedCoaster(null);
      }

      // Close rating modal if open
      if (ratingModalVisible) {
        setRatingModalVisible(false);
        setRatingLog(null);
        setRatingImageUrl('');
      }

      // Scroll to top smoothly if not already at top
      if (lastScrollYShared.value > 0) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    };
    tabBarContext?.registerResetHandler('Home', resetHandler);
    return () => {
      tabBarContext?.unregisterResetHandler('Home');
    };
  }, [searchVisible, logVisible, walletVisible, confirmationVisible, ratingModalVisible, tabBarContext, handleWalletClose]);

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

  // Note: searchBarWidth/Height/Scale, headerHeight, pillsRowOpacity removed
  // — replaced by Reanimated searchBarAnimatedStyle + buttonProgress shared values

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
        // MUST use REANIMATED_EQUAL_GAP (not equalGap) to match real search bar's marginLeft
        return {
          top: insets.top + 12,
          left: REANIMATED_EQUAL_GAP,
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
  // Dynamic Pill Content Based on Origin
  // =========================================
  // Returns appropriate content for the MorphingPill's closed state
  // Each origin type has a different appearance to match the element being replaced
  const searchPillContent = useMemo(() => {
    // CRITICAL: All pillContent must use absolute positioning to fill the entire container
    // This bypasses contentWrapper's flex behavior and ensures pixel-perfect alignment
    // with the actual destination elements when the close animation ends
    const absoluteFill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

    switch (searchOrigin) {
      case 'searchPill':
        // Action pill button - matches MorphingActionButton expanded state EXACTLY
        // Uses absoluteFill + centered row layout (same as MorphingActionButton's pressable style)
        // IMPORTANT: marginLeft must be on wrapper View, not Text, to match MorphingActionButton
        return (
          <View style={{ ...absoluteFill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="search-outline" size={16} color="#000000" />
            <View style={{ marginLeft: 6, maxWidth: 100, overflow: 'hidden' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }} numberOfLines={1}>Search</Text>
            </View>
          </View>
        );
      case 'collapsedCircle':
        // Circle button - matches MorphingActionButton collapsed state EXACTLY
        // Just centered icon, no label (same as MorphingActionButton when collapsed)
        return (
          <View style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="search-outline" size={16} color="#000000" />
          </View>
        );
      case 'expandedSearchBar':
        // Full search bar - MUST MATCH real search bar EXACTLY for seamless close
        // Uses absoluteFill + same layout as real search bar (row with padding, icon, text)
        return (
          <View style={{ ...absoluteFill, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            <View style={{ width: 20, height: 20, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="globe-outline" size={20} color="#999999" />
            </View>
            <View style={{ flex: 1, height: '100%', justifyContent: 'center', position: 'relative' }}>
              <Text style={{ position: 'absolute', fontSize: 16, color: '#999999' }} numberOfLines={1}>
                Search rides, parks, news...
              </Text>
            </View>
          </View>
        );
      case 'collapsedSearchBar':
        // Collapsed search bar - MUST MATCH real collapsed search bar EXACTLY
        // Uses absoluteFill + same layout as real search bar (row with padding, icon, text)
        return (
          <View style={{ ...absoluteFill, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
            <View style={{ width: 20, height: 20, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="globe-outline" size={20} color="#999999" />
            </View>
            <View style={{ flex: 1, height: '100%', justifyContent: 'center', position: 'relative' }}>
              <Text style={{ position: 'absolute', fontSize: 16, color: '#999999' }} numberOfLines={1}>
                Search...
              </Text>
            </View>
          </View>
        );
      default:
        // Default to searchPill layout (matches MorphingActionButton exactly)
        return (
          <View style={{ ...absoluteFill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="search-outline" size={16} color="#000000" />
            <View style={{ marginLeft: 6, maxWidth: 100, overflow: 'hidden' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }} numberOfLines={1}>Search</Text>
            </View>
          </View>
        );
    }
  }, [searchOrigin]);

  // Note: intermediatePillPosition removed — only used by old disabled morphing pill JSX

  // Note: Old morphing pill interpolations removed (topBounce/Linear, leftBounce/Linear,
  // widthBounce/Linear, heightBounce/Linear, borderRadiusBounce/Linear, searchInputOpacity,
  // morphingPillTop/Left/Width/Height/BorderRadius, focusTopOffset, morphingPillTopBase)
  // — only used by old disabled morphing pill JSX block (now deleted)
  // The MorphingPill component handles its own morph animation internally

  // Note: pillPlaceholderOpacity, globeIconOpacity, searchIconOpacity,
  // morphingShadowOpacity, morphingShadowRadius removed — only used by deleted old morphing pill JSX

  // Note: homeSearchBarOpacity, combinedMorphProgress, morphingPillOpacity removed
  // — MorphingPill overlay handles search bar handoff

  // =========================================
  // Reanimated Animated Styles for Search Morph
  // =========================================
  // Backdrop opacity
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Fog gradient / content fade
  const searchContentFadeStyle = useAnimatedStyle(() => ({
    opacity: searchContentFade.value,
  }));

  // "SEARCH" header: combined content fade × focus fade
  const searchHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchContentFade.value * interpolate(
      searchFocusProgress.value,
      [0, 0.5],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  // Section cards container: combined content fade × focus fade
  const sectionCardsContainerStyle = useAnimatedStyle(() => ({
    opacity: searchContentFade.value * interpolate(
      searchFocusProgress.value,
      [0, 0.3],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  // Dropdown list fade in when focused
  const dropdownFocusStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      searchFocusProgress.value,
      [0.3, 1],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  // Action buttons container
  const actionButtonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionButtonsOpacity.value,
    transform: [{ scale: actionButtonsScale.value }],
  }));

  const searchBarMorphAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchBarMorphOpacity.value,
  }));

  // Button opacity animated styles (Reanimated — no JS bridge)
  const logButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logButtonOpacity.value,
  }));
  const searchButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchButtonOpacity.value,
  }));
  const scanButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scanButtonOpacity.value,
  }));

  // Pill wrapper z-index animated styles (UI-thread driven, no React state delay)
  // During close: once backdrop has fully faded (opacity < 0.01), the pill is at/past
  // its rest position. Drop z to 10 so pill's shadow renders behind buttons (z=11)
  // instead of on top. This eliminates the shadow overcast during close animation.
  const logPillWrapperZStyle = useAnimatedStyle(() => {
    if (logPillZIndex.value <= 10) return { zIndex: 10 };
    if (logIsClosing.value === 1 && logBackdropOpacity.value < 0.01) {
      return { zIndex: 10 };
    }
    return { zIndex: logPillZIndex.value };
  });
  const searchPillWrapperZStyle = useAnimatedStyle(() => {
    if (searchPillZIndex.value <= 10) return { zIndex: 10 };
    if (searchIsClosing.value === 1 && backdropOpacity.value < 0.01) {
      return { zIndex: 10 };
    }
    return { zIndex: searchPillZIndex.value };
  });
  const scanPillWrapperZStyle = useAnimatedStyle(() => {
    if (scanPillZIndex.value <= 10) return { zIndex: 10 };
    if (scanIsClosing.value === 1 && scanBackdropOpacity.value < 0.01) {
      return { zIndex: 10 };
    }
    return { zIndex: scanPillZIndex.value };
  });

  // =========================================
  // Log Modal Interpolations (mirrors search)
  // =========================================
  // Log pill origin position (always from Log button position)
  const logOriginPosition = useMemo(() => {
    const PILL_HEIGHT = 36;
    const PILL_BORDER_RADIUS = 18;

    if (logOrigin === 'logCircle') {
      return {
        top: insets.top + collapsedY - circleSize / 2,
        left: collapsedPositions[0].x - circleSize / 2,
        width: circleSize,
        height: circleSize,
        borderRadius: circleSize / 2,
      };
    }
    // logPill - expanded state
    return {
      top: insets.top + expandedY - 18,
      left: expandedPositions[0].x - pillWidth / 2,
      width: pillWidth,
      height: PILL_HEIGHT,
      borderRadius: PILL_BORDER_RADIUS,
    };
  }, [logOrigin, insets.top, circleSize, collapsedY, collapsedPositions, expandedY, expandedPositions, pillWidth]);

  // =========================================
  // Dynamic Log Pill Content Based on Origin
  // =========================================
  // Returns appropriate content for the Log MorphingPill's closed state
  // Each origin type has a different appearance to match the element being replaced
  const logPillContent = useMemo(() => {
    // CRITICAL: All pillContent must use absolute positioning to fill the entire container
    // This bypasses contentWrapper's flex behavior and ensures pixel-perfect alignment
    // with the actual destination elements when the close animation ends
    const absoluteFill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

    if (logOrigin === 'logCircle') {
      // Circle button - matches MorphingActionButton collapsed state EXACTLY
      // Just centered icon, no label (same as MorphingActionButton when collapsed)
      return (
        <View style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="add-circle-outline" size={16} color="#000000" />
        </View>
      );
    }
    // logPill - Action pill button - matches MorphingActionButton expanded state EXACTLY
    // Uses absoluteFill + centered row layout (same as MorphingActionButton's pressable style)
    return (
      <View style={{ ...absoluteFill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="add-circle-outline" size={16} color="#000000" />
        <View style={{ marginLeft: 6, maxWidth: 100, overflow: 'hidden' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }} numberOfLines={1}>Log</Text>
        </View>
      </View>
    );
  }, [logOrigin]);

  // =========================================
  // Scan Modal Interpolations (mirrors log)
  // =========================================
  // Scan pill origin position (always from Scan button position)
  const scanOriginPosition = useMemo(() => {
    const PILL_HEIGHT = 36;
    const PILL_BORDER_RADIUS = 18;

    if (scanOrigin === 'scanCircle') {
      return {
        top: insets.top + collapsedY - circleSize / 2,
        left: collapsedPositions[2].x - circleSize / 2, // Scan is index 2
        width: circleSize,
        height: circleSize,
        borderRadius: circleSize / 2,
      };
    }
    // scanPill - expanded state
    return {
      top: insets.top + expandedY - 18,
      left: expandedPositions[2].x - pillWidth / 2, // Scan is index 2
      width: pillWidth,
      height: PILL_HEIGHT,
      borderRadius: PILL_BORDER_RADIUS,
    };
  }, [scanOrigin, insets.top, circleSize, collapsedY, collapsedPositions, expandedY, expandedPositions, pillWidth]);

  // =========================================
  // Dynamic Scan Pill Content Based on Origin
  // =========================================
  // Returns appropriate content for the Scan MorphingPill's closed state
  // Each origin type has a different appearance to match the element being replaced
  const scanPillContent = useMemo(() => {
    // CRITICAL: All pillContent must use absolute positioning to fill the entire container
    // This bypasses contentWrapper's flex behavior and ensures pixel-perfect alignment
    // with the actual destination elements when the close animation ends
    const absoluteFill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

    if (scanOrigin === 'scanCircle') {
      // Circle button - matches MorphingActionButton collapsed state EXACTLY
      // Just centered icon, no label (same as MorphingActionButton when collapsed)
      return (
        <View style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="barcode-outline" size={16} color="#000000" />
        </View>
      );
    }
    // scanPill - Action pill button - matches MorphingActionButton expanded state EXACTLY
    // Uses absoluteFill + centered row layout (same as MorphingActionButton's pressable style)
    return (
      <View style={{ ...absoluteFill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="barcode-outline" size={16} color="#000000" />
        <View style={{ marginLeft: 6, maxWidth: 100, overflow: 'hidden' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }} numberOfLines={1}>Scan</Text>
        </View>
      </View>
    );
  }, [scanOrigin]);

  // =========================================
  // Log Modal Animated Styles (Reanimated — UI thread)
  // =========================================

  // Log backdrop opacity
  const logBackdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logBackdropOpacity.value,
  }));

  // Log fog gradient (static height like Search modal, fades with contentFade)
  const logFogAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logContentFade.value,
  }));

  // LOG header text: contentFade * headerFocusOpacity
  const logHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logContentFade.value * interpolate(
      logFocusProgress.value, [0, 0.5], [1, 0], Extrapolation.CLAMP
    ),
  }));

  // Log section cards: contentFade * sectionCardsFocusOpacity
  const logSectionCardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logContentFade.value * interpolate(
      logFocusProgress.value, [0, 0.3], [1, 0], Extrapolation.CLAMP
    ),
  }));

  // Log dropdown focus style
  const logDropdownFocusStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      logFocusProgress.value, [0.3, 1], [0, 1], Extrapolation.CLAMP
    ),
  }));

  // =========================================
  // Scan Modal Animated Styles (Reanimated — UI thread)
  // =========================================
  const scanBackdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scanBackdropOpacity.value,
  }));

  const scanFogAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scanContentFade.value,
  }));

  const scanHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scanContentFade.value,
  }));

  const scanSectionCardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scanContentFade.value,
  }));

  return (
    <View style={styles.container}>
      {/* Main Content Wrapper - no paddingTop so content can scroll behind status bar */}
      <View style={styles.mainContentWrapper}>
      {/* News Feed - comes first, header floats over it */}
      {/* Content starts below status bar + header, but can scroll behind both */}
      <Reanimated.FlatList
        ref={flatListRef}
        data={MOCK_NEWS}
        keyExtractor={keyExtractor}
        renderItem={renderNewsCard}
        contentContainerStyle={[styles.feedContent, { paddingTop: insets.top + HEADER_HEIGHT_EXPANDED }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews={true}
        onContentSizeChange={(_w: number, h: number) => { contentHeightShared.value = h; }}
        onLayout={(e: any) => { viewportHeightShared.value = e.nativeEvent.layout.height; }}
      />

      {/* Fog Gradient Overlay - warmer tone with longer gradual fade section */}
      {/* Fixed height at expanded size; scaleY transform shrinks it when collapsed. */}
      {/* This prevents the 12-stop LinearGradient from being redrawn every frame. */}
      <Reanimated.View
        style={[
          {
            position: 'absolute',
            top: -50,
            left: 0,
            right: 0,
            height: FOG_EXPANDED_HEIGHT,
            zIndex: 5,
            pointerEvents: 'none',
          },
          fogGradientAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(240, 238, 235, 0.94)',   // Solid through header
            'rgba(240, 238, 235, 0.94)',   // Status bar area
            'rgba(240, 238, 235, 0.94)',   // Search bar area
            'rgba(240, 238, 235, 0.88)',   // Action buttons - starts easing
            'rgba(240, 238, 235, 0.75)',   // Gradual fade
            'rgba(240, 238, 235, 0.55)',   // Mid fade
            'rgba(240, 238, 235, 0.35)',   // Continue fading
            'rgba(240, 238, 235, 0.18)',   // Getting lighter
            'rgba(240, 238, 235, 0.08)',   // Very light
            'rgba(240, 238, 235, 0.03)',   // Barely visible
            'rgba(240, 238, 235, 0.01)',   // Almost invisible
            'transparent',                  // Fully clear
          ]}
          locations={[0, 0.12, 0.24, 0.32, 0.38, 0.44, 0.50, 0.55, 0.60, 0.64, 0.68, 0.72]}
          style={{ flex: 1 }}
        />
      </Reanimated.View>

      {/* Sticky Header - absolutely positioned, floats over content */}
      {/* overflow: visible allows button animations to extend beyond container */}
      {/* No animated height - let content flow naturally, fog handles the visual boundary */}
      <View
        style={[
          styles.stickyHeader,
          {
            position: 'absolute',
            top: 0, // Start from very top (covers status bar)
            left: 0,
            right: 0,
            paddingTop: insets.top, // Push content below status bar
            overflow: 'visible', // Don't clip button animations
          }
        ]}
        pointerEvents={searchVisible || logVisible || walletVisible ? 'none' : 'auto'}
      >
        {/* Search Bar Row - REANIMATED for smooth UI-thread animation */}
        <View style={[styles.header, { paddingHorizontal: 0 }]}>
          <Pressable onPress={handleSearchBarPress}>
            <Reanimated.View
              style={[
                searchBarAnimatedStyle,
                searchBarMorphAnimatedStyle,
                {
                  backgroundColor: '#FFFFFF',
                  borderRadius: 28,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.30,
                  shadowRadius: 20,
                  elevation: 8,
                },
              ]}
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
              <View
                style={{
                  flex: 1,
                  height: '100%',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                pointerEvents="none"
              >
                {/* Full placeholder - visible when expanded */}
                <Reanimated.Text
                  style={[
                    searchBarFullTextStyle,
                    {
                      position: 'absolute',
                      fontSize: 16,
                      color: '#999999',
                    },
                  ]}
                  numberOfLines={1}
                >
                  Search rides, parks, news...
                </Reanimated.Text>
                {/* Short placeholder - visible when collapsed */}
                <Reanimated.Text
                  style={[
                    searchBarShortTextStyle,
                    {
                      position: 'absolute',
                      fontSize: 16,
                      color: '#999999',
                    },
                  ]}
                  numberOfLines={1}
                >
                  Search...
                </Reanimated.Text>
              </View>
            </Reanimated.View>
          </Pressable>
        </View>

      </View>

      {/* Action Buttons — OUTSIDE stickyHeader so they render ABOVE pill shadows (z=10)
          while remaining BELOW modal backdrops (z=50). Static z=11 keeps buttons above
          pill wrappers (z=10) so pill shadow renders behind buttons at rest. */}
      <Reanimated.View style={[styles.morphingButtonsContainer, { top: insets.top, zIndex: 11 }, actionButtonsAnimatedStyle]} pointerEvents={searchVisible || logVisible ? 'none' : 'box-none'}>
        {/* Log Button */}
        <Reanimated.View style={logButtonAnimatedStyle}>
          <MorphingActionButton
            icon="add-circle-outline"
            label="Log"
            buttonIndex={0}
            animProgress={buttonProgress0}
            onPress={handleLogPress}
            collapsedX={collapsedPositions[0].x - circleSize / 2}
            expandedX={expandedPositions[0].x - pillWidth / 2}
            collapsedY={collapsedPositions[0].y - circleSize / 2}
            expandedY={expandedPositions[0].y - 18}
          />
        </Reanimated.View>
        {/* Search Button - visible, MorphingPill overlays it when animating */}
        {/* MorphingPill is invisible when closed, so this button shows through */}
        <Reanimated.View style={searchButtonAnimatedStyle}>
          <MorphingActionButton
            icon="search-outline"
            label="Search"
            buttonIndex={1}
            animProgress={buttonProgress1}
            onPress={handleSearchButtonPress}
            collapsedX={collapsedPositions[1].x - circleSize / 2}
            expandedX={expandedPositions[1].x - pillWidth / 2}
            collapsedY={collapsedPositions[1].y - circleSize / 2}
            expandedY={expandedPositions[1].y - 18}
          />
        </Reanimated.View>
        {/* Scan Button */}
        <Reanimated.View style={scanButtonAnimatedStyle}>
          <MorphingActionButton
            icon="barcode-outline"
            label="Scan"
            buttonIndex={2}
            animProgress={buttonProgress2}
            onPress={handleScanPress}
            collapsedX={collapsedPositions[2].x - circleSize / 2}
            expandedX={expandedPositions[2].x - pillWidth / 2}
            collapsedY={collapsedPositions[2].y - circleSize / 2}
            expandedY={expandedPositions[2].y - 18}
          />
        </Reanimated.View>
      </Reanimated.View>

      {/* ============================== */}
      {/* Hero Morph Search Experience */}
      {/* ============================== */}

      {/* Blur Backdrop - fades in simultaneously with pill expansion */}
      {/* Tapping backdrop unfocuses the search bar (if focused), doesn't close modal */}
      {searchVisible && (
        <Reanimated.View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 50 },
            backdropAnimatedStyle,
          ]}
          pointerEvents={searchVisible ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Reanimated.View>
      )}

      {/* Fog Gradient Zone Above Search Bar - fog effect for content above search bar */}
      {/* Extended container covers status bar (starts at -50) and extends 200px below visible area */}
      {/* Fades out with searchContentFade to prevent clipping during close animation */}
      {searchVisible && (
        <Reanimated.View
          style={[{
            position: 'absolute',
            top: -50,
            left: 0,
            right: 0,
            height: 50 + insets.top + 88 + 200, // 50px above + status bar + 88px visible + 200px buffer
            zIndex: 90,
          }, searchContentFadeStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(240, 238, 235, 0.94)',   // Solid through header area
              'rgba(240, 238, 235, 0.94)',   // Status bar area
              'rgba(240, 238, 235, 0.94)',   // Search bar area
              'rgba(240, 238, 235, 0.88)',   // Below search bar - starts easing
              'rgba(240, 238, 235, 0.75)',   // Gradual fade
              'rgba(240, 238, 235, 0.55)',   // Mid fade
              'rgba(240, 238, 235, 0.35)',   // Continue fading
              'rgba(240, 238, 235, 0.18)',   // Getting lighter
              'rgba(240, 238, 235, 0.08)',   // Very light
              'rgba(240, 238, 235, 0.03)',   // Barely visible
              'rgba(240, 238, 235, 0.01)',   // Almost invisible
              'transparent',                  // Fully clear
            ]}
            locations={[0, 0.10, 0.22, 0.30, 0.36, 0.42, 0.48, 0.53, 0.58, 0.62, 0.66, 0.70]}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      )}

      {/* "S E A R C H" Header Label - centered above the search bar */}
      {/* Fades in with modal open (searchContentFade), fades out when input focused (searchHeaderFocusOpacity) */}
      {/* paddingLeft compensates for letterSpacing on last character to achieve true center */}
      {searchVisible && (
        <Reanimated.Text
          style={[{
            position: 'absolute',
            top: insets.top + 16,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: 10,
            paddingLeft: 10, // Offset for trailing letterSpacing
            color: '#000000',
            zIndex: 160,
          }, searchHeaderAnimatedStyle]}
        >
          SEARCH
        </Reanimated.Text>
      )}

      {/* Floating Section Cards - render OUTSIDE the pill, directly on blur backdrop */}
      {/* Cards scroll UNDER the floating search bar (lower zIndex) */}
      {/* Note: Individual sections have their own staggered cascade animations from SearchModal */}
      {/* Fades out when search input is focused (sectionCardsFocusOpacity) */}
      {searchVisible && (
        <Reanimated.View
          style={[{
            position: 'absolute',
            top: insets.top, // Start from top of safe area
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 80, // BELOW the morphing pill (100) so content scrolls under it
            // Note: translateY removed - individual sections have their own staggered translateY animations
          }, sectionCardsContainerStyle]}
          pointerEvents={isSearchFocused ? 'none' : 'auto'}
        >
          <SearchModal
            visible={searchVisible}
            onClose={handleSearchClose}
            onSearch={handleSearch}
            onResultPress={(item) => console.log('Selected:', item.name)}
            morphProgress={pillMorphProgress}
            isEmbedded={true}
            sectionsOnly={true}
          />
        </Reanimated.View>
      )}

      {/* Focus Mode Dropdown - appears when search input is focused */}
      {/* Shows recent searches initially, autocomplete results when typing */}
      {searchVisible && isSearchFocused && (
        <Reanimated.View
          style={[{
            position: 'absolute',
            top: insets.top + 16 + 56 + 16, // SEARCH header position + search bar height + gap
            left: 16,
            right: 16,
            bottom: 0,
            zIndex: 85, // Above section cards (80), below morphing pill (150)
          }, dropdownFocusStyle]}
          pointerEvents="auto"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {dropdownItems.map((item, index) => {
              const itemAnim = dropdownItemAnimations[index] || new Animated.Value(1);
              const isRecentSearch = !debouncedQuery.trim();

              return (
                <Animated.View
                  key={item.id}
                  style={{
                    opacity: itemAnim,
                    transform: [{
                      translateY: itemAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  }}
                >
                  <Pressable
                    onPress={() => {
                      console.log('Selected:', item.name);
                      handleSearchUnfocus();
                    }}
                    style={({ pressed }) => [
                      styles.dropdownRow,
                      pressed && { backgroundColor: 'rgba(0,0,0,0.04)' },
                    ]}
                  >
                    {/* Icon - clock for recent, type icon for autocomplete */}
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons
                        name={isRecentSearch ? 'time-outline' : (getTypeIcon(item.type) as any)}
                        size={20}
                        color="#666666"
                      />
                    </View>
                    {/* Text content */}
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownRowTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.dropdownRowSubtitle} numberOfLines={1}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        {item.subtitle ? ` \u2022 ${item.subtitle}` : ''}
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* No results message */}
            {debouncedQuery.trim() && dropdownItems.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No results found</Text>
              </View>
            )}
          </ScrollView>
        </Reanimated.View>
      )}

      </View>
      {/* End of Main Content Wrapper */}

      {/* ============================== */}
      {/* Hero Morph Log Experience */}
      {/* ============================== */}

      {/* Log Blur Backdrop */}
      {logVisible && (
        <Reanimated.View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 50 },
            logBackdropAnimatedStyle,
          ]}
          pointerEvents={logVisible ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleLogBackdropPress}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Reanimated.View>
      )}

      {/* Fog Gradient Zone Above Log Search Bar - fog effect like Search/Scan modals */}
      {/* Extended container covers status bar (starts at -50) and extends 200px below visible area */}
      {logVisible && (
        <Reanimated.View
          style={[{
            position: 'absolute',
            top: -50,
            left: 0,
            right: 0,
            height: 50 + insets.top + 88 + 200, // 50px above + status bar + 88px visible + 200px buffer
            zIndex: 90,
          },
          logFogAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(240, 238, 235, 0.94)',   // Solid through header area
              'rgba(240, 238, 235, 0.94)',   // Status bar area
              'rgba(240, 238, 235, 0.94)',   // Search bar area
              'rgba(240, 238, 235, 0.88)',   // Below search bar - starts easing
              'rgba(240, 238, 235, 0.75)',   // Gradual fade
              'rgba(240, 238, 235, 0.55)',   // Mid fade
              'rgba(240, 238, 235, 0.35)',   // Continue fading
              'rgba(240, 238, 235, 0.18)',   // Getting lighter
              'rgba(240, 238, 235, 0.08)',   // Very light
              'rgba(240, 238, 235, 0.03)',   // Barely visible
              'rgba(240, 238, 235, 0.01)',   // Almost invisible
              'transparent',                  // Fully clear
            ]}
            locations={[0, 0.10, 0.22, 0.30, 0.36, 0.42, 0.48, 0.53, 0.58, 0.62, 0.66, 0.70]}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      )}

      {/* "L O G" Header Label */}
      {/* paddingLeft compensates for letterSpacing on last character to achieve true center */}
      {logVisible && (
        <Reanimated.Text
          style={[{
            position: 'absolute',
            top: insets.top + 16,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: 10,
            paddingLeft: 10, // Offset for trailing letterSpacing
            color: '#000000',
            zIndex: 160,
          },
          logHeaderAnimatedStyle,
          ]}
        >
          LOG
        </Reanimated.Text>
      )}

      {/* Floating Log Section Cards */}
      {logVisible && (
        <Reanimated.View
          style={[{
            position: 'absolute',
            top: insets.top,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 80,
          },
          logSectionCardsAnimatedStyle,
          ]}
          pointerEvents={isLogFocused ? 'none' : 'auto'}
        >
          <LogModal
            visible={logVisible}
            onClose={handleLogClose}
            morphProgress={logMorphProgress}
            isEmbedded={true}
            sectionsOnly={true}
            onCardSelect={handleLogCardSelect}
            onFocusInput={handleLogInputFocus}
          />
        </Reanimated.View>
      )}

      {/* Log Confirmation Card */}
      <LogConfirmationCard
        visible={confirmationVisible}
        item={selectedCoaster}
        initialPosition={coasterPosition}
        onClose={handleConfirmationClose}
        onLogComplete={handleLogComplete}
        onRateNow={handleRateNow}
      />

      {/* ============================== */}
      {/* TRUE Single-Element Log Morph - MorphingPill IS the Log button */}
      {/* This is the actual button that morphs into the modal */}
      {/* Position is dynamic based on logOrigin */}
      {/* ============================== */}
      <Reanimated.View
        style={[{
          position: 'absolute',
          top: logOriginPosition.top,
          left: logOriginPosition.left,
          width: logOriginPosition.width,
          height: logOriginPosition.height,
          overflow: 'visible',
        }, logPillWrapperZStyle]}
        pointerEvents={logVisible ? "box-none" : "none"}
      >
        <MorphingPill
          ref={logMorphingPillRef}
          pillWidth={logOriginPosition.width}
          pillHeight={logOriginPosition.height}
          pillBorderRadius={logOriginPosition.borderRadius}
          pillContent={logPillContent}
          expandedWidth={SCREEN_WIDTH - 32}
          expandedHeight={56}
          expandedBorderRadius={16}
          overshootAngle={logOrigin === 'logPill' ? 340 : 10}
          scrollHidden={logPillScrollHidden}
          expandedContent={(close) => (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              {/* Search icon - for log input */}
              <View style={{ width: 20, height: 20, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="search" size={20} color="#999999" />
              </View>
              {/* Log input - use LogModal's inputOnly mode */}
              <View style={{ flex: 1 }}>
                <LogModal
                  visible={true}
                  onClose={close}
                  isEmbedded={true}
                  inputOnly={true}
                  onInputFocus={handleLogFocus}
                  onQueryChange={handleLogQueryChange}
                  onCardSelect={handleLogCardSelect}
                  externalInputRef={logInputRef}
                />
              </View>
              {/* X Close Button */}
              <Pressable
                onPress={close}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 8,
                }}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </Pressable>
            </View>
          )}
          showBackdrop={false}
          onOpen={() => {
            // Trigger the existing log modal experience
            setLogVisible(true);
            // Bring pill wrapper above backdrop/fog (UI-thread sync)
            logPillZIndex.value = 200;
            logIsClosing.value = 0; // Not closing — prevent early z-drop
            // Check if pill was hidden (subsequent open) before resetting
            const isSubsequentOpen = logPillScrollHidden.value === 1;
            // Reset scroll-hidden state so pill is visible during morph
            logPillScrollHidden.value = 0;
            // Hide other frozen pills so they don't overlay this modal
            searchPillScrollHidden.value = 1;
            scanPillScrollHidden.value = 1;
            searchButtonOpacity.value = 1;
            scanButtonOpacity.value = 1;
            searchBarMorphOpacity.value = 1; // Show real search bar (search pill hidden)
            // First open: pill fades in from 0, so crossfade button out over 120ms
            // Subsequent opens: pill is already opaque, so hide button instantly
            logButtonOpacity.value = isSubsequentOpen ? 0 : withTiming(0, { duration: 120 });
            logMorphProgress.value = 1;
            // Backdrop fades in over first 60% of MorphingPill's animation
            logBackdropOpacity.value = withTiming(1, { duration: 510 });
            // Content fades in at same time as MorphingPill's expandedContentStyle
            logContentFade.value = withDelay(425, withTiming(1, { duration: 280 }));
          }}
          onClose={() => {
            // Trigger the close sequence
            logIsClosing.value = 1; // Signal z-index style to drop z when backdrop fades
            Keyboard.dismiss();
            setIsLogFocused(false);
            logFocusProgress.value = 0;
            setLogQuery('');
            setDebouncedLogQuery('');
            // Fade out external content (Reanimated — UI thread)
            // Fade out external content (Reanimated — UI thread)
            logContentFade.value = withTiming(0, { duration: 255 });
            // Fade out backdrop in sync with close
            logBackdropOpacity.value = withTiming(0, { duration: 340 });
            // Animate logMorphProgress in sync with MorphingPill's close
            logMorphProgress.value = withTiming(0, {
              duration: 385,
              easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
            });
          }}
          onAnimationStart={handleModalAnimStart}
          onAnimationComplete={() => {
            handleModalAnimEnd();
            // GUARD: If scroll already took over (hid the pill and showed real elements),
            // don't override — scroll handler already restored everything correctly.
            // This prevents a race where onAnimationComplete fires AFTER scroll and
            // re-hides the button that scroll just showed (causing disappearing elements).
            if (logPillScrollHidden.value === 1) {
              logButtonOpacity.value = 1;
              return;
            }
            // Pill stays opaque after close — it IS the button visually.
            // Show button at near-zero opacity so iOS can hit-test it
            // (iOS skips views with alpha === 0 during touch delivery).
            // 0.011 is invisible to the eye; shadow = 0.30 * 0.011 ≈ 0.003 = invisible.
            logButtonOpacity.value = 0.011;
          }}
          onCloseCleanup={() => {
            logPillZIndex.value = 10;
            logIsClosing.value = 0;
            // Hide pill and show real button — eliminates post-close shadow stacking
            logPillScrollHidden.value = 1;
            logButtonOpacity.value = 1;
            logMorphProgress.value = 0;
            setLogVisible(false);
          }}
        />
      </Reanimated.View>

      {/* ============================== */}
      {/* TRUE Single-Element Search Morph - MorphingPill IS the Search button */}
      {/* This is the actual button that morphs into the modal */}
      {/* Position is dynamic based on searchOrigin */}
      {/* ============================== */}
      <Reanimated.View
        style={[{
          position: 'absolute',
          top: originPosition.top,
          left: originPosition.left,
          width: originPosition.width,
          height: originPosition.height,
          overflow: 'visible', // Allow pill to expand beyond wrapper during morph
        }, searchPillWrapperZStyle]}
        // When search modal is open, MorphingPill needs to receive touches
        // When closed, make wrapper completely transparent to touches so collapsed header can receive taps
        pointerEvents={searchVisible ? "box-none" : "none"}
      >
        <MorphingPill
          ref={morphingPillRef}
          pillWidth={originPosition.width}
          pillHeight={originPosition.height}
          pillBorderRadius={originPosition.borderRadius}
          pillContent={searchPillContent}
          expandedWidth={SCREEN_WIDTH - 32}
          expandedHeight={56}
          expandedBorderRadius={16}
          // Globe icon stays visible throughout open/close when opening from search bar
          // (globe appears identically in both pill content and expanded content)
          persistentContent={
            (searchOrigin === 'expandedSearchBar' || searchOrigin === 'collapsedSearchBar')
              ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                  <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="globe-outline" size={20} color="#999999" />
                  </View>
                </View>
              )
              : undefined
          }
          // No closeTargetPosition - close back to button position (no snap/jump)
          // Overshoot: expanded search bar = straight up (0°), condensed search bar = natural (undefined),
          // expanded search pill = straight up (0°), condensed circle = 40°
          overshootAngle={searchOrigin === 'collapsedSearchBar' ? 340 : searchOrigin === 'collapsedCircle' ? 15 : 0}
          scrollHidden={searchPillScrollHidden}
          // Bar origins: slow valley arc + shadow dip (positioned above buttons)
          // Button origins: default speed, no shadow fade (same as Log/Scan)
          closeFixedSize={searchOrigin === 'expandedSearchBar'}
          closeShadowFade={searchOrigin === 'expandedSearchBar' || searchOrigin === 'collapsedSearchBar'}
          closeDuration={searchOrigin === 'expandedSearchBar' ? 445 : searchOrigin === 'collapsedSearchBar' ? 510 : undefined}
          closeArcHeight={searchOrigin === 'expandedSearchBar' ? 25 : searchOrigin === 'collapsedSearchBar' ? 30 : undefined}
          expandedContent={(close) => (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              {/* Globe icon - matches destination search bar exactly for seamless close */}
              <View style={{ width: 20, height: 20, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="globe-outline" size={20} color="#999999" />
              </View>
              {/* Search input - use SearchModal's inputOnly mode */}
              {/* Note: inputOnly mode doesn't use morphProgress/contentOpacity/contentTranslateY */}
              <View style={{ flex: 1 }}>
                <SearchModal
                  visible={true}
                  onClose={close}
                  onSearch={handleSearch}
                  onResultPress={(item) => console.log('Selected:', item.name)}
                  isEmbedded={true}
                  inputOnly={true}
                  showCloseButton={false}
                  onInputFocus={handleSearchFocus}
                  onQueryChange={handleSearchQueryChange}
                />
              </View>
              {/* X Close Button */}
              <Pressable
                onPress={close}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 8,
                }}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </Pressable>
            </View>
          )}
          showBackdrop={false}
          onOpen={() => {
            const isBarOrigin = searchOriginRef.current === 'expandedSearchBar' || searchOriginRef.current === 'collapsedSearchBar';

            // Trigger the existing search modal experience
            setSearchVisible(true);
            // Bring pill wrapper above backdrop/fog (UI-thread sync)
            searchPillZIndex.value = 200;
            searchIsClosing.value = 0; // Not closing — prevent early z-drop
            // Check if pill was hidden (subsequent open) before resetting
            const isSubsequentOpen = searchPillScrollHidden.value === 1;
            // Reset scroll-hidden state so pill is visible during morph
            searchPillScrollHidden.value = 0;
            // Hide other frozen action button pills so they don't overlay this modal
            logPillScrollHidden.value = 1;
            scanPillScrollHidden.value = 1;
            logButtonOpacity.value = 1;
            scanButtonOpacity.value = 1;

            if (isBarOrigin) {
              // Opening from SEARCH BAR — pill covers the search bar
              // First open: pill fades in, so crossfade search bar out over 120ms
              // Subsequent opens: pill is already opaque, hide search bar instantly
              searchBarMorphOpacity.value = isSubsequentOpen ? 0 : withTiming(0, { duration: 120 });
              // Search button stays visible — fades behind backdrop naturally
            } else {
              // Opening from SEARCH BUTTON — pill covers the action button
              // First open: crossfade out over 120ms. Subsequent: instant hide
              searchButtonOpacity.value = isSubsequentOpen ? 0 : withTiming(0, { duration: 120 });
              // Real search bar stays visible — fades behind backdrop naturally
              searchBarMorphOpacity.value = 1;
            }

            // MorphingPill handles ALL morph animation internally (1000ms Reanimated)
            // We only control external elements here
            pillMorphProgress.value = 1; // Instantly tell SearchModal morph is open
            // Backdrop fades in over first 60% of MorphingPill's animation
            // Backdrop fades in over first 60% of MorphingPill's animation
            backdropOpacity.value = withTiming(1, { duration: 510 });
            // Content fades in at same time as MorphingPill's expandedContentStyle
            // MorphingPill: PHASE.contentFade=0.55, PHASE.landing=0.88 (55-88% of 850ms = 468-748ms)
            searchContentFade.value = withDelay(425, withTiming(1, { duration: 280 }));
          }}
          onClose={() => {
            // Trigger the close sequence
            searchIsClosing.value = 1; // Signal z-index style to drop z when backdrop fades
            Keyboard.dismiss();
            setIsSearchFocused(false);
            searchFocusProgress.value = 0;
            setSearchQuery('');
            setDebouncedQuery('');
            // Fade out external content (blur zone, SEARCH header, section cards)
            // Fade out external content (blur zone, SEARCH header, section cards)
            searchContentFade.value = withTiming(0, { duration: 300 });
            // Fade out backdrop in sync with close
            backdropOpacity.value = withTiming(0, { duration: 435 });
            // Animate pillMorphProgress in sync with MorphingPill's close
            pillMorphProgress.value = withTiming(0, {
              duration: 485,
              easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
            });
            // Note: Do NOT force header expansion here — pill closes to whatever
            // origin it came from (collapsed or expanded). Header state is preserved.
          }}
          onAnimationStart={handleModalAnimStart}
          onAnimationComplete={(isOpen) => {
            handleModalAnimEnd();
            if (!isOpen) {
              // GUARD: If scroll already took over (hid the pill and showed real elements),
              // don't override — scroll handler already restored everything correctly.
              if (searchPillScrollHidden.value === 1) {
                searchButtonOpacity.value = 1;
                searchBarMorphOpacity.value = 1;
                return;
              }

              const isBarOrigin = searchOriginRef.current === 'expandedSearchBar' || searchOriginRef.current === 'collapsedSearchBar';

              if (isBarOrigin) {
                // Closed to SEARCH BAR position — "pill IS the search bar" pattern.
                // Pill stays visible at bar position, real bar stays hidden.
                // Search button was never hidden, just restore to be safe.
                searchButtonOpacity.value = 1;
              } else {
                // Closed to SEARCH BUTTON position — "pill IS the button" pattern.
                searchButtonOpacity.value = 0.011;
                searchBarMorphOpacity.value = 1;
              }
            }
          }}
          onCloseCleanup={() => {
            searchPillZIndex.value = 10;
            searchIsClosing.value = 0;
            const isBarOrigin = searchOriginRef.current === 'expandedSearchBar' || searchOriginRef.current === 'collapsedSearchBar';
            if (isBarOrigin) {
              // Bar origin: pill IS the search bar — no swap.
              // Shadow returned to resting via dip-and-return curve.
              // Pill at z=10 is behind buttons — no overcast.
              searchButtonOpacity.value = 1; // Ensure button is visible
            } else {
              // Button origin: swap pill for real button (same pattern as Log/Scan)
              searchPillScrollHidden.value = 1;
              searchButtonOpacity.value = 1;
              searchBarMorphOpacity.value = 1;
            }
            pillMorphProgress.value = 0;
            setSearchVisible(false);
          }}
        />
      </Reanimated.View>

      {/* ============================== */}
      {/* Hero Morph Scan/Wallet Experience */}
      {/* ============================== */}

      {/* Scan Blur Backdrop */}
      {walletVisible && (
        <Reanimated.View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 50 },
            scanBackdropAnimatedStyle,
          ]}
          pointerEvents={walletVisible ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => scanMorphingPillRef.current?.close()}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          </Pressable>
        </Reanimated.View>
      )}

      {/* Fog Gradient Zone Above Scan Search Bar - fog effect like Search/Log modals */}
      {/* Extended container covers status bar (starts at -50) and extends 200px below visible area */}
      {walletVisible && (
        <Reanimated.View
          style={[{
            position: 'absolute',
            top: -50,
            left: 0,
            right: 0,
            height: 50 + insets.top + 88 + 200, // 50px above + status bar + 88px visible + 200px buffer
            zIndex: 90,
          },
          scanFogAnimatedStyle,
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(240, 238, 235, 0.94)',   // Solid through header area
              'rgba(240, 238, 235, 0.94)',   // Status bar area
              'rgba(240, 238, 235, 0.94)',   // Search bar area
              'rgba(240, 238, 235, 0.88)',   // Below search bar - starts easing
              'rgba(240, 238, 235, 0.75)',   // Gradual fade
              'rgba(240, 238, 235, 0.55)',   // Mid fade
              'rgba(240, 238, 235, 0.35)',   // Continue fading
              'rgba(240, 238, 235, 0.18)',   // Getting lighter
              'rgba(240, 238, 235, 0.08)',   // Very light
              'rgba(240, 238, 235, 0.03)',   // Barely visible
              'rgba(240, 238, 235, 0.01)',   // Almost invisible
              'transparent',                  // Fully clear
            ]}
            locations={[0, 0.10, 0.22, 0.30, 0.36, 0.42, 0.48, 0.53, 0.58, 0.62, 0.66, 0.70]}
            style={StyleSheet.absoluteFill}
          />
        </Reanimated.View>
      )}

      {/* "W A L L E T" Header Label */}
      {/* paddingLeft compensates for letterSpacing on last character to achieve true center */}
      {walletVisible && (
        <Reanimated.Text
          style={[{
            position: 'absolute',
            top: insets.top + 16,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: 10,
            paddingLeft: 10, // Offset for trailing letterSpacing
            color: '#000000',
            zIndex: 160,
          },
          scanHeaderAnimatedStyle,
          ]}
        >
          WALLET
        </Reanimated.Text>
      )}

      {/* Floating Scan Content Cards (sectionsOnly mode) */}
      {/* Starts at insets.top so content can scroll behind the blur (like Log/Search) */}
      {walletVisible && (
        <Reanimated.View
          style={[{
            position: 'absolute',
            top: insets.top,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 80,
          },
          scanSectionCardsAnimatedStyle,
          ]}
          pointerEvents="auto"
        >
          <ScanModal
            tickets={tickets}
            onClose={() => scanMorphingPillRef.current?.close()}
            onAddTicket={handleWalletAddTicket}
            onSetDefault={setDefaultTicket}
            onTicketPress={(ticket) => console.log('Ticket pressed:', ticket.id)}
            onTicketLongPress={handlePassLongPress}
            isEmbedded={true}
            sectionsOnly={true}
            searchQuery={debouncedScanQuery}
          />
        </Reanimated.View>
      )}

      {/* TRUE Single-Element Scan Morph - MorphingPill IS the Scan button */}
      <Reanimated.View
        style={[{
          position: 'absolute',
          top: scanOriginPosition.top,
          left: scanOriginPosition.left,
          width: scanOriginPosition.width,
          height: scanOriginPosition.height,
          overflow: 'visible',
        }, scanPillWrapperZStyle]}
        pointerEvents={walletVisible ? "box-none" : "none"}
      >
        <MorphingPill
          ref={scanMorphingPillRef}
          pillWidth={scanOriginPosition.width}
          pillHeight={scanOriginPosition.height}
          pillBorderRadius={scanOriginPosition.borderRadius}
          pillContent={scanPillContent}
          expandedWidth={SCREEN_WIDTH - 32}
          expandedHeight={56}
          expandedBorderRadius={16}
          overshootAngle={scanOrigin === 'scanPill' ? 20 : 19}
          scrollHidden={scanPillScrollHidden}
          expandedContent={(close) => (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              {/* Search icon */}
              <View style={{ width: 20, height: 20, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="search" size={20} color="#999999" />
              </View>
              {/* Search input (inputOnly mode) */}
              <View style={{ flex: 1 }}>
                <ScanModal
                  tickets={stackTickets}
                  isEmbedded={true}
                  inputOnly={true}
                  onQueryChange={handleScanQueryChange}
                />
              </View>
              {/* X Close Button */}
              <Pressable
                onPress={close}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 8,
                }}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </Pressable>
            </View>
          )}
          showBackdrop={false}
          onOpen={() => {
            // Trigger the wallet modal experience
            setWalletVisible(true);
            // Bring pill wrapper above backdrop/fog (UI-thread sync)
            scanPillZIndex.value = 200;
            scanIsClosing.value = 0; // Not closing — prevent early z-drop
            // Check if pill was hidden (subsequent open) before resetting
            const isSubsequentOpen = scanPillScrollHidden.value === 1;
            // Reset scroll-hidden state so pill is visible during morph
            scanPillScrollHidden.value = 0;
            // Hide other frozen pills so they don't overlay this modal
            logPillScrollHidden.value = 1;
            searchPillScrollHidden.value = 1;
            logButtonOpacity.value = 1;
            searchButtonOpacity.value = 1;
            searchBarMorphOpacity.value = 1; // Show real search bar (search pill hidden)
            // First open: pill fades in from 0, so crossfade button out over 120ms
            // Subsequent opens: pill is already opaque, so hide button instantly
            scanButtonOpacity.value = isSubsequentOpen ? 0 : withTiming(0, { duration: 120 });
            // Backdrop fades in over first 60% of MorphingPill's animation
            // Backdrop fades in over first 60% of MorphingPill's animation
            scanBackdropOpacity.value = withTiming(1, { duration: 510 });
            // Content fades in at same time as MorphingPill's expandedContentStyle
            scanContentFade.value = withDelay(425, withTiming(1, { duration: 280 }));
          }}
          onClose={() => {
            scanIsClosing.value = 1; // Signal z-index style to drop z when backdrop fades
            // Fade out external content (Reanimated — UI thread)
            // Fade out external content (Reanimated — UI thread)
            scanContentFade.value = withTiming(0, { duration: 255 });
            // Fade out backdrop in sync with close
            scanBackdropOpacity.value = withTiming(0, { duration: 340 });
          }}
          onAnimationStart={handleModalAnimStart}
          onAnimationComplete={() => {
            handleModalAnimEnd();
            // GUARD: If scroll already took over (hid the pill and showed real elements),
            // don't override — scroll handler already restored everything correctly.
            if (scanPillScrollHidden.value === 1) {
              scanButtonOpacity.value = 1;
              return;
            }
            // Pill stays opaque after close — it IS the button visually.
            // Show button at near-zero opacity so iOS can hit-test it
            // (iOS skips views with alpha === 0 during touch delivery).
            scanButtonOpacity.value = 0.011;
          }}
          onCloseCleanup={() => {
            scanPillZIndex.value = 10;
            scanIsClosing.value = 0;
            // Hide pill and show real button — eliminates post-close shadow stacking
            scanPillScrollHidden.value = 1;
            scanButtonOpacity.value = 1;
            setWalletVisible(false);
            setScanQuery('');
            setDebouncedScanQuery('');
          }}
        />
      </Reanimated.View>

      {/* Quick Actions Menu (appears on pass long press) */}
      <QuickActionsMenu
        visible={quickActionsVisible}
        ticket={selectedQuickActionTicket}
        onClose={handleCloseQuickActions}
        onScan={handleQuickActionScan}
        onToggleFavorite={handleQuickActionToggleFavorite}
        onEdit={handleQuickActionEdit}
        onDelete={handleQuickActionDelete}
        favoritesLimitReached={favoritesLimitReached}
      />

      {/* Gate Mode Overlay (appears when scanning from quick actions) */}
      <GateModeOverlay
        ticket={gateModeTicket}
        visible={gateModeVisible}
        onClose={handleCloseGateMode}
      />

      {/* Rating Modal (appears after Rate Now in LogConfirmationCard) */}
      {ratingModalVisible && ratingLog && (
        <RatingModal
          log={ratingLog}
          imageUrl={ratingImageUrl}
          onClose={handleRatingModalClose}
          onComplete={handleRatingComplete}
        />
      )}

      {/* Touch-blocking overlay during modal animations — prevents glitched states */}
      {isModalAnimating && (
        <View
          style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}
          pointerEvents="auto"
        />
      )}
    </View>
  );
};

// Note: AnimatedCircleButton removed - replaced by MorphingActionButton

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E', // Dark background visible when content scales down
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  stickyHeader: {
    backgroundColor: 'transparent', // Transparent - gradient handles the fade effect
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
  // Dropdown styles for focus mode - glassmorphic individual cards
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',  // Heavy frost (95%)
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',       // Light border glow
  },
  dropdownIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownRowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  dropdownRowSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666666',
  },
});
