/**
 * CartScreen — Shopping cart with item list, quantity adjustment,
 * Pro discount, shipping, and checkout button.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { typography } from '../../../theme/typography';
import { haptics } from '../../../services/haptics';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { calculateCardPrice, MERCH_PRICING } from '../../../data/mockMerchData';
import { useCartStore, type CartItem } from '../store/cartStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────

// ─── Cart Item Row ──────────────────────────────────────

const CartItemRow: React.FC<{
  item: CartItem;
  onUpdateQuantity: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
}> = ({ item, onUpdateQuantity, onRemove }) => {
  const unitPrice = calculateCardPrice(item.goldFoil, item.hasGoldVerified);

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOut.duration(150)}
      layout={Layout.duration(200)}
      style={itemStyles.row}
    >
      <Image source={item.artSource} style={itemStyles.image} resizeMode="cover" />
      <View style={itemStyles.info}>
        <Text style={itemStyles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={itemStyles.park} numberOfLines={1}>{item.parkName}</Text>
        {item.goldFoil && (
          <View style={itemStyles.goldBadge}>
            <Ionicons name="shield-checkmark" size={10} color="#D4A853" />
            <Text style={itemStyles.goldText}>Gold Foil</Text>
          </View>
        )}
        <Text style={itemStyles.price}>${(unitPrice * item.quantity).toFixed(2)}</Text>
      </View>
      <View style={itemStyles.controls}>
        <Pressable
          onPress={() => {
            haptics.tick();
            onUpdateQuantity(item.productId, item.quantity - 1);
          }}
          style={itemStyles.qtyButton}
        >
          <Ionicons name="remove" size={16} color={colors.text.secondary} />
        </Pressable>
        <Text style={itemStyles.qty}>{item.quantity}</Text>
        <Pressable
          onPress={() => {
            haptics.tick();
            onUpdateQuantity(item.productId, item.quantity + 1);
          }}
          style={itemStyles.qtyButton}
        >
          <Ionicons name="add" size={16} color={colors.text.secondary} />
        </Pressable>
        <Pressable
          onPress={() => {
            haptics.tap();
            onRemove(item.productId);
          }}
          style={itemStyles.removeButton}
        >
          <Ionicons name="trash-outline" size={16} color={colors.status.error} />
        </Pressable>
      </View>
    </Animated.View>
  );
};

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    ...shadows.small,
    marginBottom: spacing.base,
  },
  image: {
    width: 56,
    height: 78,
    borderRadius: radius.sm,
  },
  info: {
    flex: 1,
    marginLeft: spacing.base,
    marginRight: spacing.md,
  },
  name: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  park: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 1,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: spacing.xs,
  },
  goldText: {
    fontSize: typography.sizes.small,
    color: '#D4A853',
    fontWeight: typography.weights.medium,
  },
  price: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});

// ─── Summary Row ────────────────────────────────────────

const SummaryRow: React.FC<{
  label: string;
  value: string;
  isDiscount?: boolean;
  isBold?: boolean;
}> = ({ label, value, isDiscount, isBold }) => (
  <View style={summaryStyles.row}>
    <Text style={[summaryStyles.label, isBold && summaryStyles.bold]}>
      {label}
    </Text>
    <Text style={[
      summaryStyles.value,
      isBold && summaryStyles.bold,
      isDiscount && summaryStyles.discount,
    ]}>
      {value}
    </Text>
  </View>
);

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
  },
  value: {
    fontSize: typography.sizes.label,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  bold: {
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.subtitle,
    color: colors.text.primary,
  },
  discount: {
    color: colors.status.success,
  },
});

// ─── Empty Cart ─────────────────────────────────────────

const EmptyCart: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => (
  <Animated.View entering={FadeIn.duration(300)} style={emptyStyles.container}>
    <Ionicons name="bag-outline" size={56} color={colors.text.meta} />
    <Text style={emptyStyles.title}>Your cart is empty</Text>
    <Text style={emptyStyles.subtitle}>Browse the card shop to find your favorites</Text>
    <Pressable
      onPress={() => {
        haptics.tap();
        onBrowse();
      }}
      style={emptyStyles.button}
    >
      <Text style={emptyStyles.buttonText}>Browse Cards</Text>
    </Pressable>
  </Animated.View>
);

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  title: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.xxl,
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radius.button,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
  },
});

// ─── Main Component ─────────────────────────────────────

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const items = useCartStore(state => state.items);
  const isPro = useCartStore(state => state.isPro);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const getSubtotal = useCartStore(state => state.getSubtotal);
  const getProDiscount = useCartStore(state => state.getProDiscount);
  const getShipping = useCartStore(state => state.getShipping);
  const getTotal = useCartStore(state => state.getTotal);
  const checkoutPress = useSpringPress({ scale: 0.97 });

  const subtotal = getSubtotal();
  const proDiscount = getProDiscount();
  const shipping = getShipping();
  const total = getTotal();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { haptics.tap(); navigation.goBack(); }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={styles.headerSpacer} />
      </View>

      {items.length === 0 ? (
        <EmptyCart onBrowse={() => navigation.navigate('MerchStore')} />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Cart Items */}
            <View style={styles.itemsSection}>
              {items.map(item => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <SummaryRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
              {isPro && proDiscount > 0 && (
                <SummaryRow
                  label="Pro Discount (10%)"
                  value={`-$${proDiscount.toFixed(2)}`}
                  isDiscount
                />
              )}
              <SummaryRow label="Shipping" value={`$${shipping.toFixed(2)}`} />
              <View style={styles.divider} />
              <SummaryRow label="Total" value={`$${total.toFixed(2)}`} isBold />
            </View>

            {/* Pro upsell */}
            {!isPro && (
              <Animated.View entering={FadeInDown.duration(250)} style={styles.proUpsell}>
                <Ionicons name="star" size={16} color={colors.accent.primary} />
                <Text style={styles.proUpsellText}>
                  TrackR Pro members save 10% on every order
                </Text>
              </Animated.View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Checkout Button */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.base }]}>
            <Pressable
              onPress={() => {
                haptics.select();
                navigation.navigate('MerchCheckout');
              }}
              {...checkoutPress.pressHandlers}
              style={{ flex: 1 }}
            >
              <Animated.View style={[styles.checkoutButton, checkoutPress.animatedStyle]}>
                <Text style={styles.checkoutText}>
                  Checkout  ·  ${total.toFixed(2)}
                </Text>
              </Animated.View>
            </Pressable>
          </View>
        </>
      )}
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  itemsSection: {
    paddingVertical: spacing.xl,
  },
  summaryCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.md,
  },
  proUpsell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  proUpsellText: {
    fontSize: typography.sizes.caption,
    color: colors.accent.primary,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    backgroundColor: colors.background.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  checkoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
  },
  checkoutText: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
});
