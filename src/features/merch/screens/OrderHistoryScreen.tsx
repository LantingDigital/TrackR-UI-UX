/**
 * OrderHistoryScreen — Past orders with status badges
 *
 * Shows all past orders grouped by status (Processing, Shipped, Delivered).
 * Each order shows items, total, and tracking info when available.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
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
import { GlassHeader } from '../../../components/GlassHeader';
import { MOCK_ORDERS, type MerchOrder } from '../../../data/mockMerchData';

// ─── Types ──────────────────────────────────────────────

// ─── Status Badge ───────────────────────────────────────

const STATUS_CONFIG: Record<MerchOrder['status'], { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }> = {
  processing: { bg: '#FFF3E0', text: '#E65100', icon: 'hourglass-outline' },
  shipped: { bg: '#E3F2FD', text: '#1565C0', icon: 'airplane-outline' },
  delivered: { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle-outline' },
};

const StatusBadge: React.FC<{ status: MerchOrder['status'] }> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={12} color={config.text} />
      <Text style={[badgeStyles.text, { color: config.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
  },
});

// ─── Order Card ─────────────────────────────────────────

const OrderCard: React.FC<{
  order: MerchOrder;
  index: number;
  onPress?: () => void;
}> = ({ order, index, onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.98 });

  const formattedDate = useMemo(() => {
    const d = new Date(order.orderDate);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [order.orderDate]);

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      {...pressHandlers}
    >
      <Animated.View
        entering={FadeInDown.duration(200).delay(index * 60)}
        style={[cardStyles.card, animatedStyle]}
      >
        {/* Header Row */}
        <View style={cardStyles.headerRow}>
          <View>
            <Text style={cardStyles.orderId}>{order.id}</Text>
            <Text style={cardStyles.date}>{formattedDate}</Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        {/* Item previews */}
        <View style={cardStyles.itemsRow}>
          {order.items.slice(0, 4).map((item, i) => (
            <View key={i} style={[cardStyles.itemThumb, { zIndex: 10 - i, marginLeft: i > 0 ? -8 : 0 }]}>
              <Image
                source={item.artSource}
                style={cardStyles.thumbImage}
                resizeMode="cover"
              />
            </View>
          ))}
          {order.items.length > 4 && (
            <View style={[cardStyles.itemThumb, { marginLeft: -8 }]}>
              <View style={cardStyles.moreThumb}>
                <Text style={cardStyles.moreText}>+{order.items.length - 4}</Text>
              </View>
            </View>
          )}
          <View style={cardStyles.itemInfo}>
            <Text style={cardStyles.itemCount}>
              {order.items.reduce((sum, i) => sum + i.quantity, 0)} cards
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={cardStyles.footer}>
          <Text style={cardStyles.total}>${order.total.toFixed(2)}</Text>
          {order.trackingNumber && (
            <View style={cardStyles.trackingRow}>
              <Ionicons name="locate-outline" size={12} color={colors.text.meta} />
              <Text style={cardStyles.trackingText}>Tracking available</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  orderId: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  date: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  itemThumb: {
    width: 40,
    height: 56,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.background.card,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  moreThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  itemInfo: {
    marginLeft: spacing.base,
  },
  itemCount: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  total: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingText: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
});

// ─── Empty State ────────────────────────────────────────

const EmptyOrders: React.FC = () => (
  <Animated.View entering={FadeIn.duration(300)} style={emptyStyles.container}>
    <Ionicons name="receipt-outline" size={56} color={colors.text.meta} />
    <Text style={emptyStyles.title}>No orders yet</Text>
    <Text style={emptyStyles.subtitle}>Your order history will appear here</Text>
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
});

// ─── Main Component ─────────────────────────────────────

export const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const orders = MOCK_ORDERS;

  const HEADER_ROW_HEIGHT = 60;
  const headerTotalHeight = insets.top + HEADER_ROW_HEIGHT;

  return (
    <View style={styles.screen}>
      {/* GlassHeader fog overlay */}
      <GlassHeader headerHeight={headerTotalHeight} />

      {/* Header — absolute, above fog */}
      <View style={[styles.header, { top: insets.top, zIndex: 10 }]}>
        <Pressable onPress={() => { haptics.tap(); navigation.goBack(); }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: headerTotalHeight + spacing.xl }]}
        >
          {orders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              index={index}
              onPress={() => {}}
            />
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
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
    paddingVertical: spacing.xl,
  },
});
