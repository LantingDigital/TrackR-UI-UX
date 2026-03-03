import React, { useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Pressable, Dimensions } from 'react-native';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { spacing } from '../../../theme/spacing';
import { CoastleGuess, MAX_GUESSES } from '../types/coastle';
import { CoastleGrid, GRID_CARD_WIDTH } from './CoastleGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SNAP_WIDTH = GRID_CARD_WIDTH + spacing.lg;

interface CoastleGridCarouselProps {
  guesses: CoastleGuess[];
  revealingIndex: number | null;
  activeIndex: SharedValue<number>;
  onGridTap?: () => void; // when game is over, tapping any card re-shows the result
}

export const CoastleGridCarousel: React.FC<CoastleGridCarouselProps> = React.memo(({
  guesses,
  revealingIndex,
  activeIndex,
  onGridTap,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  // Total visible slots: guesses + 1 upcoming empty grid (capped at MAX_GUESSES)
  const totalSlots = Math.min(guesses.length + 1, MAX_GUESSES);

  // Keep totalSlots accessible on the UI thread for the scroll handler
  const totalSlotsSV = useSharedValue(totalSlots);
  useEffect(() => { totalSlotsSV.value = totalSlots; }, [totalSlots]);

  // Auto-scroll to the newest guess grid when a new guess is added
  useEffect(() => {
    if (guesses.length > 0) {
      const targetX = (guesses.length - 1) * SNAP_WIDTH;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: targetX, animated: true });
      }, 50);
    }
  }, [guesses.length]);

  // Track scroll position entirely on the UI thread — no React state updates
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const index = Math.round(event.contentOffset.x / SNAP_WIDTH);
      activeIndex.value = Math.max(0, Math.min(index, totalSlotsSV.value - 1));
    },
  });

  return (
    <Animated.ScrollView
      ref={scrollRef as any}
      horizontal
      pagingEnabled={false}
      snapToInterval={SNAP_WIDTH}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={styles.carousel}
    >
      {Array.from({ length: totalSlots }, (_, index) => {
        const guess = guesses[index];
        const isGuessed = index < guesses.length;
        // revealingIndex === null means grids were loaded from storage (not added this session).
        // Skip flip animations to prevent 63 simultaneous animations on cold start.
        const skipAnimation = revealingIndex === null;

        return (
          <Pressable
            key={index}
            style={styles.gridWrapper}
            onPress={onGridTap}
            disabled={!onGridTap}
          >
            <CoastleGrid
              guess={isGuessed ? guess : undefined}
              guessNumber={index + 1}
              shouldReveal={isGuessed && (revealingIndex === null || index <= revealingIndex)}
              isEmpty={!isGuessed}
              skipAnimation={isGuessed && skipAnimation}
            />
          </Pressable>
        );
      })}
    </Animated.ScrollView>
  );
});

export { SNAP_WIDTH };

const styles = StyleSheet.create({
  carousel: {
    flexGrow: 0,
    overflow: 'visible',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
  },
  gridWrapper: {
    width: GRID_CARD_WIDTH,
  },
});
