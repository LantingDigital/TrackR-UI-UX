/**
 * Firebase Cloud Functions Client
 *
 * Typed wrappers around Firebase callable Cloud Functions.
 * Each function returns a clean result type, matching the auth service pattern.
 */

import functions from '@react-native-firebase/functions';

// ============================================
// Types
// ============================================

interface ValidateUsernameResult {
  available: boolean;
  error?: string;
}

// ============================================
// Cloud Function Callers
// ============================================

/**
 * Call the validateUsername Cloud Function to atomically check availability
 * and reserve a username. Handles format validation, reserved words, and
 * uniqueness check in a Firestore transaction.
 *
 * Returns { available: true } on success.
 * Returns { available: false, error: '...' } on failure.
 */
async function callValidateUsername(
  username: string,
): Promise<ValidateUsernameResult> {
  try {
    const callable = functions().httpsCallable('validateUsername');
    const result = await callable({ username });
    return result.data as ValidateUsernameResult;
  } catch (error) {
    // Firebase Functions errors have a code and message
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      'message' in error
    ) {
      const fnError = error as { code: string; message: string };
      return { available: false, error: fnError.message };
    }
    return { available: false, error: 'Failed to validate username.' };
  }
}

// ============================================
// Exports
// ============================================

export { callValidateUsername };
export type { ValidateUsernameResult };
