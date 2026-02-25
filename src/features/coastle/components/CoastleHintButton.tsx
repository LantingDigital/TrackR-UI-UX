import React, { useEffect, useCallback, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { haptics } from '../../../services/haptics';
import { MorphingPill, MorphingPillRef } from '../../../components/MorphingPill';
import { CoastleHintContent } from './CoastleHintModal';
import { HintReveal, HINT_GUESSES, GameStatus } from '../types/coastle';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const HINT_MORPH_DURATION = 850;

const HINT_CARD_WIDTH = SCREEN_WIDTH - 96;
const HINT_CARD_HEIGHT = 240;

export interface CoastleHintButtonRef {
  closeMorph: () => void;
}

interface CoastleHintButtonProps {
  guessCount: number;
  hints: HintReveal[];
  viewedHintIds: number[];
  gameStatus: GameStatus;
  onViewHints: () => void;
  onShowTooltip: () => void;
  onMorphOpen?: () => void;
  onMorphCloseStart?: () => void;
  onMorphCloseComplete?: () => void;
}

export const CoastleHintButton = forwardRef<CoastleHintButtonRef, CoastleHintButtonProps>(({
  guessCount,
  hints,
  viewedHintIds,
  gameStatus,
  onViewHints,
  onShowTooltip,
  onMorphOpen,
  onMorphCloseStart,
  onMorphCloseComplete,
}, ref) => {
  const hasHints = hints.length > 0;
  const hasUnviewed = hints.some((h) => !viewedHintIds.includes(h.afterGuess));
  const morphRef = useRef<MorphingPillRef>(null);

  useImperativeHandle(ref, () => ({
    closeMorph: () => morphRef.current?.close(),
  }), []);

  // Pill dimensions measured from hidden sizer (never affected by morph expansion)
  const [pillSize, setPillSize] = useState({ width: 0, height: 0 });

  const handleSizerLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setPillSize({ width, height });
    }
  }, []);

  // Ping animation for unviewed hint
  const pingScale = useSharedValue(1);
  const pingOpacity = useSharedValue(0);

  useEffect(() => {
    if (hasUnviewed) {
      // Spring-based ping: expand with spring physics, then pause before repeating
      pingScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withSpring(1.8, { damping: 12, stiffness: 180, mass: 1 }),
          withTiming(1.8, { duration: 600 }), // Hold at expanded (breathing room)
        ),
        -1,
        false,
      );
      pingOpacity.value = withRepeat(
        withSequence(
          withTiming(0.55, { duration: 0 }),
          withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 600 }), // Stay invisible during hold
        ),
        -1,
        false,
      );
    } else {
      // Graceful fade-out instead of abrupt cancel
      pingOpacity.value = withTiming(0, { duration: 200 });
      pingScale.value = withTiming(1, { duration: 200 }, () => {
        cancelAnimation(pingScale);
        cancelAnimation(pingOpacity);
      });
    }
  }, [hasUnviewed]);

  const pingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pingScale.value }],
    opacity: pingOpacity.value,
  }));

  const handleMorphOpen = useCallback(() => {
    haptics.tap();
    onViewHints();
    onMorphOpen?.();
  }, [onViewHints, onMorphOpen]);

  const handleMorphCloseStart = useCallback(() => {
    haptics.tap();
    onMorphCloseStart?.();
  }, [onMorphCloseStart]);

  const handleCloseCleanup = useCallback(() => {
    onMorphCloseComplete?.();
  }, [onMorphCloseComplete]);

  if (gameStatus !== 'playing') return null;

  // Label text
  const nextHintGuess = HINT_GUESSES.find((g) => g > guessCount);
  let labelText: string;
  if (hasUnviewed) {
    labelText = 'Hint available!';
  } else if (hasHints && nextHintGuess) {
    labelText = `View hint · Next at guess ${nextHintGuess}`;
  } else if (hasHints) {
    labelText = `View hint${hints.length > 1 ? 's' : ''}`;
  } else if (nextHintGuess) {
    labelText = `Hints at guesses ${HINT_GUESSES.join(' & ')}`;
  } else {
    labelText = 'No hints available';
  }

  const isActive = hasUnviewed;
  const isTappable = hasHints;

  // Pill inner content (shared between sizer and MorphingPill)
  const pillInnerContent = (
    <>
      <View style={styles.iconWrapper}>
        {isActive && (
          <Reanimated.View style={[styles.pingRing, pingStyle]} />
        )}
        <Ionicons
          name={isTappable ? 'bulb' : 'bulb-outline'}
          size={16}
          color={isActive ? colors.accent.primary : colors.text.meta}
        />
      </View>
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {labelText}
      </Text>
    </>
  );

  // When no hints, render as a simple pressable (no morph)
  if (!hasHints) {
    return (
      <Pressable
        style={styles.pill}
        onPress={() => { haptics.tick(); onShowTooltip(); }}
      >
        {pillInnerContent}
      </Pressable>
    );
  }

  // When hints available, render MorphingPill with hidden sizer for measurement
  return (
    <View style={[styles.pillContainer, pillSize.width > 0 && { width: pillSize.width, height: pillSize.height }]}>
      {/* Hidden sizer — measures natural pill dimensions independently of morph state */}
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
          expandedContent={(close) => <CoastleHintContent hints={hints} close={close} />}
          onOpen={handleMorphOpen}
          onClose={handleMorphCloseStart}
          onCloseCleanup={handleCloseCleanup}
        />
      )}
    </View>
  );
});

CoastleHintButton.displayName = 'CoastleHintButton';

const styles = StyleSheet.create({
  pillContainer: {
    alignSelf: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.background.card,
    ...shadows.small,
  },
  // Hidden measurement wrapper — same padding/gap as the real pill
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
  iconWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  label: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  labelActive: {
    color: colors.accent.primary,
    fontWeight: typography.weights.semibold,
  },
});
