/**
 * ProfileScreen
 *
 * User profile hub - navigation to various profile sections.
 * - Profile header with avatar and name
 * - Navigation buttons to sub-screens (Wallet, Rating Criteria, etc.)
 * - Coaster stats summary
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { useWallet } from '../hooks/useWallet';
import { useTabBar } from '../contexts/TabBarContext';
import { WalletScreen } from './WalletScreen';
import { CriteriaSetupScreen } from './CriteriaSetupScreen';
import {
  getCreditCount,
  getTotalRideCount,
  hasCompletedCriteriaSetup,
  subscribe,
} from '../stores/rideLogStore';

// Animation constants
const RESPONSIVE_SPRING = {
  damping: 16,
  stiffness: 180,
  mass: 0.8,
  useNativeDriver: true,
};

const PRESS_SCALE = 0.97;

type ActiveScreen = 'hub' | 'wallet' | 'criteria';

export const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const { tickets } = useWallet();
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('hub');
  const tabBarContext = useTabBar();

  // Subscribe to ride log store
  const [creditCount, setCreditCount] = useState(getCreditCount());
  const [totalRides, setTotalRides] = useState(getTotalRideCount());
  const [hasCriteriaSetup, setHasCriteriaSetup] = useState(hasCompletedCriteriaSetup());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setCreditCount(getCreditCount());
      setTotalRides(getTotalRideCount());
      setHasCriteriaSetup(hasCompletedCriteriaSetup());
    });
    return unsubscribe;
  }, []);

  // Register reset handler for Profile screen - returns to hub when tab is pressed
  useEffect(() => {
    const resetHandler = () => {
      setActiveScreen('hub');
    };
    tabBarContext?.registerResetHandler('Profile', resetHandler);
    return () => {
      tabBarContext?.unregisterResetHandler('Profile');
    };
  }, [tabBarContext]);

  // Stats
  const activeTickets = useMemo(() => {
    return tickets.filter((t) => t.status === 'active').length;
  }, [tickets]);

  // Navigation handlers
  const navigateTo = useCallback((screen: ActiveScreen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveScreen(screen);
  }, []);

  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveScreen('hub');
  }, []);

  // Render sub-screens
  if (activeScreen === 'wallet') {
    return <WalletScreen onBack={goBack} />;
  }

  if (activeScreen === 'criteria') {
    return <CriteriaSetupScreen onBack={goBack} />;
  }

  // Render hub
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={colors.text.secondary} />
          </View>
          <Text style={styles.profileName}>Coaster Enthusiast</Text>
          <Text style={styles.profileSubtext}>TrackR Member</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.accent.primary }]}>
                {creditCount}
              </Text>
              <Text style={styles.statLabel}>Credits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text.primary }]}>
                {totalRides}
              </Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.status.success }]}>
                {activeTickets}
              </Text>
              <Text style={styles.statLabel}>Active Passes</Text>
            </View>
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Settings</Text>

          <NavigationButton
            icon="wallet-outline"
            label="My Wallet"
            description="Manage your park passes and tickets"
            badge={activeTickets > 0 ? `${activeTickets}` : undefined}
            onPress={() => navigateTo('wallet')}
          />

          <NavigationButton
            icon="options-outline"
            label="Rating Criteria"
            description="Customize how you rate coasters"
            badge={!hasCriteriaSetup ? 'Setup' : undefined}
            badgeColor={!hasCriteriaSetup ? colors.accent.primary : undefined}
            onPress={() => navigateTo('criteria')}
          />

          <NavigationButton
            icon="stats-chart-outline"
            label="My Rankings"
            description="View your coaster rankings"
            disabled
            comingSoon
            onPress={() => {}}
          />

          <NavigationButton
            icon="trophy-outline"
            label="Achievements"
            description="Track your coaster milestones"
            disabled
            comingSoon
            onPress={() => {}}
          />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <NavigationButton
            icon="settings-outline"
            label="App Settings"
            description="Notifications, appearance, and more"
            disabled
            comingSoon
            onPress={() => {}}
          />

          <NavigationButton
            icon="help-circle-outline"
            label="Help & Support"
            description="FAQs and contact support"
            disabled
            comingSoon
            onPress={() => {}}
          />
        </View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>
    </View>
  );
};

// =========================================
// Navigation Button Component
// =========================================
interface NavigationButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
  comingSoon?: boolean;
  onPress: () => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  icon,
  label,
  description,
  badge,
  badgeColor,
  disabled,
  comingSoon,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: PRESS_SCALE,
      ...RESPONSIVE_SPRING,
    }).start();
  }, [disabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...RESPONSIVE_SPRING,
    }).start();
  }, [scaleAnim]);

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        disabled && styles.buttonDisabled,
      ]}
    >
      <Animated.View
        style={[
          styles.navButton,
          { transform: [{ scale: scaleAnim }] },
          disabled && styles.navButtonDisabled,
        ]}
      >
        {/* Icon */}
        <View style={[styles.navIconContainer, disabled && styles.navIconDisabled]}>
          <Ionicons
            name={icon}
            size={22}
            color={disabled ? colors.text.meta : colors.accent.primary}
          />
        </View>

        {/* Content */}
        <View style={styles.navContent}>
          <View style={styles.navLabelRow}>
            <Text style={[styles.navLabel, disabled && styles.navLabelDisabled]}>
              {label}
            </Text>
            {badge && (
              <View style={[styles.badge, badgeColor && { backgroundColor: badgeColor }]}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
            {comingSoon && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Soon</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navDescription, disabled && styles.navDescriptionDisabled]}>
            {description}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={disabled ? colors.text.meta : colors.text.secondary}
        />
      </Animated.View>
    </Pressable>
  );
};

// =========================================
// Styles
// =========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Profile Header
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.base,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  profileSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },

  // Stats Card
  statsCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.subtle,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.base,
    marginLeft: spacing.xs,
  },

  // Navigation Button
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  navButtonDisabled: {
    backgroundColor: colors.background.card,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  navIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  navIconDisabled: {
    backgroundColor: colors.background.page,
  },
  navContent: {
    flex: 1,
  },
  navLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  navLabelDisabled: {
    color: colors.text.secondary,
  },
  navDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  navDescriptionDisabled: {
    color: colors.text.meta,
  },
  badge: {
    backgroundColor: colors.status.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  comingSoonBadge: {
    backgroundColor: colors.background.page,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.meta,
  },
});
