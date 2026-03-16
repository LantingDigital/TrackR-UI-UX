# Notifications -- v1 Backend Audit (Cross-Cutting)

## Current State

- settingsStore has a `notificationsEnabled` toggle (AsyncStorage, defaults to true)
- SettingsScreen has a notifications toggle UI
- No push notification infrastructure exists (no FCM, no token registration, no Cloud Functions)
- No in-app notification center or badge system

## Push Notification Requirements (M2+)

### Infrastructure

| Component | Service | Notes |
|-----------|---------|-------|
| Token registration | Firebase Cloud Messaging (FCM) | `expo-notifications` + FCM |
| Token storage | `users/{userId}.fcmTokens: string[]` | Support multiple devices |
| Send notifications | Cloud Functions → FCM Admin SDK | Server-side sends only |
| Permission prompt | `expo-notifications` requestPermissionsAsync | iOS requires explicit opt-in |
| APN certificate | Apple Developer portal → Firebase | Required for iOS push |

### Notification Types

| Type | Trigger | Content | Priority | Milestone |
|------|---------|---------|----------|-----------|
| Friend request | `sendFriendRequest` CF | "[Name] wants to be your friend" | High | M2 |
| Friend request accepted | `acceptFriendRequest` CF | "[Name] accepted your request" | Medium | M2 |
| Post comment | `addComment` CF | "[Name] commented on your post" | Medium | M2 |
| Post like | `toggleLike` CF (threshold) | "[Name] and N others liked your post" | Low | M2 |
| Comment reply | `addComment` CF (reply) | "[Name] replied to your comment" | Medium | M2 |
| Ride milestone | `onRideLogCreate` CF | "You hit 100 credits!" | High | M2 |
| Badge earned | `awardBadges` CF | "You earned the Century Rider badge!" | Medium | M2 |
| Weekly challenge | Scheduled CF (Monday) | "New weekly challenge: [title]" | Medium | M3 |
| Daily Coastle | Scheduled CF (daily) | "Today's Coastle is ready!" | Low | M3 |
| Pro welcome | `verifyPurchase` CF | "Welcome to TrackR Pro!" | High | M3 |

### Notification Preferences

SettingsScreen already has a master toggle. For v1, this is sufficient — one toggle controls all push notifications.

Post-v1 enhancement: per-category toggles (social, milestones, games, marketing).

### Firestore Collections

| Collection | Doc Structure |
|------------|--------------|
| `users/{userId}` (token field) | `{ fcmTokens: string[], notificationsEnabled: boolean }` |
| `notifications/{userId}/items/{notifId}` (optional) | `{ type, title, body, data, read, createdAt }` |

The `notifications` subcollection is optional for v1 — only needed if building an in-app notification center. For v1, push-only (no in-app inbox) is sufficient.

### Cloud Functions

| Function | Purpose |
|----------|---------|
| `registerFCMToken` | Callable: store device token on login/app launch |
| `unregisterFCMToken` | Callable: remove token on sign out |
| `sendNotification` (internal helper) | Sends FCM message to user's registered tokens |
| `cleanupStaleTokens` | Scheduled: remove tokens that fail delivery |

### Implementation Steps (M2)

1. Install `expo-notifications`
2. Configure FCM in Firebase project + APN certificate
3. Request notification permission on first app launch (after onboarding)
4. Register FCM token and store in user doc
5. Add `sendNotification` helper to Cloud Functions
6. Wire triggers: friend request, comment, like, milestone

### In-App Notification Center (Post-v1)

Not in v1 scope, but worth noting the design direction:
- Bell icon on Home screen or top bar
- Badge count for unread notifications
- Tappable rows that deep-link to relevant screen (post, profile, logbook)
- Mark-as-read on tap
- "Mark all as read" action

## Open Questions

1. Should notifications be v1 scope or deferred to v1.1? They're listed as M2, but if time is tight, push-only notifications could be cut.
2. Notification grouping: should multiple likes be batched ("5 people liked your post") or sent individually?
3. Should the app request notification permission during onboarding or defer to first trigger?
4. Quiet hours: should the app respect system Do Not Disturb, or implement its own quiet hours setting?
5. Rich notifications: should milestone notifications include the NanoBanana card art as an image attachment?
