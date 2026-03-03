import React, { forwardRef, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { haptics } from '../../../services/haptics';
import { MorphingPill, MorphingPillRef } from '../../../components/MorphingPill';
import { CoastleSettingsContent } from './CoastleSettingsContent';
import { CoastleStats, GameStatus } from '../types/coastle';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATS_CARD_WIDTH = SCREEN_WIDTH - 64;
const STATS_CARD_HEIGHT = 500;

interface CoastleHeaderProps {
  onClose: () => void;
  stats: CoastleStats;
  gameStatus: GameStatus;
  onStatsOpen?: () => void;
  tuning?: {
    arcHeight?: number;
    arcBias?: number;
    sizeStart?: number;
    bounceAmount?: number;
    overshootAmount?: number;
    easingP1X?: number;
    easingP1Y?: number;
    easingP2X?: number;
    easingP2Y?: number;
    springDamping?: number;
    springStiffness?: number;
    springMass?: number;
    duration?: number;
  };
}

export const CoastleHeader: React.FC<CoastleHeaderProps> = ({
  onClose,
  stats,
  gameStatus,
  onStatsOpen,
  tuning,
}) => {
  const insets = useSafeAreaInsets();
  const morphRef = useRef<MorphingPillRef>(null);

  const handleOpen = useCallback(() => {
    haptics.tap();
    onStatsOpen?.();
  }, [onStatsOpen]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      {/* Close button */}
      <Pressable
        onPress={() => { haptics.tap(); onClose(); }}
        style={styles.iconButton}
      >
        <Ionicons name="close" size={24} color={colors.text.primary} />
      </Pressable>

      {/* Title — perfectly centered */}
      <View style={styles.center}>
        <Text style={styles.title}>COASTLE</Text>
      </View>

      {/* Settings pill → MorphingPill */}
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
        duration={tuning?.duration ?? 765}
        backdropType="blur"
        blurIntensity={25}
        showBackdrop={true}
        overshootAngle={10}
        overshootMagnitude={6}
        tuning={tuning}
        expandedContent={(close) => (
          <CoastleSettingsContent
            stats={stats}
            close={close}
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
    color: colors.text.primary,
  },
});
