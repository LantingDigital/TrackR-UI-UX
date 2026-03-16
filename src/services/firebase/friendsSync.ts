/**
 * Friends Sync — Firestore ↔ Zustand
 *
 * Real-time sync for friends list and friend requests.
 * - onSnapshot listeners push Firestore data → friendsStore
 * - Write operations use Firestore batched writes for atomicity
 *
 * Collections:
 * - users/{userId}/friends/{friendId} — bidirectional friend docs
 * - friendRequests/{requestId} — friend request state machine
 */

import firestore from '@react-native-firebase/firestore';
import { _friendsStoreInternal } from '../../features/community/stores/friendsStore';
import { FriendRequestDoc, FriendDocFirestore, UserDoc } from '../../types/firestore';
import type { Friend, FriendRequest, FriendActivity } from '../../features/community/types/community';

// ============================================
// Collection Refs
// ============================================

const friendsRef = (uid: string) =>
  firestore().collection('users').doc(uid).collection('friends');

const friendRequestsRef = () =>
  firestore().collection('friendRequests');

const usersRef = () => firestore().collection('users');

// ============================================
// Conversion Helpers
// ============================================

function friendDocToFriend(doc: FriendDocFirestore): Friend {
  return {
    id: doc.friendId,
    name: doc.friendName,
    initials: getInitials(doc.friendName),
    avatarUrl: doc.friendAvatarUrl ?? undefined,
    creditCount: 0, // Will be enriched by user doc lookup
    topCoaster: '',
    mutualFriends: 0,
  };
}

function requestDocToRequest(doc: FriendRequestDoc): FriendRequest {
  const createdMs = doc.createdAt?.toDate?.()?.getTime?.() ?? Date.now();
  const daysAgo = Math.floor((Date.now() - createdMs) / 86400000);

  return {
    id: doc.id,
    fromUserId: doc.fromUserId,
    fromUserName: doc.fromUserName,
    fromUserInitials: getInitials(doc.fromUserName),
    fromUserCreditCount: 0, // Denormalized at request time or enriched later
    toUserId: doc.toUserId,
    status: doc.status,
    createdAt: createdMs,
    daysAgo,
  };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

// ============================================
// Listeners
// ============================================

/**
 * Start real-time sync for friends list and incoming friend requests.
 * Returns an unsubscribe function.
 */
function startFriendsSync(uid: string): () => void {
  // Listen to friends subcollection
  const unsubFriends = friendsRef(uid).onSnapshot(
    async (snapshot) => {
      const friends: Friend[] = [];
      const friendIds: string[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as FriendDocFirestore;
        friends.push(friendDocToFriend(data));
        friendIds.push(data.friendId);
      });

      // Enrich friends with user doc data (credits, top coaster)
      const enriched = await enrichFriends(friends);
      _friendsStoreInternal.getState()._setFriends(enriched);
    },
    (error) => {
      console.error('[FriendsSync] Friends snapshot error:', error);
    },
  );

  // Listen to incoming friend requests (pending, addressed to this user)
  const unsubRequests = friendRequestsRef()
    .where('toUserId', '==', uid)
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const requests: FriendRequest[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as FriendRequestDoc;
          requests.push(requestDocToRequest({ ...data, id: doc.id }));
        });
        _friendsStoreInternal.getState()._setFriendRequests(requests);
      },
      (error) => {
        console.error('[FriendsSync] Requests snapshot error:', error);
      },
    );

  // Listen to outgoing friend requests (to track sent request IDs)
  const unsubSent = friendRequestsRef()
    .where('fromUserId', '==', uid)
    .where('status', '==', 'pending')
    .onSnapshot(
      (snapshot) => {
        const sentIds: string[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as FriendRequestDoc;
          sentIds.push(data.toUserId);
        });
        _friendsStoreInternal.getState()._setSentRequestIds(sentIds);
      },
      (error) => {
        console.error('[FriendsSync] Sent requests snapshot error:', error);
      },
    );

  return () => {
    unsubFriends();
    unsubRequests();
    unsubSent();
  };
}

