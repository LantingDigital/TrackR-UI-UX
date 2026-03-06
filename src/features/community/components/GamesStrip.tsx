import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { useSubtlePress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { MOCK_GAMES, MOCK_COASTLE_STATS, GameItem } from '../data/mockCommunityData';

interface GamesStripProps {
  onPlayCoastle: () => void;
  onPlaySpeedSorter?: () => void;
  onPlayBlindRanking?: () => void;
  onPlayTrivia?: () => void;
}

const GameCircle = ({
  item,
  onPress,
}: {
  item: GameItem;
  onPress: () => void;
}) => {
  const press = useSubtlePress();

  return (
    <Pressable onPress={onPress} {...press.pressHandlers}>
      <Animated.View style={[styles.gameWrapper, press.animatedStyle]}>
        <View
          style={[
            styles.outerRing,
            item.active ? styles.outerRingActive : styles.outerRingInactive,
          ]}
        >
          <View
            style={[
              styles.innerCircle,
              item.active ? styles.innerCircleActive : styles.innerCircleInactive,
            ]}
          >
            <Ionicons
              name={item.icon as any}
              size={item.active ? 26 : 22}
              color={item.active ? colors.accent.primary : colors.text.meta}
            />
          </View>
        </View>
        <Text
          style={[
            styles.gameLabel,
            item.active ? styles.gameLabelActive : styles.gameLabelInactive,
          ]}
        >
          {item.label}
        </Text>
        {item.id === 'coastle' && (
          <Text style={styles.gameSubtitle}>
            Daily #{MOCK_COASTLE_STATS.dailyNumber}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

export const GamesStrip = ({ onPlayCoastle, onPlaySpeedSorter, onPlayBlindRanking, onPlayTrivia }: GamesStripProps) => {
  const handlePress = (item: GameItem) => {
    if (!item.active) {
      haptics.tap();
      return;
    }
    haptics.select();
    switch (item.id) {
      case 'coastle': onPlayCoastle(); break;
      case 'speed-sorter': onPlaySpeedSorter?.(); break;
      case 'blind-ranking': onPlayBlindRanking?.(); break;
      case 'trivia': onPlayTrivia?.(); break;
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stripContent}
    >
      {MOCK_GAMES.map((game) => (
        <GameCircle
          key={game.id}
          item={game}
          onPress={() => handlePress(game)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stripContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  gameWrapper: {
    alignItems: 'center',
    width: 72,
  },
  outerRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRingActive: {
    borderWidth: 2.5,
    borderColor: colors.accent.primary,
  },
  outerRingInactive: {
    borderWidth: 2,
    borderColor: colors.border.subtle,
  },
  innerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: typography.sizes.meta,
    marginTop: spacing.xs,
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
  gameSubtitle: {
    fontSize: 10,
    color: colors.text.meta,
    marginTop: 1,
  },
});
