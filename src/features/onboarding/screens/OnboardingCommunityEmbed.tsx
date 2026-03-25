/**
 * OnboardingCommunityEmbed — Full 4-tab community auto-demo.
 *
 * Renders the REAL community screen layout:
 * - Top bar: back chevron + 4 tab labels (Feed, Friends, Rankings, Play)
 * - Animated rose indicator slides between tabs
 * - Each tab has its own content that fades/staggers in
 * - Auto-cycles through all 4 tabs with a heart-burst on Feed
 *
 * Self-contained — no stores, contexts, or navigation imports.
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Easing as REasing,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS } from '../../../constants/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT = colors.accent.primary;
const ACCENT_LIGHT = colors.accent.primaryLight;
const EASE_OUT = REasing.out(REasing.cubic);

// ─── Tab definitions ─────────────────────────────────────
type TabKey = 'feed' | 'friends' | 'rankings' | 'play';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'feed', label: 'Feed' },
  { key: 'friends', label: 'Friends' },
  { key: 'rankings', label: 'Rankings' },
  { key: 'play', label: 'Play' },
];

// Pre-measured approximate label widths (at 14px semibold)
// Used for indicator positioning since we can't measure in demo mode
// tabRow = flex:1 after 56px back button, minus paddingRight (spacing.lg = 16)
const TAB_INNER_WIDTH = SCREEN_WIDTH - 56 - spacing.lg;
const TAB_BUTTON_WIDTH = TAB_INNER_WIDTH / 4;
const LABEL_WIDTHS: Record<TabKey, number> = {
  feed: 30,
  friends: 52,
  rankings: 62,
  play: 28,
};

// Indicator X is now relative to tabRow (indicator moved inside tabRow like real app)
function getIndicatorX(tab: TabKey): number {
  const idx = TABS.findIndex(t => t.key === tab);
  return idx * TAB_BUTTON_WIDTH + (TAB_BUTTON_WIDTH - LABEL_WIDTHS[tab]) / 2;
}

// ─── Feed mock data ──────────────────────────────────────

interface DemoPost {
  id: string;
  type: 'review' | 'trip_report' | 'top_list';
  username: string;
  initials: string;
  timeAgo: string;
  likeCount: number;
  commentCount: number;
  coasterName?: string;
  parkName?: string;
  rating?: number;
  excerpt?: string;
  title?: string;
  rideCount?: number;
  listItems?: string[];
}

const DEMO_POSTS: DemoPost[] = [
  {
    id: 'p1', type: 'review', username: 'CoasterKing_23', initials: 'CK',
    timeAgo: '2h ago', likeCount: 47, commentCount: 12,
    coasterName: 'Steel Vengeance', parkName: 'Cedar Point', rating: 5,
    excerpt: 'Best RMC I\u2019ve ever ridden. The ejector airtime in the back row is unreal.',
  },
  {
    id: 'p2', type: 'trip_report', username: 'ParkHopper_Sarah', initials: 'PS',
    timeAgo: '5h ago', likeCount: 89, commentCount: 23,
    title: 'Cedar Point Trip Report', parkName: 'Cedar Point', rideCount: 47,
    excerpt: '3 parks, 47 rides, 2 days. Here\u2019s how we did it...',
  },
  {
    id: 'p3', type: 'top_list', username: 'RideOrDie_Mike', initials: 'RM',
    timeAgo: '2d ago', likeCount: 31, commentCount: 15,
    title: 'My Top 5 B&M Coasters',
    listItems: ['Fury 325', 'Banshee', 'Diamondback', 'Intimidator', 'Mako'],
  },
];

// ─── Friends mock data ───────────────────────────────────

interface DemoStory {
  id: string;
  name: string;
  initials: string;
}

const DEMO_STORIES: DemoStory[] = [
  { id: 's1', name: 'You', initials: 'ME' },
  { id: 's2', name: 'Jake', initials: 'JK' },
  { id: 's3', name: 'Sarah', initials: 'SH' },
  { id: 's4', name: 'Chris', initials: 'CR' },
  { id: 's5', name: 'Emma', initials: 'EM' },
  { id: 's6', name: 'Tyler', initials: 'TY' },
];

interface DemoActivity {
  id: string;
  type: 'ride' | 'review' | 'milestone';
  friendName: string;
  timeAgo: string;
  text: string;
}

const DEMO_ACTIVITIES: DemoActivity[] = [
  { id: 'a1', type: 'ride', friendName: 'Jake', timeAgo: '2h ago', text: 'Rode Steel Vengeance at Cedar Point' },
  { id: 'a2', type: 'review', friendName: 'Sarah', timeAgo: '4h ago', text: 'Reviewed Fury 325 at Carowinds' },
  { id: 'a3', type: 'milestone', friendName: 'Chris', timeAgo: '1d ago', text: 'Hit 100 unique coasters!' },
  { id: 'a4', type: 'ride', friendName: 'Emma', timeAgo: '1d ago', text: 'Rode VelociCoaster at Universal IOA' },
  { id: 'a5', type: 'review', friendName: 'Tyler', timeAgo: '2d ago', text: 'Reviewed Iron Gwazi at Busch Gardens' },
];

// ─── Rankings mock data ──────────────────────────────────

interface DemoRanking {
  rank: number;
  name: string;
  park: string;
  score: number;
  barPct: number;
}

const DEMO_RANKINGS: DemoRanking[] = [
  { rank: 1, name: 'Steel Vengeance', park: 'Cedar Point', score: 9.6, barPct: 92 },
  { rank: 2, name: 'Fury 325', park: 'Carowinds', score: 9.4, barPct: 88 },
  { rank: 3, name: 'VelociCoaster', park: 'Universal IOA', score: 9.3, barPct: 86 },
  { rank: 4, name: 'Iron Gwazi', park: 'Busch Gardens TB', score: 9.1, barPct: 82 },
  { rank: 5, name: 'El Toro', park: 'Six Flags GA', score: 9.0, barPct: 80 },
];

const RANKING_CATEGORIES = ['Overall', 'Airtime', 'Intensity', 'Smoothness', 'Theming'];

// ─── Play mock data ──────────────────────────────────────

interface DemoGame {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
}

const DEMO_GAMES: DemoGame[] = [
  { id: 'coastle', title: 'Coastle', subtitle: 'Guess the coaster from clues', icon: 'game-controller', iconColor: ACCENT },
  { id: 'speed-sorter', title: 'Speed Sorter', subtitle: 'Sort coasters by stats', icon: 'swap-vertical', iconColor: '#5B8DEF' },
  { id: 'blind-ranking', title: 'Blind Ranking', subtitle: 'Rank without peeking', icon: 'eye-off', iconColor: '#9B6FD4' },
  { id: 'trivia', title: 'Trivia', subtitle: 'Test your knowledge', icon: 'help-circle', iconColor: '#E8A838' },
];

// ─── Games strip icons (Feed tab) ────────────────────────

interface DemoGameIcon {
  id: string;
  label: string;
  icon: string;
  active: boolean;
}

const DEMO_GAME_ICONS: DemoGameIcon[] = [
  { id: 'coastle', label: 'Coastle', icon: 'grid-outline', active: true },
  { id: 'sorter', label: 'Sorter', icon: 'swap-vertical-outline', active: false },
  { id: 'blind', label: 'Blind Rank', icon: 'eye-off-outline', active: false },
  { id: 'trivia', label: 'Trivia', icon: 'help-circle-outline', active: false },
  { id: 'clash', label: 'Clash', icon: 'flash-outline', active: false },
];

// ─── Star Row ────────────────────────────────────────────

const StarRow = ({ rating }: { rating: number }) => (
  <View style={s.starRow}>
    {[0, 1, 2, 3, 4].map(i => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={14}
        color={i < rating ? ACCENT : colors.border.subtle}
      />
    ))}
  </View>
);

// ─── Activity icon helpers ───────────────────────────────

function activityIcon(type: DemoActivity['type']): string {
  switch (type) {
    case 'ride': return 'flash-outline';
    case 'review': return 'star-outline';
    case 'milestone': return 'trophy-outline';
  }
}

function activityColor(type: DemoActivity['type']): string {
  switch (type) {
    case 'ride': return ACCENT;
    case 'review': return '#D4A98A';
    case 'milestone': return '#4CAF50';
  }
}

// ─── Main Component ──────────────────────────────────────

interface Props {
  isActive: boolean;
}

export const OnboardingCommunityEmbed: React.FC<Props> = ({ isActive }) => {
  // Timer management
  const allTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoActiveRef = useRef(false);
  const runDemoLoopRef = useRef<(() => void) | undefined>(undefined);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('feed');

  // Tab indicator position
  const indicatorX = useSharedValue(getIndicatorX('feed'));
  const indicatorW = useSharedValue(LABEL_WIDTHS.feed);

  // Content opacity per tab (crossfade)
  const feedOpacity = useSharedValue(1);
  const friendsOpacity = useSharedValue(0);
  const rankingsOpacity = useSharedValue(0);
  const playOpacity = useSharedValue(0);

  // Feed stagger entrances (3 posts + games strip)
  const feedEntrance = useSharedValue(0);

  // Friends stagger
  const friendsEntrance = useSharedValue(0);

  // Rankings bar fill
  const rankingsEntrance = useSharedValue(0);

  // Play entrance
  const playEntrance = useSharedValue(0);

  // Heart burst
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  // Feed scroll offset
  const feedScrollY = useSharedValue(0);

  // Like state
  const [likedPostIndex, setLikedPostIndex] = useState<number | null>(null);
  const [likeCountBumped, setLikeCountBumped] = useState(false);

  // Tap indicator (visual cause before heart burst)
  const tapScale = useSharedValue(0);
  const tapOpacity = useSharedValue(0);

  // ─── Timer helpers ───────────────────────────────────

  const clearAllTimers = useCallback(() => {
    allTimersRef.current.forEach(t => clearTimeout(t));
    allTimersRef.current = [];
  }, []);

  const scheduleTimer = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    allTimersRef.current.push(t);
    return t;
  }, []);

  // ─── Switch tab helper ───────────────────────────────

  const switchToTab = useCallback((tab: TabKey, animate: boolean) => {
    setActiveTab(tab);

    // Move indicator
    const x = getIndicatorX(tab);
    const w = LABEL_WIDTHS[tab];
    if (animate) {
      indicatorX.value = withSpring(x, SPRINGS.responsive);
      indicatorW.value = withSpring(w, SPRINGS.responsive);
    } else {
      indicatorX.value = x;
      indicatorW.value = w;
    }

    // Crossfade: old out (150ms), new in (200ms)
    const opacityMap = { feed: feedOpacity, friends: friendsOpacity, rankings: rankingsOpacity, play: playOpacity };
    const entranceMap = { feed: feedEntrance, friends: friendsEntrance, rankings: rankingsEntrance, play: playEntrance };

    for (const key of Object.keys(opacityMap) as TabKey[]) {
      if (key === tab) {
        opacityMap[key].value = withDelay(animate ? 150 : 0, withTiming(1, { duration: 200, easing: EASE_OUT }));
        // Trigger entrance
        entranceMap[key].value = 0;
        entranceMap[key].value = withDelay(animate ? 200 : 0, withTiming(1, { duration: 400, easing: EASE_OUT }));
      } else {
        opacityMap[key].value = withTiming(0, { duration: 150, easing: EASE_OUT });
      }
    }
  }, [indicatorX, indicatorW, feedOpacity, friendsOpacity, rankingsOpacity, playOpacity, feedEntrance, friendsEntrance, rankingsEntrance, playEntrance]);

  // ─── Reset ───────────────────────────────────────────

  const resetState = useCallback(() => {
    feedOpacity.value = 0;
    friendsOpacity.value = 0;
    rankingsOpacity.value = 0;
    playOpacity.value = 0;
    feedEntrance.value = 0;
    friendsEntrance.value = 0;
    rankingsEntrance.value = 0;
    playEntrance.value = 0;
    heartScale.value = 0;
    heartOpacity.value = 0;
    tapScale.value = 0;
    tapOpacity.value = 0;
    feedScrollY.value = 0;
    indicatorX.value = getIndicatorX('feed');
    indicatorW.value = LABEL_WIDTHS.feed;
    setActiveTab('feed');
    setLikedPostIndex(null);
    setLikeCountBumped(false);
  }, [feedOpacity, friendsOpacity, rankingsOpacity, playOpacity, feedEntrance, friendsEntrance, rankingsEntrance, playEntrance, heartScale, heartOpacity, tapScale, tapOpacity, feedScrollY, indicatorX, indicatorW]);

  // ─── Demo loop ───────────────────────────────────────

  const runDemoLoop = useCallback(() => {
    if (!demoActiveRef.current) return;
    resetState();

    let t = 200;

    // 1. Feed enters (0-2s)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      switchToTab('feed', false);
    }, t);
    t += 300;

    // 2. Hold Feed (2-4.5s)
    t += 2200;

    // 3. Auto-scroll Feed down slightly
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      feedScrollY.value = withTiming(120, { duration: 1500, easing: REasing.inOut(REasing.cubic) });
    }, t);
    t += 1800;

    // 4. Tap indicator flash (visual cause before heart effect)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      tapScale.value = 0;
      tapOpacity.value = 0;
      tapScale.value = withTiming(1, { duration: 200, easing: EASE_OUT });
      tapOpacity.value = withTiming(0.8, { duration: 100 });
    }, t);
    t += 120;

    // Double-tap heart burst (celebration OK — low damping acceptable)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      tapOpacity.value = withTiming(0, { duration: 200 });
      setLikedPostIndex(0);
      setLikeCountBumped(true);
      heartOpacity.value = withTiming(1, { duration: 100 });
      heartScale.value = withSpring(1, { damping: 8, stiffness: 200, mass: 0.6 });
    }, t);
    t += 800;

    // Fade heart
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      heartOpacity.value = withTiming(0, { duration: 400 });
    }, t);
    t += 600;

    // 5. Switch to Friends (5-5.5s)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      feedScrollY.value = 0;
      switchToTab('friends', true);
    }, t);
    t += 500;

    // 6. Hold Friends (5.5-8.5s)
    t += 3000;

    // 7. Switch to Rankings (8.5-9s)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      switchToTab('rankings', true);
    }, t);
    t += 500;

    // 8. Hold Rankings (9-12s)
    t += 3000;

    // 9. Switch to Play (12-12.5s)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      switchToTab('play', true);
    }, t);
    t += 500;

    // 10. Hold Play (12.5-15.5s)
    t += 3000;

    // 11. Switch back to Feed (15.5-16s)
    scheduleTimer(() => {
      if (!demoActiveRef.current) return;
      switchToTab('feed', true);
    }, t);
    t += 500;

    // 12. Hold, then loop
    t += 2000;
    scheduleTimer(() => {
      if (demoActiveRef.current && runDemoLoopRef.current) {
        runDemoLoopRef.current();
      }
    }, t);
  }, [resetState, scheduleTimer, switchToTab, feedScrollY, heartOpacity, heartScale, tapScale, tapOpacity]);

  runDemoLoopRef.current = runDemoLoop;

  // ─── isActive effect ─────────────────────────────────

  useEffect(() => {
    if (!isActive) {
      demoActiveRef.current = false;
      clearAllTimers();
      resetState();
      return;
    }

    demoActiveRef.current = true;
    scheduleTimer(() => {
      if (runDemoLoopRef.current) runDemoLoopRef.current();
    }, 300);

    return () => {
      demoActiveRef.current = false;
      clearAllTimers();
    };
  }, [isActive, clearAllTimers, resetState, scheduleTimer]);

  // ─── Animated styles ─────────────────────────────────

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const feedStyle = useAnimatedStyle(() => ({
    opacity: feedOpacity.value,
    display: feedOpacity.value === 0 ? 'none' : 'flex',
  }));

  const friendsStyle = useAnimatedStyle(() => ({
    opacity: friendsOpacity.value,
    display: friendsOpacity.value === 0 ? 'none' : 'flex',
  }));

  const rankingsStyle = useAnimatedStyle(() => ({
    opacity: rankingsOpacity.value,
    display: rankingsOpacity.value === 0 ? 'none' : 'flex',
  }));

  const playStyle = useAnimatedStyle(() => ({
    opacity: playOpacity.value,
    display: playOpacity.value === 0 ? 'none' : 'flex',
  }));

  const feedScrollStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -feedScrollY.value }],
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: heartScale.value }],
  }));

  const tapRingStyle = useAnimatedStyle(() => ({
    opacity: tapOpacity.value,
    transform: [{ scale: interpolate(tapScale.value, [0, 1], [0.5, 1.15]) }],
  }));

  // Stagger helpers using entrance shared values
  const makeFeedItemStyle = (index: number) => useAnimatedStyle(() => {
    const delay = index * 0.12;
    const progress = interpolate(feedEntrance.value, [delay, Math.min(delay + 0.4, 1)], [0, 1], 'clamp');
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * 20 }],
    };
  });

  const makeFriendsItemStyle = (index: number) => useAnimatedStyle(() => {
    const delay = index * 0.1;
    const progress = interpolate(friendsEntrance.value, [delay, Math.min(delay + 0.4, 1)], [0, 1], 'clamp');
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * 16 }],
    };
  });

  const makeRankingsItemStyle = (index: number) => useAnimatedStyle(() => {
    const delay = index * 0.1;
    const progress = interpolate(rankingsEntrance.value, [delay, Math.min(delay + 0.35, 1)], [0, 1], 'clamp');
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * 16 }],
    };
  });

  const makeRankingsBarStyle = (index: number, pct: number) => useAnimatedStyle(() => {
    const delay = index * 0.1 + 0.2;
    const progress = interpolate(rankingsEntrance.value, [delay, Math.min(delay + 0.4, 1)], [0, 1], 'clamp');
    return { width: `${pct * progress}%` as any };
  });

  const makePlayItemStyle = (index: number) => useAnimatedStyle(() => {
    const delay = index * 0.12;
    const progress = interpolate(playEntrance.value, [delay, Math.min(delay + 0.4, 1)], [0, 1], 'clamp');
    return {
      opacity: progress,
      transform: [{ translateY: (1 - progress) * 20 }],
    };
  });

  // Pre-create animated styles for each item (hooks must be top-level)
  const feedItem0 = makeFeedItemStyle(0);
  const feedItem1 = makeFeedItemStyle(1);
  const feedItem2 = makeFeedItemStyle(2);
  const feedItem3 = makeFeedItemStyle(3);
  const feedItemStyles = [feedItem0, feedItem1, feedItem2, feedItem3];

  const friendsItem0 = makeFriendsItemStyle(0);
  const friendsItem1 = makeFriendsItemStyle(1);
  const friendsItem2 = makeFriendsItemStyle(2);
  const friendsItem3 = makeFriendsItemStyle(3);
  const friendsItem4 = makeFriendsItemStyle(4);
  const friendsItem5 = makeFriendsItemStyle(5);
  const friendsItem6 = makeFriendsItemStyle(6);
  const friendsItemStyles = [friendsItem0, friendsItem1, friendsItem2, friendsItem3, friendsItem4, friendsItem5, friendsItem6];

  const rankItem0 = makeRankingsItemStyle(0);
  const rankItem1 = makeRankingsItemStyle(1);
  const rankItem2 = makeRankingsItemStyle(2);
  const rankItem3 = makeRankingsItemStyle(3);
  const rankItem4 = makeRankingsItemStyle(4);
  const rankItem5 = makeRankingsItemStyle(5);
  const rankItemStyles = [rankItem0, rankItem1, rankItem2, rankItem3, rankItem4, rankItem5];

  const rankBar0 = makeRankingsBarStyle(0, DEMO_RANKINGS[0].barPct);
  const rankBar1 = makeRankingsBarStyle(1, DEMO_RANKINGS[1].barPct);
  const rankBar2 = makeRankingsBarStyle(2, DEMO_RANKINGS[2].barPct);
  const rankBar3 = makeRankingsBarStyle(3, DEMO_RANKINGS[3].barPct);
  const rankBar4 = makeRankingsBarStyle(4, DEMO_RANKINGS[4].barPct);
  const rankBarStyles = [rankBar0, rankBar1, rankBar2, rankBar3, rankBar4];

  const playItem0 = makePlayItemStyle(0);
  const playItem1 = makePlayItemStyle(1);
  const playItem2 = makePlayItemStyle(2);
  const playItem3 = makePlayItemStyle(3);
  const playItem4 = makePlayItemStyle(4);
  const playItemStyles = [playItem0, playItem1, playItem2, playItem3, playItem4];

  // ─── Render: Feed tab ────────────────────────────────

  const renderFeedPost = (post: DemoPost, index: number) => {
    const isLiked = likedPostIndex === index;
    const displayLikes = likeCountBumped && index === 0 ? post.likeCount + 1 : post.likeCount;

    return (
      <Animated.View key={post.id} style={[index > 0 && s.cardGap, feedItemStyles[index + 1]]}>
        <View style={s.card}>
          {/* Tap ring + Heart burst overlay — only on first card */}
          {index === 0 && (
            <>
              <Animated.View style={[s.tapRingOverlay, tapRingStyle]} pointerEvents="none">
                <View style={s.tapRing} />
              </Animated.View>
              <Animated.View style={[s.heartOverlay, heartAnimStyle]} pointerEvents="none">
                <Ionicons name="heart" size={48} color={ACCENT} />
              </Animated.View>
            </>
          )}

          {/* Header */}
          <View style={s.postHeader}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{post.initials}</Text>
            </View>
            <View style={s.headerTextCol}>
              <Text style={s.authorName}>{post.username}</Text>
            </View>
            <Text style={s.timeAgo}>{post.timeAgo}</Text>
          </View>

          {/* Content */}
          {post.type === 'review' && (
            <View style={s.contentArea}>
              <StarRow rating={post.rating!} />
              <Text style={s.coasterName}>{post.coasterName}</Text>
              <Text style={s.parkNameText}>{post.parkName}</Text>
              <Text style={s.bodyText} numberOfLines={3}>{post.excerpt}</Text>
            </View>
          )}
          {post.type === 'trip_report' && (
            <View style={s.contentArea}>
              <Text style={s.tripTitle}>{post.title}</Text>
              <View style={s.metaRow}>
                <Text style={s.metaText}>{post.parkName}</Text>
                <Text style={s.metaText}> · </Text>
                <Text style={s.metaText}>{post.rideCount} rides</Text>
              </View>
              <Text style={s.bodyText} numberOfLines={3}>{post.excerpt}</Text>
            </View>
          )}
          {post.type === 'top_list' && (
            <View style={s.contentArea}>
              <Text style={s.tripTitle}>{post.title}</Text>
              <View style={s.listContainer}>
                {post.listItems!.map((item, i) => (
                  <View key={i} style={[s.listItem, i > 0 && s.listItemSpacing]}>
                    <Text style={s.listRank}>{i + 1}</Text>
                    <Text style={s.listName}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={s.postFooter}>
            <View style={s.footerAction}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? ACCENT : colors.text.secondary} />
              <Text style={[s.footerCount, isLiked && s.footerCountActive]}>{displayLikes}</Text>
            </View>
            <View style={s.footerAction}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.text.secondary} />
              <Text style={s.footerCount}>{post.commentCount}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderFeedTab = () => (
    <Animated.View style={[s.tabContentAbsolute, feedStyle]}>
      <Animated.View style={feedScrollStyle}>
        {/* Games strip */}
        <Animated.View style={feedItemStyles[0]}>
          <Text style={s.gamesSectionLabel}>GAMES</Text>
          <View style={s.gamesStripRow}>
            {DEMO_GAME_ICONS.map(game => (
              <View key={game.id} style={s.gameWrapper}>
                <View style={[s.outerRing, game.active ? s.outerRingActive : s.outerRingInactive]}>
                  <View style={[s.innerCircle, game.active ? s.innerCircleActive : s.innerCircleInactive]}>
                    <Ionicons name={game.icon as any} size={game.active ? 22 : 18} color={game.active ? ACCENT : colors.text.meta} />
                  </View>
                </View>
                <Text style={[s.gameLabel, game.active ? s.gameLabelActive : s.gameLabelInactive]}>{game.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Posts */}
        {DEMO_POSTS.map((post, i) => renderFeedPost(post, i))}

        <View style={s.scrollPadding} />
      </Animated.View>
    </Animated.View>
  );

  // ─── Render: Friends tab ─────────────────────────────

  const renderFriendsTab = () => (
    <Animated.View style={[s.tabContentAbsolute, friendsStyle]}>
      {/* Stories */}
      <Animated.View style={friendsItemStyles[0]}>
        <Text style={s.sectionTitle}>Stories</Text>
        <View style={s.storiesRow}>
          {DEMO_STORIES.map((story, i) => (
            <Animated.View key={story.id} style={[s.storyBubble, friendsItemStyles[Math.min(i + 1, 6)]]}>
              <View style={s.storyRing}>
                <View style={s.storyAvatar}>
                  <Text style={s.storyInitials}>{story.initials}</Text>
                </View>
              </View>
              <Text style={s.storyName}>{story.name}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Activity */}
      <Animated.View style={[{ marginTop: spacing.xxl }, friendsItemStyles[2]]}>
        <Text style={s.sectionTitle}>Activity</Text>
      </Animated.View>

      {DEMO_ACTIVITIES.map((activity, i) => {
        const iconCol = activityColor(activity.type);
        return (
          <Animated.View key={activity.id} style={[s.activityRow, friendsItemStyles[Math.min(i + 3, 6)]]}>
            <View style={[s.activityIcon, { backgroundColor: iconCol + '18' }]}>
              <Ionicons name={activityIcon(activity.type) as any} size={14} color={iconCol} />
            </View>
            <View style={s.activityContent}>
              <View style={s.activityHeader}>
                <Text style={s.activityName}>{activity.friendName}</Text>
                <Text style={s.activityTime}>{activity.timeAgo}</Text>
              </View>
              <Text style={s.activityText}>{activity.text}</Text>
            </View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );

  // ─── Render: Rankings tab ────────────────────────────

  const renderRankingsTab = () => (
    <Animated.View style={[s.tabContentAbsolute, rankingsStyle]}>
      {/* Category chips */}
      <Animated.View style={[s.chipRow, rankItemStyles[0]]}>
        {RANKING_CATEGORIES.map((cat, i) => (
          <View key={cat} style={[s.categoryChip, i === 0 && s.categoryChipActive]}>
            <Text style={[s.categoryChipText, i === 0 && s.categoryChipTextActive]}>{cat}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Time filters */}
      <Animated.View style={[s.timeFilterRow, rankItemStyles[0]]}>
        {['All Time', 'This Month', 'This Week'].map((label, i) => (
          <View key={label} style={[s.timeChip, i === 0 && s.timeChipActive]}>
            <Text style={[s.timeChipText, i === 0 && s.timeChipTextActive]}>{label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Ranked entries */}
      {DEMO_RANKINGS.map((entry, i) => (
        <Animated.View key={entry.rank} style={[s.rankedCard, rankItemStyles[i + 1]]}>
          <View style={s.rankedLeftCol}>
            <Text style={[s.rankedNumber, entry.rank <= 3 && s.rankedNumberTop3]}>{entry.rank}</Text>
          </View>
          <View style={s.rankedInfo}>
            <Text style={s.rankedCoasterName} numberOfLines={1}>{entry.name}</Text>
            <Text style={s.rankedParkName} numberOfLines={1}>{entry.park}</Text>
            <View style={s.rankedBarTrack}>
              <Animated.View style={[s.rankedBarFill, rankBarStyles[i]]} />
            </View>
          </View>
          <View style={s.rankedScoreCol}>
            <Text style={[s.rankedScore, entry.rank <= 3 && s.rankedScoreTop3]}>{entry.score.toFixed(1)}</Text>
          </View>
        </Animated.View>
      ))}
    </Animated.View>
  );

  // ─── Render: Play tab ────────────────────────────────

  const renderPlayTab = () => (
    <Animated.View style={[s.tabContentAbsolute, playStyle]}>
      {/* Featured */}
      <Animated.View style={playItemStyles[0]}>
        <Text style={s.playSectionLabel}>FEATURED</Text>
      </Animated.View>

      <Animated.View style={[s.heroCard, playItemStyles[1]]}>
        {/* Badge row */}
        <View style={s.heroBadgeRow}>
          <View style={s.heroBadge}>
            <Ionicons name="today-outline" size={11} color={ACCENT} />
            <Text style={s.heroBadgeText}>Daily #42</Text>
          </View>
          <View style={s.heroStreakBadge}>
            <Ionicons name="flame" size={12} color="#E07A5F" />
            <Text style={s.heroStreakBadgeText}>5</Text>
          </View>
        </View>

        {/* Title */}
        <View style={s.heroTitleRow}>
          <View style={[s.heroIconCircle, { backgroundColor: ACCENT + '15' }]}>
            <Ionicons name="game-controller" size={24} color={ACCENT} />
          </View>
          <View style={s.heroTitleCol}>
            <Text style={s.heroTitle}>Coastle</Text>
            <Text style={s.heroSubtitle}>Guess the coaster from clues</Text>
          </View>
        </View>

        {/* Streak dots */}
        <View style={s.streakSection}>
          <View style={s.streakDots}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={[s.streakDot, i < 5 ? s.streakDotActive : s.streakDotInactive]} />
            ))}
          </View>
          <Text style={s.streakLabel}>5 day streak</Text>
        </View>

        {/* Stats */}
        <View style={s.heroStatsRow}>
          {[{ v: '42', l: 'Played' }, { v: '86%', l: 'Win Rate' }, { v: '4.2', l: 'Avg Guesses' }].map((stat, i) => (
            <React.Fragment key={stat.l}>
              {i > 0 && <View style={s.heroStatDivider} />}
              <View style={s.heroStat}>
                <Text style={s.heroStatValue}>{stat.v}</Text>
                <Text style={s.heroStatLabel}>{stat.l}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* CTA */}
        <View style={s.heroPlayCta}>
          <Ionicons name="play" size={14} color={colors.text.inverse} />
          <Text style={s.heroPlayCtaText}>Play Today's Coastle</Text>
        </View>
      </Animated.View>

      {/* More games */}
      <Animated.View style={playItemStyles[2]}>
        <Text style={[s.playSectionLabel, { marginTop: spacing.xl }]}>MORE GAMES</Text>
      </Animated.View>

      <View style={s.moreGamesRow}>
        {DEMO_GAMES.slice(1).map((game, i) => (
          <Animated.View key={game.id} style={[s.carouselCard, playItemStyles[i + 2]]}>
            <View style={[s.carouselIconCircle, { backgroundColor: game.iconColor + '15' }]}>
              <Ionicons name={game.icon as any} size={20} color={game.iconColor} />
            </View>
            <Text style={s.carouselTitle} numberOfLines={1}>{game.title}</Text>
            <Text style={s.carouselSubtitle} numberOfLines={2}>{game.subtitle}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  // ─── Main render ─────────────────────────────────────

  return (
    <View style={s.container}>
      {/* Top bar — back chevron + tab labels + indicator */}
      <View style={s.topBar}>
        <View style={s.topBarRow}>
          {/* Back chevron */}
          <View style={s.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text.primary} />
          </View>

          {/* Tab labels + indicator (indicator inside tabRow like real app) */}
          <View style={s.tabRow}>
            {TABS.map(tab => {
              const isActive = tab.key === activeTab;
              return (
                <View key={tab.key} style={s.tabButton}>
                  <Text style={[s.tabLabel, isActive ? s.tabLabelActive : s.tabLabelInactive]}>
                    {tab.label}
                  </Text>
                </View>
              );
            })}
            <Animated.View style={[s.indicator, indicatorStyle]} />
          </View>
        </View>
      </View>

      {/* Tab content area */}
      <View style={s.tabContentContainer}>
        {renderFeedTab()}
        {renderFriendsTab()}
        {renderRankingsTab()}
        {renderPlayTab()}

        {/* Fog gradient — matches GlassHeader S-curve from design-taste.md */}
        <LinearGradient
          colors={[
            'rgba(247,247,247,0.88)',
            'rgba(247,247,247,0.82)',
            'rgba(247,247,247,0.70)',
            'rgba(247,247,247,0.52)',
            'rgba(247,247,247,0.32)',
            'rgba(247,247,247,0.15)',
            'rgba(247,247,247,0.05)',
            'rgba(247,247,247,0.01)',
            'rgba(247,247,247,0)',
          ]}
          style={s.fogGradient}
          pointerEvents="none"
        />
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
    overflow: 'hidden',
    paddingTop: 46, // clear dynamic island — reduced to fill under status bar
  },

  // ── Top bar ──
  topBar: {
    paddingBottom: spacing.sm,
    zIndex: 10,
    backgroundColor: 'rgba(247, 247, 247, 0.88)',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  backButton: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    paddingRight: spacing.lg,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  tabLabel: {
    fontSize: typography.sizes.label,
  },
  tabLabelActive: {
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  tabLabelInactive: {
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: ACCENT,
  },

  // ── Fog gradient ──
  fogGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 5,
  },

  // ── Tap indicator ──
  tapRingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9,
  },
  tapRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(207, 103, 105, 0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(207, 103, 105, 0.15)',
  },

  // ── Tab content ──
  tabContentContainer: {
    flex: 1,
    position: 'relative',
  },
  tabContentAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // ── Feed: Games strip ──
  gamesSectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  gamesStripRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.lg,
  },
  gameWrapper: {
    alignItems: 'center',
    width: 58,
  },
  outerRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRingActive: {
    borderWidth: 2.5,
    borderColor: ACCENT,
  },
  outerRingInactive: {
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  innerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircleActive: {
    backgroundColor: colors.background.card,
  },
  innerCircleInactive: {
    backgroundColor: colors.background.page,
  },
  gameLabel: {
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
  gameLabelActive: {
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  gameLabelInactive: {
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },

  // ── Feed: Post cards ──
  cardGap: {
    marginTop: spacing.base,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
    overflow: 'hidden',
  },
  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: ACCENT,
  },
  headerTextCol: {
    flex: 1,
    marginLeft: spacing.base,
  },
  authorName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  timeAgo: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
  },
  contentArea: {
    marginTop: spacing.base,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  coasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  parkNameText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginTop: 2,
  },
  bodyText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.base,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
  tripTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  metaText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
  },
  listContainer: {
    marginTop: spacing.base,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemSpacing: {
    marginTop: spacing.sm,
  },
  listRank: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: ACCENT,
    width: 20,
  },
  listName: {
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    flex: 1,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerCount: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginLeft: spacing.xs,
  },
  footerCountActive: {
    color: ACCENT,
  },
  scrollPadding: {
    height: 300,
  },

  // ── Friends: Stories ──
  sectionTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  storiesRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  storyBubble: {
    alignItems: 'center',
    width: 64,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInitials: {
    fontSize: 15,
    fontWeight: typography.weights.bold,
    color: ACCENT,
  },
  storyName: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Friends: Activity ──
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
  activityText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // ── Rankings ──
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  categoryChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background.card,
    ...shadows.small,
  },
  categoryChipActive: {
    backgroundColor: ACCENT,
  },
  categoryChipText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.inverse,
  },
  timeFilterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timeChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background.input,
  },
  timeChipActive: {
    backgroundColor: ACCENT_LIGHT,
  },
  timeChipText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  timeChipTextActive: {
    color: ACCENT,
    fontWeight: typography.weights.semibold,
  },
  rankedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  rankedLeftCol: {
    width: 30,
    alignItems: 'center',
  },
  rankedNumber: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
  },
  rankedNumberTop3: {
    color: ACCENT,
  },
  rankedInfo: {
    flex: 1,
    marginHorizontal: spacing.base,
  },
  rankedCoasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  rankedParkName: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 1,
  },
  rankedBarTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border.subtle,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  rankedBarFill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: ACCENT,
  },
  rankedScoreCol: {
    alignItems: 'flex-end',
    minWidth: 36,
  },
  rankedScore: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  rankedScoreTop3: {
    color: ACCENT,
  },

  // ── Play ──
  playSectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    marginBottom: spacing.base,
  },
  heroCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: ACCENT_LIGHT,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: ACCENT,
  },
  heroStreakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#E07A5F15',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  heroStreakBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: '#E07A5F',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleCol: {
    marginLeft: spacing.base,
    flex: 1,
  },
  heroTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 4,
  },
  streakDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  streakDotActive: {
    backgroundColor: '#E07A5F',
  },
  streakDotInactive: {
    backgroundColor: colors.border.subtle,
  },
  streakLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
  heroStatValue: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  heroStatLabel: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: 2,
  },
  heroPlayCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
  },
  heroPlayCtaText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },

  // More games carousel
  moreGamesRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  carouselCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  carouselIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  carouselTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  carouselSubtitle: {
    fontSize: 10,
    color: colors.text.meta,
    textAlign: 'center',
    marginTop: 2,
  },
});
