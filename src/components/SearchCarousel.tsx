import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringPress } from '../hooks/useSpringPress';
import { LinearGradient } from 'expo-linear-gradient';
import { SearchableItem } from '../data/mockSearchData';
import { CARD_ART } from '../data/cardArt';

// Park → signature coaster card art mapping
const PARK_SIGNATURE_ART: Record<string, string> = {
  'cedar-point': 'steel-vengeance',
  'six-flags-magic-mountain': 'twisted-colossus',
  'hersheypark': 'candymonium',
  'carowinds': 'fury-325',
  'busch-gardens-williamsburg': 'apollos-chariot',
  'kings-island': 'diamondback',
  'dollywood': 'lightning-rod',
  'busch-gardens-tampa': 'iron-gwazi',
  'kings-dominion': 'dominator',
};

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

  // Use card art for rides; for parks use pre-warmed signature coaster art
  const cardArt = item.type === 'ride'
    ? CARD_ART[item.id]
    : CARD_ART[PARK_SIGNATURE_ART[item.id] || ''];
  const imageSource = cardArt ?? (item.image ? { uri: item.image } : undefined);

  return (
    <Animated.View style={[styles.cardContainer, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={pressHandlers.onPressIn}
        onPressOut={pressHandlers.onPressOut}
        style={styles.cardPressable}
      >
        {imageSource ? (
          cardArt ? (
            // Local require() asset — use RN Image for synchronous decode (no async queue)
            <RNImage
              source={imageSource}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            // Remote URL — use expo-image for caching + transition
            <Image
              source={imageSource}
              style={styles.cardImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.id}
              transition={250}
            />
          )
        ) : (
          <View style={styles.cardPlaceholder}>
            <Ionicons
              name={item.type === 'ride' ? 'flash' : 'location'}
              size={28}
              color={colors.text.meta}
            />
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
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
  const renderItem = useCallback(({ item }: { item: SearchableItem }) => (
    <CarouselCard
      item={item}
      onPress={() => onItemPress?.(item)}
    />
  ), [onItemPress]);

  const keyExtractor = useCallback((item: SearchableItem) => item.id, []);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        horizontal
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
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
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    backgroundColor: colors.background.imagePlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
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
