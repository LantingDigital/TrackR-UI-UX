"use strict";
/**
 * TrackR Cloud Functions
 *
 * All Cloud Functions are exported from this file.
 * Deploy: firebase deploy --only functions --project trackr-coaster-app
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshParkHoursManual = exports.refreshParkHoursScheduled = exports.populateParks = exports.matchCoasterNames = exports.processImportFile = exports.getOrderStatus = exports.confirmCardOrder = exports.createCardOrder = exports.proxyWaitTimes = exports.setAdminClaim = exports.unblockUser = exports.blockUser = exports.reportUser = exports.deleteArticle = exports.unpublishArticle = exports.publishArticle = exports.createArticle = exports.getWeeklyChallenge = exports.submitGameScore = exports.handleSubscriptionEvent = exports.verifyPurchase = exports.generatePKPass = exports.registerFCMToken = exports.removeFriend = exports.declineFriendRequest = exports.acceptFriendRequest = exports.sendFriendRequest = exports.migrateLocalData = exports.computeRankings = exports.onRatingWrite = exports.exportRideLog = exports.onRideLogUpdate = exports.onRideLogDelete = exports.onRideLogCreate = exports.deleteUserAccount = exports.onUserCreated = exports.validateUsername = void 0;
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin SDK (uses default credentials in Cloud Functions environment)
(0, app_1.initializeApp)();
// Auth & User functions
var validateUsername_1 = require("./auth/validateUsername");
Object.defineProperty(exports, "validateUsername", { enumerable: true, get: function () { return validateUsername_1.validateUsername; } });
var onUserCreated_1 = require("./auth/onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
var deleteUserAccount_1 = require("./auth/deleteUserAccount");
Object.defineProperty(exports, "deleteUserAccount", { enumerable: true, get: function () { return deleteUserAccount_1.deleteUserAccount; } });
// Ride Log triggers (maintain denormalized counters)
var onRideLogCreate_1 = require("./rideLogs/onRideLogCreate");
Object.defineProperty(exports, "onRideLogCreate", { enumerable: true, get: function () { return onRideLogCreate_1.onRideLogCreate; } });
var onRideLogDelete_1 = require("./rideLogs/onRideLogDelete");
Object.defineProperty(exports, "onRideLogDelete", { enumerable: true, get: function () { return onRideLogDelete_1.onRideLogDelete; } });
var onRideLogUpdate_1 = require("./rideLogs/onRideLogUpdate");
Object.defineProperty(exports, "onRideLogUpdate", { enumerable: true, get: function () { return onRideLogUpdate_1.onRideLogUpdate; } });
var exportRideLog_1 = require("./rideLogs/exportRideLog");
Object.defineProperty(exports, "exportRideLog", { enumerable: true, get: function () { return exportRideLog_1.exportRideLog; } });
// Ratings
var onRatingWrite_1 = require("./ratings/onRatingWrite");
Object.defineProperty(exports, "onRatingWrite", { enumerable: true, get: function () { return onRatingWrite_1.onRatingWrite; } });
var computeRankings_1 = require("./ratings/computeRankings");
Object.defineProperty(exports, "computeRankings", { enumerable: true, get: function () { return computeRankings_1.computeRankings; } });
// Migration (local data → Firestore on first auth)
var migrateLocalData_1 = require("./migration/migrateLocalData");
Object.defineProperty(exports, "migrateLocalData", { enumerable: true, get: function () { return migrateLocalData_1.migrateLocalData; } });
// Community (friend operations)
var friendOperations_1 = require("./community/friendOperations");
Object.defineProperty(exports, "sendFriendRequest", { enumerable: true, get: function () { return friendOperations_1.sendFriendRequest; } });
Object.defineProperty(exports, "acceptFriendRequest", { enumerable: true, get: function () { return friendOperations_1.acceptFriendRequest; } });
Object.defineProperty(exports, "declineFriendRequest", { enumerable: true, get: function () { return friendOperations_1.declineFriendRequest; } });
Object.defineProperty(exports, "removeFriend", { enumerable: true, get: function () { return friendOperations_1.removeFriend; } });
// Notifications
var registerFCMToken_1 = require("./notifications/registerFCMToken");
Object.defineProperty(exports, "registerFCMToken", { enumerable: true, get: function () { return registerFCMToken_1.registerFCMToken; } });
// Apple Wallet
var generatePKPass_1 = require("./wallet/generatePKPass");
Object.defineProperty(exports, "generatePKPass", { enumerable: true, get: function () { return generatePKPass_1.generatePKPass; } });
// Premium (IAP verification + Apple S2S webhook)
var verifyPurchase_1 = require("./premium/verifyPurchase");
Object.defineProperty(exports, "verifyPurchase", { enumerable: true, get: function () { return verifyPurchase_1.verifyPurchase; } });
var handleSubscriptionEvent_1 = require("./premium/handleSubscriptionEvent");
Object.defineProperty(exports, "handleSubscriptionEvent", { enumerable: true, get: function () { return handleSubscriptionEvent_1.handleSubscriptionEvent; } });
// Games & Challenges
var submitGameScore_1 = require("./games/submitGameScore");
Object.defineProperty(exports, "submitGameScore", { enumerable: true, get: function () { return submitGameScore_1.submitGameScore; } });
var getWeeklyChallenge_1 = require("./games/getWeeklyChallenge");
Object.defineProperty(exports, "getWeeklyChallenge", { enumerable: true, get: function () { return getWeeklyChallenge_1.getWeeklyChallenge; } });
// Articles (admin-managed news feed)
var articleOperations_1 = require("./articles/articleOperations");
Object.defineProperty(exports, "createArticle", { enumerable: true, get: function () { return articleOperations_1.createArticle; } });
Object.defineProperty(exports, "publishArticle", { enumerable: true, get: function () { return articleOperations_1.publishArticle; } });
Object.defineProperty(exports, "unpublishArticle", { enumerable: true, get: function () { return articleOperations_1.unpublishArticle; } });
Object.defineProperty(exports, "deleteArticle", { enumerable: true, get: function () { return articleOperations_1.deleteArticle; } });
// Community Safety (report & block)
var reportAndBlock_1 = require("./community/reportAndBlock");
Object.defineProperty(exports, "reportUser", { enumerable: true, get: function () { return reportAndBlock_1.reportUser; } });
Object.defineProperty(exports, "blockUser", { enumerable: true, get: function () { return reportAndBlock_1.blockUser; } });
Object.defineProperty(exports, "unblockUser", { enumerable: true, get: function () { return reportAndBlock_1.unblockUser; } });
// Admin
var setAdminClaim_1 = require("./admin/setAdminClaim");
Object.defineProperty(exports, "setAdminClaim", { enumerable: true, get: function () { return setAdminClaim_1.setAdminClaim; } });
// Wait Times (Queue-Times.com proxy)
var proxyWaitTimes_1 = require("./waitTimes/proxyWaitTimes");
Object.defineProperty(exports, "proxyWaitTimes", { enumerable: true, get: function () { return proxyWaitTimes_1.proxyWaitTimes; } });
// Merch Store (physical card purchases via Stripe + QPMN fulfillment)
var createCardOrder_1 = require("./merch/createCardOrder");
Object.defineProperty(exports, "createCardOrder", { enumerable: true, get: function () { return createCardOrder_1.createCardOrder; } });
var confirmCardOrder_1 = require("./merch/confirmCardOrder");
Object.defineProperty(exports, "confirmCardOrder", { enumerable: true, get: function () { return confirmCardOrder_1.confirmCardOrder; } });
var getOrderStatus_1 = require("./merch/getOrderStatus");
Object.defineProperty(exports, "getOrderStatus", { enumerable: true, get: function () { return getOrderStatus_1.getOrderStatus; } });
// Import (ride data import from other apps / spreadsheets)
var processImportFile_1 = require("./import/processImportFile");
Object.defineProperty(exports, "processImportFile", { enumerable: true, get: function () { return processImportFile_1.processImportFile; } });
var matchCoasterNames_1 = require("./import/matchCoasterNames");
Object.defineProperty(exports, "matchCoasterNames", { enumerable: true, get: function () { return matchCoasterNames_1.matchCoasterNames; } });
// Park Data (ThemeParks.wiki — populate parks, attractions, restaurants, shows, hours, geofences)
var populateParks_1 = require("./parkData/populateParks");
Object.defineProperty(exports, "populateParks", { enumerable: true, get: function () { return populateParks_1.populateParks; } });
var refreshParkHours_1 = require("./parkData/refreshParkHours");
Object.defineProperty(exports, "refreshParkHoursScheduled", { enumerable: true, get: function () { return refreshParkHours_1.refreshParkHoursScheduled; } });
Object.defineProperty(exports, "refreshParkHoursManual", { enumerable: true, get: function () { return refreshParkHours_1.refreshParkHoursManual; } });
//# sourceMappingURL=index.js.map