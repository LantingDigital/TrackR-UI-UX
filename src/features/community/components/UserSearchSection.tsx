/**
 * UserSearchSection — Search bar + results for discovering users
 *
 * Lives at the top of CommunityFriendsTab, above Stories.
 * Typing filters mock users. Each result row shows avatar, name,
 * credit count, mutual friends, and an "Add" / status button.
 * Follows keyboard-behavior.md: auto-scroll, smooth dismiss.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Keyboard } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { TIMING } from '../../../constants/animations';
import { useSpringPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import type { DiscoverableUser, FriendshipStatus } from '../types/community';

// ─── Status Button ──────────────────────────────────────────

function StatusButton({
  status,
  onAdd,
}: {
  status: FriendshipStatus;
  onAdd: () => void;
}) {
  const press = useSpringPress({ disabled: status !== 'none' });

  switch (status) {
    case 'none':
      return (
        <Pressable {...press.pressHandlers} onPress={onAdd}>
          <Animated.View style={[statusStyles.addBtn, press.animatedStyle]}>
            <Ionicons name="person-add-outline" size={14} color={colors.text.inverse} />
          </Animated.View>
        </Pressable>
      );
    case 'request_sent':
      return (
        <View style={statusStyles.sentBadge}>
          <Text style={statusStyles.sentText}>Sent</Text>
        </View>
      );
    case 'request_received':
      return (
        <View style={statusStyles.receivedBadge}>
          <Text style={statusStyles.receivedText}>Pending</Text>
        </View>
      );
    case 'friends':
      return (
        <View style={statusStyles.friendsBadge}>
          <Ionicons name="checkmark" size={14} color={colors.status.successSoft} />
        </View>
      );
    default:
      return null;
  }
}

const statusStyles = StyleSheet.create({
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentBadge: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background.input,
  },
  sentText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
  },
  receivedBadge: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.primaryLight,
  },
  receivedText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.accent.primary,
  },
  friendsBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Search Result Row ──────────────────────────────────────

interface SearchResultRowProps {
  user: DiscoverableUser;
  index: number;
  onAdd: (userId: string) => void;
}

const SearchResultRow = React.memo(function SearchResultRow({
  user,
  index,
  onAdd,
}: SearchResultRowProps) {
  const handleAdd = useCallback(() => {
    haptics.select();
    onAdd(user.id);
  }, [user.id, onAdd]);

  return (
    <Animated.View
      entering={FadeIn.duration(200).delay(index * 50)}
      exiting={FadeOut.duration(150)}
      layout={Layout.duration(200)}
      style={styles.resultRow}
    >
      {/* Avatar */}
      <View style={styles.resultAvatar}>
        <Text style={styles.resultAvatarText}>{user.initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{user.name}</Text>
        <View style={styles.resultMeta}>
          <Text style={styles.resultMetaText}>{user.creditCount} credits</Text>
          {user.mutualFriends > 0 && (
            <>
              <View style={styles.dot} />
              <Text style={styles.resultMetaText}>
                {user.mutualFriends} mutual
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Status button */}
      <StatusButton status={user.friendshipStatus} onAdd={handleAdd} />
    </Animated.View>
  );
});

// ─── Main Component ─────────────────────────────────────────

interface UserSearchSectionProps {
  onSearch: (query: string) => DiscoverableUser[];
  onSendRequest: (userId: string) => void;
}

export function UserSearchSection({
  onSearch,
  onSendRequest,
}: UserSearchSectionProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = useMemo(
    () => (query.trim().length > 0 ? onSearch(query) : []),
    [query, onSearch]
  );

  const containerHeight = useSharedValue(0);
  const resultsOpacity = useSharedValue(0);

  const showResults = query.trim().length > 0;

  React.useEffect(() => {
    if (showResults) {
      resultsOpacity.value = withTiming(1, {
        duration: TIMING.fast,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      resultsOpacity.value = withTiming(0, {
        duration: TIMING.instant,
      });
    }
  }, [showResults, resultsOpacity]);

  const resultsAnimStyle = useAnimatedStyle(() => ({
    opacity: resultsOpacity.value,
  }));

  const handleClear = useCallback(() => {
    setQuery('');
    Keyboard.dismiss();
  }, []);

  const handleAdd = useCallback((userId: string) => {
    onSendRequest(userId);
  }, [onSendRequest]);

  // Focus ring animation
  const focusOpacity = useSharedValue(0);
  React.useEffect(() => {
    focusOpacity.value = withTiming(focused ? 1 : 0, {
      duration: TIMING.fast,
    });
  }, [focused, focusOpacity]);

  const inputBorderStyle = useAnimatedStyle(() => ({
    borderColor: focused ? colors.accent.primary : colors.border.subtle,
    borderWidth: focused ? 1.5 : 1,
  }));

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <Animated.View style={[styles.inputContainer, inputBorderStyle]}>
        <Ionicons
          name="search"
          size={18}
          color={focused ? colors.accent.primary : colors.text.meta}
        />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search for users by name"
          placeholderTextColor={colors.text.meta}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.text.meta} />
          </Pressable>
        )}
      </Animated.View>

      {/* Results */}
      {showResults && (
        <Animated.View style={[styles.resultsCard, resultsAnimStyle]}>
          {results.length > 0 ? (
            results.map((user, index) => (
              <SearchResultRow
                key={user.id}
                user={user}
                index={index}
                onAdd={handleAdd}
              />
            ))
          ) : (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.emptyState}
            >
              <Ionicons name="search-outline" size={24} color={colors.text.meta} />
              <Text style={styles.emptyText}>No users found</Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    height: 48,
    gap: spacing.md,
    ...shadows.small,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  resultsCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    marginTop: spacing.md,
    padding: spacing.base,
    ...shadows.small,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xs,
  },
  resultAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  resultAvatarText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
  },
  resultInfo: {
    flex: 1,
    marginRight: spacing.base,
  },
  resultName: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  resultMetaText: {
    fontSize: typography.sizes.small,
    color: colors.text.meta,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.meta,
    marginHorizontal: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.text.meta,
  },
});
