import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, PRESS_SCALES } from '../constants/animations';
import { useCardPress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';
import { COASTER_DATABASE } from '../features/coastle/data/coastleDatabase';
import { CoastleCoaster } from '../features/coastle/types/coastle';
import { useSettingsStore, RiderType } from '../stores/settingsStore';

// ============================================
// Constants
// ============================================

const HORIZONTAL_PADDING = 16;

const COLLAPSE_THRESHOLD = 50;
const STATE_CHANGE_COOLDOWN = 400;
const SCROLL_UP_DELTA = 5;

// Header heights
const HEADER_HEIGHT_EXPANDED = 112; // 12 top + 48 search + 12 gap + 40 pills
const HEADER_HEIGHT_COLLAPSED = 60; // 12 top + 36 search row with inline tag + 12 bottom

const HEADER_SPRING = {
  damping: 18,
  stiffness: 180,
  mass: 1,
};

// ============================================
// Tag Types
// ============================================

type TagFilter = 'For You' | 'Trending' | 'Bucket List';

const TAGS: { label: TagFilter; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'For You', icon: 'sparkles-outline' },
  { label: 'Trending', icon: 'trending-up-outline' },
  { label: 'Bucket List', icon: 'bookmark-outline' },
];

// ============================================
// Content Section Types
// ============================================

type SectionType = 'horizontal-rail' | 'featured' | 'ranked-list';

interface ContentSection {
  id: string;
  title: string;
  subtitle?: string;
  type: SectionType;
  data: CoastleCoaster[];
}

// ============================================
// Data Helpers (local filters from COASTER_DATABASE)
// ============================================

const LAUNCH_COASTER_IDS = new Set([
  'top-thrill-dragster', 'kingda-ka', 'maverick-cp', 'do-dodonpa',
  'formula-rossa', 'velocicoaster', 'taron', 'hagrid', 'cheetah-hunt',
  'pantheon', 'copperhead-strike', 'icon', 'helix', 'blue-fire', 'xcelerator',
]);

function getPersonalizedRail(riderType: RiderType): { title: string; data: CoastleCoaster[] } {
  switch (riderType) {
    case 'thrills':
      return {
        title: 'Because you love thrills',
        data: [...COASTER_DATABASE]
          .filter((c) => c.speedMph >= 70 || c.heightFt >= 200)
          .sort((a, b) => b.speedMph - a.speedMph)
          .slice(0, 15),
      };
    case 'data':
      return {
        title: 'Because you love stats',
        data: [...COASTER_DATABASE]
          .sort((a, b) => b.lengthFt - a.lengthFt)
          .slice(0, 15),
      };
    case 'planner':
      return {
        title: 'Because you love exploring parks',
        data: [...COASTER_DATABASE]
          .filter((c) => c.continent !== 'North America')
          .sort((a, b) => b.yearOpened - a.yearOpened)
          .slice(0, 15),
      };
    default:
      return {
        title: 'Because you love Steel',
        data: [...COASTER_DATABASE]
          .filter((c) => c.material === 'Steel')
          .sort((a, b) => b.speedMph - a.speedMph)
          .slice(0, 15),
      };
  }
}

function getHiddenGems(): CoastleCoaster[] {
  return [...COASTER_DATABASE]
    .filter((c) => c.speedMph >= 50 && c.speedMph <= 75 && c.heightFt <= 160)
    .sort((a, b) => b.lengthFt - a.lengthFt)
    .slice(0, 10);
}

function getFeaturedCoaster(): CoastleCoaster {
  // Pick VelociCoaster as featured hero
  return COASTER_DATABASE.find((c) => c.id === 'velocicoaster') || COASTER_DATABASE[0];
}

function getMostPopular(): CoastleCoaster[] {
  // Proxy for popularity: sort by speed*height aggregate
  return [...COASTER_DATABASE]
    .sort((a, b) => (b.speedMph * b.heightFt) - (a.speedMph * a.heightFt))
    .slice(0, 10);
}

function getNewThisYear(): CoastleCoaster[] {
  return [...COASTER_DATABASE]
    .sort((a, b) => b.yearOpened - a.yearOpened)
    .slice(0, 12);
}

