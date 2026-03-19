"use strict";
/**
 * submitGameScore — Callable Cloud Function
 *
 * Records a game score, updates stats, checks for badges and challenges.
 *
 * Flow:
 * 1. Validate input
 * 2. Read/create gameStats doc
 * 3. Update highScore, gamesPlayed, streaks, history
 * 4. Check badge criteria
 * 5. Check active challenge progress
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitGameScore = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const awardBadges_1 = require("../badges/awardBadges");
const VALID_GAME_IDS = ['coastle', 'trivia', 'speed-sorter', 'blind-ranking'];
const MAX_HISTORY = 50;
// ============================================
// Cloud Function
// ============================================
exports.submitGameScore = (0, https_1.onCall)({
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 15,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in.');
    }
    const uid = request.auth.uid;
    const data = request.data;
    // Validate
    if (!data.gameId || !VALID_GAME_IDS.includes(data.gameId)) {
        throw new https_1.HttpsError('invalid-argument', `gameId must be one of: ${VALID_GAME_IDS.join(', ')}`);
    }
    if (typeof data.score !== 'number' || data.score < 0) {
        throw new https_1.HttpsError('invalid-argument', 'score must be a non-negative number.');
    }
    const db = (0, firestore_1.getFirestore)();
    const statsRef = db.doc(`users/${uid}/gameStats/${data.gameId}`);
    const statsSnap = await statsRef.get();
    let isNewHighScore = false;
    if (statsSnap.exists) {
        const existing = statsSnap.data();
        const oldHighScore = existing.highScore ?? 0;
        const oldBestStreak = existing.bestStreak ?? 0;
        const oldStreak = existing.currentStreak ?? 0;
        const oldHistory = existing.history ?? [];
        isNewHighScore = data.score > oldHighScore;
        // Determine streak: if score > 0, it counts as a "win" for streak purposes
        const newStreak = data.score > 0 ? oldStreak + 1 : 0;
        const newBestStreak = Math.max(oldBestStreak, newStreak);
        // Cap history at MAX_HISTORY (drop oldest)
        const newEntry = {
            score: data.score,
            completedAt: firestore_1.FieldValue.serverTimestamp(),
            details: data.details ?? null,
        };
        // Keep last MAX_HISTORY - 1 entries + new entry
        const trimmedHistory = oldHistory.slice(-(MAX_HISTORY - 1));
        await statsRef.update({
            highScore: isNewHighScore ? data.score : oldHighScore,
            gamesPlayed: firestore_1.FieldValue.increment(1),
            currentStreak: newStreak,
            bestStreak: newBestStreak,
            totalScore: firestore_1.FieldValue.increment(data.score),
            lastPlayedAt: firestore_1.FieldValue.serverTimestamp(),
            history: [...trimmedHistory, newEntry],
        });
    }
    else {
        // First time playing this game
        isNewHighScore = true;
        await statsRef.set({
            gameId: data.gameId,
            highScore: data.score,
            gamesPlayed: 1,
            currentStreak: data.score > 0 ? 1 : 0,
            bestStreak: data.score > 0 ? 1 : 0,
            totalScore: data.score,
            lastPlayedAt: firestore_1.FieldValue.serverTimestamp(),
            history: [
                {
                    score: data.score,
                    completedAt: firestore_1.FieldValue.serverTimestamp(),
                    details: data.details ?? null,
                },
            ],
        });
    }
    console.log(`[submitGameScore] User ${uid} played ${data.gameId}: score=${data.score}, newHigh=${isNewHighScore}`);
    // Check badge criteria (best-effort)
    try {
        await (0, awardBadges_1.checkAndAwardBadges)(uid, 'game-completed', {
            gameId: data.gameId,
            score: data.score,
        });
    }
    catch (e) {
        console.warn('[submitGameScore] Badge check failed:', e);
    }
    // Check active challenge progress (best-effort)
    try {
        await incrementChallengeProgress(db, uid, 'play-games');
    }
    catch (e) {
        console.warn('[submitGameScore] Challenge progress failed:', e);
    }
    return { newHighScore: isNewHighScore };
});
// ============================================
// Challenge Progress Helper
// ============================================
async function incrementChallengeProgress(db, uid, challengeType) {
    // Find active challenges of the matching type
    const now = new Date();
    const challengesSnap = await db
        .collection(`users/${uid}/challenges`)
        .where('completedAt', '==', null)
        .get();
    for (const doc of challengesSnap.docs) {
        const challengeData = doc.data();
        // We store the challenge type on the doc for filtering
        if (challengeData.type === challengeType) {
            const newProgress = challengeData.progress + 1;
            const goal = challengeData.goal;
            const update = {
                progress: newProgress,
            };
            if (newProgress >= goal) {
                update.completedAt = now;
            }
            await doc.ref.update(update);
        }
    }
}
//# sourceMappingURL=submitGameScore.js.map