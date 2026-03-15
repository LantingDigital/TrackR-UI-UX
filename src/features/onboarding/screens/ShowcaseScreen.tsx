import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolateColor,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { colors } from '../../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACCENT = colors.accent.primary;

interface ShowcaseItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accentColor: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'log',
    icon: 'flash',
    title: 'Log Every Ride',
    description:
      'Tap, search, done. Log rides in seconds and build your personal coaster history.',
    accentColor: ACCENT,
  },
  {
    id: 'rate',
    icon: 'star',
    title: 'Rate & Rank',
    description:
      'Weighted criteria auto-sort your personal rankings. No more arguing with yourself.',
    accentColor: ACCENT,
  },
  {
    id: 'explore',
    icon: 'map',
    title: 'Explore Parks',
    description:
      'Interactive maps, wait times, food search, and everything you need for the perfect park day.',
    accentColor: ACCENT,
  },
  {
    id: 'community',
    icon: 'people',
    title: 'Join the Community',
    description:
      'Connect with riders, share trip reports, and discover what others are riding.',
    accentColor: ACCENT,
  },
];

interface ShowcaseScreenProps {
  onContinue: () => void;
}

// Progress dot component
const ProgressDot: React.FC<{ isActive: boolean; color: string }> = ({ isActive, color }) => {
  const width = useSharedValue(isActive ? 24 : 8);
  const bgProgress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    width.value = withTiming(isActive ? 24 : 8, { duration: 250, easing: Easing.out(Easing.ease) });
    bgProgress.value = withTiming(isActive ? 1 : 0, { duration: 200 });
  }, [isActive]);

  const dotStyle = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: interpolateColor(
      bgProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.2)', color],
    ),
  }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
};

// =============================================
// Slide 1: Log Every Ride — Animated stat counters
// =============================================
const LogEveryRideSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const counterOpacity = useSharedValue(0);
  const counter1 = useSharedValue(0);
  const counter2 = useSharedValue(0);
  const counter3 = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const iconOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      iconOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      iconScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      counterOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
      counter1.value = withDelay(300, withTiming(147, { duration: 1200, easing: Easing.out(Easing.cubic) }));
      counter2.value = withDelay(400, withTiming(23, { duration: 1000, easing: Easing.out(Easing.cubic) }));
      counter3.value = withDelay(500, withTiming(8, { duration: 800, easing: Easing.out(Easing.cubic) }));
    }
  }, [isActive]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    opacity: counterOpacity.value,
  }));

  return (
    <View style={styles.slideContainer}>
      {/* Large hero icon */}
      <Animated.View style={[styles.logHeroIcon, iconStyle]}>
        <LinearGradient
          colors={[`${ACCENT}20`, `${ACCENT}08`]}
          style={styles.logHeroIconBg}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <Ionicons name="flash" size={64} color={ACCENT} />
        </LinearGradient>
      </Animated.View>

      {/* Animated stats row */}
      <Animated.View style={[styles.statsRow, statsStyle]}>
        <StatCounter value={counter1} label="rides" />
        <View style={styles.statDivider} />
        <StatCounter value={counter2} label="parks" />
        <View style={styles.statDivider} />
        <StatCounter value={counter3} label="states" />
      </Animated.View>

      {/* Title & description */}
      <Text style={styles.slideTitle}>Log Every Ride</Text>
      <Text style={styles.slideDescription}>
        Tap, search, done. Log rides in seconds and build your personal coaster history.
      </Text>
    </View>
  );
};

const StatCounter: React.FC<{ value: SharedValue<number>; label: string }> = ({ value, label }) => {
  return (
    <View style={styles.statItem}>
      <AnimatedNumber value={value} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const AnimatedNumber: React.FC<{ value: SharedValue<number> }> = ({ value }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const update = () => {
      setDisplay(Math.round(value.value));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <Text style={styles.statNumber}>{display}</Text>;
};

// =============================================
// Slide 2: Rate & Rank — Mock leaderboard
// =============================================
const RateAndRankSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      headerOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [isActive]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const rankings = [
    { rank: 1, name: 'Steel Vengeance', rating: '9.6', stars: 5 },
    { rank: 2, name: 'Velocicoaster', rating: '9.4', stars: 5 },
    { rank: 3, name: 'Iron Gwazi', rating: '9.1', stars: 4 },
  ];

  return (
    <View style={styles.slideContainer}>
      {/* Star cluster visual */}
      <Animated.View style={[styles.rateHeader, headerStyle]}>
        <View style={styles.starCluster}>
          {[0, 1, 2, 3, 4].map((i) => (
            <StarIcon key={i} index={i} isActive={isActive} />
          ))}
        </View>
      </Animated.View>

      {/* Mini leaderboard */}
      <View style={styles.leaderboard}>
        {rankings.map((item, index) => (
          <LeaderboardRow key={item.rank} item={item} index={index} isActive={isActive} />
        ))}
      </View>

      {/* Title & description */}
      <Text style={styles.slideTitle}>Rate & Rank</Text>
      <Text style={styles.slideDescription}>
        Weighted criteria auto-sort your personal rankings. No more arguing with yourself.
      </Text>
    </View>
  );
};

const StarIcon: React.FC<{ index: number; isActive: boolean }> = ({ index, isActive }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    if (isActive) {
      opacity.value = withDelay(index * 80, withTiming(1, { duration: 250 }));
      scale.value = withDelay(index * 80, withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
    }
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name="star" size={28} color={ACCENT} />
    </Animated.View>
  );
};

const LeaderboardRow: React.FC<{
  item: { rank: number; name: string; rating: string; stars: number };
  index: number;
  isActive: boolean;
}> = ({ item, index, isActive }) => {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-16);

  useEffect(() => {
    if (isActive) {
      const delay = 200 + index * 100;
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      translateX.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
    }
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.leaderboardRow, style]}>
      <Text style={styles.leaderboardRank}>#{item.rank}</Text>
      <Text style={styles.leaderboardName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.leaderboardRating}>{item.rating}</Text>
    </Animated.View>
  );
};

