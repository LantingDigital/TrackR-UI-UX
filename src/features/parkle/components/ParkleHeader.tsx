import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { MorphingPill, MorphingPillRef } from '../../../components/MorphingPill';
import { ParkleSettingsContent } from './ParkleSettingsContent';
import { ParkleStats, GameStatus } from '../types/parkle';
import type { ParkleDifficulty } from '../stores/parkleStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATS_CARD_WIDTH = SCREEN_WIDTH - 64;
const STATS_CARD_HEIGHT = 500;

interface ParkleHeaderProps {
  onClose: () => void;
  stats: ParkleStats;
  gameStatus: GameStatus;
  difficulty?: ParkleDifficulty;
  onDifficultyChange?: (value: ParkleDifficulty) => void;
}

export const ParkleHeader: React.FC<ParkleHeaderProps> = ({
  onClose,
  stats,
  gameStatus,
  difficulty,
  onDifficultyChange,
}) => {
  const insets = useSafeAreaInsets();
  const morphRef = useRef<MorphingPillRef>(null);

  const handleOpen = useCallback(() => {
    haptics.tap();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      <Pressable
        onPress={() => { haptics.tap(); onClose(); }}
        style={styles.iconButton}
      >
        <Ionicons name="close" size={24} color={colors.text.primary} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title}>PARKLE</Text>
      </View>

      <MorphingPill
        ref={morphRef}
        standalone
        holdPillDuringArc
        pillWidth={36}
        pillHeight={36}
        pillBorderRadius={18}
        pillContent={
          <View style={styles.settingsPillContent}>
            <Ionicons name="settings-outline" size={18} color={colors.text.secondary} />
          </View>
        }
        expandedWidth={STATS_CARD_WIDTH}
        expandedHeight={STATS_CARD_HEIGHT}
        expandedBorderRadius={radius.card}
        expandedY={insets.top + (SCREEN_HEIGHT - insets.top - insets.bottom - STATS_CARD_HEIGHT) / 2}
        duration={765}
        backdropType="blur"
        blurIntensity={25}
        showBackdrop={true}
        overshootAngle={10}
        overshootMagnitude={6}
        expandedContent={(close) => (
          <ParkleSettingsContent
            stats={stats}
            close={close}
            difficulty={difficulty}
            onDifficultyChange={onDifficultyChange}
          />
        )}
        onOpen={handleOpen}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsPillContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    letterSpacing: 4,
    color: colors.parkle.accent,
  },
});