function getRecordBreakers(): CoastleCoaster[] {
  const records: CoastleCoaster[] = [];
  let tallest: CoastleCoaster | null = null;
  let fastest: CoastleCoaster | null = null;
  let longest: CoastleCoaster | null = null;
  let mostInversions: CoastleCoaster | null = null;

  for (const c of COASTER_DATABASE) {
    if (!tallest || c.heightFt > tallest.heightFt) tallest = c;
    if (!fastest || c.speedMph > fastest.speedMph) fastest = c;
    if (!longest || c.lengthFt > longest.lengthFt) longest = c;
    if (!mostInversions || c.inversions > mostInversions.inversions) mostInversions = c;
  }

  if (tallest) records.push(tallest);
  if (fastest && fastest.id !== tallest?.id) records.push(fastest);
  if (longest && !records.find((r) => r.id === longest!.id)) records.push(longest);
  if (mostInversions && !records.find((r) => r.id === mostInversions!.id)) records.push(mostInversions);

  return records;
}

function getWorldsBest(): CoastleCoaster[] {
  return [...COASTER_DATABASE]
    .sort((a, b) => (b.speedMph + b.heightFt + b.lengthFt) - (a.speedMph + a.heightFt + a.lengthFt))
    .slice(0, 10);
}

function getByContinent(): { continent: string; coasters: CoastleCoaster[] }[] {
  const map = new Map<string, CoastleCoaster[]>();
  for (const c of COASTER_DATABASE) {
    const arr = map.get(c.continent) || [];
    arr.push(c);
    map.set(c.continent, arr);
  }
  return Array.from(map.entries())
    .map(([continent, coasters]) => ({
      continent,
      coasters: coasters.sort((a, b) => b.speedMph - a.speedMph).slice(0, 10),
    }))
    .sort((a, b) => b.coasters.length - a.coasters.length);
}

function getThemedCollections(): { title: string; data: CoastleCoaster[] }[] {
  return [
    {
      title: 'Wooden Legends',
      data: [...COASTER_DATABASE].filter((c) => c.material === 'Wood').sort((a, b) => b.lengthFt - a.lengthFt).slice(0, 8),
    },
    {
      title: 'Inversion Kings',
      data: [...COASTER_DATABASE].filter((c) => c.inversions >= 4).sort((a, b) => b.inversions - a.inversions).slice(0, 8),
    },
    {
      title: 'Launch Machines',
      data: [...COASTER_DATABASE].filter((c) => LAUNCH_COASTER_IDS.has(c.id)).slice(0, 8),
    },
  ];
}

function buildForYouSections(riderType: RiderType): ContentSection[] {
  const personalized = getPersonalizedRail(riderType);
  const featured = getFeaturedCoaster();
  const gems = getHiddenGems();
  return [
    { id: 'fy-personalized', title: personalized.title, type: 'horizontal-rail', data: personalized.data },
    { id: 'fy-featured', title: 'Featured', subtitle: 'Editor\'s pick', type: 'featured', data: [featured] },
    { id: 'fy-hidden-gems', title: 'Hidden Gems', subtitle: 'Under the radar', type: 'horizontal-rail', data: gems },
  ];
}

function buildTrendingSections(): ContentSection[] {
  return [
    { id: 'tr-popular', title: 'Most Popular', subtitle: 'Top 10 worldwide', type: 'ranked-list', data: getMostPopular() },
    { id: 'tr-new', title: 'Newest Additions', subtitle: 'Recently opened', type: 'horizontal-rail', data: getNewThisYear() },
    { id: 'tr-records', title: 'Record Breakers', subtitle: 'World records', type: 'ranked-list', data: getRecordBreakers() },
  ];
}

function buildBucketListSections(): ContentSection[] {
  const worldsBest = getWorldsBest();
  const continents = getByContinent();
  const collections = getThemedCollections();

  const sections: ContentSection[] = [
    { id: 'bl-best', title: 'World\'s Best', subtitle: 'The ultimate list', type: 'ranked-list', data: worldsBest },
  ];

  // By continent rails
  for (const group of continents) {
    sections.push({
      id: `bl-continent-${group.continent}`,
      title: group.continent,
      subtitle: `${group.coasters.length} top picks`,
      type: 'horizontal-rail',
      data: group.coasters,
    });
  }

  // Themed collections
  for (const col of collections) {
    sections.push({
      id: `bl-collection-${col.title}`,
      title: col.title,
      type: 'horizontal-rail',
      data: col.data,
    });
  }

  return sections;
}

// ============================================
// Search filter
// ============================================

function filterSections(sections: ContentSection[], query: string): ContentSection[] {
  if (!query.trim()) return sections;
  const q = query.toLowerCase().trim();
  return sections
    .map((section) => ({
      ...section,
      data: section.data.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.park.toLowerCase().includes(q) ||
          c.manufacturer.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q),
      ),
    }))
    .filter((section) => section.data.length > 0);
}

// ============================================
// Card Components
// ============================================

const RAIL_CARD_WIDTH = 140;
const FEATURED_CARD_HEIGHT = 170;

