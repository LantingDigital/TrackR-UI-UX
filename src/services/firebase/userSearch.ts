/**
 * User Search — Firestore Queries
 *
 * Search for users by username or displayName.
 * Used by the community friends tab to find and add friends.
 *
 * Firestore doesn't support full-text search natively, so we use
 * prefix-based queries (startAt/endAt) for substring matching.
 * For production, consider Algolia or Typesense for richer search.
 */

import firestore from '@react-native-firebase/firestore';
import { UserDoc } from '../../types/firestore';
import type { DiscoverableUser, FriendshipStatus } from '../../features/community/types/community';
import { _friendsStoreInternal } from '../../features/community/stores/friendsStore';

// ============================================
// Collection Ref
// ============================================

const usersRef = () => firestore().collection('users');

// ============================================
// Helpers
// ============================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

function getFriendshipStatus(userId: string): FriendshipStatus {
  const state = _friendsStoreInternal.getState();
  if (state.friends.some((f) => f.id === userId)) return 'friends';
  if (state.sentRequestIds.includes(userId)) return 'request_sent';
  if (state.friendRequests.some((r) => r.fromUserId === userId && r.status === 'pending')) {
    return 'request_received';
  }
  return 'none';
}

function userDocToDiscoverable(doc: UserDoc): DiscoverableUser {
  return {
    id: doc.uid,
    name: doc.displayName || 'Unknown',
    initials: getInitials(doc.displayName || 'U'),
    avatarUrl: doc.profileImageUrl ?? undefined,
    creditCount: doc.totalCredits,
    topCoaster: '', // Would need a separate query to get top-rated coaster
    mutualFriends: 0, // Would need intersection query — expensive, skip for v1
    friendshipStatus: getFriendshipStatus(doc.uid),
  };
}

// ============================================
// Search Operations
// ============================================

/**
 * Search users by username prefix.
 * Uses Firestore's startAt/endAt for prefix matching.
 */
async function searchByUsername(
  query: string,
  currentUid: string,
  limit: number = 20,
): Promise<DiscoverableUser[]> {
  const normalized = query.toLowerCase().trim();
  if (normalized.length < 2) return [];

  // Prefix range query: username >= query && username < query + high unicode char
  const snap = await usersRef()
    .where('username', '>=', normalized)
    .where('username', '<=', normalized + '\uf8ff')
    .limit(limit)
    .get();

  const results: DiscoverableUser[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as UserDoc;
    if (data.uid === currentUid) return; // Exclude self
    if (data.accountVisibility === 'private') return; // Respect privacy
    results.push(userDocToDiscoverable(data));
  });

  return results;
}

/**
 * Search users by display name prefix.
 */
async function searchByDisplayName(
  query: string,
  currentUid: string,
  limit: number = 20,
): Promise<DiscoverableUser[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const snap = await usersRef()
    .where('displayName', '>=', trimmed)
    .where('displayName', '<=', trimmed + '\uf8ff')
    .limit(limit)
    .get();

  const results: DiscoverableUser[] = [];
  snap.forEach((doc) => {
    const data = doc.data() as UserDoc;
    if (data.uid === currentUid) return;
    if (data.accountVisibility === 'private') return;
    results.push(userDocToDiscoverable(data));
  });

  return results;
}

/**
 * Combined search: tries username first, then display name.
 * Deduplicates results by user ID.
 */
async function searchUsers(
  query: string,
  currentUid: string,
  limit: number = 20,
): Promise<DiscoverableUser[]> {
  const [usernameResults, nameResults] = await Promise.all([
    searchByUsername(query, currentUid, limit),
    searchByDisplayName(query, currentUid, limit),
  ]);

  // Deduplicate
  const seen = new Set<string>();
  const merged: DiscoverableUser[] = [];

  for (const user of [...usernameResults, ...nameResults]) {
    if (!seen.has(user.id)) {
      seen.add(user.id);
      merged.push(user);
    }
  }

  return merged.slice(0, limit);
}

// ============================================
// Exports
// ============================================

export { searchUsers, searchByUsername, searchByDisplayName };
