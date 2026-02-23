import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { haptics } from '../../../services/haptics';

interface CoastleHeaderProps {
  onClose: () => void;
  onSettings: () => void;
}

export const CoastleHeader: React.FC<CoastleHeaderProps> = ({
  onClose,
  onSettings,
}) => {
  const insets = useSafeAreaInsets();

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

      {/* Settings — single icon, symmetric with close */}
      <Pressable
        onPress={() => { haptics.tap(); onSettings(); }}
        style={styles.iconButton}
      >
        <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
      </Pressable>
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
