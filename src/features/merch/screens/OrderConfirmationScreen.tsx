/**
 * OrderConfirmationScreen — Order placed success view
 *
 * Success animation (checkmark scale + fade), order number,
 * estimated delivery, and navigation back to store/orders.
 */

import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { typography } from '../../../theme/typography';
import { SPRINGS } from '../../../constants/animations';
import { haptics } from '../../../services/haptics';
import { useSpringPress } from '../../../hooks/useSpringPress';

// ─── Types ──────────────────────────────────────────────

// ─── Main Component ─────────────────────────────────────

export const OrderConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const orderId = (route.params?.orderId as string) ?? 'ORD-UNKNOWN';
  const estimatedDelivery = (route.params?.estimatedDelivery as string) ?? 'TBD';
  const insets = useSafeAreaInsets();

  const onContinueShopping = useCallback(() => {
    // Pop back to the store (reset merch stack)
    navigation.dispatch(
      CommonActions.navigate({ name: 'Tabs' })
    );
  }, [navigation]);

  const onViewOrders = useCallback(() => {
    navigation.navigate('MerchOrderHistory');
  }, [navigation]);
  const shopPress = useSpringPress({ scale: 0.97 });
  const ordersPress = useSpringPress({ scale: 0.97 });

  // Success animation
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.3);
  const ringOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  useEffect(() => {
    haptics.success();

    // Ring expands first
    ringOpacity.value = withTiming(1, { duration: 200 });
    ringScale.value = withSpring(1, SPRINGS.stiff);

    // Checkmark pops in after ring
    checkOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
    checkScale.value = withDelay(200, withSpring(1, {
      damping: 14,
      stiffness: 200,
      mass: 0.8,
    }));

    // Content fades in
    contentOpacity.value = withDelay(400, withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    }));
    contentTranslateY.value = withDelay(400, withSpring(0, SPRINGS.stiff));
  }, [checkScale, checkOpacity, ringScale, ringOpacity, contentOpacity, contentTranslateY]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.center}>
        {/* Success Icon */}
        <View style={styles.iconArea}>
          <Animated.View style={[styles.ring, ringStyle]}>
            <Animated.View style={[styles.checkWrap, checkStyle]}>
              <Ionicons name="checkmark" size={48} color={colors.status.success} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, contentStyle]}>
          <Text style={styles.title}>Order Placed</Text>
          <Text style={styles.subtitle}>Your cards are on the way</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order Number</Text>
              <Text style={styles.infoValue}>{orderId}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estimated Delivery</Text>
              <Text style={styles.infoValue}>{estimatedDelivery}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Processing</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                haptics.tap();
                onContinueShopping();
              }}
              {...shopPress.pressHandlers}
              style={{ flex: 1, marginRight: spacing.md }}
            >
              <Animated.View style={[styles.secondaryButton, shopPress.animatedStyle]}>
                <Text style={styles.secondaryText}>Keep Shopping</Text>
              </Animated.View>
            </Pressable>
            <Pressable
              onPress={() => {
                haptics.tap();
                onViewOrders();
              }}
              {...ordersPress.pressHandlers}
              style={{ flex: 1 }}
            >
              <Animated.View style={[styles.primaryButton, ordersPress.animatedStyle]}>
                <Text style={styles.primaryText}>View Orders</Text>
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
  },
  iconArea: {
    marginBottom: spacing.xxl,
  },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.subtitle,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoLabel: {
    fontSize: typography.sizes.label,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  statusBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: '#E65100',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.background.input,
  },
  secondaryText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primary,
  },
  primaryText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
});
