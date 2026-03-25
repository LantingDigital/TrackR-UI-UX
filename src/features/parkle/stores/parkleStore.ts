import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useReducer } from 'react';
import {
  ParkleGameState,
  ParkleStats,
  ParklePark,
  GameMode,
  MAX_GUESSES,
  HINT_GUESSES,
} from '../types/parkle';
import {
  createGuess,
  getDailyPark,
  getDailyPuzzleNumber,
  getRandomPark,
  generateHint,
} from '../data/parkleComparison';
import { submitParkleResult } from '../../../services/firebase/gameStatsSync';

// ============================================
// AsyncStorage Keys
// ============================================
const STORAGE_STATS = '@parkle_stats';
const STORAGE_DAILY = '@parkle_daily';
const STORAGE_DIFFICULTY = '@parkle_difficulty';

// ============================================
// Difficulty
// ============================================
export type ParkleDifficulty = 'easy' | 'hard';
let difficulty: ParkleDifficulty = 'easy';

async function loadDifficulty() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DIFFICULTY);
    if (raw === 'hard') difficulty = 'hard';
  } catch {}
}

async function saveDifficulty() {
  try {
    await AsyncStorage.setItem(STORAGE_DIFFICULTY, difficulty);
  } catch {}
}

function setDifficulty(value: ParkleDifficulty) {
  difficulty = value;
  saveDifficulty();
  notify();
}

function getDifficultyValue(): ParkleDifficulty {
  return difficulty;
}

// ============================================
// Module-Level State
// ============================================
let game: ParkleGameState | null = null;
let stats: ParkleStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0, 0],
  recentGames: [],
};
let initialized = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ============================================
// Persistence
// ============================================
async function loadStats(): Promise<ParkleStats> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_STATS);
    if (raw) {
      const parsed = JSON.parse(raw) as ParkleStats;
      if (!parsed.recentGames) parsed.recentGames = [];
      return parsed;
    }
  } catch {}
  return stats;
}

async function saveStats() {
  try {
    await AsyncStorage.setItem(STORAGE_STATS, JSON.stringify(stats));
  } catch {}
}

async function loadDaily(): Promise<ParkleGameState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DAILY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as ParkleGameState;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    if (saved.dailyDate === todayStr && saved.mode === 'daily') {
      return saved;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveDaily() {
  if (!game || game.mode !== 'daily') return;
  try {
    await AsyncStorage.setItem(STORAGE_DAILY, JSON.stringify(game));
  } catch {}
}

// ============================================
// Game API
// ============================================
async function init() {
  if (initialized) return;
  stats = await loadStats();
  await loadDifficulty();
  initialized = true;
  notify();
}

function getGame(): ParkleGameState | null {
  return game;
}

function getStats(): ParkleStats {
  return stats;
}

async function startGame(mode: GameMode) {
  if (mode === 'daily') {
    const saved = await loadDaily();
    if (saved) {
      game = saved;
      notify();
      return;
    }
    const target = getDailyPark(undefined, difficulty);
    const today = new Date();
    game = {
      mode: 'daily',
      target,
      guesses: [],
      hints: [],
      status: 'playing',
      dailyPuzzleNumber: getDailyPuzzleNumber(),
      dailyDate: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`,
    };
  } else {
    game = {
      mode: 'practice',
      target: getRandomPark(),
      guesses: [],
      hints: [],
      status: 'playing',
    };
  }
  notify();
}

function submitGuess(park: ParklePark): boolean {
  if (!game || game.status !== 'playing') return false;
  if (game.guesses.some((g) => g.park.id === park.id)) return false;

  const guess = createGuess(park, game.target);
  game.guesses.push(guess);

  if (guess.isCorrect) {
    game.status = 'won';
    stats.gamesPlayed++;
    stats.gamesWon++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.guessDistribution[game.guesses.length - 1]++;
    stats.recentGames = [
      ...(stats.recentGames ?? []).slice(-9),
      { won: true, guesses: game.guesses.length },
    ];
    saveStats();
    if (game.mode === 'daily') saveDaily();
    submitParkleResult({
      won: true,
      guesses: game.guesses.length,
      currentStreak: stats.currentStreak,
      bestStreak: stats.maxStreak,
      gamesPlayed: stats.gamesPlayed,
      gamesWon: stats.gamesWon,
    }).catch(() => {});
    notify();
    return true;
  }

  if (game.guesses.length >= MAX_GUESSES) {
    game.status = 'lost';
    stats.gamesPlayed++;
    stats.currentStreak = 0;
    stats.recentGames = [
      ...(stats.recentGames ?? []).slice(-9),
      { won: false, guesses: game.guesses.length },
    ];
    saveStats();
    if (game.mode === 'daily') saveDaily();
    submitParkleResult({
      won: false,
      guesses: game.guesses.length,
      currentStreak: 0,
      bestStreak: stats.maxStreak,
      gamesPlayed: stats.gamesPlayed,
      gamesWon: stats.gamesWon,
    }).catch(() => {});
    notify();
    return false;
  }

  if (HINT_GUESSES.includes(game.guesses.length)) {
    const hint = generateHint(game.target, game.guesses);
    if (hint) {
      game.hints.push(hint);
    }
  }

  if (game.mode === 'daily') saveDaily();
  notify();
  return false;
}

function resetGame() {
  game = null;
  notify();
}

function generateShareText(): string {
  if (!game) return '';

  const puzzleLabel = game.mode === 'daily'
    ? `Parkle #${game.dailyPuzzleNumber}`
    : 'Parkle (Practice)';
  const result = game.status === 'won'
    ? `${game.guesses.length}/${MAX_GUESSES}`
    : `X/${MAX_GUESSES}`;

  const rows = game.guesses.map((guess) => {
    const cells = guess.cells
      .sort((a, b) => a.row * 3 + a.col - (b.row * 3 + b.col))
      .map((cell) => {
        if (cell.result === 'correct') return '\u{1F7E9}';
        if (cell.result === 'close') return '\u{1F7E8}';
        return '\u2B1C';
      });
    return cells.join('');
  });

  return `${puzzleLabel} ${result}\n\n${rows.join('\n')}`;
}

// ============================================
// React Hook
// ============================================
const stableParkleActions = {
  startGame,
  submitGuess,
  resetGame,
  generateShareText,
  setDifficulty,
} as const;

let cachedParkleSnapshot: {
  game: ReturnType<typeof getGame>;
  stats: ReturnType<typeof getStats>;
  difficulty: ParkleDifficulty;
} | null = null;

export function useParkleStore() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    init();
    return () => { listeners.delete(forceUpdate); };
  }, []);

  const currentGame = getGame();
  const currentStats = getStats();
  const currentDifficulty = getDifficultyValue();
  if (
    !cachedParkleSnapshot ||
    cachedParkleSnapshot.game !== currentGame ||
    cachedParkleSnapshot.stats !== currentStats ||
    cachedParkleSnapshot.difficulty !== currentDifficulty
  ) {
    cachedParkleSnapshot = { game: currentGame, stats: currentStats, difficulty: currentDifficulty };
  }

  return {
    ...cachedParkleSnapshot,
    ...stableParkleActions,
  };
}
