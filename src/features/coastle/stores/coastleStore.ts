import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  CoastleGameState,
  CoastleStats,
  CoastleCoaster,
  GameMode,
  MAX_GUESSES,
  HINT_GUESSES,
} from '../types/coastle';
import {
  createGuess,
  getDailyCoaster,
  getDailyPuzzleNumber,
  getRandomCoaster,
  generateHint,
} from '../data/coastleComparison';

// ============================================
// AsyncStorage Keys
// ============================================
const STORAGE_STATS = '@coastle_stats';
const STORAGE_DAILY = '@coastle_daily';

// ============================================
// Module-Level State
// ============================================
let game: CoastleGameState | null = null;
let stats: CoastleStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0, 0],
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
async function loadStats(): Promise<CoastleStats> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_STATS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return stats;
}

async function saveStats() {
  try {
    await AsyncStorage.setItem(STORAGE_STATS, JSON.stringify(stats));
  } catch {}
}

async function loadDaily(): Promise<CoastleGameState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_DAILY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as CoastleGameState;
    // Check if it's today's puzzle
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
  initialized = true;
  notify();
}

function getGame(): CoastleGameState | null {
  return game;
}

function getStats(): CoastleStats {
  return stats;
}

async function startGame(mode: GameMode) {
  if (mode === 'daily') {
    // Try to restore in-progress daily
    const saved = await loadDaily();
    if (saved) {
      game = saved;
      notify();
      return;
    }
    // New daily
    const target = getDailyCoaster();
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
    // Practice mode
    game = {
      mode: 'practice',
      target: getRandomCoaster(),
      guesses: [],
      hints: [],
      status: 'playing',
    };
  }
  notify();
}

function submitGuess(coaster: CoastleCoaster): boolean {
  if (!game || game.status !== 'playing') return false;

  // Prevent duplicates
  if (game.guesses.some((g) => g.coaster.id === coaster.id)) return false;

  const guess = createGuess(coaster, game.target);
  game.guesses.push(guess);

  // Check win
  if (guess.isCorrect) {
    game.status = 'won';
    stats.gamesPlayed++;
    stats.gamesWon++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.guessDistribution[game.guesses.length - 1]++;
    saveStats();
    if (game.mode === 'daily') saveDaily();
    notify();
    return true;
  }

  // Check loss
  if (game.guesses.length >= MAX_GUESSES) {
    game.status = 'lost';
    stats.gamesPlayed++;
    stats.currentStreak = 0;
    saveStats();
    if (game.mode === 'daily') saveDaily();
    notify();
    return false;
  }

  // Check for hints
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
    ? `Coastle #${game.dailyPuzzleNumber}`
    : 'Coastle (Practice)';
  const result = game.status === 'won'
    ? `${game.guesses.length}/${MAX_GUESSES}`
    : `X/${MAX_GUESSES}`;

  const rows = game.guesses.map((guess) => {
    return guess.cells
      .sort((a, b) => a.row * 3 + a.col - (b.row * 3 + b.col))
      .map((cell) => {
        if (cell.result === 'correct') return '🟩';
        if (cell.result === 'close') return '🟨';
        return '⬜';
      })
      .join('');
  });

  return `${puzzleLabel} ${result}\n\n${rows.join('\n')}`;
}

// ============================================
// React Hook
// ============================================
export function useCoastleStore() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    init();
    return () => { listeners.delete(forceUpdate); };
  }, []);

  return {
    game: getGame(),
    stats: getStats(),
    startGame: useCallback(startGame, []),
    submitGuess: useCallback(submitGuess, []),
    resetGame: useCallback(resetGame, []),
    generateShareText: useCallback(generateShareText, []),
  };
}
