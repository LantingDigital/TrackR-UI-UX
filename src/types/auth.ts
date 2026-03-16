/**
 * Auth Types — Firebase Authentication
 *
 * Lightweight interface wrapping the Firebase User fields we actually use.
 * Keeps the rest of the app decoupled from the Firebase SDK types.
 */

/**
 * App-level representation of an authenticated user.
 * Maps 1:1 to the Firebase User fields we care about.
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  /** Which sign-in provider was used (for Firestore user doc) */
  authProvider: 'email' | 'google' | 'apple';
}

/**
 * Consistent error shape returned by all auth service functions.
 */
export interface AuthError {
  code: string;
  message: string;
}

/**
 * Result wrapper for auth operations.
 * All auth service functions return this shape.
 */
export type AuthResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: AuthError };
