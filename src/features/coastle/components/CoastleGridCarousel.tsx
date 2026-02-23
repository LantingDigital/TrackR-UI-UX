import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { spacing } from '../../../theme/spacing';
import { CoastleGuess, MAX_GUESSES } from '../types/coastle';
import { CoastleGrid, GRID_CARD_WIDTH } from './CoastleGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SNAP_WIDTH = GRID_CARD_WIDTH + spacing.lg;

interface CoastleGridCarouselProps {
  guesses: CoastleGuess[];
  revealingIndex: number | null;
  onActiveIndexChange: (index: number) => void;
}

export const CoastleGridCarousel: React.FC<CoastleGridCarouselProps> = ({
  guesses,
  revealingIndex,
  onActiveIndexChange,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(0);

  // Total visible slots: guesses + 1 upcoming empty grid (capped at MAX_GUESSES)
  const totalSlots = Math.min(guesses.length + 1, MAX_GUESSES);

  // Auto-scroll to the newest guess grid when a new guess is added
  useEffect(() => {
    if (guesses.length > 0) {
      const targetX = (guesses.length - 1) * SNAP_WIDTH;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: targetX, animated: true });
      }, 50);
    }
  }, [guesses.length]);

  // Track scroll position in real-time (not just on momentum end)
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP_WIDTH);
      const clampedIndex = Math.max(0, Math.min(index, totalSlots - 1));
      if (clampedIndex !== activeIndexRef.current) {
        activeIndexRef.current = clampedIndex;
        onActiveIndexChange(clampedIndex);
      }
    },
    [totalSlots, onActiveIndexChange],
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled={false}
      snapToInterval={SNAP_WIDTH}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      style={styles.carousel}
    >
      {Array.from({ length: totalSlots }, (_, index) => {
        const guess = guesses[index];
        const isGuessed = index < guesses.length;

        return (
          <View key={index} style={styles.gridWrapper}>
            <CoastleGrid
              guess={isGuessed ? guess : undefined}
              guessNumber={index + 1}
              shouldReveal={isGuessed && (revealingIndex === null || index <= revealingIndex)}
              isEmpty={!isGuessed}
            />
          </View>
        );
      })}
    </ScrollView>
  );
};

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
