/**
 * CheckoutScreen — Shipping address form, mock payment, order summary
 *
 * Collects shipping address, shows ••••4242 mock payment method,
 * order summary with Pro discount, and Place Order button.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
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
import { FogHeader } from '../../../components/FogHeader';
import { MERCH_PRICING } from '../../../data/mockMerchData';
import { useCartStore, type ShippingAddress } from '../store/cartStore';

// ─── Types ──────────────────────────────────────────────

// ─── Form Field ─────────────────────────────────────────

const FormField: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'words' | 'sentences';
}> = ({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'words' }) => (
  <View style={fieldStyles.container}>
    <Text style={fieldStyles.label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text.meta}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      style={fieldStyles.input}
    />
  </View>
);

const fieldStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
});

// ─── Order Summary Item ─────────────────────────────────

const OrderSummaryItem: React.FC<{
  artSource: any;
  name: string;
  quantity: number;
  goldFoil: boolean;
  price: number;
}> = ({ artSource, name, quantity, goldFoil, price }) => (
  <View style={orderItemStyles.row}>
    <Image source={artSource} style={orderItemStyles.image} resizeMode="cover" />
    <View style={orderItemStyles.info}>
      <Text style={orderItemStyles.name} numberOfLines={1}>{name}</Text>
      <Text style={orderItemStyles.meta}>
        Qty: {quantity}{goldFoil ? ' · Gold Foil' : ''}
      </Text>
    </View>
    <Text style={orderItemStyles.price}>${price.toFixed(2)}</Text>
  </View>
);

const orderItemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  image: {
    width: 40,
    height: 56,
    borderRadius: radius.sm,
  },
  info: {
    flex: 1,
    marginLeft: spacing.base,
  },
  name: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  meta: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },
  price: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});

// ─── Main Component ─────────────────────────────────────

export const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const items = useCartStore(state => state.items);
  const isPro = useCartStore(state => state.isPro);
  const getSubtotal = useCartStore(state => state.getSubtotal);
  const getProDiscount = useCartStore(state => state.getProDiscount);
  const getShipping = useCartStore(state => state.getShipping);
  const getTotal = useCartStore(state => state.getTotal);
  const setShippingAddress = useCartStore(state => state.setShippingAddress);
  const placeOrderPress = useSpringPress({ scale: 0.97 });

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  const updateField = useCallback((field: keyof ShippingAddress, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  }, []);

  const isFormValid = address.fullName.trim() !== '' &&
    address.line1.trim() !== '' &&
    address.city.trim() !== '' &&
    address.state.trim() !== '' &&
    address.zip.trim() !== '';

  const subtotal = getSubtotal();
  const proDiscount = getProDiscount();
  const shipping = getShipping();
  const total = getTotal();

  const handlePlaceOrder = useCallback(() => {
    haptics.success();
    setShippingAddress(address);
    navigation.navigate('MerchOrderConfirmation', {
      orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  }, [address, setShippingAddress, navigation]);

  const HEADER_ROW_HEIGHT = 60;
  const headerTotalHeight = insets.top + HEADER_ROW_HEIGHT;

  return (
    <View style={styles.screen}>
      {/* Fog gradient overlay */}
      <FogHeader headerHeight={headerTotalHeight} />

      {/* Header — absolute, above fog */}
      <View style={[styles.header, { top: insets.top, zIndex: 10 }]}>
        <Pressable onPress={() => { haptics.tap(); navigation.goBack(); }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: headerTotalHeight + spacing.base }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Shipping Address */}
          <Animated.View entering={FadeInDown.duration(200)}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <View style={styles.formCard}>
              <FormField
                label="Full Name"
                value={address.fullName}
                onChangeText={(v) => updateField('fullName', v)}
                placeholder="John Doe"
              />
              <FormField
                label="Address Line 1"
                value={address.line1}
                onChangeText={(v) => updateField('line1', v)}
                placeholder="123 Main Street"
              />
              <FormField
                label="Address Line 2"
                value={address.line2}
                onChangeText={(v) => updateField('line2', v)}
                placeholder="Apt, Suite (optional)"
              />
              <View style={styles.fieldRow}>
                <View style={{ flex: 1, marginRight: spacing.md }}>
                  <FormField
                    label="City"
                    value={address.city}
                    onChangeText={(v) => updateField('city', v)}
                    placeholder="City"
                  />
                </View>
                <View style={{ width: 80, marginRight: spacing.md }}>
                  <FormField
                    label="State"
                    value={address.state}
                    onChangeText={(v) => updateField('state', v)}
                    placeholder="CA"
                    autoCapitalize="none"
                  />
                </View>
                <View style={{ width: 100 }}>
                  <FormField
                    label="ZIP"
                    value={address.zip}
                    onChangeText={(v) => updateField('zip', v)}
                    placeholder="92501"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Payment */}
          <Animated.View entering={FadeInDown.duration(200).delay(100)}>
            <Text style={styles.sectionTitle}>Payment</Text>
            <View style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <Ionicons name="card-outline" size={20} color={colors.text.primary} />
                <Text style={styles.paymentText}>Visa ending in 4242</Text>
                <Text style={styles.paymentMeta}>Mock</Text>
              </View>
            </View>
          </Animated.View>

          {/* Order Summary */}
          <Animated.View entering={FadeInDown.duration(200).delay(200)}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              {items.map(item => (
                <OrderSummaryItem
                  key={item.productId}
                  artSource={item.artSource}
                  name={item.name}
                  quantity={item.quantity}
                  goldFoil={item.goldFoil}
                  price={item.quantity * (item.goldFoil && !item.hasGoldVerified
                    ? MERCH_PRICING.cardPrice + MERCH_PRICING.goldFoilUpcharge
                    : MERCH_PRICING.cardPrice)}
                />
              ))}
              <View style={styles.totalSection}>
                <SummaryLine label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                {isPro && proDiscount > 0 && (
                  <SummaryLine label="Pro Discount" value={`-$${proDiscount.toFixed(2)}`} isGreen />
                )}
                <SummaryLine label="Shipping" value={`$${shipping.toFixed(2)}`} />
                <View style={styles.totalDivider} />
                <SummaryLine label="Total" value={`$${total.toFixed(2)}`} isBold />
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Place Order Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.base }]}>
        <Pressable
          onPress={handlePlaceOrder}
          disabled={!isFormValid}
          {...placeOrderPress.pressHandlers}
          style={{ flex: 1 }}
        >
          <Animated.View style={[
            styles.placeOrderButton,
            placeOrderPress.animatedStyle,
            !isFormValid && styles.placeOrderDisabled,
          ]}>
            <Ionicons name="lock-closed" size={16} color={colors.text.inverse} />
            <Text style={styles.placeOrderText}>
              Place Order  ·  ${total.toFixed(2)}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

