/**
 * Article Operations — Admin-only Callable Cloud Functions
 *
 * Manages the articles collection (news feed).
 * All operations require admin custom claim.
 *
 * - publishArticle: sets status to 'published', stamps publishedAt
 * - unpublishArticle: reverts to 'draft', clears publishedAt
 * - deleteArticle: hard delete from Firestore
 * - createArticle: creates a new article document
 *
 * Client-side security rules also enforce admin-only write,
 * but these CFs add server-side validation and side effects
 * (like sending push notifications on publish).
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { sendNotificationFromTemplate } from '../notifications/templates';

// ============================================
// Helpers
// ============================================

function assertAdmin(auth: { uid: string; token: Record<string, unknown> } | undefined): string {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }
  if (auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  return auth.uid;
}

// ============================================
// createArticle
// ============================================

export const createArticle = onCall(
  { region: 'us-central1' },
  async (request) => {
    const uid = assertAdmin(request.auth);
    const data = request.data as Record<string, unknown> | undefined;

    if (!data) {
      throw new HttpsError('invalid-argument', 'Article data is required.');
    }

    const title = data.title as string | undefined;
    const subtitle = data.subtitle as string | undefined;
    const body = data.body as string | undefined;
    const category = data.category as string | undefined;

    if (!title || typeof title !== 'string') {
      throw new HttpsError('invalid-argument', 'title is required.');
    }
    if (!body || typeof body !== 'string') {
      throw new HttpsError('invalid-argument', 'body is required.');
    }
    if (!category || typeof category !== 'string') {
      throw new HttpsError('invalid-argument', 'category is required.');
    }

    const db = getFirestore();
    const articleRef = db.collection('articles').doc();

    const now = FieldValue.serverTimestamp();
    const articleDoc = {
      id: articleRef.id,
      title,
      subtitle: subtitle ?? '',
      body,
      bannerImageUrl: (data.bannerImageUrl as string) ?? null,
      category,
      tags: (data.tags as string[]) ?? [],
      readTimeMinutes: (data.readTimeMinutes as number) ?? 0,
      sources: (data.sources as Array<{ name: string; url: string }>) ?? [],
      authorId: uid,
      authorName: (data.authorName as string) ?? 'TrackR',
      publishedAt: null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    await articleRef.set(articleDoc);

    console.log(`[createArticle] Admin ${uid} created article ${articleRef.id}: "${title}"`);

    return { articleId: articleRef.id };
  },
);

// ============================================
// publishArticle
// ============================================

export const publishArticle = onCall(
  { region: 'us-central1' },
  async (request) => {
    const uid = assertAdmin(request.auth);
    const articleId = request.data?.articleId as string | undefined;
    const notifyUsers = request.data?.notifyUsers as boolean | undefined;

    if (!articleId || typeof articleId !== 'string') {
      throw new HttpsError('invalid-argument', 'articleId is required.');
    }

    const db = getFirestore();
    const articleRef = db.doc(`articles/${articleId}`);
    const articleSnap = await articleRef.get();

    if (!articleSnap.exists) {
      throw new HttpsError('not-found', 'Article not found.');
    }

    const articleData = articleSnap.data()!;

    if (articleData.status === 'published') {
      throw new HttpsError('failed-precondition', 'Article is already published.');
    }

    await articleRef.update({
      status: 'published',
      publishedAt: Timestamp.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[publishArticle] Admin ${uid} published article ${articleId}`);

    // Optionally notify all users about the new article
    if (notifyUsers) {
      try {
        await notifyUsersOfNewArticle(db, articleId, articleData.title as string, articleData.category as string);
      } catch (e) {
        console.warn('[publishArticle] Notification broadcast failed:', e);
      }
    }

    return { success: true };
  },
);

// ============================================
// unpublishArticle
// ============================================

export const unpublishArticle = onCall(
  { region: 'us-central1' },
  async (request) => {
    const uid = assertAdmin(request.auth);
    const articleId = request.data?.articleId as string | undefined;

    if (!articleId || typeof articleId !== 'string') {
      throw new HttpsError('invalid-argument', 'articleId is required.');
    }

    const db = getFirestore();
    const articleRef = db.doc(`articles/${articleId}`);
    const articleSnap = await articleRef.get();

    if (!articleSnap.exists) {
      throw new HttpsError('not-found', 'Article not found.');
    }

    if (articleSnap.data()!.status === 'draft') {
      throw new HttpsError('failed-precondition', 'Article is already a draft.');
    }

    await articleRef.update({
      status: 'draft',
      publishedAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[unpublishArticle] Admin ${uid} unpublished article ${articleId}`);

    return { success: true };
  },
);

// ============================================
// deleteArticle
// ============================================

export const deleteArticle = onCall(
  { region: 'us-central1' },
  async (request) => {
    const uid = assertAdmin(request.auth);
    const articleId = request.data?.articleId as string | undefined;

    if (!articleId || typeof articleId !== 'string') {
      throw new HttpsError('invalid-argument', 'articleId is required.');
    }

    const db = getFirestore();
    const articleRef = db.doc(`articles/${articleId}`);
    const articleSnap = await articleRef.get();

    if (!articleSnap.exists) {
      throw new HttpsError('not-found', 'Article not found.');
    }

    await articleRef.delete();

    console.log(`[deleteArticle] Admin ${uid} deleted article ${articleId}`);

    return { success: true };
  },
);

// ============================================
// Notification Helper
// ============================================

/**
 * Send push notification about a new article to users who have notifications enabled.
 * Batches in groups of 10 to avoid overwhelming FCM.
 */
async function notifyUsersOfNewArticle(
  db: FirebaseFirestore.Firestore,
  articleId: string,
  title: string,
  category: string,
): Promise<void> {
  // Query users with notifications enabled (batched to limit load)
  const usersSnap = await db
    .collection('users')
    .where('notificationsEnabled', '==', true)
    .select('fcmTokens')
    .limit(500) // Cap at 500 users for v1
    .get();

  let sent = 0;
  for (const userDoc of usersSnap.docs) {
    const tokens = userDoc.data().fcmTokens as string[] | undefined;
    if (!tokens || tokens.length === 0) continue;

    try {
      await sendNotificationFromTemplate(
        userDoc.id,
        'new-article-published',
        { articleId, title, category },
      );
      sent++;
    } catch {
      // Best-effort, skip failures
    }
  }

  console.log(`[notifyUsersOfNewArticle] Notified ${sent} users about article ${articleId}`);
}
