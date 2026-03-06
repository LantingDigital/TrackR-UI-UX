/**
 * BlindRankingHeader — Close + Title + MorphingPill settings gear
 *
 * Matches CoastleHeader pattern exactly.
 */

import React, { useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { spacing } from '../../../../theme/spacing';
import { radius } from '../../../../theme/radius';
import { haptics } from '../../../../services/haptics';
import { MorphingPill, MorphingPillRef } from '../../../../components/MorphingPill';
import { BlindRankingSettingsContent } from './BlindRankingSettingsContent';
import type { BlindRankingStats } from '../types/blindRanking';
import type { BlindRankingSettings } from '../stores/blindRankingStore';
import { setShowCommunityComparison } from '../stores/blindRankingStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATS_CARD_WIDTH = SCREEN_WIDTH - 64;
const STATS_CARD_HEIGHT = 500;

const PILL_TUNING = {
  arcHeight: 120,
  arcBias: 0.5,
  sizeStart: 0.5,
  expandDuration: 650,
  bounceAmount: 10,
  overshootAmount: 1.03,
  easingP1X: 0.5,
  easingP1Y: 0.70,
  easingP2X: 0.5,
  easingP2Y: 1.0,
  springDamping: 20,
  springStiffness: 220,
  springMass: 0.6,
  duration: 550,
};

interface BlindRankingHeaderProps {
  onClose: () => void;
  stats: BlindRankingStats;
  settings: BlindRankingSettings;
}

export const BlindRankingHeader: React.FC<BlindRankingHeaderProps> = ({
  onClose, stats, settings,
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
        <Text style={styles.title}>BLIND RANKING</Text>
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
        tuning={PILL_TUNING}
        expandedContent={(close) => (
          <BlindRankingSettingsContent
            stats={stats}
            settings={settings}
            onSetShowCommunityComparison={setShowCommunityComparison}
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
