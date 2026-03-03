import * as Haptics from 'expo-haptics';
import { getHapticsEnabled } from '../stores/settingsStore';

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
  tap: () => { if (getHapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },

  /** Medium impact — card selection, important presses */
  select: () => { if (getHapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },

  /** Heavy impact — destructive actions, confirmations */
  heavy: () => { if (getHapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); },

  /** Notification success — log complete, rating saved */
  success: () => { if (getHapticsEnabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },

  /** Notification error — failures */
  error: () => { if (getHapticsEnabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); },

  /** Notification warning */
  warning: () => { if (getHapticsEnabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); },

  /** Selection tick — slider movement, picker change */
  tick: () => { if (getHapticsEnabled()) Haptics.selectionAsync(); },

  /** Light impact — toggle, snap-to-grid */
  snap: () => { if (getHapticsEnabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
};
