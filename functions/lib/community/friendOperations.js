"use strict";
/**
 * Friend Operations — Callable Cloud Functions
 *
 * Server-side friend request lifecycle:
 * - sendFriendRequest: creates request, validates no duplicates
 * - acceptFriendRequest: creates bidirectional friend docs atomically
 * - declineFriendRequest: marks request as declined
 * - removeFriend: deletes bidirectional friend docs
 *
 * These CFs replace direct client writes to friendRequests and
 * users/{userId}/friends collections.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFriend = exports.declineFriendRequest = exports.acceptFriendRequest = exports.sendFriendRequest = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const sendNotification_1 = require("../notifications/sendNotification");
// ============================================
// sendFriendRequest
// ============================================
exports.sendFriendRequest = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const toUserId = request.data?.toUserId;
    if (!toUserId || typeof toUserId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'toUserId is required.');
    }
    if (toUserId === uid) {
        throw new https_1.HttpsError('invalid-argument', 'Cannot send a friend request to yourself.');
    }
    const db = (0, firestore_1.getFirestore)();
    // Check target user exists
    const targetUser = await db.doc(`users/${toUserId}`).get();
    if (!targetUser.exists) {
        throw new https_1.HttpsError('not-found', 'User not found.');
    }
    // Check not already friends
    const existingFriend = await db
        .doc(`users/${uid}/friends/${toUserId}`)
        .get();
    if (existingFriend.exists) {
        throw new https_1.HttpsError('already-exists', 'Already friends with this user.');
    }
    // Check no pending request in either direction
    const outgoing = await db
        .collection('friendRequests')
        .where('fromUserId', '==', uid)
        .where('toUserId', '==', toUserId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
    if (!outgoing.empty) {
        throw new https_1.HttpsError('already-exists', 'Friend request already sent.');
    }
    const incoming = await db
        .collection('friendRequests')
        .where('fromUserId', '==', toUserId)
        .where('toUserId', '==', uid)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
    if (!incoming.empty) {
        throw new https_1.HttpsError('already-exists', 'This user has already sent you a request. Check your pending requests.');
    }
    // Get sender info for denormalization
    const senderDoc = await db.doc(`users/${uid}`).get();
    const senderData = senderDoc.data();
    const requestRef = db.collection('friendRequests').doc();
    await requestRef.set({
        id: requestRef.id,
        fromUserId: uid,
        fromUserName: senderData?.displayName ?? '',
        fromUserAvatarUrl: senderData?.profileImageUrl ?? null,
        toUserId,
        status: 'pending',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        respondedAt: null,
    });
    console.log(`[sendFriendRequest] ${uid} -> ${toUserId}, requestId=${requestRef.id}`);
    // Send push notification to recipient (best-effort, don't fail the request)
    try {
        const senderName = senderData?.displayName ?? 'Someone';
        await (0, sendNotification_1.sendNotificationToUser)(toUserId, 'New Friend Request', `${senderName} wants to be your friend!`, { screen: 'friends', requestId: requestRef.id });
    }
    catch (e) {
        console.warn('[sendFriendRequest] FCM notification failed:', e);
    }
    return { requestId: requestRef.id };
});
// ============================================
// acceptFriendRequest
// ============================================
exports.acceptFriendRequest = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const requestId = request.data?.requestId;
    if (!requestId || typeof requestId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'requestId is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    await db.runTransaction(async (transaction) => {
        const requestRef = db.doc(`friendRequests/${requestId}`);
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists) {
            throw new https_1.HttpsError('not-found', 'Friend request not found.');
        }
        const requestData = requestSnap.data();
        if (requestData.toUserId !== uid) {
            throw new https_1.HttpsError('permission-denied', 'You can only accept requests sent to you.');
        }
        if (requestData.status !== 'pending') {
            throw new https_1.HttpsError('failed-precondition', `Request is already ${requestData.status}.`);
        }
        const fromUserId = requestData.fromUserId;
        // Get both users' info for denormalized friend docs
        const [accepterSnap, senderSnap] = await Promise.all([
            transaction.get(db.doc(`users/${uid}`)),
            transaction.get(db.doc(`users/${fromUserId}`)),
        ]);
        const accepterData = accepterSnap.data();
        const senderData = senderSnap.data();
        const now = firestore_1.FieldValue.serverTimestamp();
        // Update request status
        transaction.update(requestRef, {
            status: 'accepted',
            respondedAt: now,
        });
        // Create bidirectional friend docs
        transaction.set(db.doc(`users/${uid}/friends/${fromUserId}`), {
            friendId: fromUserId,
            friendName: senderData?.displayName ?? '',
            friendAvatarUrl: senderData?.profileImageUrl ?? null,
            addedAt: now,
        });
        transaction.set(db.doc(`users/${fromUserId}/friends/${uid}`), {
            friendId: uid,
            friendName: accepterData?.displayName ?? '',
            friendAvatarUrl: accepterData?.profileImageUrl ?? null,
            addedAt: now,
        });
    });
    // Get fromUserId from the transaction context for notification
    const requestDoc = await db.doc(`friendRequests/${requestId}`).get();
    const fromUserId = requestDoc.data()?.fromUserId;
    const accepterDoc = await db.doc(`users/${uid}`).get();
    const accepterName = accepterDoc.data()?.displayName ?? 'Someone';
    console.log(`[acceptFriendRequest] ${uid} accepted ${requestId}`);
    // Send push notification to the requester (best-effort)
    try {
        await (0, sendNotification_1.sendNotificationToUser)(fromUserId, 'Friend Request Accepted', `${accepterName} accepted your friend request!`, { screen: 'friends' });
    }
    catch (e) {
        console.warn('[acceptFriendRequest] FCM notification failed:', e);
    }
    return { success: true };
});
// ============================================
// declineFriendRequest
// ============================================
exports.declineFriendRequest = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const requestId = request.data?.requestId;
    if (!requestId || typeof requestId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'requestId is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    const requestRef = db.doc(`friendRequests/${requestId}`);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Friend request not found.');
    }
    const requestData = requestSnap.data();
    if (requestData.toUserId !== uid) {
        throw new https_1.HttpsError('permission-denied', 'You can only decline requests sent to you.');
    }
    if (requestData.status !== 'pending') {
        throw new https_1.HttpsError('failed-precondition', `Request is already ${requestData.status}.`);
    }
    await requestRef.update({
        status: 'declined',
        respondedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log(`[declineFriendRequest] ${uid} declined ${requestId}`);
    return { success: true };
});
// ============================================
// removeFriend
// ============================================
exports.removeFriend = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const friendId = request.data?.friendId;
    if (!friendId || typeof friendId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'friendId is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    const batch = db.batch();
    // Delete bidirectional friend docs
    batch.delete(db.doc(`users/${uid}/friends/${friendId}`));
    batch.delete(db.doc(`users/${friendId}/friends/${uid}`));
    await batch.commit();
    console.log(`[removeFriend] ${uid} removed ${friendId}`);
    return { success: true };
});
//# sourceMappingURL=friendOperations.js.map