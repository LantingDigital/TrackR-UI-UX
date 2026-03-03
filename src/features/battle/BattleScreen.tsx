import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { PRESS_SCALES } from '../../constants/animations';
import { useSpringPress } from '../../hooks/useSpringPress';
import { haptics } from '../../services/haptics';
import { useBattleStore, initBattle } from './data/battleStore';
import { BattleCard, BattleScaleSelector, BattleProgress, BattleResults } from './components';
import type { BattlePreference } from './types/battle';

export const BattleScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    currentRound,
    totalRounds,
    isComplete,
    submitBattle,
    getCurrentMatchup,
    getBattleResults,
  } = useBattleStore();

  const [animationKey, setAnimationKey] = useState(0);
  const closePress = useSpringPress({ scale: PRESS_SCALES.normal });

  // Init battle on mount
  useEffect(() => {
    initBattle(15);
  }, []);

  const matchup = getCurrentMatchup();

  const handleSelect = useCallback((preference: BattlePreference) => {
    submitBattle(preference);
    setAnimationKey((k) => k + 1);
  }, []);

  const handlePlayAgain = useCallback(() => {
    initBattle(15);
    setAnimationKey((k) => k + 1);
  }, []);

  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleClose = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  // Results view
  if (isComplete) {
    const { topCoasters, insights } = getBattleResults();
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Battle Mode</Text>
          <Pressable
            {...closePress.pressHandlers}
            onPress={handleClose}
            hitSlop={12}
          >
            <Animated.View style={[styles.closeButton, closePress.animatedStyle]}>
              <Text style={styles.closeText}>Done</Text>
            </Animated.View>
          </Pressable>
        </View>
        <BattleResults
          topCoasters={topCoasters}
          insights={insights}
          onPlayAgain={handlePlayAgain}
          onDone={handleDone}
        />
      </View>
    );
  }

  // Battle view
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          {...closePress.pressHandlers}
          onPress={handleClose}
          hitSlop={12}
        >
          <Animated.View style={[styles.closeButton, closePress.animatedStyle]}>
            <Text style={styles.closeText}>Close</Text>
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Battle Mode</Text>
        <View style={styles.headerSpacer} />
      </View>

      <BattleProgress currentRound={currentRound} totalRounds={totalRounds} />

      {matchup && (
        <View style={styles.battleArea}>
          <View style={styles.cardsSection}>
            <View style={styles.cardsContainer}>
              <BattleCard
                coaster={matchup.coasterA}
                side="left"
                animationKey={animationKey}
                label="A"
              />
              <View style={styles.vsLabel}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <BattleCard
                coaster={matchup.coasterB}
                side="right"
                animationKey={animationKey}
                label="B"
              />
            </View>
          </View>

          <BattleScaleSelector
            onSelect={handleSelect}
            coasterAName={matchup.coasterA.name}
            coasterBName={matchup.coasterB.name}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 60,
  },
  closeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.background.input,
  },
  closeText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  battleArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  cardsSection: {
    flex: 1,
    justifyContent: 'center',
  },
  cardsContainer: {
    gap: spacing.base,
  },
  vsLabel: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: -spacing.md,
    zIndex: 10,
    elevation: 10,
  },
  vsText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
});
