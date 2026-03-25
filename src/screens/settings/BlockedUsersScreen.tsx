/**
 * BlockedUsersScreen
 *
 * Shows a list of blocked user profiles. Each has a grayed-out avatar
 * with a slash overlay, username, and an unblock button.
 * Currently uses mock data since accounts aren't connected.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
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
  FadeOut,
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
import { SettingsBottomSheet } from '../../components/settings/SettingsBottomSheet';

const HEADER_HEIGHT = 52;

// ============================================
// Mock Data
// ============================================

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
}

const MOCK_BLOCKED_USERS: BlockedUser[] = [
  // Empty by default -- users would populate via the app
];

// ============================================
// BlockedUserRow
// ============================================

function BlockedUserRow({
  user,
  index,
  onUnblock,
}: {
  user: BlockedUser;
  index: number;
  onUnblock: (id: string) => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const unblockPress = useSpringPress();

  useEffect(() => {
    const delay = index * TIMING.stagger;
    opacity.value = withDelay(delay, withTiming(1, { duration: TIMING.normal }));
    translateY.value = withDelay(delay, withSpring(0, SPRINGS.responsive));
  }, []);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const initials = user.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Animated.View style={[styles.userRow, rowStyle]} exiting={FadeOut.duration(200)}>
      {/* Grayed-out avatar with slash */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.slashOverlay}>
          <Ionicons name="ban-outline" size={28} color={colors.status.error} />
        </View>
      </View>

      {/* User info */}
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>{user.username}</Text>
      </View>

      {/* Unblock button */}
      <Pressable
        {...unblockPress.pressHandlers}
        onPress={() => {
          haptics.select();
          onUnblock(user.id);
        }}
      >
        <Animated.View style={[styles.unblockBtn, unblockPress.animatedStyle]}>
          <Text style={styles.unblockText}>Unblock</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================
// BlockedUsersScreen
// ============================================

export function BlockedUsersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const backPress = useSpringPress();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>(MOCK_BLOCKED_USERS);
  const [unblockSheetVisible, setUnblockSheetVisible] = useState(false);
  const [pendingUnblockId, setPendingUnblockId] = useState<string | null>(null);

  const handleUnblock = useCallback((id: string) => {
    haptics.tap();
    setPendingUnblockId(id);
    setUnblockSheetVisible(true);
  }, []);

  const handleUnblockConfirm = useCallback(() => {
    if (pendingUnblockId) {
      haptics.success();
      setBlockedUsers((prev) => prev.filter((u) => u.id !== pendingUnblockId));
      setPendingUnblockId(null);
    }
  }, [pendingUnblockId]);

  const headerAnim = useSharedValue(0);
  useEffect(() => {
    headerAnim.value = withTiming(1, { duration: TIMING.normal });
  }, []);
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
  }));

  const headerTotalHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      {blockedUsers.length === 0 ? (
        <View style={[styles.emptyState, { paddingTop: headerTotalHeight }]}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={48} color={colors.text.meta} />
          </View>
          <Text style={styles.emptyTitle}>No Blocked Users</Text>
          <Text style={styles.emptySubtitle}>
            Users you block will appear here. You can unblock them at any time.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <BlockedUserRow user={item} index={index} onUnblock={handleUnblock} />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: headerTotalHeight + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* GlassHeader fog overlay */}
      <GlassHeader headerHeight={headerTotalHeight} />

      {/* Header — floats above fog */}
      <Animated.View style={[styles.header, { top: insets.top }, headerStyle]}>
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
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Unblock confirmation bottom sheet */}
      <SettingsBottomSheet
        visible={unblockSheetVisible}
        onClose={() => { setUnblockSheetVisible(false); setPendingUnblockId(null); }}
        title="Unblock User"
        warning
        warningMessage="Are you sure you want to unblock this user? They will be able to see your profile and activity again."
        warningIcon="person-add-outline"
        confirmLabel="Unblock"
        cancelLabel="Cancel"
        onConfirm={handleUnblockConfirm}
      />
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
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.small,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: colors.text.meta,
  },
  slashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.08)',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
  displayName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  username: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    backgroundColor: colors.accent.primaryLight,
  },
  unblockText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
  },
});
