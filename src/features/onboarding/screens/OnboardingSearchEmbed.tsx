import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Text, ScrollView, Image, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';
import { CARD_ART } from '../../../data/cardArt';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
  Easing as ReanimatedEasing,
  runOnJS,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';

import { SearchBar, MorphingActionButton } from '../../../components';
import { MorphingPill, MorphingPillRef } from '../../../components/MorphingPill';
import { OnboardingCoasterSheet, OnboardingCoasterSheetRef } from './OnboardingCoasterSheet';
import { EnrichedCoaster } from '../../parks/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const GAP = 12;

// Fixed header heights for smooth animation
const HEADER_HEIGHT_EXPANDED = 132;

// Type for tracking which element triggered the search modal
type SearchOrigin = 'expandedSearchBar' | 'searchPill';

// =========================================
// Coaster Data for Cinematic Demo
// =========================================
interface DemoCoaster {
  id: string;
  name: string;
  park: string;
  height?: string;
  speed?: string;
  inversions?: string;
  lengthFt?: string;
  status?: string;
  color: string; // placeholder card art color
}

const DEMO_COASTERS: DemoCoaster[] = [
  { id: 'steel-vengeance', name: 'Steel Vengeance', park: 'Cedar Point', height: '205', speed: '74', inversions: '4', lengthFt: '5,740', status: 'Operating', color: '#8B4513' },
  { id: 'steel-curtain', name: 'Steel Curtain', park: 'Kennywood', height: '220', speed: '76', inversions: '9', status: 'Operating', color: '#2C3E50' },
  { id: 'steel-dragon-2000', name: 'Steel Dragon 2000', park: 'Nagashima Spa Land', height: '318', speed: '95', inversions: '0', status: 'Operating', color: '#1A5276' },
  { id: 'steel-force', name: 'Steel Force', park: 'Dorney Park', height: '200', speed: '75', inversions: '0', status: 'Operating', color: '#4A235A' },
  { id: 'steel-taipan', name: 'Steel Taipan', park: 'Dreamworld', height: '105', speed: '62', inversions: '3', status: 'Operating', color: '#7D3C98' },
  { id: 'steel-eel', name: 'Steel Eel', park: 'SeaWorld San Antonio', height: '150', speed: '65', inversions: '0', status: 'Operating', color: '#1E8449' },
  { id: 'steel-venom', name: 'Steel Venom', park: 'Valleyfair', height: '185', speed: '68', inversions: '0', status: 'Operating', color: '#B9770E' },
  { id: 'fury-325', name: 'Fury 325', park: 'Carowinds', height: '325', speed: '95', status: 'Operating', color: '#1A5276' },
  { id: 'millennium-force', name: 'Millennium Force', park: 'Cedar Point', height: '310', speed: '93', status: 'Operating', color: '#4A235A' },
  { id: 'iron-gwazi', name: 'Iron Gwazi', park: 'Busch Gardens TB', height: '206', speed: '76', inversions: '2', status: 'Operating', color: '#7D3C98' },
  { id: 'jurassic-world-velocicoaster', name: 'VelociCoaster', park: 'Universal IOA', height: '155', speed: '70', inversions: '4', status: 'Operating', color: '#1E8449' },
  { id: 'el-toro', name: 'El Toro', park: 'Six Flags GA', height: '181', speed: '70', status: 'Operating', color: '#B9770E' },
  { id: 'lightning-rod', name: 'Lightning Rod', park: 'Dollywood', height: '80', speed: '73', status: 'Operating', color: '#C0392B' },
];

// =========================================
// Popular Rides for Search Initial State
// =========================================
const POPULAR_RIDES = [
  { id: 'top-thrill-2', name: 'Top Thrill 2' },
  { id: 'millennium-force', name: 'Millennium Force' },
  { id: 'steel-vengeance', name: 'Steel Vengeance' },
];

const POPULAR_PARKS = [
  { name: 'Cedar Point', location: 'Sandusky, OH' },
  { name: 'Kings Island', location: 'Mason, OH' },
  { name: 'Carowinds', location: 'Charlotte, NC' },
];

const TRENDING_SEARCHES = [
  'Kingda Ka',
  'Top Thrill 2',
  'Superman: Escape from Krypton',
];

// =========================================
// Static EnrichedCoaster data for real CoasterSheet
// =========================================
const ENRICHED_COASTERS: Record<string, EnrichedCoaster> = {
  'steel-curtain': {
    id: 'steel-curtain',
    name: 'Steel Curtain',
    park: 'Kennywood',
    country: 'United States',
    continent: 'North America',
    manufacturer: 'S&S Worldwide',
    material: 'Steel',
    type: 'Hyper',
    heightFt: 220,
    speedMph: 75,
    lengthFt: 4000,
    inversions: 8,
    yearOpened: 2019,
    dropFt: 205,
    duration: 120,
    designer: 'Joe Draves',
    model: 'Looping Hyper Coaster',
    status: 'Operating',
    description: 'Steel Curtain is a steel hypercoaster at Kennywood in West Mifflin, Pennsylvania, United States. Manufactured by S&S \u2013 Sansei Technologies, the coaster reaches a height of 220 ft and features either eight or nine inversions, including a 197 ft corkscrew which was the world\'s tallest inversion at the time. Themed to the Pittsburgh Steelers NFL football team, the roller coaster is named after the Steel Curtain, the nickname for the Steelers\' defensive line during the 1970s.',
  },
  'fury-325': {
    id: 'fury-325',
    name: 'Fury 325',
    park: 'Carowinds',
    country: 'United States',
    continent: 'North America',
    manufacturer: 'Bolliger & Mabillard',
    material: 'Steel',
    type: 'Giga',
    heightFt: 325,
    speedMph: 95,
    lengthFt: 6602,
    inversions: 0,
    yearOpened: 2015,
    dropFt: 320,
    duration: 205,
    designer: 'Walter Bolliger',
    model: 'Giga Coaster',
    status: 'Operating',
    description: 'Fury 325 is a steel roller coaster located at Carowinds in Charlotte, North Carolina, United States. Manufactured by Bolliger & Mabillard, the giga coaster opened to the public on March 28, 2015. Fury 325 features a 325 ft lift hill, a 320 ft drop, and a maximum speed of 95 mph, making it one of the tallest and fastest roller coasters in the world.',
  },
};

