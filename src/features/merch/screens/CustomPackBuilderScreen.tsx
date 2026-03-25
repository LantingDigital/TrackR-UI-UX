/**
 * CustomPackBuilderScreen — Pick 5/10/20 cards for a discounted pack
 *
 * Grid of all available card art with checkmark overlay on selected.
 * Pack size selector at top, running total with savings at bottom.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { typography } from '../../../theme/typography';
import { SPRINGS, TIMING } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { LinearGradient } from 'expo-linear-gradient';
import { FogHeader } from '../../../components/FogHeader';
import {
  getMerchProducts,
  PACK_OPTIONS,
  MERCH_PRICING,
  type MerchProduct,
  type PackOption,
} from '../../../data/mockMerchData';
import { useCartStore } from '../store/cartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const TILE_GAP = spacing.md;
const TILE_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - TILE_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const TILE_HEIGHT = TILE_WIDTH * (7 / 5); // TCG aspect ratio

// ─── Types ──────────────────────────────────────────────

// ─── Pack Size Pill ─────────────────────────────────────

const PackSizePill: React.FC<{
  option: PackOption;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ option, isSelected, onSelect }) => {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onSelect();
      }}
      style={[
        pillStyles.pill,
        isSelected && pillStyles.pillSelected,
      ]}
    >
      <Text style={[pillStyles.size, isSelected && pillStyles.textSelected]} numberOfLines={1}>
        {option.label}
      </Text>
      <Text style={[pillStyles.discount, isSelected && pillStyles.textSelected]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {option.savingsLabel}
      </Text>
    </Pressable>
  );
};

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background.card,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
  },
  pillSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  size: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  discount: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginTop: 2,
  },
  textSelected: {
    color: colors.text.inverse,
  },
});

// ─── Selectable Card Tile ───────────────────────────────

const SelectableCardTile: React.FC<{
  product: MerchProduct;
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}> = React.memo(({ product, isSelected, isDisabled, onToggle }) => {
  const checkOpacity = useSharedValue(isSelected ? 1 : 0);

  React.useEffect(() => {
    checkOpacity.value = withTiming(isSelected ? 1 : 0, {
      duration: 150,
      easing: Easing.out(Easing.cubic),
    });
  }, [isSelected, checkOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value * 0.3,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: withSpring(isSelected ? 1 : 0.5, SPRINGS.responsive) }],
  }));

  return (
    <Pressable
      onPress={() => {
        if (isDisabled && !isSelected) return;
        haptics.select();
        onToggle();
      }}
      style={[
        tileStyles.container,
        isDisabled && !isSelected && tileStyles.disabled,
      ]}
    >
      <Image
        source={product.artSource}
        style={tileStyles.image}
        resizeMode="cover"
      />
      {/* Selection overlay */}
      <Animated.View style={[tileStyles.overlay, overlayStyle]} />
      {/* Check mark */}
      <Animated.View style={[tileStyles.checkContainer, checkStyle]}>
        <View style={tileStyles.checkCircle}>
          <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
        </View>
      </Animated.View>
      <Text style={tileStyles.name} numberOfLines={1}>{product.name}</Text>
    </Pressable>
  );
});

const tileStyles = StyleSheet.create({
  container: {
    width: TILE_WIDTH,
    marginBottom: spacing.base,
  },
  disabled: {
    opacity: 0.4,
  },
  image: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: radius.md,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.accent.primary,
  },
  checkContainer: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
});

// ─── Main Component ─────────────────────────────────────

