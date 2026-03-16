/**
 * BlindRankingScreen — Personal Preference Ranking
 *
 * See items one at a time. Place them where YOU think they belong.
 * No right or wrong — just your taste. At the end, compare with
 * the community's ranking for fun.
 *
 * Animation philosophy: Coastle-style controlled motion.
 * withTiming for entrances, subtle scales (0.9→1), no bouncy overshoot.
 */

import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { PageDots } from '../../../components/PageDots';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { useCardPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import {
  useBlindRankingStore,
  selectCategory,
  placeInSlot,
  resetGame,
  BLIND_RANKING_CATEGORIES,
} from './stores/blindRankingStore';
import type { BlindRankingCategory } from './types/blindRanking';
import { BlindRankingHeader } from './components/BlindRankingHeader';

const EASE_OUT = Easing.out(Easing.ease);

// ─── Category Card ──────────────────────────────────────────

const CategoryCard = React.memo(function CategoryCard({ category, index, onPress }: {
  category: BlindRankingCategory;
  index: number;
  onPress: () => void;
}) {
  const press = useCardPress();
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      index * 60,
      withTiming(1, { duration: 220, easing: EASE_OUT }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateY: (1 - entrance.value) * 16 },
    ],
  }));

  return (
    <Pressable {...press.pressHandlers} onPress={onPress}>
      <Animated.View style={[entranceStyle, press.animatedStyle]}>
        <View style={styles.catCard}>
          <View style={[styles.catIconCircle, { backgroundColor: category.color + '18' }]}>
            <Ionicons name={category.icon as any} size={24} color={category.color} />
          </View>
          <Text style={styles.catTitle}>{category.title}</Text>
          <Text style={styles.catDesc}>{category.description}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ─── Slot Row ───────────────────────────────────────────────

const SlotRow = React.memo(function SlotRow({ index, slot, isAvailable, onPress }: {
  index: number;
  slot: { name: string; subtitle: string } | null;
  isAvailable: boolean;
  onPress: () => void;
}) {
  const fillOpacity = useSharedValue(slot ? 1 : 0);
  const fillScale = useSharedValue(slot ? 1 : 0.96);

  useEffect(() => {
    if (slot) {
      // Controlled fade-in + subtle scale — no bounce
      fillOpacity.value = withTiming(1, { duration: 180 });
      fillScale.value = withTiming(1, { duration: 180, easing: EASE_OUT });
    }
  }, [slot]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: fillOpacity.value,
    transform: [{ scale: fillScale.value }],
  }));

  return (
    <Pressable
      style={[
        styles.slot,
        slot !== null && styles.slotFilled,
        isAvailable && !slot && styles.slotAvailable,
      ]}
      onPress={onPress}
      disabled={slot !== null}
    >
      <Text style={[styles.slotRank, slot && styles.slotRankFilled]}>{index + 1}</Text>
      {slot ? (
        <Animated.View style={[styles.slotContent, fillStyle]}>
          <Text style={styles.slotName}>{slot.name}</Text>
          <Text style={styles.slotSub}>{slot.subtitle}</Text>
        </Animated.View>
      ) : (
        <Text style={styles.slotEmpty}>
          {isAvailable ? 'Tap to place here' : ''}
        </Text>
      )}
    </Pressable>
  );
});

// ─── Results Comparison Row ─────────────────────────────────

