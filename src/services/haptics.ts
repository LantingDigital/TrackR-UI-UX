import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback service.
 * Import `haptics` instead of using expo-haptics directly.
 *
 * Usage:
 *   import { haptics } from '@/services/haptics';
 *   haptics.tap();
 */
export const haptics = {
  /** Light impact — menu items, small buttons */
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Medium impact — card selection, important presses */
  select: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Heavy impact — destructive actions, confirmations */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Notification success — log complete, rating saved */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Notification error — failures */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Notification warning */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /** Selection tick — slider movement, picker change */
  tick: () => Haptics.selectionAsync(),

  /** Light impact — toggle, snap-to-grid */
  snap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};
