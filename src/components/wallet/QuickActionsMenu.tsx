/**
 * QuickActionsMenu Component
 *
 * Custom branded popup menu for pass quick actions.
 * Appears on long-press of a pass card.
 *
 * Actions:
 * - Scan: Opens gate mode with this pass
 * - Pin/Unpin: Toggle favorite status (max 3)
 * - Edit: Navigate to edit pass details
 * - Delete: Remove pass (with confirmation styling)
 *
 * Design:
 * - Floating card with blur backdrop
 * - Spring animation entrance/exit
 * - Light haptic feedback on actions
 * - Matches app's premium aesthetic
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Ticket } from '../../types/wallet';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { SPRINGS } from '../../constants/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickActionsMenuProps {
  /** Whether the menu is visible */
  visible: boolean;
  /** The ticket to perform actions on */
  ticket: Ticket | null;
  /** Called when menu should close */
  onClose: () => void;
  /** Called when Scan is pressed - opens gate mode */
  onScan?: (ticket: Ticket) => void;
  /** Called when Pin/Unpin is pressed */
  onToggleFavorite?: (ticket: Ticket) => void;
  /** Called when Edit is pressed */
  onEdit?: (ticket: Ticket) => void;
  /** Called when Delete is pressed */
  onDelete?: (ticket: Ticket) => void;
  /** Whether favorites limit (3) is reached - disables pin action */
  favoritesLimitReached?: boolean;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  visible,
  ticket,
  onClose,
  onScan,
  onToggleFavorite,
  onEdit,
  onDelete,
  favoritesLimitReached = false,
}) => {
  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0.9)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const menuTranslateY = useRef(new Animated.Value(20)).current;

  // Animate in/out
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(menuScale, {
          toValue: 1,
          ...SPRINGS.responsive,
          useNativeDriver: true,
        }),
        Animated.spring(menuOpacity, {
          toValue: 1,
          ...SPRINGS.responsive,
          useNativeDriver: true,
        }),
        Animated.spring(menuTranslateY, {
          toValue: 0,
          ...SPRINGS.responsive,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuScale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(menuTranslateY, {
          toValue: 20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Handle action press with haptic feedback
  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
    onClose();
  };

  // Handle backdrop press
  const handleBackdropPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  if (!ticket) return null;

  const isFavorite = ticket.isFavorite;
  const canPin = isFavorite || !favoritesLimitReached;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Blur Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={styles.backdropPressable} onPress={handleBackdropPress}>
          <BlurView intensity={20} tint="dark" style={styles.blurView} />
        </Pressable>
      </Animated.View>

      {/* Menu Card */}
      <View style={styles.menuContainer}>
        <Animated.View
          style={[
            styles.menuCard,
            {
              opacity: menuOpacity,
              transform: [
                { scale: menuScale },
                { translateY: menuTranslateY },
              ],
            },
          ]}
        >
          {/* Header with pass info */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {ticket.parkName}
            </Text>
            <Text style={styles.headerSubtitle}>Quick Actions</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Scan Action */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => onScan && handleAction(() => onScan(ticket))}
            >
              <View style={[styles.actionIcon, styles.actionIconScan]}>
                <Ionicons name="scan" size={20} color={colors.accent.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Scan</Text>
                <Text style={styles.actionSubtitle}>Open at gate</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </Pressable>

            {/* Pin/Unpin Action */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
                !canPin && styles.actionButtonDisabled,
              ]}
              onPress={() => canPin && onToggleFavorite && handleAction(() => onToggleFavorite(ticket))}
              disabled={!canPin}
            >
              <View style={[styles.actionIcon, styles.actionIconFavorite]}>
                <Ionicons
                  name={isFavorite ? 'star' : 'star-outline'}
                  size={20}
                  color={isFavorite ? '#FFD700' : '#666666'}
                />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, !canPin && styles.actionTitleDisabled]}>
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </Text>
                <Text style={styles.actionSubtitle}>
                  {!canPin && !isFavorite ? 'Max 3 favorites reached' : (isFavorite ? 'Currently favorited' : 'Quick access')}
                </Text>
              </View>
              {canPin && <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />}
            </Pressable>

            {/* Edit Action */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => onEdit && handleAction(() => onEdit(ticket))}
            >
              <View style={[styles.actionIcon, styles.actionIconEdit]}>
                <Ionicons name="pencil" size={20} color="#007AFF" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Edit</Text>
                <Text style={styles.actionSubtitle}>Modify pass details</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </Pressable>

            {/* Divider before destructive action */}
            <View style={styles.dividerThin} />

            {/* Delete Action */}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => onDelete && handleAction(() => onDelete(ticket))}
            >
              <View style={[styles.actionIcon, styles.actionIconDelete]}>
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionTitle, styles.actionTitleDestructive]}>Delete</Text>
                <Text style={styles.actionSubtitle}>Remove this pass</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </Pressable>
          </View>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelButtonPressed,
            ]}
            onPress={handleBackdropPress}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropPressable: {
    flex: 1,
  },
  blurView: {
    flex: 1,
  },

  // Menu Container
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Menu Card
  menuCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },

  // Header
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Dividers
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
  },
  dividerThin: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginVertical: 4,
  },

  // Actions Container
  actionsContainer: {
    paddingVertical: 8,
  },

  // Action Button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionButtonPressed: {
    backgroundColor: '#F5F5F5',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },

  // Action Icon
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionIconScan: {
    backgroundColor: `${colors.accent.primary}15`,
  },
  actionIconFavorite: {
    backgroundColor: '#FFF8E1',
  },
  actionIconEdit: {
    backgroundColor: '#E3F2FD',
  },
  actionIconDelete: {
    backgroundColor: '#FFEBEE',
  },

  // Action Text
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  actionTitleDisabled: {
    color: '#999999',
  },
  actionTitleDestructive: {
    color: '#FF3B30',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#999999',
  },

  // Cancel Button
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
  },
  cancelButtonPressed: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
});

export default QuickActionsMenu;
