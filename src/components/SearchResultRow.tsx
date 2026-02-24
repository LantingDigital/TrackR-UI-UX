import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SearchableItem, getTypeIcon } from '../data/mockSearchData';
import { useSpringPress } from '../hooks/useSpringPress';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';

interface SearchResultRowProps {
  item: SearchableItem;
  onPress?: () => void;
}

export const SearchResultRow: React.FC<SearchResultRowProps> = ({
  item,
  onPress,
}) => {
  const { pressHandlers, animatedStyle } = useSpringPress({
    scale: 0.98,
    opacity: 0.7,
  });

  const iconName = getTypeIcon(item.type) as keyof typeof Ionicons.glyphMap;
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        style={styles.pressable}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color={colors.text.secondary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.primaryText} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.secondaryText} numberOfLines={1}>
            {item.subtitle ? `${item.subtitle} • ${typeLabel}` : typeLabel}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.border.subtle} />
      </Pressable>
    </Animated.View>
  );
};

// Simpler row for recent/trending searches (just text, no subtitle)
interface SimpleSearchRowProps {
  text: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export const SimpleSearchRow: React.FC<SimpleSearchRowProps> = ({
  text,
  icon = 'time-outline',
  onPress,
}) => {
  const { pressHandlers, animatedStyle } = useSpringPress({
    scale: 0.98,
    opacity: 0.7,
  });

  return (
    <Animated.View style={[styles.simpleContainer, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        style={styles.simplePressable}
      >
        <Ionicons name={icon} size={18} color={colors.text.meta} style={styles.simpleIcon} />
        <Text style={styles.simpleText} numberOfLines={1}>
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  textContainer: {
    flex: 1,
  },
  primaryText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
  },
  // Simple row styles
  simpleContainer: {
    marginHorizontal: spacing.lg,
  },
  simplePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  simpleIcon: {
    marginRight: spacing.base,
  },
  simpleText: {
    fontSize: typography.sizes.input,
    color: colors.text.primary,
    flex: 1,
  },
});