// Gradient colors for placeholder cards (no images)
const CARD_GRADIENTS: [string, string][] = [
  ['#CF6769', '#E8999A'],
  ['#6A9FBF', '#A3C7D9'],
  ['#7BAE7F', '#A8D4AB'],
  ['#B8860B', '#DAA520'],
  ['#8B7EC8', '#B0A4E3'],
  ['#CF8969', '#E8B49A'],
];

function getGradient(index: number): [string, string] {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

const HorizontalRailCard = React.memo(
  ({ item, index }: { item: CoastleCoaster; index: number }) => {
    const { pressHandlers, animatedStyle } = useCardPress();
    const gradient = getGradient(index);

    return (
      <Pressable {...pressHandlers} style={{ width: RAIL_CARD_WIDTH, marginRight: spacing.base }}>
        <Reanimated.View style={[styles.railCard, animatedStyle]}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.railCardGradient}
          />
          <View style={styles.railCardContent}>
            <Text style={styles.railCardName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.railCardPark} numberOfLines={1}>{item.park}</Text>
            <View style={styles.railCardStat}>
              <Text style={styles.railCardStatText}>{item.speedMph} mph</Text>
            </View>
          </View>
        </Reanimated.View>
      </Pressable>
    );
  },
);

const FeaturedCard = React.memo(
  ({ item }: { item: CoastleCoaster }) => {
    const { pressHandlers, animatedStyle } = useCardPress();

    return (
      <Pressable {...pressHandlers} style={{ marginHorizontal: HORIZONTAL_PADDING }}>
        <Reanimated.View style={[styles.featuredCard, animatedStyle]}>
          <LinearGradient
            colors={['#CF6769', '#A04547']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuredCardGradient}
          />
          <View style={styles.featuredCardOverlay}>
            <View style={styles.featuredCardBadge}>
              <Ionicons name="star" size={12} color={colors.accent.primary} />
              <Text style={styles.featuredCardBadgeText}>Featured</Text>
            </View>
            <Text style={styles.featuredCardName}>{item.name}</Text>
            <Text style={styles.featuredCardPark}>{item.park}</Text>
            <View style={styles.featuredCardStats}>
              <Text style={styles.featuredCardStatText}>{item.heightFt} ft</Text>
              <View style={styles.featuredStatDot} />
              <Text style={styles.featuredCardStatText}>{item.speedMph} mph</Text>
              <View style={styles.featuredStatDot} />
              <Text style={styles.featuredCardStatText}>{item.inversions} inv</Text>
            </View>
          </View>
        </Reanimated.View>
      </Pressable>
    );
  },
);

const RankedListItem = React.memo(
  ({ item, rank }: { item: CoastleCoaster; rank: number }) => {
    const { pressHandlers, animatedStyle } = useCardPress();

    return (
      <Pressable {...pressHandlers} style={{ marginHorizontal: HORIZONTAL_PADDING }}>
        <Reanimated.View style={[styles.rankedItem, animatedStyle]}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankNumber}>{rank}</Text>
          </View>
          <View style={styles.rankedInfo}>
            <Text style={styles.rankedName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.rankedPark} numberOfLines={1}>{item.park}</Text>
          </View>
          <View style={styles.rankedStatBadge}>
            <Text style={styles.rankedStatText}>{item.speedMph} mph</Text>
          </View>
        </Reanimated.View>
      </Pressable>
    );
  },
);

// ============================================
// Section Renderer
// ============================================

const SectionRenderer = React.memo(
  ({ section }: { section: ContentSection }) => {
    switch (section.type) {
      case 'horizontal-rail':
        return (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.subtitle && (
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.railContentContainer}
            >
              {section.data.map((item, index) => (
                <HorizontalRailCard key={item.id} item={item} index={index} />
              ))}
            </ScrollView>
          </View>
        );

      case 'featured':
        return (
          <View style={styles.sectionContainer}>
            {section.data.map((item) => (
              <FeaturedCard key={item.id} item={item} />
            ))}
          </View>
        );

      case 'ranked-list':
        return (
          <View style={styles.sectionContainer}>
            <View style={[styles.sectionHeader, { paddingHorizontal: HORIZONTAL_PADDING }]}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.subtitle && (
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              )}
            </View>
            {section.data.map((item, index) => (
              <RankedListItem key={item.id} item={item} rank={index + 1} />
            ))}
          </View>
        );

      default:
        return null;
    }
  },
);

// ============================================
// Tag Pill Component
// ============================================