const ComparisonRow = React.memo(function ComparisonRow({ yourRank, item, communityRank, index }: {
  yourRank: number;
  item: { name: string; subtitle: string };
  communityRank?: number;
  index: number;
}) {
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      index * 40,
      withTiming(1, { duration: 200, easing: EASE_OUT }),
    );
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateX: (1 - entrance.value) * 20 }],
  }));

  const diff = communityRank != null ? Math.abs(yourRank - communityRank) : null;

  return (
    <Animated.View style={entranceStyle}>
      <View style={styles.compRow}>
        <View style={styles.compRankBadge}>
          <Text style={styles.compRankText}>{yourRank}</Text>
        </View>
        <View style={styles.compInfo}>
          <Text style={styles.compName}>{item.name}</Text>
          <Text style={styles.compSub}>{item.subtitle}</Text>
        </View>
        {communityRank != null && (
          <View style={styles.compCommunity}>
            <Text style={styles.compCommunityLabel}>Community</Text>
            <Text style={[
              styles.compCommunityRank,
              diff === 0 && styles.compMatch,
              diff != null && diff <= 1 && diff > 0 && styles.compClose,
            ]}>
              #{communityRank}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

// ─── Main Screen ────────────────────────────────────────────

export function BlindRankingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { game, stats, settings, categories } = useBlindRankingStore();

  const handleClose = useCallback(() => {
    haptics.tap();
    resetGame();
    navigation.goBack();
  }, [navigation]);

  const handleCategorySelect = useCallback((cat: BlindRankingCategory) => {
    haptics.tap();
    selectCategory(cat);
  }, []);

  const handleSlotPress = useCallback((slotIndex: number) => {
    if (game.slots[slotIndex] !== null) return;
    haptics.success();
    placeInSlot(slotIndex);
  }, [game.slots]);

  // ─── Category Select ──────────────────────────────

  if (game.status === 'category_select') {
    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <BlindRankingHeader onClose={handleClose} stats={stats} settings={settings} />
        </View>
        <ScrollView
          contentContainerStyle={[styles.catContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        >
          <Text style={styles.catSectionTitle}>Pick a Category</Text>
          <Text style={styles.catSectionSub}>
            Rank items by YOUR preference — no right or wrong!
          </Text>
          <View style={styles.catGrid}>
            {categories.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                index={i}
                onPress={() => handleCategorySelect(cat)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Results ──────────────────────────────────────

  if (game.status === 'results') {
    const hasCommunityData = settings.showCommunityComparison && game.slots.some((s) => s?.communityRank != null);

    return (
      <View style={styles.container}>
        <View style={styles.headerWrapper}>
          <BlindRankingHeader onClose={handleClose} stats={stats} settings={settings} />
        </View>
        <ScrollView contentContainerStyle={[styles.resultsContent, { paddingBottom: insets.bottom + spacing.xxl }]}>
          {/* Hero */}
          <View style={styles.resultsHero}>
            <View style={[styles.resultsIconCircle, { backgroundColor: (game.category?.color ?? colors.accent.primary) + '18' }]}>
              <Ionicons
                name={game.category?.icon as any ?? 'trophy-outline'}
                size={28}
                color={game.category?.color ?? colors.accent.primary}
              />
            </View>
            <Text style={styles.resultsTitle}>{game.category?.title}</Text>
            <Text style={styles.resultsSub}>Here's how you ranked them</Text>
          </View>

          {/* Ranking comparison */}
          <View style={styles.compSection}>
            <View style={styles.compHeader}>
              <Text style={styles.compHeaderYour}>Your Rank</Text>
              {hasCommunityData && <Text style={styles.compHeaderComm}>vs Community</Text>}
            </View>
            {game.slots.map((item, i) => {
              if (!item) return null;
              return (
                <ComparisonRow
                  key={item.id}
                  yourRank={i + 1}
                  item={item}
                  communityRank={item.communityRank}
                  index={i}
                />
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.resultsActions}>
            <Pressable style={styles.playAgainBtn} onPress={() => { haptics.tap(); resetGame(); }}>
              <Text style={styles.playAgainText}>Play Again</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={handleClose}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── Playing ──────────────────────────────────────

  const filledCount = game.slots.filter((s) => s !== null).length;
  const hasRevealedItem = game.revealedItem != null;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <BlindRankingHeader onClose={handleClose} stats={stats} settings={settings} />
      </View>

      {/* Revealed item card */}
      {hasRevealedItem && (
        <RevealCard
          key={game.revealedItem!.id}
          name={game.revealedItem!.name}
          subtitle={game.revealedItem!.subtitle}
          counter={`${game.currentItemIndex + 1} of ${game.items.length}`}
          color={game.category?.color ?? colors.accent.primary}
        />
      )}

      {/* Ranking slots */}
      <ScrollView
        contentContainerStyle={[styles.slotsContainer, { paddingBottom: spacing.sm }]}
        showsVerticalScrollIndicator={false}
      >
        {game.slots.map((slot, i) => (
          <SlotRow
            key={i}
            index={i}
            slot={slot}
            isAvailable={hasRevealedItem}
            onPress={() => handleSlotPress(i)}
          />
        ))}
      </ScrollView>

      {/* Progress dots — bottom-positioned like Coastle */}
      <View style={{ paddingBottom: insets.bottom + spacing.md }}>
        <PageDots
          current={filledCount}
          total={game.items.length}
          label={`${filledCount}/${game.items.length}`}
        />
      </View>
    </View>
  );
}

// ─── Reveal Card ────────────────────────────────────────────

const RevealCard = React.memo(function RevealCard({ name, subtitle, counter, color }: {
  name: string;
  subtitle: string;
  counter: string;
  color: string;
}) {
  // Controlled entrance: scale 0.92→1, opacity 0→1, no bounce
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 200, easing: EASE_OUT });
    opacity.value = withTiming(1, { duration: 180 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <View style={[styles.revealCard, { borderColor: color }]}>
        <Text style={[styles.revealLabel, { color }]}>
          Where does this belong?
        </Text>
        <Text style={styles.revealName}>{name}</Text>
        <Text style={styles.revealSub}>{subtitle}</Text>
        <Text style={styles.revealCounter}>{counter}</Text>
      </View>
    </Animated.View>
  );
});

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  headerWrapper: {
    zIndex: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: { width: 36 },

  // Category select
  catContent: {
    paddingHorizontal: spacing.xl,
  },
  catSectionTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xl,
  },
  catSectionSub: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  catGrid: {
    gap: spacing.base,
  },
  catCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.small,
  },
  catIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  catTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  catDesc: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },

  // Revealed item
  revealCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    ...shadows.small,
  },
  revealLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revealName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  revealSub: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  revealCounter: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
    marginTop: spacing.sm,
  },

  // Slots
  slotsContainer: {
    paddingHorizontal: spacing.xl,
    gap: 6,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
    minHeight: 50,
  },
  slotFilled: {
    borderStyle: 'solid',
    borderColor: colors.accent.primaryLight,
    backgroundColor: colors.background.card,
  },
  slotAvailable: {
    borderColor: colors.accent.primary + '40',
  },
  slotRank: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.meta,
    width: 28,
    textAlign: 'center',
  },
  slotRankFilled: {
    color: colors.accent.primary,
  },
  slotContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  slotName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  slotSub: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
  slotEmpty: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.body,
    color: colors.text.meta,
    fontStyle: 'italic',
  },

  // Results
  resultsContent: {
    paddingHorizontal: spacing.xl,
  },
  resultsHero: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  resultsIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  resultsTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  resultsSub: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Comparison
  compSection: {
    marginBottom: spacing.xl,
  },
  compHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.base,
  },
  compHeaderYour: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compHeaderComm: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: 6,
    ...shadows.small,
  },
  compRankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compRankText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  compInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  compName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  compSub: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
  compCommunity: {
    alignItems: 'flex-end',
  },
  compCommunityLabel: {
    fontSize: 10,
    color: colors.text.meta,
  },
  compCommunityRank: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.secondary,
  },
  compMatch: {
    color: '#4CAF50',
  },
  compClose: {
    color: '#D4A98A',
  },

  // Actions
  resultsActions: {
    alignItems: 'center',
  },
  playAgainBtn: {
    backgroundColor: colors.accent.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xxxl,
    marginBottom: spacing.lg,
  },
  playAgainText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  doneBtn: {
    paddingVertical: spacing.base,
  },
  doneText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
  },
});
