/**
 * TrackR Cloud Functions
 *
 * All Cloud Functions are exported from this file.
 * Deploy: firebase deploy --only functions --project trackr-coaster-app
 */

import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (uses default credentials in Cloud Functions environment)
initializeApp();

// Auth & User functions
export { validateUsername } from './auth/validateUsername';
export { onUserCreated } from './auth/onUserCreated';

// Apple Wallet
export { generatePKPass } from './wallet/generatePKPass';
