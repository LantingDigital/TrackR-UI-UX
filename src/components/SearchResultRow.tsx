import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SearchableItem, getTypeIcon } from '../data/mockSearchData';
import { useSpringPress } from '../hooks/useSpringPress';

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
          <Ionicons name={iconName} size={20} color="#666666" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.primaryText} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.secondaryText} numberOfLines={1}>
            {item.subtitle ? `${item.subtitle} • ${typeLabel}` : typeLabel}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
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
        <Ionicons name={icon} size={18} color="#999999" style={styles.simpleIcon} />
        <Text style={styles.simpleText} numberOfLines={1}>
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  secondaryText: {
    fontSize: 14,
    color: '#666666',
  },
  // Simple row styles
  simpleContainer: {
    marginHorizontal: 16,
  },
  simplePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  simpleIcon: {
    marginRight: 12,
  },
  simpleText: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
});