// =============================================
// Slide 3: Explore Parks — Fanning park cards
// =============================================
const ExploreParksSlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const parks = [
    { name: 'Cedar Point', icon: 'location' as const, rides: 17 },
    { name: 'Magic Mountain', icon: 'location' as const, rides: 20 },
    { name: 'Kings Island', icon: 'location' as const, rides: 15 },
  ];

  return (
    <View style={styles.slideContainer}>
      {/* Fanning park cards */}
      <View style={styles.parkCardsContainer}>
        {parks.map((park, index) => (
          <ParkCard key={park.name} park={park} index={index} total={parks.length} isActive={isActive} />
        ))}
      </View>

      {/* Title & description */}
      <Text style={styles.slideTitle}>Explore Parks</Text>
      <Text style={styles.slideDescription}>
        Interactive maps, wait times, food search, and everything you need for the perfect park day.
      </Text>
    </View>
  );
};

const ParkCard: React.FC<{
  park: { name: string; icon: keyof typeof Ionicons.glyphMap; rides: number };
  index: number;
  total: number;
  isActive: boolean;
}> = ({ park, index, total, isActive }) => {
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.9);

  // Fan angles: -8, 0, 8 degrees
  const targetRotate = (index - Math.floor(total / 2)) * 8;
  // Slight vertical stagger for depth
  const targetY = Math.abs(index - Math.floor(total / 2)) * 8;

  useEffect(() => {
    if (isActive) {
      const delay = 100 + index * 80;
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      rotate.value = withDelay(delay, withTiming(targetRotate, { duration: 500, easing: Easing.out(Easing.cubic) }));
      translateY.value = withDelay(delay, withTiming(targetY, { duration: 500, easing: Easing.out(Easing.cubic) }));
      scale.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    }
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { rotate: `${rotate.value}deg` },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.parkCard, style, { zIndex: total - Math.abs(index - Math.floor(total / 2)) }]}>
      <View style={styles.parkCardInner}>
        <View style={styles.parkCardIconRow}>
          <Ionicons name={park.icon} size={16} color={ACCENT} />
          <Text style={styles.parkCardName} numberOfLines={1}>{park.name}</Text>
        </View>
        <Text style={styles.parkCardRides}>{park.rides} coasters</Text>
      </View>
    </Animated.View>
  );
};

// =============================================
// Slide 4: Join Community — Overlapping avatars + chat bubbles
// =============================================
const JoinCommunitySlide: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const avatarColors = ['#CF6769', '#B85557', '#A04446', '#D88A8C', '#E5A3A4'];

  return (
    <View style={styles.slideContainer}>
      {/* Overlapping avatar circles */}
      <View style={styles.avatarRow}>
        {avatarColors.map((color, index) => (
          <AvatarCircle key={index} color={color} index={index} isActive={isActive} />
        ))}
      </View>

      {/* Chat bubble hints */}
      <View style={styles.chatBubblesContainer}>
        <ChatBubble text="Just hit 100 credits!" index={0} isActive={isActive} align="left" />
        <ChatBubble text="VelociCoaster is insane" index={1} isActive={isActive} align="right" />
      </View>

      {/* Title & description */}
      <Text style={styles.slideTitle}>Join the Community</Text>
      <Text style={styles.slideDescription}>
        Connect with riders, share trip reports, and discover what others are riding.
      </Text>
    </View>
  );
};

const AvatarCircle: React.FC<{ color: string; index: number; isActive: boolean }> = ({ color, index, isActive }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      const delay = index * 60;
      opacity.value = withDelay(delay, withTiming(1, { duration: 250 }));
      scale.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    }
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.avatar, { backgroundColor: color, marginLeft: index === 0 ? 0 : -12 }, style]}>
      <Ionicons name="person" size={18} color="rgba(255,255,255,0.9)" />
    </Animated.View>
  );
};

