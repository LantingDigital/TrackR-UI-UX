/**
 * getWeeklyChallenge — Callable Cloud Function
 *
 * Returns the current weekly challenge definition + user's progress.
 * Challenges rotate every Monday at midnight PT.
 *
 * Challenge definitions are stored in a Firestore admin doc.
 * If no admin-managed challenges exist, falls back to a hardcoded rotation.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ============================================
// Types
// ============================================

interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  type: 'log-rides' | 'rate-coasters' | 'play-games' | 'visit-parks';
  goal: number;
  startDate: string;
  endDate: string;
  reward: { type: 'badge' | 'points'; value: string };
}

interface ChallengeProgressDoc {
  challengeId: string;
  progress: number;
  goal: number;
  completedAt: FirebaseFirestore.Timestamp | null;
  startedAt: FirebaseFirestore.Timestamp;
  type: string;
}

// ============================================
// Hardcoded Rotation (fallback)
// ============================================

const CHALLENGE_ROTATION: Array<Omit<ChallengeDefinition, 'id' | 'startDate' | 'endDate'>> = [
  {
    title: 'Credit Collector',
    description: 'Log 5 rides this week',
    type: 'log-rides',
    goal: 5,
    reward: { type: 'points', value: '50' },
  },
  {
    title: 'Critic\'s Choice',
    description: 'Rate 3 coasters this week',
    type: 'rate-coasters',
    goal: 3,
    reward: { type: 'points', value: '30' },
  },
  {
    title: 'Game Night',
    description: 'Play 10 games this week',
    type: 'play-games',
    goal: 10,
    reward: { type: 'points', value: '40' },
  },
  {
    title: 'Park Explorer',
    description: 'Log rides at 2 different parks this week',
    type: 'visit-parks',
    goal: 2,
    reward: { type: 'badge', value: 'weekly-explorer' },
  },
];

/**
 * Get the Monday 00:00 PT for the given date's week.
 */
function getWeekStart(date: Date): Date {
  // Convert to PT (UTC-7 or UTC-8 depending on DST)
  const ptOffset = -7; // Approximate as PDT for simplicity
  const ptDate = new Date(date.getTime() + ptOffset * 60 * 60 * 1000);

  const day = ptDate.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday is 1
  const monday = new Date(ptDate);
  monday.setUTCDate(monday.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);

  // Convert back from PT to UTC
  return new Date(monday.getTime() - ptOffset * 60 * 60 * 1000);
}

function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  return end;
}

/**
 * Determine which rotation index applies for the given week.
 * Uses a fixed epoch (Jan 6 2025, a Monday) to compute week number.
 */
function getRotationIndex(weekStart: Date): number {
  const epoch = new Date('2025-01-06T00:00:00Z');
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weeksSinceEpoch = Math.floor(
    (weekStart.getTime() - epoch.getTime()) / weekMs,
  );
  return Math.abs(weeksSinceEpoch) % CHALLENGE_ROTATION.length;
}

// ============================================
// Cloud Function
// ============================================

export const getWeeklyChallenge = onCall(
  {
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const uid = request.auth.uid;
    const db = getFirestore();
    const now = new Date();

    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(weekStart);
    const challengeId = `week-${weekStart.toISOString().slice(0, 10)}`;

    // Try admin-managed challenge first
    let challenge: ChallengeDefinition | null = null;

    const adminChallenge = await db
      .doc(`_admin/challenges/weekly/${challengeId}`)
      .get();

    if (adminChallenge.exists) {
      challenge = adminChallenge.data() as ChallengeDefinition;
    } else {
      // Fall back to hardcoded rotation
      const idx = getRotationIndex(weekStart);
      const template = CHALLENGE_ROTATION[idx];
      challenge = {
        ...template,
        id: challengeId,
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      };
    }

    // Get user's progress for this challenge
    const progressRef = db.doc(`users/${uid}/challenges/${challengeId}`);
    const progressSnap = await progressRef.get();

    let progress: ChallengeProgressDoc | null = null;

    if (progressSnap.exists) {
      progress = progressSnap.data() as ChallengeProgressDoc;
    } else {
      // Auto-enroll the user in the current challenge
      const newProgress: ChallengeProgressDoc = {
        challengeId,
        progress: 0,
        goal: challenge.goal,
        completedAt: null,
        startedAt: FieldValue.serverTimestamp() as unknown as FirebaseFirestore.Timestamp,
        type: challenge.type,
      };
      await progressRef.set(newProgress);
      progress = { ...newProgress, startedAt: new Date() as unknown as FirebaseFirestore.Timestamp };
    }

    return { challenge, progress };
  },
);
