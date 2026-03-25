/**
 * MerchCardDetailSheet — Card art detail view for purchasing
 *
 * Large card art preview, coaster stats, gold foil toggle
 * (free if GPS-verified, +$2.99 if not), quantity selector,
 * "Add to Cart" and "Buy Now" buttons.
 *
 * Presented as a bottom sheet / full screen modal.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
  Switch,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { GlassHeader } from '../../../components/GlassHeader';
import { MERCH_PRICING, calculateCardPrice, getMerchProducts, type MerchProduct } from '../../../data/mockMerchData';
import { useCartStore } from '../store/cartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_ASPECT = 7 / 5; // TCG aspect ratio
const CARD_WIDTH = SCREEN_WIDTH - spacing.xxxl * 2;
const CARD_HEIGHT = CARD_WIDTH * CARD_ASPECT;

// ─── Types ──────────────────────────────────────────────

// ─── Stat Row ───────────────────────────────────────────

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={statStyles.row}>
    <Text style={statStyles.label}>{label}</Text>
    <Text style={statStyles.value}>{value}</Text>
  </View>
);

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  label: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  value: {
    fontSize: typography.sizes.caption,
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
});

// ─── Quantity Selector ──────────────────────────────────

const QuantitySelector: React.FC<{
  quantity: number;
  onChange: (qty: number) => void;
}> = ({ quantity, onChange }) => {
  const handleDecrease = () => {
    if (quantity > 1) {
      haptics.tick();
      onChange(quantity - 1);
    }
  };
  const handleIncrease = () => {
    haptics.tick();
    onChange(quantity + 1);
  };

  return (
    <View style={qtyStyles.container}>
      <Pressable
        onPress={handleDecrease}
        style={[qtyStyles.button, quantity <= 1 && qtyStyles.buttonDisabled]}
        disabled={quantity <= 1}
      >
        <Ionicons
          name="remove"
          size={18}
          color={quantity <= 1 ? colors.text.meta : colors.text.primary}
        />
      </Pressable>
      <Text style={qtyStyles.value}>{quantity}</Text>
      <Pressable onPress={handleIncrease} style={qtyStyles.button}>
        <Ionicons name="add" size={18} color={colors.text.primary} />
      </Pressable>
    </View>
  );
};

const qtyStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  value: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    minWidth: 32,
    textAlign: 'center',
  },
});

// ─── Gold Foil Toggle ───────────────────────────────────

const GoldFoilToggle: React.FC<{
  enabled: boolean;
  onToggle: () => void;
  isFree: boolean;
}> = ({ enabled, onToggle, isFree }) => {
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onToggle();
      }}
      style={goldStyles.container}
    >
      <View style={goldStyles.textWrap}>
        <View style={goldStyles.labelRow}>
          <Ionicons name="shield-checkmark" size={16} color="#D4A853" />
          <Text style={goldStyles.label}>Gold Foil Border</Text>
        </View>
        <Text style={goldStyles.price}>
          {isFree ? 'FREE (GPS Verified)' : `+$${MERCH_PRICING.goldFoilUpcharge.toFixed(2)}`}
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={() => {
          haptics.tap();
          onToggle();
        }}
        trackColor={{ false: colors.background.input, true: '#D4A853' }}
        thumbColor={colors.background.card}
        ios_backgroundColor={colors.background.input}
      />
    </Pressable>
  );
};

const goldStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  textWrap: {
    flex: 1,
    marginRight: spacing.base,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  price: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },
});

// ─── Main Component ─────────────────────────────────────

export const MerchCardDetailSheet: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const productId = route.params?.productId as string;
  const product = useMemo(() => {
    return getMerchProducts().find(p => p.coasterId === productId) ?? null;
  }, [productId]);

  const insets = useSafeAreaInsets();
  const [goldFoil, setGoldFoil] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  if (!product) return null;

  const unitPrice = calculateCardPrice(goldFoil, product.hasGoldVerified);
  const totalPrice = unitPrice * quantity;

  const addToCartPress = useSpringPress({ scale: 0.97 });
  const buyNowPress = useSpringPress({ scale: 0.97 });

  const handleAddToCart = useCallback(() => {
    haptics.success();
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        coasterId: product.coasterId,
        name: product.name,
        parkName: product.parkName,
        artSource: product.artSource,
        goldFoil,
        hasGoldVerified: product.hasGoldVerified,
      });
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [addItem, product, goldFoil, quantity]);

  const stats = product.stats;

  const HEADER_ROW_HEIGHT = 60;
  const headerTotalHeight = insets.top + HEADER_ROW_HEIGHT;

  return (
    <View style={styles.screen}>
      {/* GlassHeader fog overlay */}
      <GlassHeader headerHeight={headerTotalHeight} />

      {/* Header — absolute, above fog */}
      <View style={[styles.header, { top: insets.top, zIndex: 10 }]}>
        <Pressable onPress={() => { haptics.tap(); navigation.goBack(); }} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Card Detail</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerTotalHeight + spacing.base }]}
      >
        {/* Card Art */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.cardArtWrapper}
        >
          <View style={styles.cardArtContainer}>
            <Image
              source={product.artSource}
              style={styles.cardArt}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Name + Park */}
        <Animated.View entering={FadeInDown.duration(250).delay(100)} style={styles.nameSection}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPark}>{product.parkName}</Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(250).delay(150)} style={styles.statsCard}>
          {stats.heightFt ? <StatRow label="Height" value={`${stats.heightFt} ft`} /> : null}
          {stats.speedMph ? <StatRow label="Top Speed" value={`${stats.speedMph} mph`} /> : null}
          {stats.lengthFt ? <StatRow label="Length" value={`${stats.lengthFt.toLocaleString()} ft`} /> : null}
          {stats.inversions ? <StatRow label="Inversions" value={`${stats.inversions}`} /> : null}
          {stats.yearOpened ? <StatRow label="Opened" value={`${stats.yearOpened}`} /> : null}
          {stats.manufacturer ? <StatRow label="Manufacturer" value={stats.manufacturer} /> : null}
        </Animated.View>

        {/* Gold Foil Toggle */}
        <Animated.View entering={FadeInDown.duration(250).delay(200)} style={styles.goldSection}>
          <GoldFoilToggle
            enabled={goldFoil}
            onToggle={() => setGoldFoil(prev => !prev)}
            isFree={product.hasGoldVerified}
          />
        </Animated.View>

        {/* Quantity + Price */}
        <Animated.View entering={FadeInDown.duration(250).delay(250)} style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Quantity</Text>
            <QuantitySelector quantity={quantity} onChange={setQuantity} />
          </View>
          <View style={styles.priceRight}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={styles.priceValue}>${totalPrice.toFixed(2)}</Text>
          </View>
        </Animated.View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.base }]}>
        <Pressable
          onPress={handleAddToCart}
          {...addToCartPress.pressHandlers}
          style={{ flex: 1, marginRight: spacing.md }}
        >
          <Animated.View style={[styles.addToCartButton, addToCartPress.animatedStyle]}>
            <Ionicons
              name={addedToCart ? 'checkmark' : 'bag-add-outline'}
              size={18}
              color={colors.text.primary}
            />
            <Text style={styles.addToCartText}>
              {addedToCart ? 'Added' : 'Add to Cart'}
            </Text>
          </Animated.View>
        </Pressable>
        <Pressable
          onPress={() => {
            haptics.select();
            handleAddToCart();
            navigation.navigate('MerchCheckout');
          }}
          {...buyNowPress.pressHandlers}
          style={{ flex: 1 }}
        >
          <Animated.View style={[styles.buyNowButton, buyNowPress.animatedStyle]}>
            <Text style={styles.buyNowText}>Buy Now</Text>
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
  closeButton: {
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
  scrollContent: {
    paddingBottom: 120,
  },

  // Card Art
  cardArtWrapper: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  cardArtContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.modal,
  },
  cardArt: {
    width: '100%',
    height: '100%',
  },

  // Name
  nameSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  productName: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    lineHeight: typography.sizes.hero * typography.lineHeights.tight,
  },
  productPark: {
    fontSize: typography.sizes.subtitle,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Stats
  statsCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
    marginBottom: spacing.lg,
  },

  // Gold
  goldSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
  },
  priceLabel: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  priceRight: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: typography.sizes.heroLarge,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    backgroundColor: colors.background.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.background.input,
    gap: spacing.sm,
  },
  addToCartText: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  buyNowButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
  },
  buyNowText: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
});
