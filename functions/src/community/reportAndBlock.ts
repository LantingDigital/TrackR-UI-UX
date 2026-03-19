/**
 * Report & Block — Callable Cloud Functions
 *
 * Community safety features for pre-launch.
 *
 * - reportUser: submits a report to the reports collection (reviewed by admin)
 * - blockUser: adds a bidirectional block (blocker can't see blocked, blocked can't see blocker)
 * - unblockUser: removes the block
 *
 * Reports are stored in `reports/{reportId}` (admin-readable only).
 * Blocks are stored in `users/{userId}/blockedUsers/{blockedUid}` (already in security rules).
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ============================================
// Report Reasons
// ============================================

const VALID_REASONS = [
  'spam',
  'harassment',
  'inappropriate-content',
  'impersonation',
  'other',
] as const;

type ReportReason = typeof VALID_REASONS[number];

// ============================================
// reportUser
// ============================================

export const reportUser = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = request.auth.uid;
    const reportedUserId = request.data?.reportedUserId as string | undefined;
    const reason = request.data?.reason as string | undefined;
    const details = request.data?.details as string | undefined;
    const contentId = request.data?.contentId as string | undefined;
    const contentType = request.data?.contentType as string | undefined;

    if (!reportedUserId || typeof reportedUserId !== 'string') {
      throw new HttpsError('invalid-argument', 'reportedUserId is required.');
    }

    if (reportedUserId === uid) {
      throw new HttpsError('invalid-argument', 'Cannot report yourself.');
    }

    if (!reason || !VALID_REASONS.includes(reason as ReportReason)) {
      throw new HttpsError(
        'invalid-argument',
        `reason must be one of: ${VALID_REASONS.join(', ')}`,
      );
    }

    const db = getFirestore();

    // Verify reported user exists
    const reportedUser = await db.doc(`users/${reportedUserId}`).get();
    if (!reportedUser.exists) {
      throw new HttpsError('not-found', 'Reported user not found.');
    }

    // Rate limit: max 5 reports per user per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentReports = await db
      .collection('reports')
      .where('reporterId', '==', uid)
      .where('createdAt', '>=', oneDayAgo)
      .count()
      .get();

    if (recentReports.data().count >= 5) {
      throw new HttpsError(
        'resource-exhausted',
        'Too many reports. Please try again later.',
      );
    }

    // Check for duplicate report on same user (within 24h)
    const duplicateCheck = await db
      .collection('reports')
      .where('reporterId', '==', uid)
      .where('reportedUserId', '==', reportedUserId)
      .where('createdAt', '>=', oneDayAgo)
      .limit(1)
      .get();

    if (!duplicateCheck.empty) {
      throw new HttpsError(
        'already-exists',
        'You have already reported this user recently.',
      );
    }

    const reportRef = db.collection('reports').doc();
    const reporterData = (await db.doc(`users/${uid}`).get()).data();
    const reportedData = reportedUser.data();

    await reportRef.set({
      id: reportRef.id,
      reporterId: uid,
      reporterName: reporterData?.displayName ?? '',
      reportedUserId,
      reportedName: reportedData?.displayName ?? '',
      reason,
      details: details ?? null,
      contentId: contentId ?? null,
      contentType: contentType ?? null,
      status: 'pending', // pending → reviewed → resolved / dismissed
      createdAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      resolution: null,
    });

    console.log(
      `[reportUser] User ${uid} reported ${reportedUserId} for ${reason}, reportId=${reportRef.id}`,
    );

    // TODO: Notify admins when a report is filed.
    // Can't query Firestore by custom claims. Options:
    // 1. Store admin UIDs in _admin/config doc
    // 2. Use a Firestore trigger on reports collection
    // For v1, Caleb can check reports in Firebase Console.

    return { reportId: reportRef.id };
  },
);

// ============================================
// blockUser
// ============================================

export const blockUser = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = request.auth.uid;
    const blockedUserId = request.data?.blockedUserId as string | undefined;

    if (!blockedUserId || typeof blockedUserId !== 'string') {
      throw new HttpsError('invalid-argument', 'blockedUserId is required.');
    }

    if (blockedUserId === uid) {
      throw new HttpsError('invalid-argument', 'Cannot block yourself.');
    }

    const db = getFirestore();

    // Verify user exists
    const blockedUser = await db.doc(`users/${blockedUserId}`).get();
    if (!blockedUser.exists) {
      throw new HttpsError('not-found', 'User not found.');
    }

    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    // Add to blocker's blocked list
    batch.set(db.doc(`users/${uid}/blockedUsers/${blockedUserId}`), {
      blockedUserId,
      blockedName: blockedUser.data()?.displayName ?? '',
      blockedAt: now,
    });

    // If they're friends, remove the friendship
    const friendDoc = await db.doc(`users/${uid}/friends/${blockedUserId}`).get();
    if (friendDoc.exists) {
      batch.delete(db.doc(`users/${uid}/friends/${blockedUserId}`));
      batch.delete(db.doc(`users/${blockedUserId}/friends/${uid}`));
    }

    // Cancel any pending friend requests between them
    const outgoing = await db
      .collection('friendRequests')
      .where('fromUserId', '==', uid)
      .where('toUserId', '==', blockedUserId)
      .where('status', '==', 'pending')
      .get();

    for (const doc of outgoing.docs) {
      batch.update(doc.ref, { status: 'declined', respondedAt: now });
    }

    const incoming = await db
      .collection('friendRequests')
      .where('fromUserId', '==', blockedUserId)
      .where('toUserId', '==', uid)
      .where('status', '==', 'pending')
      .get();

    for (const doc of incoming.docs) {
      batch.update(doc.ref, { status: 'declined', respondedAt: now });
    }

    await batch.commit();

    console.log(`[blockUser] User ${uid} blocked ${blockedUserId}`);

    return { success: true };
  },
);

// ============================================
// unblockUser
// ============================================

export const unblockUser = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = request.auth.uid;
    const blockedUserId = request.data?.blockedUserId as string | undefined;

    if (!blockedUserId || typeof blockedUserId !== 'string') {
      throw new HttpsError('invalid-argument', 'blockedUserId is required.');
    }

    const db = getFirestore();
    const blockRef = db.doc(`users/${uid}/blockedUsers/${blockedUserId}`);
    const blockSnap = await blockRef.get();

    if (!blockSnap.exists) {
      throw new HttpsError('not-found', 'User is not blocked.');
    }

    await blockRef.delete();

    console.log(`[unblockUser] User ${uid} unblocked ${blockedUserId}`);

    return { success: true };
  },
);
