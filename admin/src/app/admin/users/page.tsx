'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  where,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase';

interface UserRecord {
  id: string;
  displayName: string;
  email: string;
  username: string;
  proStatus: { active: boolean; tier: string | null; expiresAt: Date | null } | null;
  createdAt: Date | null;
  rideCount: number;
  friendCount: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const PAGE_SIZE = 25;

  useEffect(() => {
    loadUsers();
  }, []);

  function parseUser(d: QueryDocumentSnapshot): UserRecord {
    const data = d.data();
    const pro = data.proStatus as { active?: boolean; tier?: string; expiresAt?: Timestamp } | undefined;
    return {
      id: d.id,
      displayName: data.displayName ?? '',
      email: data.email ?? '',
      username: data.username ?? '',
      proStatus: pro
        ? {
            active: pro.active ?? false,
            tier: pro.tier ?? null,
            expiresAt: pro.expiresAt instanceof Timestamp ? pro.expiresAt.toDate() : null,
          }
        : null,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
      rideCount: data.rideCount ?? 0,
      friendCount: data.friendCount ?? 0,
    };
  }

  async function loadUsers(after?: QueryDocumentSnapshot) {
    setLoading(true);
    try {
      let q;
      if (after) {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          startAfter(after),
          limit(PAGE_SIZE),
        );
      } else {
        q = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE),
        );
      }
      const snap = await getDocs(q);
      const newUsers = snap.docs.map(parseUser);

      if (after) {
        setUsers((prev) => [...prev, ...newUsers]);
      } else {
        setUsers(newUsers);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadUsers();
      return;
    }
    setLoading(true);
    try {
      // Search by username (exact match since Firestore doesn't support full-text)
      const q = query(
        collection(db, 'users'),
        where('username', '==', searchQuery.trim().toLowerCase()),
        limit(10),
      );
      const snap = await getDocs(q);
      setUsers(snap.docs.map(parseUser));
      setHasMore(false);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBlockUser(userId: string) {
    if (!confirm('Block this user? This will remove them from all friendships.')) return;
    setActionLoading(userId);
    try {
      const blockUser = httpsCallable(functions, 'blockUser');
      await blockUser({ blockedUserId: userId });
    } catch (err) {
      console.error('Failed to block user:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSetAdmin(userId: string) {
    if (!confirm('Grant admin privileges to this user?')) return;
    setActionLoading(userId);
    try {
      const setAdminClaim = httpsCallable(functions, 'setAdminClaim');
      await setAdminClaim({ uid: userId });
    } catch (err) {
      console.error('Failed to set admin:', err);
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(date: Date | null) {
    if (!date) return '--';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Users</h2>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by username..."
          className="flex-1 max-w-sm px-4 py-2 bg-card border border-gray-200 rounded-lg text-sm
            text-text-primary shadow-card
            focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
            transition-all duration-150"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg
            hover:bg-accent-hover transition-all duration-150"
        >
          Search
        </button>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              loadUsers();
            }}
            className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-gray-200
              rounded-lg hover:bg-page transition-all duration-150"
          >
            Clear
          </button>
        )}
      </div>

      {/* Users table */}
      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-medium text-text-meta uppercase tracking-wider">
                User
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-meta uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-meta uppercase tracking-wider">
                Rides
              </th>
              <th className="text-left px-5 py-3 text-xs font-medium text-text-meta uppercase tracking-wider">
                Joined
              </th>
              <th className="text-right px-5 py-3 text-xs font-medium text-text-meta uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-3">
                      <div className="h-4 w-32 bg-page rounded animate-pulse" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-4 w-16 bg-page rounded animate-pulse" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-4 w-12 bg-page rounded animate-pulse" />
                    </td>
                    <td className="px-5 py-3">
                      <div className="h-4 w-20 bg-page rounded animate-pulse" />
                    </td>
                    <td className="px-5 py-3" />
                  </tr>
                ))}
              </>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-text-meta">
                  {searchQuery ? 'No users found.' : 'No users yet.'}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-page/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-text-primary">
                      {u.displayName || u.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-text-meta">
                      @{u.username || '--'}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    {u.proStatus?.active ? (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent">
                        Pro ({u.proStatus.tier})
                      </span>
                    ) : (
                      <span className="text-xs text-text-meta">Free</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-text-primary">{u.rideCount}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-text-meta">{formatDate(u.createdAt)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleSetAdmin(u.id)}
                        disabled={actionLoading === u.id}
                        className="px-2 py-1 text-xs font-medium text-text-secondary
                          hover:text-text-primary transition-colors
                          disabled:opacity-50"
                        title="Grant admin"
                      >
                        Make Admin
                      </button>
                      <button
                        onClick={() => handleBlockUser(u.id)}
                        disabled={actionLoading === u.id}
                        className="px-2 py-1 text-xs font-medium text-red-500
                          hover:text-red-600 transition-colors
                          disabled:opacity-50"
                        title="Block user"
                      >
                        Block
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {hasMore && (
          <div className="px-5 py-3 border-t border-gray-100">
            <button
              onClick={() => lastDoc && loadUsers(lastDoc)}
              disabled={loading}
              className="text-sm font-medium text-accent hover:text-accent-hover
                disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
