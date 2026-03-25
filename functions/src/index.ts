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
export { deleteUserAccount } from './auth/deleteUserAccount';

// Ride Log triggers (maintain denormalized counters)
export { onRideLogCreate } from './rideLogs/onRideLogCreate';
export { onRideLogDelete } from './rideLogs/onRideLogDelete';
export { onRideLogUpdate } from './rideLogs/onRideLogUpdate';
export { exportRideLog } from './rideLogs/exportRideLog';

// Ratings
export { onRatingWrite } from './ratings/onRatingWrite';
export { computeRankings } from './ratings/computeRankings';

// Migration (local data → Firestore on first auth)
export { migrateLocalData } from './migration/migrateLocalData';

// Community (friend operations)
export {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from './community/friendOperations';

// Notifications
export { registerFCMToken } from './notifications/registerFCMToken';

// Apple Wallet
export { generatePKPass } from './wallet/generatePKPass';

// Premium (IAP verification + Apple S2S webhook)
export { verifyPurchase } from './premium/verifyPurchase';
export { handleSubscriptionEvent } from './premium/handleSubscriptionEvent';

// Games & Challenges
export { submitGameScore } from './games/submitGameScore';
export { getWeeklyChallenge } from './games/getWeeklyChallenge';

// Articles (admin-managed news feed)
export {
  createArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
} from './articles/articleOperations';

// Community Safety (report & block)
export {
  reportUser,
  blockUser,
  unblockUser,
} from './community/reportAndBlock';

// Admin
export { setAdminClaim } from './admin/setAdminClaim';

// Wait Times (Queue-Times.com proxy)
export { proxyWaitTimes } from './waitTimes/proxyWaitTimes';

// Merch Store (physical card purchases via Stripe + QPMN fulfillment)
export { createCardOrder } from './merch/createCardOrder';
export { confirmCardOrder } from './merch/confirmCardOrder';
export { getOrderStatus } from './merch/getOrderStatus';

// Import (ride data import from other apps / spreadsheets)
export { processImportFile } from './import/processImportFile';
export { matchCoasterNames } from './import/matchCoasterNames';

// Park Data (ThemeParks.wiki — populate parks, attractions, restaurants, shows, hours, geofences)
export { populateParks } from './parkData/populateParks';
export { refreshParkHoursScheduled, refreshParkHoursManual } from './parkData/refreshParkHours';
