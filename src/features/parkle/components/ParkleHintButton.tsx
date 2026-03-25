import React, { useEffect, useCallback, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, Dimensions, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { MorphingPill, MorphingPillRef } from '../../../components/MorphingPill';
import { ParkleHintContent, ParkleHintPreContent } from './ParkleHintModal';
import { HintReveal, GameStatus } from '../types/parkle';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const HINT_MORPH_DURATION = 850;

const HINT_CARD_WIDTH = SCREEN_WIDTH - 96;
const HINT_CARD_HEIGHT = 300;

export interface ParkleHintButtonRef {
  closeMorph: () => void;
}

interface ParkleHintButtonProps {
  guessCount: number;
  hints: HintReveal[];
  viewedHintIds: number[];
  gameStatus: GameStatus;
  onViewHints: () => void;
  onMorphOpen?: () => void;
  onMorphCloseStart?: () => void;
  onMorphCloseComplete?: () => void;
}

export const ParkleHintButton = forwardRef<ParkleHintButtonRef, ParkleHintButtonProps>(({
  guessCount,
  hints,
  viewedHintIds,
  gameStatus,
  onViewHints,
  onMorphOpen,
  onMorphCloseStart,
  onMorphCloseComplete,
}, ref) => {
  const hasHints = hints.length > 0;
  const hasUnviewed = hints.some((h) => !viewedHintIds.includes(h.afterGuess));
  const morphRef = useRef<MorphingPillRef>(null);
  const morphIsOpenRef = useRef(false);

  useImperativeHandle(ref, () => ({
    closeMorph: () => morphRef.current?.close(),
  }), []);

  const [pillSize, setPillSize] = useState({ width: 0, height: 0 });

  const handleSizerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setPillSize({ width, height });
    }
  }, []);

  const popScale = useSharedValue(1);
  const lastPoppedHintCount = useRef(hints.length);

  useEffect(() => {
    if (hints.length < lastPoppedHintCount.current) {
      lastPoppedHintCount.current = hints.length;
    }
    if (hasUnviewed && hints.length > lastPoppedHintCount.current) {
      lastPoppedHintCount.current = hints.length;
      if (!morphIsOpenRef.current) {
        popScale.value = withSequence(
          withTiming(1, { duration: 0 }),
          withSpring(1.08, { damping: 8, stiffness: 300 }),
          withSpring(1, { damping: 12, stiffness: 200 }),
        );
      }
    }
  }, [hints.length, hasUnviewed]);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popScale.value }],
  }));

  const handleMorphOpen = useCallback(() => {
    haptics.tap();
    morphIsOpenRef.current = true;
    popScale.value = withTiming(1, { duration: 200 });
    setTimeout(() => onViewHints(), 500);
    onMorphOpen?.();
  }, [onViewHints, onMorphOpen]);

  const handleMorphCloseStart = useCallback(() => {
    haptics.tap();
    morphIsOpenRef.current = false;
    onMorphCloseStart?.();
  }, [onMorphCloseStart]);

  const handleCloseCleanup = useCallback(() => {
    onMorphCloseComplete?.();
  }, [onMorphCloseComplete]);

  if (gameStatus !== 'playing') return null;

  const isActive = hasUnviewed;

  const pillInnerContent = (
    <>
      <Ionicons
        name={hasHints ? 'bulb' : 'bulb-outline'}
        size={16}
        color={isActive ? colors.parkle.accent : colors.text.meta}
      />
      <Text style={[styles.label, isActive && styles.labelActive]}>
        View available hints
      </Text>
    </>
  );

  return (
    <Reanimated.View style={[styles.pillContainer, popStyle, pillSize.width > 0 && { width: pillSize.width, height: pillSize.height }]}>
      <View
        style={styles.sizer}
        onLayout={handleSizerLayout}
        pointerEvents="none"
      >
        {pillInnerContent}
      </View>

      {pillSize.width > 0 && (
        <MorphingPill
          ref={morphRef}
          standalone
          pillWidth={pillSize.width}
          pillHeight={pillSize.height}
          pillBorderRadius={radius.pill}
          originScreenX={(SCREEN_WIDTH - pillSize.width) / 2}
          pillContent={<View style={styles.pillInner}>{pillInnerContent}</View>}
          expandedWidth={HINT_CARD_WIDTH}
          expandedHeight={HINT_CARD_HEIGHT}
          expandedBorderRadius={radius.card}
          expandedY={(SCREEN_HEIGHT - HINT_CARD_HEIGHT) / 2}
          showBackdrop={false}
          openArcHeight={0}
          openBounce={0}
          smoothClose
          overshootAngle={0}
          overshootMagnitude={0}
          expandedContent={(close) =>
            hasHints
              ? <ParkleHintContent hints={hints} close={close} />
              : <ParkleHintPreContent close={close} />
          }
          onOpen={handleMorphOpen}
          onClose={handleMorphCloseStart}
          onCloseCleanup={handleCloseCleanup}
        />
      )}
    </Reanimated.View>
  );
});

ParkleHintButton.displayName = 'ParkleHintButton';

const styles = StyleSheet.create({
  pillContainer: {
    alignSelf: 'center',
  },
  sizer: {
    position: 'absolute',
    opacity: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pillInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  labelActive: {
    color: colors.parkle.accent,
    fontWeight: typography.weights.semibold,
  },
});