// =========================================
// Demo Sequence Typing Config
// =========================================
const TYPE_SPEED = 80; // ms per character
const BACKSPACE_SPEED = 50; // ms per character
const CURSOR_BLINK_RATE = 500; // ms

interface OnboardingSearchEmbedProps {
  isActive: boolean;
}

export const OnboardingSearchEmbed: React.FC<OnboardingSearchEmbedProps> = ({ isActive }) => {
  const insets = useSafeAreaInsets();

  const [searchVisible, setSearchVisible] = useState(false);

  // Ref for MorphingPill
  const morphingPillRef = useRef<MorphingPillRef>(null);

  // Demo loop timer refs — array to track all active timers for cleanup
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cursorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoActiveRef = useRef(false);

  // =========================================
  // Typing State
  // =========================================
  const [typedText, setTypedText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(false);
  const typedTextRef = useRef('');

  // =========================================
  // Bottom Sheet State (real CoasterSheet)
  // =========================================
  const [sheetCoaster, setSheetCoaster] = useState<EnrichedCoaster | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const coasterSheetRef = useRef<OnboardingCoasterSheetRef>(null);

  // Highlighted result index
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // Recent search (shows in sequence 2 after Steel Curtain was searched in sequence 1)
  const [recentSearch, setRecentSearch] = useState<string | null>(null);

  // REANIMATED: Shared value for UI-thread animations
  const reanimatedProgress = useSharedValue(1);

  // REANIMATED: Separate shared values for each button (enables stagger effect)
  const buttonProgress0 = useSharedValue(1); // Log button
  const buttonProgress1 = useSharedValue(1); // Search button
  const buttonProgress2 = useSharedValue(1); // Scan button

  // Scroll-driven pill hiding (kept for MorphingPill compatibility)
  const searchPillScrollHidden = useSharedValue(0);

  // Pill wrapper z-index
  const searchPillZIndex = useSharedValue(10);

  // Close-in-progress flag
  const searchIsClosing = useSharedValue(0);

  // Hero morph animation values for search modal
  const pillMorphProgress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const searchContentFade = useSharedValue(0);

  // Action buttons visibility during morph
  const actionButtonsOpacity = useSharedValue(1);
  const actionButtonsScale = useSharedValue(1);

  // Search bar visibility during morphs
  const searchBarMorphOpacity = useSharedValue(1);

  // Button opacity shared values
  const logButtonOpacity = useSharedValue(1);
  const searchButtonOpacity = useSharedValue(1);
  const scanButtonOpacity = useSharedValue(1);

  // Animation lock
  const isModalAnimatingRef = useRef(false);

  // Pre-computed origin positions
  const allOriginPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Search origin state
  const [searchOrigin, setSearchOrigin] = useState<SearchOrigin>('expandedSearchBar');
  const searchOriginRef = useRef<SearchOrigin>('expandedSearchBar');

  // Fog gradient dimensions
  const FOG_EXPANDED_HEIGHT = 50 + insets.top + HEADER_HEIGHT_EXPANDED + 200;

  // REANIMATED: Search bar animated style
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

  // Search bar text opacity styles
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

  // Calculate dimensions
  const containerWidth = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
  const pillWidth = (containerWidth - (GAP * 2)) / 3;
  const circleSize = 42;

  // Calculate collapsed state layout
  const collapsedSearchWidth = SCREEN_WIDTH * 0.50;
  const totalCirclesWidth = circleSize * 3;
  const totalContentWidth = collapsedSearchWidth + totalCirclesWidth;
  const equalGap = (SCREEN_WIDTH - totalContentWidth) / 5;

  // Calculate morphing button positions
  const expandedY = 20 + 56 + 12 + 18; // paddingTop(20) + searchHeight(56) + pillsContainerPaddingTop(12) + half pill height(18)
  const expandedPositions = [
    { x: HORIZONTAL_PADDING + pillWidth / 2, y: expandedY },
    { x: HORIZONTAL_PADDING + pillWidth + GAP + pillWidth / 2, y: expandedY },
    { x: HORIZONTAL_PADDING + pillWidth * 2 + GAP * 2 + pillWidth / 2, y: expandedY },
  ];

  // Collapsed (circle) positions
  const collapsedY = 12 + 21;
  const collapsedPositions = [
    { x: equalGap + collapsedSearchWidth + equalGap + circleSize / 2, y: collapsedY },
    { x: equalGap + collapsedSearchWidth + equalGap + circleSize + equalGap + circleSize / 2, y: collapsedY },
    { x: equalGap + collapsedSearchWidth + equalGap + circleSize * 2 + equalGap * 2 + circleSize / 2, y: collapsedY },
  ];

  // =========================================
  // Hero Morph Search Pill Interpolations
  // =========================================
  const originPosition = useMemo(() => {
    switch (searchOrigin) {
      case 'expandedSearchBar':
        return {
          top: insets.top + 20,
          left: HORIZONTAL_PADDING,
          width: containerWidth,
          height: 56,
          borderRadius: 28,
        };
      case 'searchPill':
        return {
          top: insets.top + expandedY - 18,
          left: expandedPositions[1].x - pillWidth / 2,
          width: pillWidth,
          height: 36,
          borderRadius: 18,
        };
      default:
        return {
          top: insets.top + 20,
          left: HORIZONTAL_PADDING,
          width: containerWidth,
          height: 56,
          borderRadius: 28,
        };
    }
  }, [searchOrigin, insets.top, containerWidth, pillWidth, expandedY, expandedPositions]);

  // Dynamic Pill Content
  const searchPillContent = useMemo(() => {
    const absoluteFill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

    switch (searchOrigin) {
      case 'searchPill':
        return (
          <View style={{ ...absoluteFill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="search-outline" size={16} color="#000000" />
            <View style={{ marginLeft: 6, maxWidth: 100, overflow: 'hidden' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#000000' }} numberOfLines={1}>Search</Text>
            </View>
          </View>
        );
      case 'expandedSearchBar':
      default:
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
    }
  }, [searchOrigin]);

  // Pre-computed origin position map
  allOriginPositionsRef.current = {
    expandedSearchBar: { x: HORIZONTAL_PADDING, y: insets.top + 20 },
    searchPill: { x: expandedPositions[1].x - pillWidth / 2, y: insets.top + expandedY - 18 },
  };

  // =========================================
  // Dynamic Search Results (filtered by typed text)
  // =========================================
  const filteredResults = useMemo(() => {
    if (typedText.length === 0) return [];
    const query = typedText.toLowerCase();
    return DEMO_COASTERS.filter(c =>
      c.name.toLowerCase().includes(query)
    ).slice(0, 7);
  }, [typedText]);

  // =========================================
  // Animated Styles
  // =========================================
  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const searchContentFadeStyle = useAnimatedStyle(() => ({
    opacity: searchContentFade.value,
  }));

  const searchHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchContentFade.value,
  }));

  const sectionCardsContainerStyle = useAnimatedStyle(() => ({
    opacity: searchContentFade.value,
  }));

  const actionButtonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionButtonsOpacity.value,
    transform: [{ scale: actionButtonsScale.value }],
  }));

  // Search bar hides during morph from search bar, shows after pill settles.
  // When morphing from search pill, bar stays visible (pill comes from below).
  const searchBarMorphAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchBarMorphOpacity.value,
  }));

  const logButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logButtonOpacity.value,
  }));
  const searchButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchButtonOpacity.value,
  }));
  const scanButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: scanButtonOpacity.value,
  }));

  const searchPillWrapperZStyle = useAnimatedStyle(() => {
    if (searchPillZIndex.value <= 10) return { zIndex: 10 };
    if (searchIsClosing.value === 1 && backdropOpacity.value < 0.01) {
      return { zIndex: 10 };
    }
    return { zIndex: searchPillZIndex.value };
  });

  // Modal animation lock handlers
  const handleModalAnimStart = useCallback(() => {
    isModalAnimatingRef.current = true;
  }, []);

  const handleModalAnimEnd = useCallback(() => {
    isModalAnimatingRef.current = false;
  }, []);

  // No-op handlers for buttons (nothing is tappable)
  const noop = useCallback(() => {}, []);

  // =========================================
  // Timer Helpers
  // =========================================
  const clearAllTimers = useCallback(() => {
    if (demoTimerRef.current) {
      clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
    allTimersRef.current.forEach(t => clearTimeout(t));
    allTimersRef.current = [];
    if (cursorTimerRef.current) {
      clearInterval(cursorTimerRef.current);
      cursorTimerRef.current = null;
    }
  }, []);

  const scheduleTimer = useCallback((fn: () => void, delay: number): ReturnType<typeof setTimeout> => {
    const t = setTimeout(fn, delay);
    allTimersRef.current.push(t);
    return t;
  }, []);

  // =========================================
  // Cursor Blink
  // =========================================
  const startCursorBlink = useCallback(() => {
    if (cursorTimerRef.current) clearInterval(cursorTimerRef.current);
    setCursorVisible(true);
    cursorTimerRef.current = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, CURSOR_BLINK_RATE);
  }, []);

  const stopCursorBlink = useCallback(() => {
    if (cursorTimerRef.current) {
      clearInterval(cursorTimerRef.current);
      cursorTimerRef.current = null;
    }
    setCursorVisible(false);
  }, []);

  // =========================================
  // Typing Engine (returns total time consumed)
  // =========================================
  const typeString = useCallback((text: string, startDelay: number, onComplete?: () => void): number => {
    let elapsed = startDelay;
    for (let i = 0; i < text.length; i++) {
      const charIndex = i;
      const charDelay = elapsed;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newText = typedTextRef.current + text[charIndex];
        typedTextRef.current = newText;
        setTypedText(newText);
      }, charDelay);
      elapsed += TYPE_SPEED;
    }
    if (onComplete) {
      scheduleTimer(() => {
        if (demoActiveRef.current) onComplete();
      }, elapsed);
    }
    return elapsed;
  }, [scheduleTimer]);

  const backspaceChars = useCallback((count: number, startDelay: number, onComplete?: () => void): number => {
    let elapsed = startDelay;
    for (let i = 0; i < count; i++) {
      const bsDelay = elapsed;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newText = typedTextRef.current.slice(0, -1);
        typedTextRef.current = newText;
        setTypedText(newText);
      }, bsDelay);
      elapsed += BACKSPACE_SPEED;
    }
    if (onComplete) {
      scheduleTimer(() => {
        if (demoActiveRef.current) onComplete();
      }, elapsed);
    }
    return elapsed;
  }, [scheduleTimer]);

  // =========================================
  // Bottom Sheet Controls (real CoasterSheet)
  // =========================================
  const openSheet = useCallback((coasterKey: string) => {
    const enriched = ENRICHED_COASTERS[coasterKey];
    if (!enriched) return;
    setSheetCoaster(enriched);
    setSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    // Clear search text — return to generic search modal (not the typed query)
    setTypedText('');
    typedTextRef.current = '';
    // Delay clearing coaster so the dismiss animation can complete
    scheduleTimer(() => {
      setSheetCoaster(null);
    }, 400);
  }, [scheduleTimer]);

  const autoScrollSheet = useCallback(() => {
    // Scroll to exactly heroPageEnd — snaps to the additional info page
    coasterSheetRef.current?.scrollToAdditionalInfo();
  }, []);

  // =========================================
  // Auto-Demo Timer — Full Cinematic Sequence
  // =========================================
  useEffect(() => {
    if (!isActive) {
      demoActiveRef.current = false;
      clearAllTimers();
      // Reset state
      setTypedText('');
      typedTextRef.current = '';
      setCursorVisible(false);
      setHighlightedIndex(null);
      setSheetVisible(false);
      setSheetCoaster(null);
      return;
    }

    demoActiveRef.current = true;

    const runCinematicLoop = () => {
      if (!demoActiveRef.current) return;

      // Reset state
      setTypedText('');
      typedTextRef.current = '';
      setHighlightedIndex(null);
      setRecentSearch(null); // Clear recent so sequence 1 shows fresh

      // =============================================
      // SEQUENCE 1: From Search Bar — Steel Vengeance → Steel Curtain
      // =============================================
      let t = 0;

      // Step 1: Wait 1.5s, then open from expandedSearchBar
      t += 1500;
      scheduleTimer(() => {
        if (!demoActiveRef.current || !morphingPillRef.current) return;

        setSearchOrigin('expandedSearchBar');
        searchOriginRef.current = 'expandedSearchBar';

        // Bar origin: hide bar, make pill visible — pill IS the search bar during morph
        searchBarMorphOpacity.value = 0;
        searchPillScrollHidden.value = 0;

        const pos = allOriginPositionsRef.current['expandedSearchBar'];
        if (pos) {
          morphingPillRef.current.open(pos.x, pos.y);
        }
      }, t);

      // Step 2: After morph opens (~900ms), start cursor blink + type "Steel Vengeance"
      t += 900;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        startCursorBlink();
      }, t);

      // Step 3: Wait a beat (300ms) then start typing
      t += 300;
      const steelVengeanceText = 'Steel Vengeance';
      t = typeString(steelVengeanceText, t);

      // Step 4: Wait 500ms after typing completes
      t += 500;

      // Step 5: Backspace "Vengeance" (9 chars)
      const backspaceCount = 'Vengeance'.length;
      t = backspaceChars(backspaceCount, t);

      // Step 6: Wait 600ms then type "Curtain" (natural pause after backspace)
      t += 600;
      t = typeString('Curtain', t);

      // Step 7: Wait 500ms, then "tap" Steel Curtain result
      t += 500;
      const highlightTime = t;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        setHighlightedIndex(0); // Steel Curtain should be first result
      }, highlightTime);

      // Step 8: Wait 300ms, open bottom sheet + set recent search while sheet covers modal
      t += 300;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        stopCursorBlink();
        setHighlightedIndex(null);
        openSheet('steel-curtain');
        // Set recent search NOW while sheet covers the search modal — no visible layout jump
        setRecentSearch('Steel Curtain');
      }, t);

      // Step 9: Auto-scroll sheet after 1.5s
      t += 1500;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        autoScrollSheet();
      }, t);

      // Step 10: Wait 2.5s, close sheet
      t += 2500;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        closeSheet();
      }, t);

      // Step 11: Sheet closes — recent search already set, generic modal shows immediately
      t += 400; // wait for sheet dismiss animation

      // Step 11b: Wait 1.2s showing generic modal, then close
      t += 1200;
      scheduleTimer(() => {
        if (!demoActiveRef.current || !morphingPillRef.current) return;
        morphingPillRef.current.close();
      }, t);

      // Step 12: Wait 2s for close animation + pause before next sequence
      t += 2000;

      // =============================================
      // SEQUENCE 2: From Search Pill — Fury 325
      // =============================================

      // Step 13: Change origin to searchPill
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        setSearchOrigin('searchPill');
        searchOriginRef.current = 'searchPill';
      }, t);

      // Step 14: Wait 200ms for state to settle, then open
      t += 200;
      scheduleTimer(() => {
        if (!demoActiveRef.current || !morphingPillRef.current) return;

        // Make pill visible + hide button BEFORE opening (prevents double shadow)
        searchPillScrollHidden.value = 0;
        searchButtonOpacity.value = 0; // hide button instantly, pill covers it

        const pos = allOriginPositionsRef.current['searchPill'];
        if (pos) {
          morphingPillRef.current.open(pos.x, pos.y);
        }
      }, t);

      // Step 15: After morph opens, start cursor + type "Fury 325"
      t += 900;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        startCursorBlink();
      }, t);

      t += 300;
      const fury325Text = 'Fury 325';
      t = typeString(fury325Text, t);

      // Step 16: Wait 500ms, tap result
      t += 500;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        setHighlightedIndex(0);
      }, t);

      // Step 17: Wait 300ms, open sheet
      t += 300;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        stopCursorBlink();
        setHighlightedIndex(null);
        openSheet('fury-325');
      }, t);

      // Step 18: Auto-scroll after 1.5s
      t += 1500;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        autoScrollSheet();
      }, t);

      // Step 19: Wait 2.5s, close sheet
      t += 2500;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        closeSheet();
      }, t);

      // Step 20: Sheet closes and clears text automatically (goes to generic modal)
      // Wait 1.6s showing generic modal, then close
      t += 1600;
      scheduleTimer(() => {
        if (!demoActiveRef.current || !morphingPillRef.current) return;
        morphingPillRef.current.close();
      }, t);

      // Step 21: Wait 2s for close animation + pause before loop
      t += 2000;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        setSearchOrigin('expandedSearchBar');
        searchOriginRef.current = 'expandedSearchBar';
      }, t);

      // Step 22: Wait 200ms then loop
      t += 200;
      scheduleTimer(() => {
        if (!demoActiveRef.current) return;
        runCinematicLoop();
      }, t);
    };

    runCinematicLoop();

    return () => {
      demoActiveRef.current = false;
      clearAllTimers();
    };
  }, [isActive, clearAllTimers, scheduleTimer, typeString, backspaceChars, startCursorBlink, stopCursorBlink, openSheet, closeSheet, autoScrollSheet]);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.mainContentWrapper}>
        {/* Static feed content placeholder */}
        <ScrollView
          contentContainerStyle={[styles.feedContent, { paddingTop: insets.top + HEADER_HEIGHT_EXPANDED }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          {/* Trending Section Placeholder */}
          <View style={styles.feedSectionWrapper}>
            <Text style={styles.sectionTitle}>Trending Coasters</Text>
            <View style={styles.placeholderCardRow}>
              <View style={styles.placeholderCardSmall} />
              <View style={styles.placeholderCardSmall} />
              <View style={styles.placeholderCardSmall} />
            </View>
          </View>

          {/* News Card Placeholder */}
          <View style={styles.cardWrapper}>
            <View style={styles.placeholderNewsCard}>
              <View style={styles.placeholderImage} />
              <View style={styles.placeholderTextBlock}>
                <View style={[styles.placeholderLine, { width: '80%' }]} />
                <View style={[styles.placeholderLine, { width: '60%' }]} />
              </View>
            </View>
          </View>

          {/* Friend Activity Placeholder */}
          <View style={styles.feedSectionWrapper}>
            <Text style={styles.sectionTitle}>Friend Activity</Text>
            <View style={styles.placeholderCardRow}>
              <View style={styles.placeholderCardWide} />
            </View>
          </View>

          {/* Another News Card */}
          <View style={styles.cardWrapper}>
            <View style={styles.placeholderNewsCard}>
              <View style={styles.placeholderImage} />
              <View style={styles.placeholderTextBlock}>
                <View style={[styles.placeholderLine, { width: '70%' }]} />
                <View style={[styles.placeholderLine, { width: '50%' }]} />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Fog Gradient Overlay */}
        <View
          style={{
            position: 'absolute',
            top: -50,
            left: 0,
            right: 0,
            height: FOG_EXPANDED_HEIGHT,
            zIndex: 5,
          }}
        >
          <LinearGradient
            colors={[
              'rgba(240, 238, 235, 0.94)',
              'rgba(240, 238, 235, 0.94)',
              'rgba(240, 238, 235, 0.94)',
              'rgba(240, 238, 235, 0.88)',
              'rgba(240, 238, 235, 0.75)',
              'rgba(240, 238, 235, 0.55)',
              'rgba(240, 238, 235, 0.35)',
              'rgba(240, 238, 235, 0.18)',
              'rgba(240, 238, 235, 0.08)',
              'rgba(240, 238, 235, 0.03)',
              'rgba(240, 238, 235, 0.01)',
              'transparent',
            ]}
            locations={[0, 0.12, 0.24, 0.32, 0.38, 0.44, 0.50, 0.55, 0.60, 0.64, 0.68, 0.72]}
            style={{ flex: 1 }}
          />
        </View>

        {/* Sticky Header */}
        <View
          style={[
            styles.stickyHeader,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              paddingTop: insets.top,
              overflow: 'visible',
            }
          ]}
        >
          {/* Search Bar Row */}
          <View style={[styles.header, { paddingHorizontal: 0 }]}>
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
              {/* Globe Icon */}
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
          </View>
        </View>

        {/* Action Buttons */}
        <Reanimated.View
          style={[styles.morphingButtonsContainer, { top: insets.top, zIndex: 11 }, actionButtonsAnimatedStyle]}
        >
          {/* Log Button */}
          <Reanimated.View style={logButtonAnimatedStyle}>
            <MorphingActionButton
              icon="add-circle-outline"
              label="Log"
              buttonIndex={0}
              animProgress={buttonProgress0}
              onPress={noop}
              collapsedX={collapsedPositions[0].x - circleSize / 2}
              expandedX={expandedPositions[0].x - pillWidth / 2}
              collapsedY={collapsedPositions[0].y - circleSize / 2}
              expandedY={expandedPositions[0].y - 18}
            />
          </Reanimated.View>
          {/* Search Button */}
          <Reanimated.View style={searchButtonAnimatedStyle}>
            <MorphingActionButton
              icon="search-outline"
              label="Search"
              buttonIndex={1}
              animProgress={buttonProgress1}
              onPress={noop}
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
              onPress={noop}
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

        {/* Blur Backdrop */}
        {searchVisible && (
          <Reanimated.View
            style={[
              StyleSheet.absoluteFill,
              { zIndex: 50 },
              backdropAnimatedStyle,
            ]}
          >
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          </Reanimated.View>
        )}

        {/* Fog Gradient Zone Above Search Bar */}
        {searchVisible && (
          <Reanimated.View
            style={[{
              position: 'absolute',
              top: -50,
              left: 0,
              right: 0,
              height: 50 + insets.top + 88 + 200,
              zIndex: 90,
            }, searchContentFadeStyle]}
          >
            <LinearGradient
              colors={[
                'rgba(240, 238, 235, 0.94)',
                'rgba(240, 238, 235, 0.94)',
                'rgba(240, 238, 235, 0.94)',
                'rgba(240, 238, 235, 0.88)',
                'rgba(240, 238, 235, 0.75)',
                'rgba(240, 238, 235, 0.55)',
                'rgba(240, 238, 235, 0.35)',
                'rgba(240, 238, 235, 0.18)',
                'rgba(240, 238, 235, 0.08)',
                'rgba(240, 238, 235, 0.03)',
                'rgba(240, 238, 235, 0.01)',
                'transparent',
              ]}
              locations={[0, 0.10, 0.22, 0.30, 0.36, 0.42, 0.48, 0.53, 0.58, 0.62, 0.66, 0.70]}
              style={StyleSheet.absoluteFill}
            />
          </Reanimated.View>
        )}

        {/* "S E A R C H" Header Label */}
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
              paddingLeft: 10,
              color: '#000000',
              zIndex: 160,
            }, searchHeaderAnimatedStyle]}
          >
            SEARCH
          </Reanimated.Text>
        )}

        {/* Floating Section Cards — Dynamic search results */}
        {searchVisible && (
          <Reanimated.View
            style={[{
              position: 'absolute',
              top: insets.top,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 80,
            }, sectionCardsContainerStyle]}
          >
            <ScrollView
              style={styles.demoSearchContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            >
              {filteredResults.length > 0 ? (
                <View style={styles.demoSearchSection}>
                  <Text style={styles.demoSearchSectionTitle}>Top Results</Text>
                  {/* Rich card for top result — animated in/out */}
                  {filteredResults.length > 0 && (() => {
                    const topResult = filteredResults[0];
                    return (
                      <Reanimated.View
                        key={topResult.id}
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(150)}
                        layout={Layout.duration(200)}
                        style={[
                          styles.richResultCard,
                          highlightedIndex === 0 && styles.demoSearchRowHighlighted,
                        ]}
                      >
                        <View style={styles.richResultHeader}>
                          <View style={styles.richResultIconWrap}>
                            <Ionicons name="flash" size={16} color={colors.accent.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.richResultName}>{topResult.name}</Text>
                            <Text style={styles.richResultPark}>{topResult.park}</Text>
                          </View>
                          {topResult.status && (
                            <View style={styles.richResultStatusBadge}>
                              <Text style={styles.richResultStatusText}>{topResult.status}</Text>
                            </View>
                          )}
                        </View>
                        {/* Stat pills row */}
                        <View style={styles.richResultStatsRow}>
                          {topResult.height && (
                            <View style={styles.richResultStatPill}>
                              <Text style={styles.richResultStatValue}>{topResult.height} ft</Text>
                            </View>
                          )}
                          {topResult.speed && (
                            <View style={styles.richResultStatPill}>
                              <Text style={styles.richResultStatValue}>{topResult.speed} mph</Text>
                            </View>
                          )}
                          {topResult.inversions && topResult.inversions !== '0' && (
                            <View style={styles.richResultStatPill}>
                              <Text style={styles.richResultStatValue}>{topResult.inversions} inv</Text>
                            </View>
                          )}
                          {topResult.lengthFt && (
                            <View style={styles.richResultStatPill}>
                              <Text style={styles.richResultStatValue}>{topResult.lengthFt} ft long</Text>
                            </View>
                          )}
                        </View>
                        {/* View details link */}
                        <Text style={styles.richResultViewDetails}>View details ›</Text>
                      </Reanimated.View>
                    );
                  })()}
                  {/* Regular list rows — animated in/out */}
                  {filteredResults.slice(1).map((coaster, index) => (
                    <Reanimated.View
                      key={coaster.id}
                      entering={FadeIn.duration(200).delay(index * 50)}
                      exiting={FadeOut.duration(150)}
                      layout={Layout.duration(200)}
                      style={[
                        styles.demoSearchRow,
                        highlightedIndex === index + 1 && styles.demoSearchRowHighlighted,
                      ]}
                    >
                      <View style={styles.demoSearchIcon}>
                        <Ionicons name="flash" size={18} color={colors.accent.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.demoSearchName}>{coaster.name}</Text>
                        <Text style={styles.demoSearchPark}>{coaster.park}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#999999" />
                    </Reanimated.View>
                  ))}
                </View>
              ) : typedText.length === 0 ? (
                /* Show initial state: Recent Searches (if any), Popular Rides, Popular Parks, Trending */
                <View>
                  {/* Recent Searches — shows after first search was completed */}
                  {recentSearch && (
                    <View style={styles.demoSearchSection}>
                      <Text style={styles.demoSearchSectionTitle}>Recent Searches</Text>
                      <View style={styles.demoSearchRow}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Ionicons name="time-outline" size={16} color="#999999" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.demoSearchName}>{recentSearch}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#999999" />
                      </View>
                    </View>
                  )}

                  {/* Popular Rides — horizontal cards with real card art */}
                  <View style={styles.demoSearchSection}>
                    <Text style={styles.demoSearchSectionTitle}>Popular Rides</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      scrollEnabled={false}
                      contentContainerStyle={styles.popularRidesRow}
                    >
                      {POPULAR_RIDES.map((ride) => {
                        const cardArt = CARD_ART[ride.id];
                        return (
                          <View key={ride.id} style={styles.popularRideCard}>
                            {cardArt ? (
                              <Image
                                source={cardArt}
                                style={styles.popularRideImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.popularRideImage, { backgroundColor: '#E0E0E0' }]} />
                            )}
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.7)']}
                              style={styles.popularRideGradient}
                            />
                            <Text style={styles.popularRideName} numberOfLines={2}>{ride.name}</Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Popular Parks — horizontal cards with gray gradient */}
                  <View style={styles.demoSearchSection}>
                    <Text style={styles.demoSearchSectionTitle}>Popular Parks</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      scrollEnabled={false}
                      contentContainerStyle={styles.popularRidesRow}
                    >
                      {POPULAR_PARKS.map((park) => (
                        <View key={park.name} style={styles.popularParkCard}>
                          <LinearGradient
                            colors={['#8E8E93', '#636366']}
                            style={StyleSheet.absoluteFill}
                          />
                          <View style={styles.popularParkContent}>
                            <Ionicons name="location" size={16} color="#FFFFFF" style={{ marginBottom: 4 }} />
                            <Text style={styles.popularParkName} numberOfLines={2}>{park.name}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Trending — simple list */}
                  <View style={styles.demoSearchSection}>
                    <Text style={styles.demoSearchSectionTitle}>Trending</Text>
                    {TRENDING_SEARCHES.map((term, index) => (
                      <View
                        key={term}
                        style={[
                          styles.trendingRow,
                          index < TRENDING_SEARCHES.length - 1 && styles.trendingRowBorder,
                        ]}
                      >
                        <Ionicons name="trending-up" size={18} color={colors.accent.primary} style={{ marginRight: 12 }} />
                        <Text style={styles.trendingText}>{term}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                /* No results state */
                <View style={styles.demoSearchSection}>
                  <Text style={styles.demoSearchSectionTitle}>No Results</Text>
                  <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                    <Ionicons name="search" size={32} color="#CCCCCC" />
                    <Text style={{ fontSize: 14, color: '#999999', marginTop: 8 }}>No matches found</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </Reanimated.View>
        )}

        {/* ============================== */}
        {/* Real CoasterSheet */}
        {/* ============================== */}
        <OnboardingCoasterSheet
          ref={coasterSheetRef}
          coaster={sheetCoaster}
          visible={sheetVisible}
          onClose={closeSheet}
        />
      </View>

      {/* Search MorphingPill */}
      <Reanimated.View
        style={[{
          position: 'absolute',
          top: originPosition.top,
          left: originPosition.left,
          width: originPosition.width,
          height: originPosition.height,
          overflow: 'visible',
        }, searchPillWrapperZStyle]}
      >
        <MorphingPill
          ref={morphingPillRef}
          pillWidth={originPosition.width}
          pillHeight={originPosition.height}
          pillBorderRadius={originPosition.borderRadius}
          pillContent={searchPillContent}
          originScreenX={originPosition.left}
          originScreenY={originPosition.top}
          expandedWidth={SCREEN_WIDTH - 32}
          expandedHeight={56}
          expandedBorderRadius={16}
          persistentContent={
            searchOrigin === 'expandedSearchBar'
              ? (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                  <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="globe-outline" size={20} color="#999999" />
                  </View>
                </View>
              )
              : undefined
          }
          overshootAngle={0}
          scrollHidden={searchPillScrollHidden}
          closeFixedSize={searchOrigin === 'expandedSearchBar'}
          closeShadowFade={searchOrigin !== 'expandedSearchBar'}
          closeDuration={searchOrigin === 'expandedSearchBar' ? 445 : undefined}
          closeArcHeight={searchOrigin === 'expandedSearchBar' ? 25 : undefined}
          expandedContent={(_close) => (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              {/* Globe icon */}
              <View style={{ width: 20, height: 20, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="globe-outline" size={20} color="#999999" />
              </View>
              {/* Dynamic search input with typed text + cursor */}
              <View style={{ flex: 1, height: '100%', justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* Blinking cursor at the LEADING edge (before text when empty) */}
                  {cursorVisible && typedText.length === 0 && (
                    <View
                      style={{
                        width: 2,
                        height: 20,
                        backgroundColor: colors.accent.primary,
                        marginRight: 2,
                        borderRadius: 1,
                      }}
                    />
                  )}
                  {typedText.length > 0 ? (
                    <Text style={{ fontSize: 16, color: '#000000' }}>{typedText}</Text>
                  ) : !cursorVisible ? (
                    <Text style={{ fontSize: 16, color: '#999999' }}>Search rides, parks, news...</Text>
                  ) : null}
                  {/* Cursor after typed text (trailing edge while typing) */}
                  {cursorVisible && typedText.length > 0 && (
                    <View
                      style={{
                        width: 2,
                        height: 20,
                        backgroundColor: colors.accent.primary,
                        marginLeft: 1,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </View>
              </View>
              {/* X Close Button (visual only) */}
              <View
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
              </View>
            </View>
          )}
          showBackdrop={false}
          onOpen={() => {
            searchContentFade.value = 0;
            backdropOpacity.value = 0;

            setSearchVisible(true);
            searchPillZIndex.value = 200;
            searchIsClosing.value = 0;
            searchPillScrollHidden.value = 0;

            if (searchOriginRef.current === 'expandedSearchBar') {
              // Bar origin: hide bar, pill IS the visual (same position, higher z-index)
              searchBarMorphOpacity.value = 0;
              searchButtonOpacity.value = 1;
            } else {
              // Button origin: hide button, keep bar visible
              searchButtonOpacity.value = 0;
              searchBarMorphOpacity.value = 1;
            }

            pillMorphProgress.value = 1;
            backdropOpacity.value = withTiming(1, { duration: 510 });
            searchContentFade.value = withDelay(425, withTiming(1, { duration: 280 }));
          }}
          onClose={() => {
            searchIsClosing.value = 1;
            searchContentFade.value = withTiming(0, { duration: 300 });
            backdropOpacity.value = withTiming(0, { duration: 435 });
            pillMorphProgress.value = withTiming(0, {
              duration: 485,
              easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
            });
            // Keep underlying element HIDDEN during close — pill is still the visible element
          }}
          onAnimationStart={handleModalAnimStart}
          onAnimationComplete={(isOpen) => {
            handleModalAnimEnd();
            // Don't restore anything here — wait for onCloseCleanup
          }}
          onCloseCleanup={() => {
            // All in one frame: hide pill + show real elements simultaneously
            searchPillScrollHidden.value = 1; // hide pill
            searchPillZIndex.value = 10;
            searchIsClosing.value = 0;
            searchBarMorphOpacity.value = 1;  // show bar
            searchButtonOpacity.value = 1;    // show button
            pillMorphProgress.value = 0;
            setSearchVisible(false);
          }}
        />
      </Reanimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  mainContentWrapper: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  stickyHeader: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  morphingButtonsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 132,
    overflow: 'visible',
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: spacing.lg,
  },
  feedSectionWrapper: {
    marginTop: spacing.lg,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: spacing.base,
  },
  placeholderCardRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  placeholderCardSmall: {
    flex: 1,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...shadows.small,
  },
  placeholderCardWide: {
    flex: 1,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    ...shadows.small,
  },
  placeholderNewsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.card,
  },
  placeholderImage: {
    height: 160,
    backgroundColor: '#E8E6E3',
  },
  placeholderTextBlock: {
    padding: spacing.base,
    gap: 8,
  },
  placeholderLine: {
    height: 12,
    backgroundColor: '#E8E6E3',
    borderRadius: 6,
  },
  // Demo search content styles
  demoSearchContent: {
    paddingTop: 145,
    paddingHorizontal: 20,
    flex: 1,
  },
  demoSearchSection: {
    marginBottom: 24,
  },
  demoSearchSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  demoSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E6E3',
    borderRadius: 10,
  },
  demoSearchRowHighlighted: {
    backgroundColor: 'rgba(207, 103, 105, 0.08)',
    borderBottomColor: 'transparent',
  },
  demoSearchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(207, 103, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoSearchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  demoSearchPark: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },

  // Popular Rides carousel cards
  popularRidesRow: {
    gap: 10,
  },
  popularRideCard: {
    width: 110,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background.imagePlaceholder,
  },
  popularRideImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  popularRideGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  popularRideName: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Popular Parks cards
  popularParkCard: {
    width: 110,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
  },
  popularParkContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 8,
  },
  popularParkName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Trending rows
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  trendingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E6E3',
  },
  trendingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },

  // Rich result card (top search result)
  richResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  richResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  richResultIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(207, 103, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  richResultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  richResultPark: {
    fontSize: 13,
    color: '#666666',
    marginTop: 1,
  },
  richResultStatusBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  richResultStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#28A745',
  },
  richResultStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  richResultStatPill: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  richResultStatValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  richResultViewDetails: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.primary,
  },
});
