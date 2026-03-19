"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteArticle = exports.unpublishArticle = exports.publishArticle = exports.createArticle = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const templates_1 = require("../notifications/templates");
// ============================================
// Helpers
// ============================================
function assertAdmin(auth) {
    if (!auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    if (auth.token.admin !== true) {
        throw new https_1.HttpsError('permission-denied', 'Admin access required.');
    }
    return auth.uid;
}
// ============================================
// createArticle
// ============================================
exports.createArticle = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    const uid = assertAdmin(request.auth);
    const data = request.data;
    if (!data) {
        throw new https_1.HttpsError('invalid-argument', 'Article data is required.');
    }
    const title = data.title;
    const subtitle = data.subtitle;
    const body = data.body;
    const category = data.category;
    if (!title || typeof title !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'title is required.');
    }
    if (!body || typeof body !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'body is required.');
    }
    if (!category || typeof category !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'category is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    const articleRef = db.collection('articles').doc();
    const now = firestore_1.FieldValue.serverTimestamp();
    const articleDoc = {
        id: articleRef.id,
        title,
        subtitle: subtitle ?? '',
        body,
        bannerImageUrl: data.bannerImageUrl ?? null,
        category,
        tags: data.tags ?? [],
        readTimeMinutes: data.readTimeMinutes ?? 0,
        sources: data.sources ?? [],
        authorId: uid,
        authorName: data.authorName ?? 'TrackR',
        publishedAt: null,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
    };
    await articleRef.set(articleDoc);
    console.log(`[createArticle] Admin ${uid} created article ${articleRef.id}: "${title}"`);
    return { articleId: articleRef.id };
});
// ============================================
// publishArticle
// ============================================
exports.publishArticle = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    const uid = assertAdmin(request.auth);
    const articleId = request.data?.articleId;
    const notifyUsers = request.data?.notifyUsers;
    if (!articleId || typeof articleId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'articleId is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    const articleRef = db.doc(`articles/${articleId}`);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Article not found.');
    }
    const articleData = articleSnap.data();
    if (articleData.status === 'published') {
        throw new https_1.HttpsError('failed-precondition', 'Article is already published.');
    }
    await articleRef.update({
        status: 'published',
        publishedAt: firestore_1.Timestamp.now(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log(`[publishArticle] Admin ${uid} published article ${articleId}`);
    // Optionally notify all users about the new article
    if (notifyUsers) {
        try {
            await notifyUsersOfNewArticle(db, articleId, articleData.title, articleData.category);
        }
        catch (e) {
            console.warn('[publishArticle] Notification broadcast failed:', e);
        }
    }
    return { success: true };
});
// ============================================
// unpublishArticle
// ============================================
exports.unpublishArticle = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    const uid = assertAdmin(request.auth);
    const articleId = request.data?.articleId;
    if (!articleId || typeof articleId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'articleId is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    const articleRef = db.doc(`articles/${articleId}`);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Article not found.');
    }
    if (articleSnap.data().status === 'draft') {
        throw new https_1.HttpsError('failed-precondition', 'Article is already a draft.');
    }
    await articleRef.update({
        status: 'draft',
        publishedAt: null,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    console.log(`[unpublishArticle] Admin ${uid} unpublished article ${articleId}`);
    return { success: true };
});
// ============================================
// deleteArticle
// ============================================
exports.deleteArticle = (0, https_1.onCall)({ region: 'us-central1' }, async (request) => {
    const uid = assertAdmin(request.auth);
    const articleId = request.data?.articleId;
    if (!articleId || typeof articleId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'articleId is required.');
    }
    const db = (0, firestore_1.getFirestore)();
    const articleRef = db.doc(`articles/${articleId}`);
    const articleSnap = await articleRef.get();
    if (!articleSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Article not found.');
    }
    await articleRef.delete();
    console.log(`[deleteArticle] Admin ${uid} deleted article ${articleId}`);
    return { success: true };
});
// ============================================
// Notification Helper
// ============================================
/**
 * Send push notification about a new article to users who have notifications enabled.
 * Batches in groups of 10 to avoid overwhelming FCM.
 */
async function notifyUsersOfNewArticle(db, articleId, title, category) {
    // Query users with notifications enabled (batched to limit load)
    const usersSnap = await db
        .collection('users')
        .where('notificationsEnabled', '==', true)
        .select('fcmTokens')
        .limit(500) // Cap at 500 users for v1
        .get();
    let sent = 0;
    for (const userDoc of usersSnap.docs) {
        const tokens = userDoc.data().fcmTokens;
        if (!tokens || tokens.length === 0)
            continue;
        try {
            await (0, templates_1.sendNotificationFromTemplate)(userDoc.id, 'new-article-published', { articleId, title, category });
            sent++;
        }
        catch {
            // Best-effort, skip failures
        }
    }
    console.log(`[notifyUsersOfNewArticle] Notified ${sent} users about article ${articleId}`);
}
//# sourceMappingURL=articleOperations.js.map