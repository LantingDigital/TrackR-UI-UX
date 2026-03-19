"use strict";
/**
 * awardBadges — Internal helper (NOT a callable)
 *
 * Checks badge criteria against current user stats and awards
 * any newly earned badges. Called by other CFs after qualifying events.
 *
 * Events that trigger badge checks:
 * - ride-logged: onRideLogCreate
 * - rating-created: onRatingWrite
 * - game-completed: submitGameScore
 *
 * Badge catalog is defined here as the source of truth.
 * Each badge has a check function that determines eligibility.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndAwardBadges = checkAndAwardBadges;
const firestore_1 = require("firebase-admin/firestore");
const sendNotification_1 = require("../notifications/sendNotification");
// ============================================
// Badge Catalog
// ============================================
const BADGE_CATALOG = [
    // Ride milestones
    {
        id: 'first-credit',
        name: 'First Credit',
        description: 'Log your first ride',
        icon: '🎢',
        tier: 'bronze',
        event: 'ride-logged',
        check: (s) => ({ earned: s.totalCredits >= 1, progress: Math.min(100, (s.totalCredits / 1) * 100) }),
    },
    {
        id: 'ten-credits',
        name: 'Decade Rider',
        description: 'Ride 10 distinct coasters',
        icon: '🔟',
        tier: 'silver',
        event: 'ride-logged',
        check: (s) => ({ earned: s.totalCredits >= 10, progress: Math.min(100, (s.totalCredits / 10) * 100) }),
    },
    {
        id: 'fifty-credits',
        name: 'Half Century',
        description: 'Ride 50 distinct coasters',
        icon: '🏆',
        tier: 'gold',
        event: 'ride-logged',
        check: (s) => ({ earned: s.totalCredits >= 50, progress: Math.min(100, (s.totalCredits / 50) * 100) }),
    },
    {
        id: 'century-rider',
        name: 'Century Rider',
        description: 'Ride 100 distinct coasters',
        icon: '💎',
        tier: 'platinum',
        event: 'ride-logged',
        check: (s) => ({ earned: s.totalCredits >= 100, progress: Math.min(100, (s.totalCredits / 100) * 100) }),
    },
    // Rating milestones
    {
        id: 'first-rating',
        name: "Critic's Debut",
        description: 'Rate your first coaster',
        icon: '⭐',
        tier: 'bronze',
        event: 'rating-created',
        check: (s) => ({ earned: s.totalRatings >= 1, progress: Math.min(100, (s.totalRatings / 1) * 100) }),
    },
    {
        id: 'rate-fifty',
        name: 'Seasoned Critic',
        description: 'Rate 50 coasters',
        icon: '📝',
        tier: 'gold',
        event: 'rating-created',
        check: (s) => ({ earned: s.totalRatings >= 50, progress: Math.min(100, (s.totalRatings / 50) * 100) }),
    },
    // Park milestones
    {
        id: 'park-hopper',
        name: 'Park Hopper',
        description: 'Log rides at 5 different parks',
        icon: '🗺️',
        tier: 'silver',
        event: 'ride-logged',
        check: (s) => ({ earned: s.distinctParks >= 5, progress: Math.min(100, (s.distinctParks / 5) * 100) }),
    },
    // Game milestones
    {
        id: 'game-master',
        name: 'Game Master',
        description: 'Play all 4 game types',
        icon: '🎮',
        tier: 'gold',
        event: 'game-completed',
        check: (s) => {
            const gamesPlayed = Object.keys(s.gameStats).filter((g) => s.gameStats[g].gamesPlayed > 0).length;
            return { earned: gamesPlayed >= 4, progress: Math.min(100, (gamesPlayed / 4) * 100) };
        },
    },
    {
        id: 'streak-7',
        name: 'Week Warrior',
        description: '7-day play streak',
        icon: '🔥',
        tier: 'silver',
        event: 'game-completed',
        check: (s) => {
            const maxStreak = Object.values(s.gameStats).reduce((max, g) => Math.max(max, g.bestStreak), 0);
            return { earned: maxStreak >= 7, progress: Math.min(100, (maxStreak / 7) * 100) };
        },
    },
    {
        id: 'coastle-100',
        name: 'Coastle Century',
        description: 'Play 100 Coastle games',
        icon: '🧩',
        tier: 'gold',
        event: 'game-completed',
        check: (s) => {
            const coastle = s.gameStats['coastle'];
            const played = coastle?.gamesPlayed ?? 0;
            return { earned: played >= 100, progress: Math.min(100, (played / 100) * 100) };
        },
    },
];
// ============================================
// Stats Collector
// ============================================
async function collectUserStats(db, uid, eventContext) {
    // Read user doc for credit/ride counts
    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.data() ?? {};
    // Count ratings
    const ratingsSnap = await db
        .collection(`ratings/${uid}/ratings`)
        .count()
        .get();
    const totalRatings = ratingsSnap.data().count;
    // Count distinct parks from ride logs
    const logsSnap = await db
        .collection(`rideLogs/${uid}/logs`)
        .select('parkName')
        .get();
    const distinctParks = new Set(logsSnap.docs.map((d) => d.data().parkName)).size;
    // Get game stats
    const gameStatsSnap = await db
        .collection(`users/${uid}/gameStats`)
        .get();
    const gameStats = {};
    gameStatsSnap.forEach((doc) => {
        const data = doc.data();
        gameStats[doc.id] = {
            gamesPlayed: data.gamesPlayed ?? 0,
            highScore: data.highScore ?? 0,
            bestStreak: data.bestStreak ?? 0,
        };
    });
    return {
        totalCredits: userData.totalCredits ?? 0,
        totalRides: userData.totalRides ?? 0,
        totalRatings,
        distinctParks,
        gameStats,
        eventContext: eventContext,
    };
}
// ============================================
// Main Function
// ============================================
async function checkAndAwardBadges(uid, event, eventContext) {
    const db = (0, firestore_1.getFirestore)();
    // Get current badge state
    const badgesSnap = await db.collection(`users/${uid}/badges`).get();
    const earnedBadgeIds = new Set();
    badgesSnap.forEach((doc) => {
        const data = doc.data();
        if (data.progress >= 100) {
            earnedBadgeIds.add(doc.id);
        }
    });
    // Collect stats
    const stats = await collectUserStats(db, uid, eventContext);
    // Check relevant badges
    const relevantBadges = BADGE_CATALOG.filter((b) => b.event === event);
    const awarded = [];
    for (const badge of relevantBadges) {
        // Skip already earned
        if (earnedBadgeIds.has(badge.id))
            continue;
        const result = badge.check(stats);
        if (result.earned) {
            // Award the badge
            await db.doc(`users/${uid}/badges/${badge.id}`).set({
                badgeId: badge.id,
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                tier: badge.tier,
                earnedAt: firestore_1.FieldValue.serverTimestamp(),
                progress: 100,
            });
            awarded.push(badge.id);
            console.log(`[awardBadges] User ${uid} earned badge: ${badge.name}`);
            // Send notification (best-effort)
            try {
                await (0, sendNotification_1.sendNotificationToUser)(uid, 'Badge Earned!', `You earned the "${badge.name}" badge!`, { screen: 'profile', badgeId: badge.id });
            }
            catch (e) {
                console.warn(`[awardBadges] Notification failed for badge ${badge.id}:`, e);
            }
        }
        else if (result.progress > 0) {
            // Update progress for in-progress badges
            await db.doc(`users/${uid}/badges/${badge.id}`).set({
                badgeId: badge.id,
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                tier: badge.tier,
                progress: Math.floor(result.progress),
            }, { merge: true });
        }
    }
    return awarded;
}
//# sourceMappingURL=awardBadges.js.map