export const CustomPackBuilderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const addItem = useCartStore(state => state.addItem);
  const checkoutPress = useSpringPress({ scale: 0.97 });

  const pack = PACK_OPTIONS[selectedPackIndex];
  const products = useMemo(() => getMerchProducts(), []);
  const maxCards = pack.size;
  const isAtMax = selectedIds.size >= maxCards;

  const toggleCard = useCallback((product: MerchProduct) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else if (next.size < maxCards) {
        next.add(product.id);
      }
      return next;
    });
  }, [maxCards]);

  // Price calculation
  const basePrice = MERCH_PRICING.cardPrice * selectedIds.size;
  const discountedPrice = basePrice * (1 - pack.discount);
  const savings = basePrice - discountedPrice;

  const handleAddPack = useCallback(() => {
    haptics.success();
    const selectedProducts = products.filter(p => selectedIds.has(p.id));
    for (const product of selectedProducts) {
      addItem({
        productId: product.id,
        coasterId: product.coasterId,
        name: product.name,
        parkName: product.parkName,
        artSource: product.artSource,
        goldFoil: false,
        hasGoldVerified: product.hasGoldVerified,
      });
    }
    navigation.navigate('MerchCart');
  }, [selectedIds, products, addItem, navigation]);

  const renderItem = useCallback(({ item }: { item: MerchProduct }) => (
    <SelectableCardTile
      product={item}
      isSelected={selectedIds.has(item.id)}
      isDisabled={isAtMax}
      onToggle={() => toggleCard(item)}
    />
  ), [selectedIds, isAtMax, toggleCard]);

  const keyExtractor = useCallback((item: MerchProduct) => item.id, []);

  const HEADER_ROW_HEIGHT = 60;
  const PACK_SELECTOR_HEIGHT = 44;
  const COUNTER_HEIGHT = 28;
  const headerTotalHeight = insets.top + HEADER_ROW_HEIGHT + PACK_SELECTOR_HEIGHT + COUNTER_HEIGHT;

  return (
    <View style={styles.screen}>
      {/* Fog gradient overlay — covers header + pack selector + counter */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — absolute, above fog */}
      <View style={[styles.header, { top: insets.top, zIndex: 10 }]}>
        <Pressable onPress={() => { haptics.tap(); navigation.goBack(); }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Build Your Pack</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Pack Size Selector — absolute, above fog */}
      <Animated.View entering={FadeInDown.duration(200)} style={[styles.packSelector, { top: insets.top + HEADER_ROW_HEIGHT, zIndex: 10 }]}>
        {PACK_OPTIONS.map((option, i) => (
          <PackSizePill
            key={option.size}
            option={option}
            isSelected={i === selectedPackIndex}
            onSelect={() => {
              setSelectedPackIndex(i);
              // Clear selection if new pack size is smaller
              if (option.size < selectedIds.size) {
                setSelectedIds(new Set());
              }
            }}
          />
        ))}
      </Animated.View>

      {/* Counter — absolute, above fog */}
      <View style={[styles.counter, { top: insets.top + HEADER_ROW_HEIGHT + PACK_SELECTOR_HEIGHT, zIndex: 10 }]}>
        <Text style={styles.counterText}>
          {selectedIds.size} / {maxCards} selected
        </Text>
      </View>

      {/* Card Grid */}
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.gridContent, { paddingTop: headerTotalHeight + spacing.sm }]}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom fog for FAB separation */}
      <LinearGradient
        colors={['rgba(247, 247, 247, 0)', 'rgba(247, 247, 247, 0.8)', 'rgba(247, 247, 247, 1)']}
        locations={[0, 0.4, 1]}
        style={styles.bottomFog}
        pointerEvents="none"
      />

      {/* Full-width FAB with integrated price */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.base }]}>
        <Pressable
          onPress={handleAddPack}
          disabled={selectedIds.size < maxCards}
          {...checkoutPress.pressHandlers}
        >
          <Animated.View style={[
            styles.addPackButton,
            checkoutPress.animatedStyle,
            selectedIds.size < maxCards && styles.addPackButtonDisabled,
          ]}>
            <Text style={styles.addPackText}>
              {selectedIds.size < maxCards
                ? `Select ${maxCards - selectedIds.size} more`
                : 'Add Pack to Cart'}
            </Text>
            {selectedIds.size > 0 && (
              <Text style={styles.addPackPrice}>
                ${discountedPrice.toFixed(2)}
                {savings > 0 ? `  ·  Save $${savings.toFixed(2)}` : ''}
              </Text>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },
  packSelector: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  counter: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  counterText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },
  gridRow: {
    gap: TILE_GAP,
  },
  bottomFog: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.background.page,
  },
  addPackButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    minHeight: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    ...shadows.card,
  },
  addPackButtonDisabled: {
    opacity: 0.5,
  },
  addPackText: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  addPackPrice: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
});
