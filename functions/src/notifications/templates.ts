/**
 * Notification Templates — Centralized notification content
 *
 * All push notification titles, bodies, and deep link data live here.
 * Cloud Functions call getNotificationTemplate() to get consistent messaging.
 *
 * Adding a new notification type:
 * 1. Add the type to NotificationType union
 * 2. Add the template to TEMPLATES
 * 3. Call sendNotificationFromTemplate() from the relevant CF
 */

import { sendNotificationToUser } from './sendNotification';

// ============================================
// Types
// ============================================

export type NotificationType =
  | 'friend-request-received'
  | 'friend-request-accepted'
  | 'badge-earned'
  | 'weekly-challenge-complete'
  | 'new-article-published'
  | 'pro-welcome'
  | 'pro-expired'
  | 'pro-renewed'
  | 'report-received'    // admin-only
  | 'post-liked'
  | 'post-commented';

interface NotificationTemplate {
  title: string | ((vars: Record<string, string>) => string);
  body: string | ((vars: Record<string, string>) => string);
  data: (vars: Record<string, string>) => Record<string, string>;
}

// ============================================
// Templates
// ============================================

const TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  'friend-request-received': {
    title: 'New Friend Request',
    body: (v) => `${v.senderName} wants to be your friend!`,
    data: (v) => ({ screen: 'friends', requestId: v.requestId }),
  },

  'friend-request-accepted': {
    title: 'Friend Request Accepted',
    body: (v) => `${v.accepterName} accepted your friend request!`,
    data: () => ({ screen: 'friends' }),
  },

  'badge-earned': {
    title: 'Badge Earned!',
    body: (v) => `You earned the "${v.badgeName}" badge!`,
    data: (v) => ({ screen: 'profile', badgeId: v.badgeId }),
  },

  'weekly-challenge-complete': {
    title: 'Challenge Complete!',
    body: (v) => `You completed the "${v.challengeTitle}" challenge!`,
    data: (v) => ({ screen: 'games', challengeId: v.challengeId }),
  },

  'new-article-published': {
    title: (v) => v.category === 'news-digest' ? 'News Digest' : 'New on TrackR',
    body: (v) => v.title,
    data: (v) => ({ screen: 'article', articleId: v.articleId }),
  },

  'pro-welcome': {
    title: 'Welcome to TrackR Pro!',
    body: 'Thanks for supporting TrackR. Your Pro features are now active.',
    data: () => ({ screen: 'profile' }),
  },

  'pro-expired': {
    title: 'Pro Subscription Expired',
    body: 'Your TrackR Pro subscription has ended. Renew anytime to get your features back.',
    data: () => ({ screen: 'settings' }),
  },

  'pro-renewed': {
    title: 'Pro Renewed!',
    body: 'Your TrackR Pro subscription has been renewed. Thanks for the continued support!',
    data: () => ({ screen: 'profile' }),
  },

  'report-received': {
    title: 'New User Report',
    body: (v) => `Report on ${v.reportedName}: ${v.reason}`,
    data: (v) => ({ screen: 'admin', reportId: v.reportId }),
  },

  'post-liked': {
    title: (v) => `${v.likerName} liked your post`,
    body: (v) => v.postPreview || 'Check it out!',
    data: (v) => ({ screen: 'post', postId: v.postId }),
  },

  'post-commented': {
    title: (v) => `${v.commenterName} commented on your post`,
    body: (v) => v.commentPreview || 'Check it out!',
    data: (v) => ({ screen: 'post', postId: v.postId }),
  },
};

// ============================================
// Public API
// ============================================

/**
 * Resolve a notification template to title + body + data.
 */
export function getNotificationContent(
  type: NotificationType,
  vars: Record<string, string> = {},
): { title: string; body: string; data: Record<string, string> } {
  const template = TEMPLATES[type];

  const title =
    typeof template.title === 'function' ? template.title(vars) : template.title;
  const body =
    typeof template.body === 'function' ? template.body(vars) : template.body;
  const data = template.data(vars);

  return { title, body, data };
}

/**
 * Send a templated notification to a user.
 * Convenience wrapper that resolves the template and calls sendNotificationToUser.
 */
export async function sendNotificationFromTemplate(
  userId: string,
  type: NotificationType,
  vars: Record<string, string> = {},
): Promise<void> {
  const { title, body, data } = getNotificationContent(type, vars);
  await sendNotificationToUser(userId, title, body, data);
}
