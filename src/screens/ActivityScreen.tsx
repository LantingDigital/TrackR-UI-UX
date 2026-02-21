/**
 * ActivityScreen
 *
 * Personal tracking hub: pending ratings, log history, and milestones.
 * Replaces the old LogScreen with a more comprehensive activity view.
 *
 * This is a placeholder - full implementation coming in Phase 3.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSpringPress } from '../hooks/useSpringPress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import {
  getPendingLogs,
  subscribe,
  RideLog,
  completeRating,
} from '../stores/rideLogStore';
import { ALL_SEARCHABLE_ITEMS } from '../data/mockSearchData';
import { useTabBar } from '../contexts/TabBarContext';
import { RatingModal } from '../components/RatingModal';
import { SPRINGS } from '../constants/animations';

// Get coaster image from search data
function getCoasterImage(coasterId: string): string {
  const item = ALL_SEARCHABLE_ITEMS.find((i) => i.id === coasterId);
  return item?.image || 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=400';
}

export const ActivityScreen = () => {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBar();
  const [pendingLogs, setPendingLogs] = useState<RideLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Rating modal state
  const [selectedLog, setSelectedLog] = useState<RideLog | null>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  // Subscribe to store changes
  useEffect(() => {
    const updateData = () => {
      setPendingLogs(getPendingLogs());
    };

    updateData();
    const unsubscribe = subscribe(updateData);
    return unsubscribe;
  }, []);

  // Register reset handler
  useEffect(() => {
    const resetHandler = () => {
      // Reset scroll position or close modals
      if (ratingModalVisible) {
        setRatingModalVisible(false);
        setSelectedLog(null);
      }
    };
    tabBar?.registerResetHandler('Activity', resetHandler);
    return () => {
      tabBar?.unregisterResetHandler('Activity');
    };
  }, [tabBar, ratingModalVisible]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setPendingLogs(getPendingLogs());
      setRefreshing(false);
    }, 500);
  }, []);

  // Pending card press handler - opens rating modal
  const handlePendingCardPress = useCallback((log: RideLog) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLog(log);
    setRatingModalVisible(true);
    tabBar?.hideTabBar(200);
  }, [tabBar]);

  // Handle rating modal close
  const handleRatingClose = useCallback(() => {
    setRatingModalVisible(false);
    setSelectedLog(null);
    tabBar?.showTabBar(200);
  }, [tabBar]);

  // Handle rating completion
  const handleRatingComplete = useCallback((log: RideLog, ratings: Record<string, number>) => {
    completeRating(log.id, ratings);
    setRatingModalVisible(false);
    setSelectedLog(null);
    tabBar?.showTabBar(200);
  }, [tabBar]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Activity</Text>
          <Text style={styles.headerSubtitle}>Your ride journey</Text>
        </View>

        {/* Pending Ratings Queue */}
        {pendingLogs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={18} color="#F9A825" />
              <Text style={styles.sectionTitle}>Awaiting Rating</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pendingLogs.length}</Text>
              </View>
            </View>

            {pendingLogs.map((log) => (
              <PendingCard
                key={log.id}
                log={log}
                onPress={() => handlePendingCardPress(log)}
              />
            ))}
          </View>
        )}

        {/* Recent Logs Section - Placeholder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={18} color={colors.text.secondary} />
            <Text style={styles.sectionTitle}>Recent Logs</Text>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Your recent ride logs will appear here.
            </Text>
          </View>
        </View>

        {/* Milestones Section - Placeholder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={18} color={colors.accent.primary} />
            <Text style={styles.sectionTitle}>Milestones</Text>
          </View>

          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Credit milestones and achievements coming soon.
            </Text>
          </View>
        </View>

        {/* Empty State - when no pending */}
        {pendingLogs.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="checkmark-circle" size={56} color={colors.status.success} />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              No pending ratings. Log a ride from the Home screen to get started.
            </Text>
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        animationType="none"
        transparent
        statusBarTranslucent
      >
        {selectedLog && (
          <RatingModal
            log={selectedLog}
            imageUrl={getCoasterImage(selectedLog.coasterId)}
            onClose={handleRatingClose}
            onComplete={handleRatingComplete}
          />
        )}
      </Modal>
    </View>
  );
};

// =========================================
// Pending Card Component
// =========================================
interface PendingCardProps {
  log: RideLog;
  onPress: () => void;
}

const PendingCard: React.FC<PendingCardProps> = ({ log, onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({
    scale: 0.98,
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressHandlers.onPressIn}
      onPressOut={pressHandlers.onPressOut}
    >
      <Animated.View
        style={[
          styles.pendingCard,
          animatedStyle,
        ]}
      >
        <Image
          source={{ uri: getCoasterImage(log.coasterId) }}
          style={styles.pendingImage}
        />
        <View style={styles.pendingInfo}>
          <Text style={styles.pendingName} numberOfLines={1}>
            {log.coasterName}
          </Text>
          <Text style={styles.pendingPark} numberOfLines={1}>
            {log.parkName}
          </Text>
        </View>
        <View style={styles.rateIndicator}>
          <Ionicons name="star-outline" size={16} color="#F9A825" />
          <Text style={styles.rateText}>Rate</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.text.meta} />
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
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 17,
    color: colors.text.secondary,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  countBadge: {
    backgroundColor: '#F9A825',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Pending Card
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.base,
    marginBottom: spacing.sm,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  pendingImage: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.background.page,
  },
  pendingInfo: {
    flex: 1,
    marginLeft: spacing.base,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  pendingPark: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  rateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.sm,
  },
  rateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F9A825',
  },

  // Placeholder
  placeholderCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.text.meta,
    textAlign: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ActivityScreen;
