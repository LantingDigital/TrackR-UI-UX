import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
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
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { SPRINGS, TIMING } from '../constants/animations';
import { useSpringPress } from '../hooks/useSpringPress';
import { haptics } from '../services/haptics';
import {
  useSettingsStore,
  resetOnboarding,
  type RiderType,
} from '../stores/settingsStore';
import { getCriteria } from '../stores/rideLogStore';

// ============================================
// Rider type display labels
// ============================================
const RIDER_LABELS: Record<NonNullable<RiderType>, string> = {
  thrills: 'Thrill Seeker',
  data: 'Data Nerd',
  planner: 'Trip Planner',
  newbie: 'Fresh Rider',
};

// ============================================
// Staggered entrance animation
// ============================================
function useStaggerEntrance(index: number) {
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
// Section Header
// ============================================
const SectionHeader = ({ label }: { label: string }) => (
  <Text style={styles.sectionHeader}>{label.toUpperCase()}</Text>
);

// ============================================
// Row Components
// ============================================
type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
};

const ToggleRow = ({ label, value, onValueChange, isLast }: ToggleRowProps) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={(v) => {
        haptics.tap();
        onValueChange(v);
      }}
      trackColor={{ false: colors.border.subtle, true: colors.accent.primary }}
      thumbColor={colors.background.card}
    />
  </View>
);

type TappableRowProps = {
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
};

const TappableRow = ({ label, value, onPress, isLast, destructive }: TappableRowProps) => {
  const { pressHandlers, animatedStyle } = useSpringPress();

  return (
    <Pressable
      {...pressHandlers}
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
    >
      <Animated.View style={[styles.row, !isLast && styles.rowBorder, animatedStyle]}>
        <Text
          style={[
            styles.rowLabel,
            destructive && { color: colors.status.error },
          ]}
        >
          {label}
        </Text>
        <View style={styles.rowRight}>
          {value ? (
            <Text style={styles.rowValue}>{value}</Text>
          ) : null}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.text.meta}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
};

type InfoRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

const InfoRow = ({ label, value, isLast }: InfoRowProps) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

// ============================================
// SettingsScreen
// ============================================
export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const {
    hapticsEnabled,
    notificationsEnabled,
    riderType,
    setHapticsEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();

  const backPress = useSpringPress();

  // Staggered entrance for each section
  const headerAnim = useStaggerEntrance(0);
  const prefsAnim = useStaggerEntrance(1);
  const accountAnim = useStaggerEntrance(2);
  const dataAnim = useStaggerEntrance(3);
  const aboutAnim = useStaggerEntrance(4);

  const riderLabel = riderType ? RIDER_LABELS[riderType] : 'Not set';

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset your rider type and show the onboarding flow again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            haptics.heavy();
            resetOnboarding();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <Animated.View style={[styles.header, headerAnim]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={() => {
            haptics.tap();
            navigation.goBack();
          }}
          hitSlop={12}
        >
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.text.primary}
            />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Preferences ── */}
        <Animated.View style={prefsAnim}>
          <SectionHeader label="Preferences" />
          <View style={styles.sectionCard}>
            <ToggleRow
              label="Haptics"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
            />
            <ToggleRow
              label="Notifications"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <TappableRow
              label="Rating Criteria"
              value={`${getCriteria().filter(c => c.weight > 0).length} active`}
              onPress={() => navigation.navigate('CriteriaWeightEditor')}
              isLast
            />
          </View>
        </Animated.View>

        {/* ── Account ── */}
        <Animated.View style={accountAnim}>
          <SectionHeader label="Account" />
          <View style={styles.sectionCard}>
            <TappableRow
              label="Rider Type"
              value={riderLabel}
            />
            <TappableRow
              label="Sign Out"
              isLast
            />
          </View>
        </Animated.View>

        {/* ── Data ── */}
        <Animated.View style={dataAnim}>
          <SectionHeader label="Data" />
          <View style={styles.sectionCard}>
            <TappableRow
              label="Reset Onboarding"
              onPress={handleResetOnboarding}
              destructive
            />
            <TappableRow
              label="Clear Ride History"
              destructive
              isLast
            />
          </View>
        </Animated.View>

        {/* ── About ── */}
        <Animated.View style={aboutAnim}>
          <SectionHeader label="About" />
          <View style={styles.sectionCard}>
            <InfoRow label="App Version" value="1.0.0" />
            <InfoRow label="Developer" value="Lanting Digital LLC" />
            <TappableRow label="Terms of Service" />
            <TappableRow label="Privacy Policy" isLast />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
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

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // ── Section ──
  sectionHeader: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    ...shadows.section,
  },

  // ── Row ──
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
});

export default SettingsScreen;
