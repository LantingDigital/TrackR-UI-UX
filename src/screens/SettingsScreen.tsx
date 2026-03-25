/**
 * SettingsScreen
 *
 * Full premium settings experience with grouped sections:
 * Account, App Preferences, Social, Data & Storage, About.
 * iOS-Settings-style grouped rows with spring entrance animations.
 *
 * Sub-screens and bottom sheets:
 * - Units -> SettingsBottomSheet
 * - Rider Type -> SettingsBottomSheet with descriptions
 * - Activity Visibility -> SettingsBottomSheet
 * - Blocked Users -> BlockedUsersScreen (navigation)
 * - Clear Cache -> SettingsBottomSheet warning
 * - Export Ride Log -> ExportRideLogScreen (navigation)
 * - Reset Onboarding -> DangerousActionModal
 * - Delete Account -> DangerousActionModal (typed confirmation)
 * - Email -> EmailScreen (navigation)
 * - Password -> PasswordScreen (navigation)
 * - Home Park -> Navigate to Parks tab with auto-open park switcher
 * - Terms of Service -> TermsScreen (navigation)
 * - Privacy Policy -> PrivacyPolicyScreen (navigation)
 * - Credits -> CreditsScreen (navigation)
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as StoreReview from 'expo-store-review';
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
  setDisplayName as storeSetDisplayName,
  setUsername as storeSetUsername,
  setProfileImageUri,
  setHomeParkName as storeSetHomeParkName,
  setUnitSystem as storeSetUnitSystem,
  setRiderType as storeSetRiderType,
  setActivityVisibility as storeSetActivityVisibility,
  type RiderType,
  type UnitSystem,
  type PrivacyLevel,
} from '../stores/settingsStore';
import { resetCards as resetFirstSessionCards } from '../features/first-session';
import { getCriteria } from '../stores/rideLogStore';
import { SettingsBottomSheet } from '../components/settings/SettingsBottomSheet';
import { DangerousActionModal } from '../components/settings/DangerousActionModal';
import type { SettingsSheetOption } from '../components/settings/SettingsBottomSheet';
import { GlassHeader } from '../components/GlassHeader';
import { useAuthStore } from '../stores/authStore';
import { signOut as firebaseSignOut } from '../services/firebase/auth';
import { callDeleteUserAccount } from '../services/firebase/functions';
import { stopAllSync } from '../services/firebase/syncController';
import { useConfirmModal } from '../contexts/ConfirmModalContext';

// ============================================
// Constants
// ============================================
const APP_VERSION = '1.0.0';
const MOCK_FRIENDS_COUNT = 12;
const MOCK_BLOCKED_COUNT = 0;

const RIDER_LABELS: Record<NonNullable<RiderType>, string> = {
  thrills: 'Thrill Seeker',
  data: 'Data Nerd',
  planner: 'Trip Planner',
  newbie: 'Fresh Rider',
};

const UNIT_LABELS: Record<UnitSystem, string> = {
  imperial: 'Imperial (ft, mph)',
  metric: 'Metric (m, km/h)',
};

const PRIVACY_LABELS: Record<PrivacyLevel, string> = {
  everyone: 'Everyone',
  friends: 'Friends Only',
  private: 'Only Me',
};

// Bottom sheet option configs
const UNIT_OPTIONS: SettingsSheetOption[] = [
  { key: 'imperial', label: 'Imperial', description: 'Feet, miles per hour', icon: 'flag-outline' },
  { key: 'metric', label: 'Metric', description: 'Meters, kilometers per hour', icon: 'globe-outline' },
];

const RIDER_TYPE_OPTIONS: SettingsSheetOption[] = [
  { key: 'thrills', label: 'Thrill Seeker', description: 'You live for the biggest drops and fastest speeds', icon: 'flash-outline' },
  { key: 'data', label: 'Data Nerd', description: 'You track every stat, every ride, every time', icon: 'stats-chart-outline' },
  { key: 'planner', label: 'Trip Planner', description: 'You always have the next park visit mapped out', icon: 'map-outline' },
  { key: 'newbie', label: 'Fresh Rider', description: 'Just getting into the coaster world', icon: 'sparkles-outline' },
];

const VISIBILITY_OPTIONS: SettingsSheetOption[] = [
  { key: 'everyone', label: 'Everyone', description: 'Anyone can see your activity', icon: 'earth-outline' },
  { key: 'friends', label: 'Friends Only', description: 'Only your friends can see your activity', icon: 'people-outline' },
  { key: 'private', label: 'Only Me', description: 'Your activity is completely private', icon: 'lock-closed-outline' },
];

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
const SectionHeader = React.memo(({ label }: { label: string }) => (
  <Text style={styles.sectionHeader}>{label.toUpperCase()}</Text>
));

// ============================================
// Row Components
// ============================================
type ToggleRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
};

const SWITCH_TRACK_COLOR = { false: colors.border.subtle, true: colors.accent.primary };

const ToggleRow = React.memo(({ icon, label, value, onValueChange, isLast }: ToggleRowProps) => {
  const handleValueChange = useCallback((v: boolean) => {
    haptics.tap();
    onValueChange(v);
  }, [onValueChange]);

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      {icon && (
        <View style={styles.rowIconBg}>
          <Ionicons name={icon} size={16} color={colors.accent.primary} />
        </View>
      )}
      <Text style={[styles.rowLabel, icon && styles.rowLabelWithIcon]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={handleValueChange}
        trackColor={SWITCH_TRACK_COLOR}
        thumbColor={colors.background.card}
      />
    </View>
  );
});

type TappableRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  destructive?: boolean;
};

const TappableRow = React.memo(({ icon, label, value, onPress, isLast, destructive }: TappableRowProps) => {
  const { pressHandlers, animatedStyle } = useSpringPress();

  const handlePress = useCallback(() => {
    haptics.tap();
    onPress?.();
  }, [onPress]);

  return (
    <Pressable
      {...pressHandlers}
      onPress={handlePress}
    >
      <Animated.View style={[styles.row, !isLast && styles.rowBorder, animatedStyle]}>
        {icon && (
          <View style={[styles.rowIconBg, destructive && styles.rowIconBgDestructive]}>
            <Ionicons
              name={icon}
              size={16}
              color={destructive ? colors.status.error : colors.accent.primary}
            />
          </View>
        )}
        <Text
          style={[
            styles.rowLabel,
            icon && styles.rowLabelWithIcon,
            destructive && styles.rowLabelDestructive,
          ]}
        >
          {label}
        </Text>
        <View style={styles.rowRight}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={16} color={colors.text.meta} />
        </View>
      </Animated.View>
    </Pressable>
  );
});

type InfoRowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
};

const InfoRow = React.memo(({ icon, label, value, isLast }: InfoRowProps) => (
  <View style={[styles.row, !isLast && styles.rowBorder]}>
    {icon && (
      <View style={styles.rowIconBg}>
        <Ionicons name={icon} size={16} color={colors.accent.primary} />
      </View>
    )}
    <Text style={[styles.rowLabel, icon && styles.rowLabelWithIcon]}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
));

// ============================================
// SettingsScreen
// ============================================
export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { alert: showAlert } = useConfirmModal();
  const {
    hapticsEnabled,
    notificationsEnabled,
    riderType,
    homeParkName,
    displayName,
    username,
    profileImageUri,
    unitSystem,
    activityVisibility,
    setHapticsEnabled,
    setNotificationsEnabled,
  } = useSettingsStore();
  const { isAuthenticated, user: authUser } = useAuthStore();

  // Bottom sheet states
  const [unitsSheetVisible, setUnitsSheetVisible] = useState(false);
  const [riderTypeSheetVisible, setRiderTypeSheetVisible] = useState(false);
  const [visibilitySheetVisible, setVisibilitySheetVisible] = useState(false);
  const [clearCacheSheetVisible, setClearCacheSheetVisible] = useState(false);
  const [friendsSheetVisible, setFriendsSheetVisible] = useState(false);
  const [rateSheetVisible, setRateSheetVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  const [displayNameSheetVisible, setDisplayNameSheetVisible] = useState(false);
  const [usernameSheetVisible, setUsernameSheetVisible] = useState(false);

  // Modal states
  const [resetOnboardingModalVisible, setResetOnboardingModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);

  // Staggered entrance for each section
  const headerAnim = useStaggerEntrance(0);
  const profileAnim = useStaggerEntrance(1);
  const accountAnim = useStaggerEntrance(2);
  const prefsAnim = useStaggerEntrance(3);
  const socialAnim = useStaggerEntrance(4);
  const dataAnim = useStaggerEntrance(5);
  const aboutAnim = useStaggerEntrance(6);

  const riderLabel = riderType ? RIDER_LABELS[riderType] : 'Not set';

  // ── Handlers ──

  const handleEditName = useCallback(() => {
    haptics.tap();
    setDisplayNameSheetVisible(true);
  }, []);

  const handleDisplayNameSubmit = useCallback((text: string) => {
    storeSetDisplayName(text);
  }, []);

  const handleEditUsername = useCallback(() => {
    haptics.tap();
    setUsernameSheetVisible(true);
  }, []);

  const handleUsernameSubmit = useCallback((text: string) => {
    const formatted = text.startsWith('@') ? text : `@${text}`;
    storeSetUsername(formatted);
  }, []);

  const handleChangePhoto = useCallback(() => {
    haptics.select();
    setPhotoSheetVisible(true);
  }, []);

  const handleTakePhoto = useCallback(async () => {
    setPhotoSheetVisible(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImageUri(result.assets[0].uri);
    }
  }, []);

  const handleChooseFromLibrary = useCallback(async () => {
    setPhotoSheetVisible(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfileImageUri(result.assets[0].uri);
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setPhotoSheetVisible(false);
    setProfileImageUri(null);
  }, []);

  // Navigate to Email screen
  const handleChangeEmail = useCallback(() => {
    navigation.navigate('EmailSettings');
  }, [navigation]);

  // Navigate to Password screen
  const handleChangePassword = useCallback(() => {
    navigation.navigate('PasswordSettings');
  }, [navigation]);

  const handleSignOut = useCallback(() => {
    haptics.tap();
    setSignOutModalVisible(true);
  }, []);

  const handleSignOutConfirm = useCallback(async () => {
    haptics.tap();
    stopAllSync();
    await firebaseSignOut();
    resetOnboarding();
  }, []);

  // Navigate to Parks tab and auto-open park switcher
  const handleHomePark = useCallback(() => {
    // Navigate to the Parks tab. The park screen's MorphingPill handles the switcher.
    // We navigate to Parks and use params to signal auto-open if needed.
    navigation.navigate('Tabs', { screen: 'Parks' });
  }, [navigation]);

  // Open Units bottom sheet
  const handleUnitSystem = useCallback(() => {
    setUnitsSheetVisible(true);
  }, []);

  // Open Rider Type bottom sheet
  const handleRiderType = useCallback(() => {
    setRiderTypeSheetVisible(true);
  }, []);

  // Open Activity Visibility bottom sheet
  const handlePrivacy = useCallback(() => {
    setVisibilitySheetVisible(true);
  }, []);

  const handleFriendsList = useCallback(() => {
    haptics.tap();
    setFriendsSheetVisible(true);
  }, []);

  // Navigate to Blocked Users screen
  const handleBlockedUsers = useCallback(() => {
    navigation.navigate('BlockedUsers');
  }, [navigation]);

  // Open Reset Onboarding modal
  const handleResetOnboarding = useCallback(() => {
    setResetOnboardingModalVisible(true);
  }, []);

  // Open Clear Cache bottom sheet
  const handleClearCache = useCallback(() => {
    setClearCacheSheetVisible(true);
  }, []);

  // Navigate to Export Ride Log screen
  const handleExportData = useCallback(() => {
    navigation.navigate('ExportRideLog');
  }, [navigation]);

  // Navigate to Import Ride Data screen
  const handleImportData = useCallback(() => {
    navigation.navigate('ImportRideData');
  }, [navigation]);

  // Open Delete Account modal
  const handleDeleteAccount = useCallback(() => {
    setDeleteAccountModalVisible(true);
  }, []);

  const handleRateApp = useCallback(() => {
    haptics.tap();
    setRateSheetVisible(true);
  }, []);

  // Navigate to Terms screen
  const handleTerms = useCallback(() => {
    navigation.navigate('TermsOfService');
  }, [navigation]);

  // Navigate to Privacy Policy screen
  const handlePrivacyPolicy = useCallback(() => {
    navigation.navigate('PrivacyPolicy');
  }, [navigation]);

  // Navigate to Credits screen
  const handleCredits = useCallback(() => {
    navigation.navigate('Credits');
  }, [navigation]);

  const handleRatingCriteria = useCallback(() => {
    navigation.navigate('CriteriaWeightEditor');
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    haptics.tap();
    navigation.goBack();
  }, [navigation]);

  // ── Bottom sheet callbacks ──

  const handleUnitSelect = useCallback((key: string) => {
    storeSetUnitSystem(key as UnitSystem);
  }, []);

  const handleRiderTypeSelect = useCallback((key: string) => {
    storeSetRiderType(key as NonNullable<RiderType>);
  }, []);

  const handleVisibilitySelect = useCallback((key: string) => {
    storeSetActivityVisibility(key as PrivacyLevel);
  }, []);

  const handleClearCacheConfirm = useCallback(() => {
    haptics.success();
  }, []);

  const handleResetOnboardingConfirm = useCallback(() => {
    resetOnboarding();
    resetFirstSessionCards();
  }, []);

  const handleDeleteAccountConfirm = useCallback(async () => {
    try {
      await callDeleteUserAccount();
      // If the CF didn't throw, deletion succeeded
      stopAllSync();
      resetOnboarding();
    } catch {
      showAlert({ title: 'Error', message: 'Failed to delete account. Please try again.' });
    }
  }, []);

  // ── Bottom sheet close callbacks ──

  const handleUnitsSheetClose = useCallback(() => setUnitsSheetVisible(false), []);
  const handleRiderTypeSheetClose = useCallback(() => setRiderTypeSheetVisible(false), []);
  const handleVisibilitySheetClose = useCallback(() => setVisibilitySheetVisible(false), []);
  const handleClearCacheSheetClose = useCallback(() => setClearCacheSheetVisible(false), []);
  const handleResetOnboardingModalClose = useCallback(() => setResetOnboardingModalVisible(false), []);
  const handleDeleteAccountModalClose = useCallback(() => setDeleteAccountModalVisible(false), []);
  const handleSignOutModalClose = useCallback(() => setSignOutModalVisible(false), []);
  const handleFriendsSheetClose = useCallback(() => setFriendsSheetVisible(false), []);
  const handleRateSheetClose = useCallback(() => setRateSheetVisible(false), []);
  const handlePhotoSheetClose = useCallback(() => setPhotoSheetVisible(false), []);
  const handleDisplayNameSheetClose = useCallback(() => setDisplayNameSheetVisible(false), []);
  const handleUsernameSheetClose = useCallback(() => setUsernameSheetVisible(false), []);

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const backPress = useSpringPress();
  const headerHeight = insets.top + 52;

  return (
    <View style={styles.container}>
      {/* Scroll content — fills screen, scrolls behind header */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + spacing.xs, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Card (mini) ── */}
        <Animated.View style={profileAnim}>
          <Pressable
            onPress={() => {
              haptics.tap();
            }}
          >
            <View style={styles.profileCard}>
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profileCardAvatar} />
              ) : (
                <View style={styles.profileCardAvatarFallback}>
                  <Text style={styles.profileCardInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.profileCardInfo}>
                <Text style={styles.profileCardName}>{displayName}</Text>
                <Text style={styles.profileCardUsername}>{username}</Text>
              </View>
              <Pressable
                onPress={handleChangePhoto}
                hitSlop={8}
              >
                <View style={styles.profileCardEditBtn}>
                  <Ionicons name="camera-outline" size={16} color={colors.accent.primary} />
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>

        {/* ── Account ── */}
        <Animated.View style={accountAnim}>
          <SectionHeader label="Account" />
          <View style={styles.sectionCard}>
            {isAuthenticated ? (
              <>
                <TappableRow
                  icon="person-outline"
                  label="Display Name"
                  value={displayName}
                  onPress={handleEditName}
                />
                <TappableRow
                  icon="at-outline"
                  label="Username"
                  value={username}
                  onPress={handleEditUsername}
                />
                <TappableRow
                  icon="mail-outline"
                  label="Email"
                  value={authUser?.email ?? 'Not set'}
                  onPress={handleChangeEmail}
                />
                {authUser?.authProvider === 'email' && (
                  <TappableRow
                    icon="lock-closed-outline"
                    label="Password"
                    onPress={handleChangePassword}
                  />
                )}
                <TappableRow
                  icon="log-out-outline"
                  label="Sign Out"
                  onPress={handleSignOut}
                  isLast
                />
              </>
            ) : (
              <TappableRow
                icon="person-add-outline"
                label="Create Account"
                onPress={() => { haptics.tap(); resetOnboarding(); }}
                isLast
              />
            )}
          </View>
        </Animated.View>

        {/* ── App Preferences ── */}
        <Animated.View style={prefsAnim}>
          <SectionHeader label="App Preferences" />
          <View style={styles.sectionCard}>
            <TappableRow
              icon="home-outline"
              label="Home Park"
              value={homeParkName ?? 'Not set'}
              onPress={handleHomePark}
            />
            <ToggleRow
              icon="hand-left-outline"
              label="Haptics"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
            />
            <ToggleRow
              icon="notifications-outline"
              label="Notifications"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <TappableRow
              icon="swap-horizontal-outline"
              label="Units"
              value={UNIT_LABELS[unitSystem]}
              onPress={handleUnitSystem}
            />
            <TappableRow
              icon="options-outline"
              label="Rating Criteria"
              value={`${getCriteria().filter((c) => c.weight > 0).length} active`}
              onPress={handleRatingCriteria}
            />
            <TappableRow
              icon="flash-outline"
              label="Rider Type"
              value={riderLabel}
              onPress={handleRiderType}
              isLast
            />
          </View>
        </Animated.View>

        {/* ── Social ── */}
        <Animated.View style={socialAnim}>
          <SectionHeader label="Social" />
          <View style={styles.sectionCard}>
            <TappableRow
              icon="people-outline"
              label="Friends"
              value={`${MOCK_FRIENDS_COUNT}`}
              onPress={handleFriendsList}
            />
            <TappableRow
              icon="eye-outline"
              label="Activity Visibility"
              value={PRIVACY_LABELS[activityVisibility]}
              onPress={handlePrivacy}
            />
            <TappableRow
              icon="ban-outline"
              label="Blocked Users"
              value={`${MOCK_BLOCKED_COUNT}`}
              onPress={handleBlockedUsers}
              isLast
            />
          </View>
        </Animated.View>

        {/* ── Data & Storage ── */}
        <Animated.View style={dataAnim}>
          <SectionHeader label="Data & Storage" />
          <View style={styles.sectionCard}>
            <TappableRow
              icon="trash-outline"
              label="Clear Cache"
              onPress={handleClearCache}
            />
            <TappableRow
              icon="download-outline"
              label="Export Ride Log"
              onPress={handleExportData}
            />
            <TappableRow
              icon="push-outline"
              label="Import Ride Data"
              onPress={handleImportData}
            />
            <TappableRow
              icon="refresh-outline"
              label="Reset Onboarding"
              onPress={handleResetOnboarding}
              destructive
              isLast={!isAuthenticated}
            />
            {isAuthenticated && (
              <TappableRow
                icon="close-circle-outline"
                label="Delete Account"
                onPress={handleDeleteAccount}
                destructive
                isLast
              />
            )}
          </View>
        </Animated.View>

        {/* ── About ── */}
        <Animated.View style={aboutAnim}>
          <SectionHeader label="About" />
          <View style={styles.sectionCard}>
            <InfoRow
              icon="information-circle-outline"
              label="App Version"
              value={APP_VERSION}
            />
            <InfoRow
              icon="code-slash-outline"
              label="Developer"
              value="Lanting Digital LLC"
            />
            <TappableRow
              icon="document-text-outline"
              label="Terms of Service"
              onPress={handleTerms}
            />
            <TappableRow
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={handlePrivacyPolicy}
            />
            <TappableRow
              icon="heart-outline"
              label="Credits"
              onPress={handleCredits}
            />
            <TappableRow
              icon="star-outline"
              label="Rate TrackR"
              onPress={handleRateApp}
              isLast
            />
          </View>
        </Animated.View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>TrackR v{APP_VERSION}</Text>
          <Text style={styles.footerText}>Made with care by Lanting Digital</Text>
        </View>
      </ScrollView>

      {/* Liquid Glass header overlay — reduced fade to not cover profile card */}
      <GlassHeader headerHeight={headerHeight} fadeDistance={60} />

      {/* Floating header */}
      <Animated.View style={[styles.header, { top: insets.top }, headerAnim]}>
        <Pressable
          {...backPress.pressHandlers}
          onPress={handleGoBack}
          hitSlop={12}
        >
          <Animated.View style={[styles.backButton, backPress.animatedStyle]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Animated.View>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* ── Bottom Sheets ── */}

      {/* Units */}
      <SettingsBottomSheet
        visible={unitsSheetVisible}
        onClose={handleUnitsSheetClose}
        title="Units"
        options={UNIT_OPTIONS}
        selectedKey={unitSystem}
        onSelect={handleUnitSelect}
      />

      {/* Rider Type */}
      <SettingsBottomSheet
        visible={riderTypeSheetVisible}
        onClose={handleRiderTypeSheetClose}
        title="Rider Type"
        options={RIDER_TYPE_OPTIONS}
        selectedKey={riderType ?? undefined}
        onSelect={handleRiderTypeSelect}
      />

      {/* Activity Visibility */}
      <SettingsBottomSheet
        visible={visibilitySheetVisible}
        onClose={handleVisibilitySheetClose}
        title="Activity Visibility"
        options={VISIBILITY_OPTIONS}
        selectedKey={activityVisibility}
        onSelect={handleVisibilitySelect}
      />

      {/* Clear Cache Warning */}
      <SettingsBottomSheet
        visible={clearCacheSheetVisible}
        onClose={handleClearCacheSheetClose}
        title="Clear Cache"
        warning
        warningMessage="This will clear all locally cached images and data. Your ride logs and account data will not be affected."
        warningIcon="trash-outline"
        confirmLabel="Clear Cache"
        cancelLabel="Cancel"
        onConfirm={handleClearCacheConfirm}
      />

      {/* Friends Coming Soon */}
      <SettingsBottomSheet
        visible={friendsSheetVisible}
        onClose={handleFriendsSheetClose}
        title="Friends"
        warning
        warningMessage="Friends list is coming soon. You'll be able to add friends, share rides, and compare rankings."
        warningIcon="people-outline"
        confirmLabel="OK"
        onConfirm={handleFriendsSheetClose}
      />

      {/* Rate TrackR — pre-prompt then native review dialog */}
      <SettingsBottomSheet
        visible={rateSheetVisible}
        onClose={handleRateSheetClose}
        title="Enjoying TrackR?"
        warning
        warningMessage="If you're enjoying TrackR, would you mind leaving a quick rating on the App Store? It helps more coaster enthusiasts find the app."
        warningIcon="star-outline"
        confirmLabel="Rate TrackR"
        cancelLabel="Not now"
        onConfirm={async () => {
          handleRateSheetClose();
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            await StoreReview.requestReview();
          }
        }}
      />

      {/* Profile Photo Picker */}
      <SettingsBottomSheet
        visible={photoSheetVisible}
        onClose={handlePhotoSheetClose}
        title="Profile Photo"
        options={[
          { key: 'camera', label: 'Take Photo', icon: 'camera-outline' },
          { key: 'library', label: 'Choose from Library', icon: 'images-outline' },
          ...(profileImageUri
            ? [{ key: 'remove', label: 'Remove Photo', icon: 'trash-outline' as keyof typeof Ionicons.glyphMap }]
            : []),
        ]}
        onSelect={(key) => {
          if (key === 'camera') handleTakePhoto();
          else if (key === 'library') handleChooseFromLibrary();
          else if (key === 'remove') handleRemovePhoto();
        }}
      />

      {/* Display Name */}
      <SettingsBottomSheet
        visible={displayNameSheetVisible}
        onClose={handleDisplayNameSheetClose}
        title="Display Name"
        textInput
        textInputPlaceholder="Enter your display name"
        textInputDefaultValue={displayName}
        confirmLabel="Save"
        onTextSubmit={handleDisplayNameSubmit}
      />

      {/* Username */}
      <SettingsBottomSheet
        visible={usernameSheetVisible}
        onClose={handleUsernameSheetClose}
        title="Username"
        textInput
        textInputPlaceholder="Enter your username"
        textInputDefaultValue={username}
        confirmLabel="Save"
        onTextSubmit={handleUsernameSubmit}
      />

      {/* ── Dangerous Action Modals ── */}

      {/* Sign Out */}
      <DangerousActionModal
        visible={signOutModalVisible}
        onClose={handleSignOutModalClose}
        title="Sign Out"
        message="Are you sure you want to sign out? Your data will remain safe in the cloud."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={handleSignOutConfirm}
        icon="log-out-outline"
      />

      {/* Reset Onboarding */}
      <DangerousActionModal
        visible={resetOnboardingModalVisible}
        onClose={handleResetOnboardingModalClose}
        title="Reset Onboarding"
        message="This will reset your rider type and preferences, and show the onboarding flow again next time you open the app. Your ride logs will not be affected."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={handleResetOnboardingConfirm}
        icon="refresh-outline"
      />

      {/* Delete Account */}
      <DangerousActionModal
        visible={deleteAccountModalVisible}
        onClose={handleDeleteAccountModalClose}
        title="Delete Account"
        message="This action is permanent and cannot be undone. All your ride logs, ratings, and profile data will be permanently deleted."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAccountConfirm}
        requireTypedConfirmation
        icon="skull-outline"
        severe
      />
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
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
    zIndex: 10,
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

  // ── Profile Card ──
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.base,
    ...shadows.section,
  },
  profileCardAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileCardAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardInitials: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.inverse,
  },
  profileCardInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
  profileCardName: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  profileCardUsername: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  profileCardEditBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: spacing.base,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  rowIconBg: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  rowIconBgDestructive: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
  },
  rowLabel: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  rowLabelWithIcon: {
    flex: 1,
  },
  rowLabelDestructive: {
    color: colors.status.error,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
    maxWidth: '50%',
  },
  rowValue: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'right',
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  footerText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
  },
});

export default SettingsScreen;
