/**
 * Firebase Auth Service
 *
 * All auth operations go through here. Returns consistent AuthResult<T>
 * shapes so consumers never deal with raw Firebase errors.
 *
 * Supports: email/password, Google Sign-In, Apple Sign-In.
 */

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  appleAuth,
  AppleRequestOperation,
  AppleRequestScope,
  AppleError,
} from '@invertase/react-native-apple-authentication';
import { AuthUser, AuthError, AuthResult } from '../../types/auth';

// ============================================
// Helpers
// ============================================

/**
 * Detect which auth provider was used from Firebase User's providerData.
 */
function detectAuthProvider(
  firebaseUser: FirebaseAuthTypes.User,
): 'email' | 'google' | 'apple' {
  const providers = firebaseUser.providerData;
  if (providers.some((p) => p.providerId === 'apple.com')) return 'apple';
  if (providers.some((p) => p.providerId === 'google.com')) return 'google';
  return 'email';
}

/**
 * Extract the fields we care about from a Firebase User.
 */
function toAuthUser(firebaseUser: FirebaseAuthTypes.User): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    authProvider: detectAuthProvider(firebaseUser),
  };
}

/**
 * Normalize any caught error into our AuthError shape.
 */
function toAuthError(error: unknown): AuthError {
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'message' in error
  ) {
    const firebaseError = error as { code: string; message: string };
    return {
      code: firebaseError.code,
      message: getReadableMessage(firebaseError.code, firebaseError.message),
    };
  }
  return {
    code: 'auth/unknown',
    message: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Map Firebase error codes to human-readable messages.
 */
function getReadableMessage(code: string, fallback: string): string {
  const messages: Record<string, string> = {
    'auth/invalid-email': 'That email address is invalid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-login-credentials': 'Invalid email or password.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/requires-recent-login':
      'This action requires a recent login. Please sign in again.',
    'auth/account-exists-with-different-credential':
      'An account already exists with a different sign-in method.',
  };
  return messages[code] ?? fallback;
}

// ============================================
// Google Sign-In Configuration
// ============================================

/**
 * Configure Google Sign-In once on module load.
 *
 * iosClientId: auto-read from GoogleService-Info.plist (no need to set here).
 * webClientId: REQUIRED to get an idToken for Firebase Auth credential.
 *   Find at: Firebase Console > Auth > Sign-in method > Google > Web client ID
 *   (or GCP Console > Credentials > "Web client (auto created by Google Service)")
 *
 * TODO: Caleb — enable Google Sign-In in Firebase Console if not already done,
 * then paste the web client ID here. It will look like:
 * 416798662915-XXXXXXXX.apps.googleusercontent.com (same project number, different hash)
 */
const GOOGLE_WEB_CLIENT_ID =
  '416798662915-eli7jkfng016hsm2a303ahrntum498du.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

// ============================================
// Auth Functions
// ============================================

/**
 * Sign in with email and password.
 */
async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult<AuthUser>> {
  try {
    const credential = await auth().signInWithEmailAndPassword(email, password);
    return { success: true, data: toAuthUser(credential.user) };
  } catch (error) {
    return { success: false, error: toAuthError(error) };
  }
}

/**
 * Create a new account with email and password.
 * Also signs the user in automatically.
 */
async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult<AuthUser>> {
  try {
    const credential = await auth().createUserWithEmailAndPassword(
      email,
      password,
    );
    return { success: true, data: toAuthUser(credential.user) };
  } catch (error) {
    return { success: false, error: toAuthError(error) };
  }
}

/**
 * Sign in with Google. Opens the native Google Sign-In sheet,
 * then exchanges the Google credential for a Firebase credential.
 */
async function signInWithGoogle(): Promise<AuthResult<AuthUser>> {
  try {
    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') {
      return {
        success: false,
        error: {
          code: 'auth/google-cancelled',
          message: 'Google sign-in was cancelled.',
        },
      };
    }

    const { idToken } = response.data;

    if (!idToken) {
      return {
        success: false,
        error: {
          code: 'auth/google-no-token',
          message:
            'Failed to get Google ID token. Check webClientId configuration.',
        },
      };
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential =
      await auth().signInWithCredential(googleCredential);

    return { success: true, data: toAuthUser(userCredential.user) };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: {
            code: 'auth/google-in-progress',
            message: 'A sign-in operation is already in progress.',
          },
        };
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: {
            code: 'auth/play-services-unavailable',
            message: 'Google Play Services is not available.',
          },
        };
      }
    }
    return { success: false, error: toAuthError(error) };
  }
}