/**
 * Enrich friend objects with data from their user docs.
 */
async function enrichFriends(friends: Friend[]): Promise<Friend[]> {
  if (friends.length === 0) return friends;

  // Batch fetch user docs (max 30 per in-query)
  const enriched: Friend[] = [];
  const chunks = chunkArray(friends, 10);

  for (const chunk of chunks) {
    const ids = chunk.map((f) => f.id);
    const snap = await usersRef().where('uid', 'in', ids).get();

    const userMap = new Map<string, UserDoc>();
    snap.forEach((doc) => {
      const data = doc.data() as UserDoc;
      userMap.set(data.uid, data);
    });

    for (const friend of chunk) {
      const userDoc = userMap.get(friend.id);
      enriched.push({
        ...friend,
        creditCount: userDoc?.totalCredits ?? 0,
        avatarUrl: userDoc?.profileImageUrl ?? undefined,
        name: userDoc?.displayName || friend.name,
      });
    }
  }

  return enriched;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ============================================
// Write Operations
// ============================================

/**
 * Send a friend request to another user.
 */
async function sendFriendRequest(
  uid: string,
  userName: string,
  userAvatarUrl: string | null,
  targetUserId: string,
): Promise<void> {
  // Optimistic update
  _friendsStoreInternal.getState()._addSentRequestId(targetUserId);

  const now = firestore.Timestamp.now();
  const requestDoc: Omit<FriendRequestDoc, 'id'> = {
    fromUserId: uid,
    fromUserName: userName,
    fromUserAvatarUrl: userAvatarUrl,
    toUserId: targetUserId,
    status: 'pending',
    createdAt: now,
    respondedAt: null,
  };

  await friendRequestsRef().add(requestDoc);
}

/**
 * Accept a friend request. Creates bidirectional friend docs atomically.
 */
async function acceptFriendRequest(
  uid: string,
  userName: string,
  userAvatarUrl: string | null,
  requestId: string,
): Promise<void> {
  const requestSnap = await friendRequestsRef().doc(requestId).get();
  if (!requestSnap.exists()) return;

  const requestData = requestSnap.data() as FriendRequestDoc;
  const now = firestore.Timestamp.now();
  const batch = firestore().batch();

  // Update request status
  batch.update(friendRequestsRef().doc(requestId), {
    status: 'accepted',
    respondedAt: now,
  });

  // Create bidirectional friend docs
  const myFriendDoc: FriendDocFirestore = {
    friendId: requestData.fromUserId,
    friendName: requestData.fromUserName,
    friendAvatarUrl: requestData.fromUserAvatarUrl,
    addedAt: now,
  };

  const theirFriendDoc: FriendDocFirestore = {
    friendId: uid,
    friendName: userName,
    friendAvatarUrl: userAvatarUrl,
    addedAt: now,
  };

  batch.set(
    friendsRef(uid).doc(requestData.fromUserId),
    myFriendDoc,
  );
  batch.set(
    friendsRef(requestData.fromUserId).doc(uid),
    theirFriendDoc,
  );

  await batch.commit();
}

/**
 * Decline a friend request.
 */
async function declineFriendRequest(requestId: string): Promise<void> {
  await friendRequestsRef().doc(requestId).update({
    status: 'declined',
    respondedAt: firestore.Timestamp.now(),
  });
}

/**
 * Remove a friend. Deletes bidirectional friend docs atomically.
 */
async function removeFriend(uid: string, friendId: string): Promise<void> {
  // Optimistic delete
  _friendsStoreInternal.getState()._removeFriend(friendId);

  const batch = firestore().batch();
  batch.delete(friendsRef(uid).doc(friendId));
  batch.delete(friendsRef(friendId).doc(uid));
  await batch.commit();
}

// ============================================
// Exports
// ============================================

export {
  startFriendsSync,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
};
