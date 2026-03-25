/**
 * MerchStoreScreen — Physical card art storefront
 *
 * Hero banner, park filter pills, browse sections:
 *   - New Arrivals (horizontal scroll)
 *   - Popular (horizontal scroll)
 *   - By Park (filtered grid)
 *   - Build Your Pack (CTA)
 *
 * Lives inside Collection tab (LogbookScreen).
 * Uses real NanoBanana card art from CARD_ART.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Image,
  TextInput,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withSpring,
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
import { useSpringPress, useCardPress } from '../../../hooks/useSpringPress';
import { GlassHeader } from '../../../components/GlassHeader';
import {
  getNewArrivals,
  getPopularProducts,
  getMerchProducts,
  MERCH_PRICING,
  type MerchProduct,
} from '../../../data/mockMerchData';
import { useCartStore } from '../store/cartStore';
import { MerchCardTile } from '../components/MerchCardTile';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_TILE_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.base) / 2;
const HERO_HEIGHT = 260;

// ─── Types ──────────────────────────────────────────────

// ─── Section Header ─────────────────────────────────────

const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}> = ({ title, subtitle, onSeeAll }) => (
  <View style={sectionStyles.header}>
    <View>
      <Text style={sectionStyles.title}>{title}</Text>
      {subtitle && <Text style={sectionStyles.subtitle}>{subtitle}</Text>}
    </View>
    {onSeeAll && (
      <Pressable onPress={() => { haptics.tap(); onSeeAll(); }}>
        <Text style={sectionStyles.seeAll}>See All</Text>
      </Pressable>
    )}
  </View>
);

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },
  seeAll: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
});

// ─── Hero Banner ────────────────────────────────────────

const HeroBanner: React.FC<{
  featuredProducts: MerchProduct[];
  onPress: (product: MerchProduct) => void;
}> = ({ featuredProducts, onPress }) => {
  const { pressHandlers, animatedStyle } = useCardPress();
  const featured = featuredProducts[0];
  if (!featured) return null;

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress(featured);
      }}
      {...pressHandlers}
    >
      <Animated.View
        style={[styles.heroBanner, animatedStyle]}
        entering={FadeIn.duration(300)}
      >
        <Image
          source={featured.artSource}
          style={styles.heroImage}
          resizeMode="cover"
          blurRadius={8}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>PHYSICAL CARDS</Text>
            <Text style={styles.heroTitle}>Collect Your Rides</Text>
            <Text style={styles.heroSubtitle}>
              Premium card art on collector-grade material. Starting at ${MERCH_PRICING.cardPrice}
            </Text>
          </View>
          <View style={styles.heroCardPreview}>
            <Image
              source={featured.artSource}
              style={styles.heroPreviewImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Horizontal Card Strip ──────────────────────────────

const HorizontalCardStrip: React.FC<{
  products: MerchProduct[];
  onSelectProduct: (product: MerchProduct) => void;
}> = ({ products, onSelectProduct }) => {
  const tileWidth = SCREEN_WIDTH * 0.38;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stripContent}
      style={styles.stripScroll}
    >
      {products.map((product, index) => (
        <Animated.View
          key={product.id}
          entering={FadeInDown.duration(250).delay(index * 50)}
          style={{ paddingVertical: spacing.xl }}
        >
          <MerchCardTile
            artSource={product.artSource}
            name={product.name}
            parkName={product.parkName}
            price={product.price}
            isNew={product.isNew}
            width={tileWidth}
            onPress={() => onSelectProduct(product)}
          />
        </Animated.View>
      ))}
    </ScrollView>
  );
};

// ─── Pack Builder CTA ───────────────────────────────────

const PackBuilderCTA: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({ scale: 0.98 });

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      {...pressHandlers}
    >
      <Animated.View
        style={[styles.packCTA, animatedStyle]}
        entering={FadeInDown.duration(300)}
      >
        <View style={styles.packCTAIcon}>
          <Ionicons name="layers-outline" size={28} color={colors.accent.primary} />
        </View>
        <View style={styles.packCTAText}>
          <Text style={styles.packCTATitle}>Build Your Pack</Text>
          <Text style={styles.packCTASubtitle}>
            Pick 5, 10, or 20 cards and save up to 30%
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.meta} />
      </Animated.View>
    </Pressable>
  );
};

// ─── Grid View ──────────────────────────────────────────

const ProductGrid: React.FC<{
  products: MerchProduct[];
  onSelectProduct: (product: MerchProduct) => void;
}> = ({ products, onSelectProduct }) => {
  // Pair products into rows of 2
  const rows: MerchProduct[][] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push(products.slice(i, i + 2));
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((product, colIndex) => (
            <Animated.View
              key={product.id}
              entering={FadeInDown.duration(250).delay((rowIndex * 2 + colIndex) * 40)}
              style={styles.gridItem}
            >
              <MerchCardTile
                artSource={product.artSource}
                name={product.name}
                parkName={product.parkName}
                price={product.price}
                width={CARD_TILE_WIDTH}
                onPress={() => onSelectProduct(product)}
              />
            </Animated.View>
          ))}
        </View>
      ))}
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────

export const MerchStoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const cartItemCount = useCartStore(state => state.getItemCount());

  const onSelectProduct = useCallback((product: MerchProduct) => {
    navigation.navigate('MerchCardDetail', { productId: product.coasterId });
  }, [navigation]);
  const onOpenCart = useCallback(() => navigation.navigate('MerchCart'), [navigation]);
  const onOpenPackBuilder = useCallback(() => navigation.navigate('MerchPackBuilder'), [navigation]);
  const onGoBack = useCallback(() => navigation.goBack(), [navigation]);

  const newArrivals = useMemo(() => getNewArrivals(10), []);
  const popular = useMemo(() => getPopularProducts(10), []);
  const allProducts = useMemo(() => getMerchProducts(), []);
  const isSearching = searchQuery.trim().length > 0;
  const filteredProducts = useMemo(() => {
    if (!isSearching) return allProducts;
    const q = searchQuery.toLowerCase().trim();
    return allProducts.filter(
      (p) => p.name.toLowerCase().includes(q) || p.parkName.toLowerCase().includes(q)
    );
  }, [searchQuery, isSearching, allProducts]);

  const HEADER_ROW_HEIGHT = 60; // 12 + 36 + 12
  const headerTotalHeight = insets.top + HEADER_ROW_HEIGHT;

  // Scroll-based fog crossfade — hero is visible at rest, fog fades in on scroll
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });
  const fogAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], 'clamp'),
  }));

  return (
    <View style={styles.screen}>
      {/* GlassHeader fog overlay — crossfades in on scroll */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }, fogAnimStyle]}>
        <GlassHeader headerHeight={headerTotalHeight} zIndex={undefined} />
      </Animated.View>

      {/* Header — absolute, above fog */}
      <View style={[styles.header, { top: insets.top, zIndex: 10 }]}>
        <Pressable onPress={() => { haptics.tap(); onGoBack(); }} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>CARD SHOP</Text>
        <Pressable onPress={() => { haptics.tap(); onOpenCart(); }} style={styles.cartButton}>
          <Ionicons name="bag-outline" size={22} color={colors.text.primary} />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerTotalHeight + spacing.base }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero Banner */}
        <HeroBanner
          featuredProducts={popular}
          onPress={onSelectProduct}
        />

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={colors.text.meta} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cards..."
            placeholderTextColor={colors.text.meta}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {isSearching && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.searchClear}>
              <Ionicons name="close-circle" size={18} color={colors.text.meta} />
            </Pressable>
          )}
        </View>

        {/* New Arrivals */}
        {!isSearching && (
          <>
            <SectionHeader title="New Arrivals" subtitle="Latest card art drops" />
            <HorizontalCardStrip products={newArrivals} onSelectProduct={onSelectProduct} />
          </>
        )}

        {/* Build Your Pack CTA — prominent, right after first carousel */}
        {!isSearching && (
          <View style={styles.ctaWrapper}>
            <PackBuilderCTA onPress={onOpenPackBuilder} />
          </View>
        )}

        {/* Popular */}
        {!isSearching && (
          <>
            <SectionHeader title="Popular" subtitle="Fan favorites" />
            <HorizontalCardStrip products={popular} onSelectProduct={onSelectProduct} />
          </>
        )}

        {/* Browse Grid */}
        <SectionHeader
          title={isSearching ? `Results for "${searchQuery}"` : 'Browse All'}
          subtitle={`${filteredProducts.length} cards`}
        />
        <ProductGrid products={filteredProducts} onSelectProduct={onSelectProduct} />

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
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
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 4,
  },
  cartButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.accent.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },

  // Search
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    marginTop: spacing.base,
    paddingHorizontal: spacing.base,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  searchIcon: {
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  searchClear: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },

  // Hero
  heroBanner: {
    height: HERO_HEIGHT,
    marginHorizontal: spacing.lg,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
    ...shadows.section,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  heroLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.bold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
    lineHeight: typography.sizes.hero * typography.lineHeights.tight,
  },
  heroSubtitle: {
    fontSize: typography.sizes.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.md,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },
  heroCardPreview: {
    width: 100,
    height: 140,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.small,
  },
  heroPreviewImage: {
    width: '100%',
    height: '100%',
  },

  // Horizontal strip
  stripScroll: {
    overflow: 'visible',
  },
  stripContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.base,
  },

  // Pack CTA
  ctaWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxl,
  },
  packCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  packCTAIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  packCTAText: {
    flex: 1,
  },
  packCTATitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  packCTASubtitle: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    marginTop: 2,
  },

  // Grid
  grid: {
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.lg,
  },
  gridItem: {
    paddingBottom: spacing.md,
  },
});
