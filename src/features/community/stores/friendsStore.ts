/**
 * Friends Store — Zustand
 *
 * Manages friends list, activity feed, friend requests, and user search.
 * Firestore sync layer pushes data via _set* internal actions.
 * UI actions call Firestore write functions which do optimistic updates.
 */

import { create } from 'zustand';
import type { Friend, FriendActivity, FriendRequest, DiscoverableUser, FriendshipStatus } from '../types/community';

// ============================================
// Store Interface
// ============================================

interface FriendsState {
  friends: Friend[];
  activity: FriendActivity[];
  friendRequests: FriendRequest[];
  discoverableUsers: DiscoverableUser[];
  sentRequestIds: string[]; // user IDs we've sent requests to

  // UI Actions (these are called by components)
  sendRequest: (userId: string) => void;
  acceptRequest: (requestId: string) => void;
  declineRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
  searchUsers: (query: string) => DiscoverableUser[];
  getFriendshipStatus: (userId: string) => FriendshipStatus;
  loadMoreActivity: () => void;

  // Firestore sync actions (called by sync layer, not UI)
  _setFriends: (friends: Friend[]) => void;
  _setFriendRequests: (requests: FriendRequest[]) => void;
  _setActivity: (activity: FriendActivity[]) => void;
  _setDiscoverableUsers: (users: DiscoverableUser[]) => void;
  _setSentRequestIds: (ids: string[]) => void;
  _addSentRequestId: (id: string) => void;
  _removeFriend: (friendId: string) => void;
  _resetStore: () => void;
}

// ============================================
// Store
// ============================================

const useStore = create<FriendsState>((set, get) => ({
  friends: [],
  activity: [],
  friendRequests: [],
  discoverableUsers: [],
  sentRequestIds: [],

  sendRequest: (userId: string) => {
    set((state) => ({
      sentRequestIds: [...state.sentRequestIds, userId],
      discoverableUsers: state.discoverableUsers.map((u) =>
        u.id === userId ? { ...u, friendshipStatus: 'request_sent' as const } : u
      ),
    }));
  },

  acceptRequest: (requestId: string) => {
    const state = get();
    const request = state.friendRequests.find((r) => r.id === requestId);
    if (!request) return;

    const discUser = state.discoverableUsers.find((u) => u.id === request.fromUserId);

    const newFriend: Friend = {
      id: request.fromUserId,
      name: request.fromUserName,
      initials: request.fromUserInitials,
      creditCount: request.fromUserCreditCount,
      topCoaster: discUser?.topCoaster ?? 'Unknown',
      mutualFriends: discUser?.mutualFriends ?? 0,
    };

    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
      friends: [...state.friends, newFriend],
      discoverableUsers: state.discoverableUsers.map((u) =>
        u.id === request.fromUserId ? { ...u, friendshipStatus: 'friends' as const } : u
      ),
    }));
  },

  declineRequest: (requestId: string) => {
    const state = get();
    const request = state.friendRequests.find((r) => r.id === requestId);

    set((state) => ({
      friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
      discoverableUsers: request
        ? state.discoverableUsers.map((u) =>
            u.id === request.fromUserId ? { ...u, friendshipStatus: 'none' as const } : u
          )
        : state.discoverableUsers,
    }));
  },

  removeFriend: (friendId: string) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
      activity: state.activity.filter((a) => a.friendId !== friendId),
      discoverableUsers: state.discoverableUsers.map((u) =>
        u.id === friendId ? { ...u, friendshipStatus: 'none' as const } : u
      ),
    }));
  },

  searchUsers: (query: string): DiscoverableUser[] => {
    const state = get();
    if (!query.trim()) return [];
    const lowerQ = query.toLowerCase();

    const friendResults: DiscoverableUser[] = state.friends
      .filter((f) => f.name.toLowerCase().includes(lowerQ))
      .map((f) => ({
        id: f.id,
        name: f.name,
        initials: f.initials,
        avatarUrl: f.avatarUrl,
        creditCount: f.creditCount,
        topCoaster: f.topCoaster,
        mutualFriends: f.mutualFriends,
        friendshipStatus: 'friends' as const,
      }));

    const discoverResults = state.discoverableUsers
      .filter((u) => u.name.toLowerCase().includes(lowerQ));

    const seen = new Set<string>();
    const merged: DiscoverableUser[] = [];
    for (const u of [...friendResults, ...discoverResults]) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        merged.push(u);
      }
    }
    return merged;
  },

  getFriendshipStatus: (userId: string): FriendshipStatus => {
    const state = get();
    if (state.friends.some((f) => f.id === userId)) return 'friends';
    if (state.sentRequestIds.includes(userId)) return 'request_sent';
    if (state.friendRequests.some((r) => r.fromUserId === userId && r.status === 'pending')) {
      return 'request_received';
    }
    return 'none';
  },

  loadMoreActivity: () => {
    set((state) => {
      const nextBatch = state.activity.slice(0, 5).map((item, i) => ({
        ...item,
        id: `${item.id}-page-${Date.now()}-${i}`,
        daysAgo: item.daysAgo + 14,
        timestamp: item.timestamp - 14 * 86400000,
      }));
      return { activity: [...state.activity, ...nextBatch] };
    });
  },

  // ── Firestore sync actions ──────────────────

  _setFriends: (friends) => set({ friends }),
  _setFriendRequests: (requests) => set({ friendRequests: requests }),
  _setActivity: (activity) => set({ activity }),
  _setDiscoverableUsers: (users) => set({ discoverableUsers: users }),
  _setSentRequestIds: (ids) => set({ sentRequestIds: ids }),
  _addSentRequestId: (id) =>
    set((state) => ({
      sentRequestIds: state.sentRequestIds.includes(id)
        ? state.sentRequestIds
        : [...state.sentRequestIds, id],
    })),
  _removeFriend: (friendId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
      activity: state.activity.filter((a) => a.friendId !== friendId),
    })),
  _resetStore: () =>
    set({
      friends: [],
      activity: [],
      friendRequests: [],
      discoverableUsers: [],
      sentRequestIds: [],
    }),
}));

// ============================================
// Internal Access (for sync layer)
// ============================================

export const _friendsStoreInternal = useStore;

// ============================================
// Standalone Getters (non-reactive)
// ============================================

export function getFriends(): Friend[] {
  return useStore.getState().friends;
}

export function getFriend(friendId: string): Friend | undefined {
  return useStore.getState().friends.find((f) => f.id === friendId);
}

export function getActivity(): FriendActivity[] {
  return useStore.getState().activity;
}

export function getFriendshipStatus(userId: string): FriendshipStatus {
  return useStore.getState().getFriendshipStatus(userId);
}

// ============================================
// React Hook
// ============================================

export function useFriendsStore() {
  return useStore();
}
