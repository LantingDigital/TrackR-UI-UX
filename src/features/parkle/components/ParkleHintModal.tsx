import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { HintReveal } from '../types/parkle';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH - 96;

// ============================================
// HintPage
// ============================================

interface HintPageProps {
  hint: HintReveal;
  index: number;
  total: number;
  width: number;
}

const HintPage: React.FC<HintPageProps> = ({ hint, index, total, width }) => {
  const isFirstLetter = hint.hintType === 'first_letter';
  const label = isFirstLetter
    ? 'The first letter of this park is'
    : 'The country starts with';

  return (
    <View style={[styles.page, { width }]}>
      <Text style={styles.pageCounter}>Hint {index + 1}/{total}</Text>
      <View style={styles.pageContentArea}>
        <Text style={styles.hintLabel}>{label}</Text>
        {isFirstLetter ? (
          <Text style={styles.hintLetter}>{hint.value}</Text>
        ) : (
          <Text style={[styles.hintPattern, { width: width - spacing.xl * 2 }]}>
            <Text style={styles.hintPatternFirst}>{hint.value[0]}</Text>
            <Text style={styles.hintPatternRest}>{hint.value.slice(1)}</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

// ============================================
// ParkleHintContent
// ============================================

interface ParkleHintContentProps {
  hints: HintReveal[];
  close: () => void;
}

export const ParkleHintContent: React.FC<ParkleHintContentProps> = ({
  hints,
  close,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const initialScrollDone = useRef(false);

  const handleScrollLayout = useCallback(() => {
    if (hints.length > 1 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      scrollRef.current?.scrollTo({ x: (hints.length - 1) * PAGE_WIDTH, animated: false });
    }
  }, [hints.length]);

  return (
    <View style={styles.content}>
      <View style={styles.scrollWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onLayout={handleScrollLayout}
          style={styles.scrollView}
          bounces={false}
        >
          {hints.map((hint, i) => (
            <HintPage
              key={hint.afterGuess}
              hint={hint}
              index={i}
              total={hints.length}
              width={PAGE_WIDTH}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.button}
          onPress={() => { haptics.tap(); close(); }}
        >
          <Text style={styles.buttonText}>Got it</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ============================================
// ParkleHintPreContent
// ============================================

interface ParkleHintPreContentProps {
  close: () => void;
}

export const ParkleHintPreContent: React.FC<ParkleHintPreContentProps> = ({ close }) => (
  <View style={styles.preContent}>
    <Ionicons name="bulb-outline" size={28} color={colors.text.meta} />
    <Text style={styles.preHintText}>Hints unlock at guesses 3 & 6</Text>
    <Pressable style={styles.button} onPress={() => { haptics.tap(); close(); }}>
      <Text style={styles.buttonText}>Got it</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    alignSelf: 'stretch',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  pageCounter: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    textAlign: 'center',
  },
  pageContentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  hintLabel: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.label * 1.4,
  },
  hintLetter: {
    fontSize: 80,
    fontWeight: typography.weights.bold,
    color: colors.parkle.accent,
    lineHeight: 88,
  },
  hintPattern: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    letterSpacing: 1.5,
    lineHeight: 32,
  },
  hintPatternFirst: {
    color: colors.parkle.accent,
  },
  hintPatternRest: {
    color: colors.text.secondary,
  },
  footer: {
    alignItems: 'center',
  },
  button: {
    height: 40,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radius.button,
    backgroundColor: colors.parkle.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  preContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  preHintText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