const TagPill = React.memo(
  ({
    label,
    icon,
    isActive,
    onPress,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    isActive: boolean;
    onPress: () => void;
  }) => {
    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
      scale.value = withSpring(PRESS_SCALES.subtle, SPRINGS.responsive);
    }, []);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, SPRINGS.responsive);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePress = useCallback(() => {
      haptics.tap();
      onPress();
    }, [onPress]);

    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Reanimated.View
          style={[
            styles.tagPill,
            isActive ? styles.tagPillActive : styles.tagPillInactive,
            animStyle,
          ]}
        >
          <Ionicons
            name={icon}
            size={14}
            color={isActive ? colors.text.inverse : colors.text.secondary}
            style={{ marginRight: spacing.xs }}
          />
          <Text
            style={[
              styles.tagPillText,
              isActive ? styles.tagPillTextActive : styles.tagPillTextInactive,
            ]}
          >
            {label}
          </Text>
        </Reanimated.View>
      </Pressable>
    );
  },
);

// ============================================
// Empty State
// ============================================

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="search-outline" size={48} color={colors.text.meta} />
    <Text style={styles.emptyTitle}>No results found</Text>
    <Text style={styles.emptySubtitle}>
      Try adjusting your search
    </Text>
  </View>
);

// ============================================
// Main Screen
// ============================================