// ─── Summary Line (reused) ──────────────────────────────

const SummaryLine: React.FC<{
  label: string;
  value: string;
  isBold?: boolean;
  isGreen?: boolean;
}> = ({ label, value, isBold, isGreen }) => (
  <View style={lineStyles.row}>
    <Text style={[lineStyles.label, isBold && lineStyles.bold]}>{label}</Text>
    <Text style={[lineStyles.value, isBold && lineStyles.bold, isGreen && lineStyles.green]}>
      {value}
    </Text>
  </View>
);

const lineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
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
  green: {
    color: colors.status.success,
  },
});

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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.xl,
    marginBottom: spacing.base,
  },
  formCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },
  fieldRow: {
    flexDirection: 'row',
  },
  paymentCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  paymentText: {
    flex: 1,
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  paymentMeta: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    fontWeight: typography.weights.medium,
  },
  summaryCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.small,
  },
  totalSection: {
    marginTop: spacing.base,
    paddingTop: spacing.md,
  },
  totalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing.md,
  },
  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    backgroundColor: colors.background.page,
    ...shadows.small,
    shadowOffset: { width: 0, height: -4 },
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
    gap: spacing.sm,
  },
  placeOrderDisabled: {
    opacity: 0.5,
  },
  placeOrderText: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
});
