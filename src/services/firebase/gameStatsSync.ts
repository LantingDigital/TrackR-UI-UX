/**
 * Game Stats Sync — Firestore persistence for all game stats
 *
 * Schema: users/{userId}/gameStats/{gameId}
 *
 * Each game document contains:
 * - Universal: gamesPlayed, lastPlayedAt
 * - Game-specific metrics (see GameStats type below)
 * - history: array of past game results
 *
 * This service provides read/write to Firestore when the user is authenticated.
 * Games work offline without auth — stats are persisted locally via AsyncStorage
 * in each game's store. This service syncs the local stats to Firestore when online.
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ============================================
// Types
// ============================================

export type GameId = 'coastle' | 'parkle' | 'trivia' | 'speed-sorter' | 'blind-ranking';

interface BaseGameStats {
  gamesPlayed: number;
  lastPlayedAt: string; // ISO date string
}

export interface CoastleGameStats extends BaseGameStats {
  currentStreak: number;
  bestStreak: number;
  winRate: number;
  history: Array<{ date: string; won: boolean; guesses: number }>;
}

export interface ParkleGameStats extends BaseGameStats {
  currentStreak: number;
  bestStreak: number;
  winRate: number;
  history: Array<{ date: string; won: boolean; guesses: number }>;
}

export interface TriviaGameStats extends BaseGameStats {
  highScore: number;
  correctPercentage: number;
  history: Array<{ date: string; score: number; total: number }>;
}

export interface SpeedSorterGameStats extends BaseGameStats {
  bestTime: number; // ms
  history: Array<{ date: string; accuracy: number; time: number }>;
}

export interface BlindRankingGameStats extends BaseGameStats {
  accuracy: number;
  history: Array<{ date: string; category: string; accuracy: number }>;
}

export type GameStats =
  | CoastleGameStats
  | ParkleGameStats
  | TriviaGameStats
  | SpeedSorterGameStats
  | BlindRankingGameStats;

// ============================================
// Helpers
// ============================================

function getUserId(): string | null {
  return auth().currentUser?.uid ?? null;
}

function getGameStatsRef(userId: string, gameId: GameId) {
  return firestore()
    .collection('users')
    .doc(userId)
    .collection('gameStats')
    .doc(gameId);
}

// ============================================
// Read
// ============================================

export async function getGameStats<T extends GameStats>(gameId: GameId): Promise<T | null> {
  const uid = getUserId();
  if (!uid) return null;

  try {
    const doc = await getGameStatsRef(uid, gameId).get();
    if (doc.exists()) {
      return doc.data() as T;
    }
    return null;
  } catch (err) {
    console.warn(`[gameStatsSync] Failed to read ${gameId} stats:`, err);
    return null;
  }
}

// ============================================
// Write
// ============================================

export async function saveGameStats(gameId: GameId, stats: Partial<GameStats>): Promise<boolean> {
  const uid = getUserId();
  if (!uid) return false;

  try {
    await getGameStatsRef(uid, gameId).set(
      {
        ...stats,
        lastPlayedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    return true;
  } catch (err) {
    console.warn(`[gameStatsSync] Failed to save ${gameId} stats:`, err);
    return false;
  }
}

// ============================================
// Score submission (used after game completion)
// ============================================

export async function submitCoastleResult(result: {
  won: boolean;
  guesses: number;
  currentStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  gamesWon: number;
}): Promise<boolean> {
  const winRate = result.gamesPlayed > 0
    ? Math.round((result.gamesWon / result.gamesPlayed) * 100)
    : 0;

  return saveGameStats('coastle', {
    gamesPlayed: result.gamesPlayed,
    currentStreak: result.currentStreak,
    bestStreak: result.bestStreak,
    winRate,
  } as Partial<CoastleGameStats>);
}

export async function submitParkleResult(result: {
  won: boolean;
  guesses: number;
  currentStreak: number;
  bestStreak: number;
  gamesPlayed: number;
  gamesWon: number;
}): Promise<boolean> {
  const winRate = result.gamesPlayed > 0
    ? Math.round((result.gamesWon / result.gamesPlayed) * 100)
    : 0;

  return saveGameStats('parkle', {
    gamesPlayed: result.gamesPlayed,
    currentStreak: result.currentStreak,
    bestStreak: result.bestStreak,
    winRate,
  } as Partial<ParkleGameStats>);
}

export async function submitTriviaResult(result: {
  score: number;
  total: number;
  gamesPlayed: number;
  highScore: number;
  correctPercentage: number;
}): Promise<boolean> {
  return saveGameStats('trivia', {
    gamesPlayed: result.gamesPlayed,
    highScore: result.highScore,
    correctPercentage: result.correctPercentage,
  } as Partial<TriviaGameStats>);
}

export async function submitSpeedSorterResult(result: {
  accuracy: number;
  time: number;
  gamesPlayed: number;
  bestTime: number;
}): Promise<boolean> {
  return saveGameStats('speed-sorter', {
    gamesPlayed: result.gamesPlayed,
    bestTime: result.bestTime,
  } as Partial<SpeedSorterGameStats>);
}

export async function submitBlindRankingResult(result: {
  accuracy: number;
  category: string;
  gamesPlayed: number;
}): Promise<boolean> {
  return saveGameStats('blind-ranking', {
    gamesPlayed: result.gamesPlayed,
    accuracy: result.accuracy,
  } as Partial<BlindRankingGameStats>);
}
