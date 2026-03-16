/**
 * Firestore User Service
 *
 * Handles user document CRUD operations. The user doc is created on first auth
 * and updated during onboarding and profile edits.
 *
 * Cloud-Function-only fields (totalCredits, totalRides, proStatus) are NEVER
 * written by this service — they're managed by server-side triggers.
 */

import firestore from '@react-native-firebase/firestore';
import { UserDoc, UserDocClientWritable, UsernameDoc } from '../../types/firestore';
import { AuthUser } from '../../types/auth';

// ============================================
// Collections
// ============================================

const usersRef = () => firestore().collection('users');
const usernamesRef = () => firestore().collection('usernames');

// ============================================
// User Document Operations
// ============================================

/**
 * Get a user document by UID.
 * Returns null if the document doesn't exist.
 */
async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await usersRef().doc(uid).get();
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}

/**
 * Create the initial user document after first authentication.
 * Called once per user, right after their first sign-in/sign-up.
 *
 * Sets safe defaults for all fields. Onboarding will fill in
 * homeParkName, riderType, username, etc. later.
 */
async function createUserDoc(authUser: AuthUser): Promise<UserDoc> {
  const now = firestore.Timestamp.now();

  const userDoc: UserDoc = {
    uid: authUser.uid,
    displayName: authUser.displayName ?? '',
    username: '', // Set during onboarding via validateUsername CF
    profileImageUrl: authUser.photoURL,
    authProvider: authUser.authProvider,

    // Filled during onboarding
    homeParkName: '',
    riderType: 'well-rounded',

    // Cloud Functions maintain these
    totalCredits: 0,
    totalRides: 0,

    // Defaults
    accountVisibility: 'public',
    fcmTokens: [],
    notificationsEnabled: true,

    proStatus: {
      active: false,
      tier: null,
      expiresAt: null,
      platform: null,
    },

    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
  };

  await usersRef().doc(authUser.uid).set(userDoc);
  return userDoc;
}

/**
 * Get or create a user document. Used in the auth flow to ensure
 * a Firestore doc always exists for the authenticated user.
 *
 * - First sign-in: creates the doc with defaults
 * - Subsequent sign-ins: returns the existing doc
 */
async function getOrCreateUserDoc(authUser: AuthUser): Promise<UserDoc> {
  const existing = await getUserDoc(authUser.uid);
  if (existing) {
    // Update lastActiveAt on every sign-in
    await usersRef().doc(authUser.uid).update({
      lastActiveAt: firestore.Timestamp.now(),
    });
    return { ...existing, lastActiveAt: firestore.Timestamp.now() };
  }
  return createUserDoc(authUser);
}

/**
 * Update writable fields on the user document.
 * Only allows fields the client is permitted to write.
 */
async function updateUserDoc(
  uid: string,
  updates: Partial<UserDocClientWritable>,
): Promise<void> {
  await usersRef()
    .doc(uid)
    .update({
      ...updates,
      updatedAt: firestore.Timestamp.now(),
    });
}

// ============================================
// Username Operations (client-side checks)
// ============================================

/**
 * Check if a username is available (client-side read).
 * For the actual claim (atomic reserve), use the validateUsername Cloud Function.
 */
async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = username.toLowerCase().trim();
  if (!isValidUsernameFormat(normalized)) return false;

  const snap = await usernamesRef().doc(normalized).get();
  return !snap.exists();
}

/**
 * Validate username format locally before hitting Firestore.
 * Rules: 3-20 chars, alphanumeric + underscores only, no leading/trailing underscores.
 */
function isValidUsernameFormat(username: string): boolean {
  if (username.length < 3 || username.length > 20) return false;
  if (!/^[a-z0-9_]+$/.test(username)) return false;
  if (username.startsWith('_') || username.endsWith('_')) return false;
  return true;
}

/**
 * Reserved words that cannot be used as usernames.
 */
const RESERVED_USERNAMES = new Set([
  'admin',
  'trackr',
  'support',
  'help',
  'official',
  'moderator',
  'mod',
  'system',
  'staff',
  'team',
  'null',
  'undefined',
  'anonymous',
  'deleted',
]);

function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase().trim());
}

// ============================================
// Exports
// ============================================

export {
  getUserDoc,
  createUserDoc,
  getOrCreateUserDoc,
  updateUserDoc,
  isUsernameAvailable,
  isValidUsernameFormat,
  isReservedUsername,
};