/**
 * Sign in with Apple. Opens the native Apple Sign-In sheet,
 * then exchanges the Apple credential for a Firebase credential.
 *
 * NOTE: Requires "Sign in with Apple" capability enabled in Xcode/Apple Developer portal.
 * The nonce is auto-generated by the library and passed to Firebase for verification.
 */
async function signInWithApple(): Promise<AuthResult<AuthUser>> {
  try {
    if (!appleAuth.isSupported) {
      return {
        success: false,
        error: {
          code: 'auth/apple-not-supported',
          message: 'Apple Sign-In is not supported on this device.',
        },
      };
    }

    const appleResponse = await appleAuth.performRequest({
      requestedOperation: AppleRequestOperation.LOGIN,
      requestedScopes: [AppleRequestScope.EMAIL, AppleRequestScope.FULL_NAME],
    });

    if (!appleResponse.identityToken) {
      return {
        success: false,
        error: {
          code: 'auth/apple-no-token',
          message: 'Failed to get Apple identity token.',
        },
      };
    }

    // The nonce is auto-generated by the library (SHA256 hashed before sending to Apple).
    // We pass the raw nonce to Firebase so it can verify the identity token.
    const appleCredential = auth.AppleAuthProvider.credential(
      appleResponse.identityToken,
      appleResponse.nonce,
    );

    const userCredential =
      await auth().signInWithCredential(appleCredential);

    // Apple only provides name on FIRST sign-in. If we got it, update the Firebase profile.
    if (appleResponse.fullName) {
      const { givenName, familyName } = appleResponse.fullName;
      if (givenName || familyName) {
        const displayName = [givenName, familyName]
          .filter(Boolean)
          .join(' ');
        if (displayName && !userCredential.user.displayName) {
          await userCredential.user.updateProfile({ displayName });
        }
      }
    }

    return { success: true, data: toAuthUser(userCredential.user) };
  } catch (error) {
    // Handle user cancellation
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === AppleError.CANCELED
    ) {
      return {
        success: false,
        error: {
          code: 'auth/apple-cancelled',
          message: 'Apple sign-in was cancelled.',
        },
      };
    }
    return { success: false, error: toAuthError(error) };
  }
}

/**
 * Sign out the current user.
 */
async function signOut(): Promise<AuthResult> {
  try {
    await auth().signOut();
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toAuthError(error) };
  }
}

/**
 * Send a password reset email.
 */
async function resetPassword(email: string): Promise<AuthResult> {
  try {
    await auth().sendPasswordResetEmail(email);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toAuthError(error) };
  }
}

/**
 * Delete the currently signed-in user's account.
 * Requires a recent sign-in (Firebase security requirement).
 */
async function deleteAccount(): Promise<AuthResult> {
  try {
    const user = auth().currentUser;
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/no-current-user', message: 'No user is signed in.' },
      };
    }
    await user.delete();
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toAuthError(error) };
  }
}

/**
 * Send a verification email to the currently signed-in user.
 */
async function sendEmailVerification(): Promise<AuthResult> {
  try {
    const user = auth().currentUser;
    if (!user) {
      return {
        success: false,
        error: { code: 'auth/no-current-user', message: 'No user is signed in.' },
      };
    }
    await user.sendEmailVerification();
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toAuthError(error) };
  }
}

/**
 * Reload the current Firebase user to get fresh state (e.g. emailVerified).
 * Returns the refreshed AuthUser or null.
 */
async function reloadCurrentUser(): Promise<AuthUser | null> {
  const user = auth().currentUser;
  if (!user) return null;
  await user.reload();
  // Re-fetch after reload to get updated fields
  const refreshed = auth().currentUser;
  return refreshed ? toAuthUser(refreshed) : null;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
function onAuthStateChanged(
  callback: (user: AuthUser | null) => void,
): () => void {
  return auth().onAuthStateChanged((firebaseUser) => {
    callback(firebaseUser ? toAuthUser(firebaseUser) : null);
  });
}

/**
 * Get the current user synchronously (snapshot, not a listener).
 * Returns null if no user is signed in.
 */
function getCurrentUser(): AuthUser | null {
  const firebaseUser = auth().currentUser;
  return firebaseUser ? toAuthUser(firebaseUser) : null;
}

// ============================================
// Named Exports
// ============================================

export {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithApple,
  signOut,
  resetPassword,
  deleteAccount,
  sendEmailVerification,
  reloadCurrentUser,
  onAuthStateChanged,
  getCurrentUser,
  toAuthUser,
};
