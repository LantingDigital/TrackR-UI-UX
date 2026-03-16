# Firestore Security Rules

Complete `firestore.rules` for TrackR v1. Deploy with `firebase deploy --only firestore:rules`.

## Principles

1. **Authenticated by default.** No anonymous reads/writes except public rankings and public posts.
2. **Owner writes only.** Users can only write their own data. Cloud Functions handle cross-user writes.
3. **Cloud Functions are trusted.** Admin SDK bypasses rules. These rules protect against client-side attacks.
4. **Blocked users filtered.** Security rules can't efficiently filter blocked users — handle in Cloud Functions + client-side.

---

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isProUser() {
      return isAuthenticated()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.proStatus.active == true;
    }

    // ========================================
    // M1: USERS
    // ========================================

    match /users/{userId} {
      // Anyone authenticated can read basic profile info
      // Privacy filtering (public vs private) handled in Cloud Functions
      allow read: if isAuthenticated();

      // Only the owner can update their own profile
      // Cloud Functions handle: totalCredits, totalRides, proStatus (admin SDK bypasses)
      allow update: if isOwner(userId)
        && !request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['totalCredits', 'totalRides', 'proStatus', 'createdAt']);

      // User doc creation handled by generateProfileReady Cloud Function
      allow create: if false;
      allow delete: if false; // deleteUserAccount CF handles this

      // --- Subcollections ---

      match /friends/{friendId} {
        // Can read own friends list
        allow read: if isOwner(userId);
        // Friend docs created/deleted by Cloud Functions only
        allow write: if false;
      }

      match /tickets/{ticketId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId);
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }

      match /blockedUsers/{blockedUid} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId);
        allow delete: if isOwner(userId);
      }

      match /savedArticles/{articleId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId);
        allow delete: if isOwner(userId);
      }

      match /feedPreferences/{docId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }

      match /criteriaConfig/{docId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }

      match /gameStats/{gameId} {
        allow read: if isOwner(userId);
        allow write: if isOwner(userId);
      }

      match /challenges/{challengeId} {
        allow read: if isOwner(userId);
        // Progress updates come from Cloud Functions
        allow write: if false;
      }

      match /badges/{badgeId} {
        allow read: if isOwner(userId);
        // Badges awarded by Cloud Functions only
        allow write: if false;
      }
    }

    // ========================================
    // M1: USERNAMES
    // ========================================

    match /usernames/{username} {
      // Anyone can check if a username exists (for availability check UI)
      allow read: if isAuthenticated();
      // Created/deleted by validateUsername Cloud Function only
      allow write: if false;
    }

    // ========================================
    // M1: RIDE LOGS
    // ========================================

    match /rideLogs/{userId} {
      // Meta doc
      match /meta {
        allow read: if isOwner(userId);
        // Written by Cloud Functions only (onRideLogCreate/Delete)
        allow write: if false;
      }

      match /logs/{logId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId)
          && request.resource.data.keys().hasAll(['coasterId', 'coasterName', 'parkName', 'timestamp']);
        allow update: if isOwner(userId);
        allow delete: if isOwner(userId);
      }
    }

    // ========================================
    // M1: RATINGS
    // ========================================

    match /ratings/{userId}/{coasterId} {
      // Owner can read/write their own ratings
      allow read: if isOwner(userId);
      allow create: if isOwner(userId)
        && request.resource.data.keys().hasAll(['coasterId', 'criteriaRatings', 'weightedScore']);
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }

    // ========================================
    // M2: POSTS
    // ========================================

    match /posts/{postId} {
      // Public posts readable by anyone authenticated
      // Friends-only posts: Cloud Functions handle filtering
      allow read: if isAuthenticated();

      // Posts created via createPost Cloud Function
      // But allow direct create for simpler v1 if needed
      allow create: if isAuthenticated()
        && request.resource.data.authorId == request.auth.uid
        && request.resource.data.keys().hasAll(['type', 'content', 'visibility', 'authorId']);

      // Only author can update/delete their own post
      allow update: if isAuthenticated()
        && resource.data.authorId == request.auth.uid;
      allow delete: if isAuthenticated()
        && resource.data.authorId == request.auth.uid;

      match /comments/{commentId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated()
          && request.resource.data.authorId == request.auth.uid;
        // Comment authors can edit/delete their own
        allow update: if isAuthenticated()
          && resource.data.authorId == request.auth.uid;
        allow delete: if isAuthenticated()
          && resource.data.authorId == request.auth.uid;
      }
    }

    // ========================================
    // M2: RANKINGS
    // ========================================

    match /rankings/{docId} {
      // Public read — everyone can see rankings
      allow read: if isAuthenticated();
      // Written by computeRankings Cloud Function only
      allow write: if false;
    }

    // ========================================
    // M2: FRIEND REQUESTS
    // ========================================

    match /friendRequests/{requestId} {
      // Can read if you're the sender or recipient
      allow read: if isAuthenticated()
        && (resource.data.fromUserId == request.auth.uid
            || resource.data.toUserId == request.auth.uid);
      // Created/updated by Cloud Functions only
      allow write: if false;
    }

    // ========================================
    // M2: PARK WAIT TIMES
    // ========================================

    match /parkWaitTimes/{parkSlug} {
      // Anyone authenticated can read cached wait times
      allow read: if isAuthenticated();
      // Written by proxyWaitTimes Cloud Function only
      allow write: if false;
    }

    // ========================================
    // M3: PURCHASES
    // ========================================

    match /purchases/{purchaseId} {
      // Users can read their own purchases
      allow read: if isAuthenticated()
        && resource.data.userId == request.auth.uid;
      // Written by verifyPurchase / handleSubscriptionEvent Cloud Functions only
      allow write: if false;
    }

    // ========================================
    // M3: APPLE WALLET
    // ========================================

    match /appleWalletPasses/{serialNumber} {
      // Read by Apple Wallet web service (via Cloud Function, bypasses rules)
      // No client access needed
      allow read: if false;
      allow write: if false;
    }

    match /appleWalletRegistrations/{regId} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

---

## Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // User avatars
    match /avatars/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024 // 5MB max
        && request.resource.contentType.matches('image/.*');
    }

    // Ticket images
    match /tickets/{userId}/{ticketId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024 // 10MB max
        && request.resource.contentType.matches('image/.*');
    }

    // PKPass files (generated by Cloud Functions)
    match /passes/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Cloud Functions only
    }

    // Exported ride logs (generated by Cloud Functions)
    match /exports/{userId}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Cloud Functions only
    }
  }
}
```

---

## Notes

- **Cloud Functions bypass all rules** via Admin SDK. Rules only protect against direct client SDK access.
- **Blocked user filtering** is NOT enforced in rules (too complex for rules language). Handled in CFs + client.
- **Friends-only post visibility** is NOT enforced in rules. The `read: if isAuthenticated()` on posts is intentionally permissive — the `getFeed` CF handles filtering. Direct doc access by ID is allowed (for deep links, notifications).
- **Rate limiting** is not in Firestore rules. Use Cloud Functions with App Check for abuse prevention.
