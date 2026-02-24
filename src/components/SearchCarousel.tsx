import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSpringPress } from '../hooks/useSpringPress';
import { LinearGradient } from 'expo-linear-gradient';
import { SearchableItem } from '../data/mockSearchData';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = 120;
const CARD_HEIGHT = 120; // Square cards per user request
const CARD_GAP = 12;

interface SearchCarouselProps {
  title: string;
  items: SearchableItem[];
  onItemPress?: (item: SearchableItem) => void;
}

interface CarouselCardProps {
  item: SearchableItem;
  onPress?: () => void;
}

const CarouselCard: React.FC<CarouselCardProps> = ({ item, onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({
    scale: 0.95,
    opacity: 0.9,
  });

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        style={styles.cardPressable}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.cardGradient}
        />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const SearchCarousel: React.FC<SearchCarouselProps> = ({
  title,
  items,
  onItemPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
      >
        {items.map(item => (
          <CarouselCard
            key={item.id}
            item={item}
            onPress={() => onItemPress?.(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: CARD_GAP,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.border.subtle,
    ...shadows.small,
  },
  cardPressable: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  cardTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  cardName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
});
