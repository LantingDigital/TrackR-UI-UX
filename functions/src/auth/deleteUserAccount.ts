/**
 * deleteUserAccount — Callable Cloud Function
 *
 * Cascading delete of all user data across Firestore, Storage, and Auth.
 * Requires a safety confirmation string to prevent accidental calls.
 *
 * Deletion order:
 * 1. Subcollections: rideLogs, ratings, friends, tickets, badges, gameStats, challenges, criteriaConfig
 * 2. Username reservation
 * 3. All posts authored by user
 * 4. Remove user from all friends' friend lists
 * 5. Delete pending friend requests (from and to)
 * 6. Firebase Storage files (avatars, ticket images)
 * 7. User document
 * 8. Firebase Auth account
 *
 * Must be idempotent — safe to retry if partially failed.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const BATCH_LIMIT = 500;

export const deleteUserAccount = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = request.auth.uid;
    const confirmation = request.data?.confirmation;

    if (confirmation !== 'DELETE') {
      throw new HttpsError(
        'invalid-argument',
        'Must pass { confirmation: "DELETE" } to confirm account deletion.',
      );
    }

    const db = getFirestore();

    // 1. Get user doc for username and friend list
    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.data();
    const username = userData?.username as string | undefined;

    // 2. Delete ride logs subcollection
    await deleteSubcollection(db, `rideLogs/${uid}/logs`);
    await deleteSubcollection(db, `rideLogs/${uid}/meta`);

    // 3. Delete ratings subcollection
    await deleteSubcollection(db, `ratings/${uid}/ratings`);

    // 4. Delete user subcollections
    await deleteSubcollection(db, `users/${uid}/friends`);
    await deleteSubcollection(db, `users/${uid}/tickets`);
    await deleteSubcollection(db, `users/${uid}/badges`);
    await deleteSubcollection(db, `users/${uid}/gameStats`);
    await deleteSubcollection(db, `users/${uid}/challenges`);
    await deleteSubcollection(db, `users/${uid}/criteriaConfig`);
    await deleteSubcollection(db, `users/${uid}/blockedUsers`);
    await deleteSubcollection(db, `users/${uid}/savedArticles`);
    await deleteSubcollection(db, `users/${uid}/feedPreferences`);

    // 5. Delete username reservation
    if (username) {
      const usernameRef = db.doc(`usernames/${username}`);
      const usernameSnap = await usernameRef.get();
      if (usernameSnap.exists && usernameSnap.data()?.uid === uid) {
        await usernameRef.delete();
      }
    }

    // 6. Delete all posts authored by this user
    const postsSnap = await db
      .collection('posts')
      .where('authorId', '==', uid)
      .get();

    for (const postDoc of postsSnap.docs) {
      // Delete comments subcollection first
      await deleteSubcollection(db, `posts/${postDoc.id}/comments`);
      await postDoc.ref.delete();
    }

    // 7. Remove user from all friends' friend lists
    // Query all users who have this user as a friend
    // This is an expensive operation but necessary for data consistency
    const friendsSnap = await db
      .collectionGroup('friends')
      .where('friendId', '==', uid)
      .get();

    const friendBatch = db.batch();
    let friendOps = 0;
    for (const friendDoc of friendsSnap.docs) {
      friendBatch.delete(friendDoc.ref);
      friendOps++;
      if (friendOps >= BATCH_LIMIT) {
        await friendBatch.commit();
        friendOps = 0;
      }
    }
    if (friendOps > 0) {
      await friendBatch.commit();
    }

    // 8. Delete pending friend requests (from and to this user)
    const outgoingRequests = await db
      .collection('friendRequests')
      .where('fromUserId', '==', uid)
      .get();

    const incomingRequests = await db
      .collection('friendRequests')
      .where('toUserId', '==', uid)
      .get();

    const requestBatch = db.batch();
    for (const doc of [...outgoingRequests.docs, ...incomingRequests.docs]) {
      requestBatch.delete(doc.ref);
    }
    await requestBatch.commit();

    // 9. Delete Firebase Storage files
    try {
      const bucket = getStorage().bucket();
      // Delete avatar files
      await bucket.deleteFiles({ prefix: `avatars/${uid}/` });
      // Delete ticket images
      await bucket.deleteFiles({ prefix: `tickets/${uid}/` });
      // Delete PKPass files
      await bucket.deleteFiles({ prefix: `passes/${uid}/` });
      // Delete exports
      await bucket.deleteFiles({ prefix: `exports/${uid}/` });
    } catch (error) {
      // Storage deletion is best-effort — don't fail the whole operation
      console.warn('[deleteUserAccount] Storage cleanup error:', error);
    }

    // 10. Delete user document
    await db.doc(`users/${uid}`).delete();

    // 11. Delete Firebase Auth account
    try {
      await getAuth().deleteUser(uid);
    } catch (error) {
      // Auth deletion might fail if already deleted — that's fine
      console.warn('[deleteUserAccount] Auth deletion error:', error);
    }

    console.log(`[deleteUserAccount] User ${uid} fully deleted`);

    return { success: true };
  },
);

/**
 * Delete all documents in a subcollection using batched writes.
 */
async function deleteSubcollection(
  db: FirebaseFirestore.Firestore,
  path: string,
): Promise<void> {
  const collRef = db.collection(path);
  let snapshot = await collRef.limit(BATCH_LIMIT).get();

  while (!snapshot.empty) {
    const batch = db.batch();
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();

    // Check for more documents
    snapshot = await collRef.limit(BATCH_LIMIT).get();
  }
}
