// ─── Friends Store ──────────────────────────────────────────
//
// Module-level store for friends list + activity feed.
// Pattern: communityStore.ts (state + listeners + notify + useReducer hook).

import { useEffect, useReducer } from 'react';
import type { Friend, FriendActivity } from '../types/community';
import { MOCK_FRIENDS, MOCK_FRIEND_ACTIVITY } from '../data/mockFriendsData';

// ============================================
// Module-Level State
// ============================================

let friends: Friend[] = [...MOCK_FRIENDS];
let activity: FriendActivity[] = [...MOCK_FRIEND_ACTIVITY];

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ============================================
// Getters
// ============================================

export function getFriends(): Friend[] {
  return friends;
}

export function getFriend(friendId: string): Friend | undefined {
  return friends.find((f) => f.id === friendId);
}

export function getActivity(): FriendActivity[] {
  return activity;
}

// ============================================
// React Hook
// ============================================

export function useFriendsStore() {
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => {
      listeners.delete(forceUpdate);
    };
  }, []);

  return {
    friends,
    activity,
  };
}