const ChatBubble: React.FC<{ text: string; index: number; isActive: boolean; align: 'left' | 'right' }> = ({
  text, index, isActive, align,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (isActive) {
      const delay = 400 + index * 150;
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));
    }
  }, [isActive]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[
      styles.chatBubble,
      align === 'right' && styles.chatBubbleRight,
      style,
    ]}>
      <Text style={styles.chatBubbleText}>{text}</Text>
    </Animated.View>
  );
};

// =============================================
// Main ShowcaseScreen
// =============================================
export const ShowcaseScreen: React.FC<ShowcaseScreenProps> = ({ onContinue }) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const ctaPress = useStrongPress();

  // Entrance animations
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    contentOpacity.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    contentTranslateY.value = withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLastItem = activeIndex === SHOWCASE_ITEMS.length - 1;

  const handleNext = useCallback(() => {
    haptics.tap();
    if (isLastItem) {
      onContinue();
    } else {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  }, [activeIndex, isLastItem, onContinue]);

  const handleSkip = useCallback(() => {
    haptics.tap();
    onContinue();
  }, [onContinue]);

  const currentColor = SHOWCASE_ITEMS[activeIndex]?.accentColor ?? ACCENT;

  const renderItem = ({ item, index }: { item: ShowcaseItem; index: number }) => {
    // Each slide gets its own unique visual treatment
    switch (item.id) {
      case 'log':
        return <LogEveryRideSlide isActive={index === activeIndex} />;
      case 'rate':
        return <RateAndRankSlide isActive={index === activeIndex} />;
      case 'explore':
        return <ExploreParksSlide isActive={index === activeIndex} />;
      case 'community':
        return <JoinCommunitySlide isActive={index === activeIndex} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <Pressable
        style={[styles.skipButton, { top: insets.top + spacing.md }]}
        onPress={handleSkip}
        hitSlop={12}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <Animated.View style={[styles.content, contentStyle, { paddingTop: insets.top + spacing.xl }]}>
        {/* Carousel */}
        <View style={styles.carouselRegion}>
          <FlatList
            ref={flatListRef}
            data={SHOWCASE_ITEMS}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            bounces={false}
            style={styles.carousel}
          />
        </View>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {SHOWCASE_ITEMS.map((item, index) => (
            <ProgressDot
              key={item.id}
              isActive={index === activeIndex}
              color={currentColor}
            />
          ))}
        </View>

        {/* CTA */}
        <View style={[styles.ctaRegion, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Pressable {...ctaPress.pressHandlers} onPress={handleNext}>
            <Animated.View style={ctaPress.animatedStyle}>
              <LinearGradient
                colors={[currentColor, shadeColor(currentColor, -20)]}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.ctaText}>
                  {isLastItem ? 'Continue' : 'Next'}
                </Text>
                <Ionicons
                  name={isLastItem ? 'arrow-forward' : 'chevron-forward'}
                  size={18}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

// Helper to darken a hex color
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + percent));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + percent));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Skip
  skipButton: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 10,
  },
  skipText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.5)',
  },

  content: {
    flex: 1,
  },

  // Carousel
  carouselRegion: {
    flex: 1,
    justifyContent: 'center',
  },
  carousel: {
    flexGrow: 0,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.lg,
  },
  slideDescription: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.6,
    maxWidth: 300,
  },

  // ========================
  // Slide 1: Log Every Ride
  // ========================
  logHeroIcon: {
    marginBottom: spacing.xxl,
  },
  logHeroIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 64,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.4)',
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // ========================
  // Slide 2: Rate & Rank
  // ========================
  rateHeader: {
    marginBottom: spacing.xl,
  },
  starCluster: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  leaderboard: {
    width: '100%',
    maxWidth: 280,
    marginBottom: spacing.xxxl,
    gap: spacing.md,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    gap: spacing.base,
  },
  leaderboardRank: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: ACCENT,
    width: 28,
  },
  leaderboardName: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: '#FFFFFF',
  },
  leaderboardRating: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: 'rgba(255,255,255,0.6)',
  },

  // ========================
  // Slide 3: Explore Parks
  // ========================
  parkCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    height: 110,
  },
  parkCard: {
    position: 'absolute',
  },
  parkCardInner: {
    backgroundColor: '#161618',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    width: 160,
    alignItems: 'center',
  },
  parkCardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  parkCardName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  parkCardRides: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.4)',
  },

  // ========================
  // Slide 4: Join Community
  // ========================
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0C',
  },
  chatBubblesContainer: {
    width: '100%',
    maxWidth: 280,
    marginBottom: spacing.xxxl,
    gap: spacing.md,
  },
  chatBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  chatBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: `${ACCENT}15`,
  },
  chatBubbleText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.7)',
  },

  // Dots
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  // CTA
  ctaRegion: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xxxl,
    alignItems: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    height: 56,
    borderRadius: radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  ctaText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