export const DiscoverScreen = () => {
  const insets = useSafeAreaInsets();
  const { riderType } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<TagFilter>('For You');

  // Scroll animation shared values
  const isCollapsed = useSharedValue(0); // 0 = expanded, 1 = collapsed
  const lastScrollYShared = useSharedValue(0);
  const lastStateChangeTimeShared = useSharedValue(0);
  const contentHeightShared = useSharedValue(0);
  const viewportHeightShared = useSharedValue(0);
  const headerProgress = useSharedValue(1); // 1 = expanded, 0 = collapsed

  // Build content sections based on active tag
  const allSections = useMemo(() => {
    switch (activeTag) {
      case 'For You':
        return buildForYouSections(riderType);
      case 'Trending':
        return buildTrendingSections();
      case 'Bucket List':
        return buildBucketListSections();
    }
  }, [activeTag, riderType]);

  const sections = useMemo(
    () => filterSections(allSections, searchQuery),
    [allSections, searchQuery],
  );

  // Fog gradient dimensions
  const FOG_EXPANDED_HEIGHT = 50 + insets.top + HEADER_HEIGHT_EXPANDED + 200;
  const FOG_COLLAPSED_HEIGHT = 50 + insets.top + HEADER_HEIGHT_COLLAPSED + 200;
  const FOG_SCALE_COLLAPSED = FOG_COLLAPSED_HEIGHT / FOG_EXPANDED_HEIGHT;

  const fogGradientAnimatedStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(
      headerProgress.value,
      [0, 1],
      [FOG_SCALE_COLLAPSED, 1],
    );
    const translateY = -FOG_EXPANDED_HEIGHT * (1 - scaleY) / 2;
    return {
      transform: [{ translateY }, { scaleY }],
    };
  });

  // Header animated styles
  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(headerProgress.value, [0, 1], [36, 44]),
  }));

  const tagsRowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    height: interpolate(headerProgress.value, [0, 1], [0, 40]),
    marginTop: interpolate(headerProgress.value, [0, 1], [0, spacing.md]),
    overflow: 'hidden' as const,
  }));

  const collapsedTagAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headerProgress.value, [0, 0.3], [1, 0]),
    width: interpolate(headerProgress.value, [0, 0.3], [80, 0]),
    overflow: 'hidden' as const,
  }));

  // Haptic trigger via runOnJS
  const triggerScrollHaptic = useCallback(() => {
    haptics.tap();
  }, []);

  // Scroll handler (worklet — runs on UI thread)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      const offsetY = event.contentOffset.y;

      // Ignore negative offsets (top bounce)
      if (offsetY <= 0) {
        lastScrollYShared.value = 0;
        return;
      }

      // Ignore bottom bounce
      const maxScrollY = contentHeightShared.value - viewportHeightShared.value;
      if (maxScrollY > 0 && offsetY >= maxScrollY) {
        lastScrollYShared.value = offsetY;
        return;
      }

      // Cooldown — prevent rapid state changes
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
        headerProgress.value = withSpring(0, HEADER_SPRING);
      }
      // Expand when scrolling up with minimum delta
      else if (isScrollingUp && scrollDelta > SCROLL_UP_DELTA && isCollapsed.value) {
        isCollapsed.value = 0;
        lastStateChangeTimeShared.value = now;
        runOnJS(triggerScrollHaptic)();
        headerProgress.value = withSpring(1, HEADER_SPRING);
      }

      lastScrollYShared.value = offsetY;
    },
  });

  const handleTagPress = useCallback((tag: TagFilter) => {
    setActiveTag(tag);
  }, []);

  // Render all sections as a single scrollable list
  const renderContent = useMemo(() => {
    if (sections.length === 0) {
      return <EmptyState />;
    }
    return sections.map((section) => (
      <SectionRenderer key={section.id} section={section} />
    ));
  }, [sections]);

  const contentPaddingTop = insets.top + HEADER_HEIGHT_EXPANDED;

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <Reanimated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: contentPaddingTop,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        onContentSizeChange={(_w: number, h: number) => {
          contentHeightShared.value = h;
        }}
        onLayout={(e: any) => {
          viewportHeightShared.value = e.nativeEvent.layout.height;
        }}
      >
        {renderContent}
      </Reanimated.ScrollView>

      {/* Fog Gradient Overlay */}
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
            'rgba(247, 247, 247, 0.94)',
            'rgba(247, 247, 247, 0.94)',
            'rgba(247, 247, 247, 0.94)',
            'rgba(247, 247, 247, 0.88)',
            'rgba(247, 247, 247, 0.75)',
            'rgba(247, 247, 247, 0.55)',
            'rgba(247, 247, 247, 0.35)',
            'rgba(247, 247, 247, 0.18)',
            'rgba(247, 247, 247, 0.08)',
            'rgba(247, 247, 247, 0.03)',
            'rgba(247, 247, 247, 0.01)',
            'transparent',
          ]}
          locations={[0, 0.12, 0.24, 0.32, 0.38, 0.44, 0.50, 0.55, 0.60, 0.64, 0.68, 0.72]}
          style={{ flex: 1 }}
        />
      </Reanimated.View>

      {/* Sticky Header — absolutely positioned, content scrolls behind */}
      <View
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top + spacing.base,
          },
        ]}
      >
        {/* Search Bar Row */}
        <View style={styles.searchRow}>
          <Reanimated.View style={[styles.searchBar, searchBarAnimatedStyle]}>
            <Ionicons
              name="search"
              size={18}
              color={colors.text.meta}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search coasters, parks, makers..."
              placeholderTextColor={colors.text.meta}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {/* Collapsed: show active tag indicator inline */}
            <Reanimated.View style={[styles.collapsedTagIndicator, collapsedTagAnimatedStyle]}>
              <Text style={styles.collapsedTagText} numberOfLines={1}>{activeTag}</Text>
            </Reanimated.View>
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  haptics.tap();
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color={colors.text.meta} />
              </Pressable>
            )}
          </Reanimated.View>
        </View>

        {/* Tag Pills Row — collapses away */}
        <Reanimated.View style={[styles.tagsRow, tagsRowAnimatedStyle]}>
          {TAGS.map((tag) => (
            <TagPill
              key={tag.label}
              label={tag.label}
              icon={tag.icon}
              isActive={activeTag === tag.label}
              onPress={() => handleTagPress(tag.label)}
            />
          ))}
        </Reanimated.View>
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // Scroll content
  scrollContent: {
    flexGrow: 1,
  },

  // Sticky Header
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'visible',
  },

  // Search
  searchRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.searchBar,
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    paddingVertical: 0,
  },

  // Collapsed tag indicator (inline with search bar)
  collapsedTagIndicator: {
    backgroundColor: colors.accent.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  collapsedTagText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md, // squared corners (12), NOT radius.pill
  },
  tagPillActive: {
    backgroundColor: colors.accent.primary,
  },
  tagPillInactive: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  tagPillText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
  },
  tagPillTextActive: {
    color: colors.text.inverse,
  },
  tagPillTextInactive: {
    color: colors.text.primary,
  },

  // Sections
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Horizontal Rail Card
  railContentContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  railCard: {
    width: RAIL_CARD_WIDTH,
    height: 170,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
    ...shadows.card,
  },
  railCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  railCardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.base,
  },
  railCardName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  railCardPark: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  railCardStat: {
    marginTop: spacing.sm,
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  railCardStatText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },

  // Featured Card
  featuredCard: {
    height: FEATURED_CARD_HEIGHT,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  featuredCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredCardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  featuredCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    gap: 4,
  },
  featuredCardBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  featuredCardName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
    letterSpacing: -0.5,
  },
  featuredCardPark: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  featuredCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  featuredCardStatText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: 'rgba(255,255,255,0.9)',
  },
  featuredStatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Ranked List Item
  rankedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.trendingRank,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  rankNumber: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  rankedInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  rankedName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  rankedPark: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 1,
  },
  rankedStatBadge: {
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  rankedStatText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default DiscoverScreen;
