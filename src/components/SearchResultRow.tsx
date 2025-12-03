import React, { useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchableItem, getTypeIcon } from '../data/mockSearchData';

interface SearchResultRowProps {
  item: SearchableItem;
  onPress?: () => void;
}

export const SearchResultRow: React.FC<SearchResultRowProps> = ({
  item,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const iconName = getTypeIcon(item.type) as keyof typeof Ionicons.glyphMap;

  // Get type label
  const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={[
        styles.simpleContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
