/**
 * CreditsScreen
 *
 * Shows app credits: "Built with love by Lanting Digital LLC",
 * app version, and acknowledgments for open source libraries used.
 */

import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { SPRINGS, TIMING } from '../../constants/animations';
import { useSpringPress } from '../../hooks/useSpringPress';
import { haptics } from '../../services/haptics';
import { GlassHeader } from '../../components/GlassHeader';

const HEADER_HEIGHT = 52;

// ============================================
// Open source libraries (from package.json)
// ============================================

const LIBRARIES = [
  { name: 'React Native', description: 'Mobile application framework', version: '0.81.5' },
  { name: 'Expo', description: 'Development platform for React Native', version: '54' },
  { name: 'React Native Reanimated', description: 'Performant animations on the UI thread', version: '4.2' },
  { name: 'React Navigation', description: 'Routing and navigation', version: '7' },
  { name: 'React Native Gesture Handler', description: 'Touch and gesture system', version: '2.28' },
  { name: 'React Native Safe Area Context', description: 'Safe area handling', version: '5.6' },
  { name: 'Expo Haptics', description: 'Haptic feedback', version: '15' },
  { name: 'Expo Blur', description: 'Blur effects', version: '15' },
  { name: 'Expo Linear Gradient', description: 'Gradient rendering', version: '15' },
  { name: 'Expo Image Picker', description: 'Image selection', version: '17' },
  { name: '@rnmapbox/maps', description: 'Interactive map rendering', version: '10.2' },
  { name: '@shopify/react-native-skia', description: '2D graphics engine', version: '2.2' },
  { name: 'React Native SVG', description: 'SVG support', version: '15.12' },
  { name: 'Lottie React Native', description: 'Lottie animation rendering', version: '7.3' },
  { name: 'AsyncStorage', description: 'Persistent key-value storage', version: '2.2' },
  { name: 'React Native Draggable FlatList', description: 'Draggable list components', version: '4.0' },
  { name: 'Expo Camera', description: 'Camera access', version: '17' },
  { name: 'Expo AV', description: 'Audio/video playback', version: '16' },
];

// ============================================
// Stagger
// ============================================

function useStagger(index: number) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * TIMING.stagger;
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    translateY.value = withDelay(delay, withSpring(0, SPRINGS.responsive));
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ============================================
// CreditsScreen
// ============================================

export function CreditsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const backPress = useSpringPress();

  const headerAnim = useStagger(0);
  const heroAnim = useStagger(1);
  const libsAnim = useStagger(2);

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Scroll content — fills entire screen, scrolls behind header */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerTotalHeight + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <Animated.View style={heroAnim}>
          <View style={styles.heroCard}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="heart" size={32} color={colors.accent.primary} />
            </View>
            <Text style={styles.heroTitle}>TrackR</Text>
            <Text style={styles.heroVersion}>Version 1.0.0</Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroBuilt}>Built with love by</Text>
            <Text style={styles.heroCompany}>Lanting Digital LLC</Text>
            <Text style={styles.heroLocation}>Riverside, California</Text>
          </View>
        </Animated.View>

        {/* Open Source */}
        <Animated.View style={libsAnim}>
          <Text style={styles.sectionHeader}>OPEN SOURCE LIBRARIES</Text>
          <Text style={styles.sectionSubtext}>
            TrackR is built on the shoulders of amazing open source projects.
          </Text>

          <View style={styles.libsCard}>
            {LIBRARIES.map((lib, i) => (
              <View
                key={lib.name}
                style={[
                  styles.libRow,
                  i < LIBRARIES.length - 1 && styles.libRowBorder,
                ]}
              >
                <View style={styles.libInfo}>
                  <Text style={styles.libName}>{lib.name}</Text>
                  <Text style={styles.libDescription}>{lib.description}</Text>
                </View>
                <Text style={styles.libVersion}>v{lib.version}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Special Thanks */}
        <Animated.View style={libsAnim}>
          <Text style={styles.sectionHeader}>SPECIAL THANKS</Text>
          <View style={styles.thanksCard}>
            <Text style={styles.thanksText}>
              To the roller coaster community for their passion and enthusiasm that inspired this app. To the open source community for building the incredible tools that make apps like this possible.
            </Text>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="code-slash" size={16} color={colors.text.meta} />
          <Text style={styles.footerText}>
            Designed and developed by Caleb Lanting
          </Text>
        </View>
      </ScrollView>

      {/* GlassHeader fog overlay */}
      <GlassHeader headerHeight={headerTotalHeight} />

      {/* Header — floats above fog */}
      <Animated.View style={[styles.header, { top: insets.top }, headerAnim]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={() => {
            haptics.tap();
            navigation.goBack();
          }}
          hitSlop={12}
        >
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Credits</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: HEADER_HEIGHT,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Hero
  heroCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.section,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  heroVersion: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  heroDivider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.accent.primary,
    marginVertical: spacing.xl,
  },
  heroBuilt: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
  heroCompany: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    marginTop: spacing.xs,
  },
  heroLocation: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },

  // Section
  sectionHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionSubtext: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    marginBottom: spacing.lg,
    marginLeft: spacing.xs,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },

  // Libraries
  libsCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.section,
  },
  libRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  libRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  libInfo: {
    flex: 1,
  },
  libName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  libDescription: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    marginTop: 2,
  },
  libVersion: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    marginLeft: spacing.base,
  },

  // Thanks
  thanksCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.small,
  },
  thanksText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.sizes.caption * 1.65,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
});
