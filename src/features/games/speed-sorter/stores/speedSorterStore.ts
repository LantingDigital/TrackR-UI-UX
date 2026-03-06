// ─── Speed Sorter Store ────────────────────────────────────

import { useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SpeedSorterGameState, SpeedSorterStats, SpeedSorterRound, SortCategory, SpeedSorterCoaster } from '../types/speedSorter';
import { COASTER_INDEX } from '../../../../data/coasterIndex';

const STATS_KEY = '@trackr:speed_sorter_stats';
const SETTINGS_KEY = '@trackr:speed_sorter_settings';
const ROUNDS_PER_GAME = 5;
const COASTERS_PER_ROUND = 5;

// ============================================
// Settings
// ============================================

export interface SpeedSorterSettings {
  hardMode: boolean;
  showTimer: boolean;
}

let settings: SpeedSorterSettings = {
  hardMode: false,
  showTimer: true,
};

// ============================================
// Module-Level State
// ============================================

let gameState: SpeedSorterGameState = {
  status: 'idle',
  rounds: [],
  currentRoundIndex: 0,
  userOrder: [],
  roundScores: [],
  roundTimes: [],
  totalScore: 0,
  totalTime: 0,
  roundStartTime: 0,
};

let stats: SpeedSorterStats = {
  gamesPlayed: 0,
  bestScore: 0,
  bestTime: 0,
  totalRounds: 0,
  perfectRounds: 0,
};

type Listener = () => void;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((fn) => fn()); }

// ============================================
// Helpers
// ============================================

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const CATEGORIES: { cat: SortCategory; label: string; unit: string; key: keyof typeof COASTER_INDEX[0] }[] = [
  { cat: 'speed', label: 'Fastest', unit: 'mph', key: 'speedMph' },
  { cat: 'height', label: 'Tallest', unit: 'ft', key: 'heightFt' },
  { cat: 'length', label: 'Longest', unit: 'ft', key: 'lengthFt' },
  { cat: 'inversions', label: 'Most Inversions', unit: '', key: 'inversions' },
  { cat: 'year', label: 'Newest', unit: '', key: 'yearOpened' },
];

function generateRound(catDef: typeof CATEGORIES[0], coastersPerRound: number): SpeedSorterRound {
  const eligible = COASTER_INDEX
    .filter((c) => {
      const val = c[catDef.key] as number;
      return val > 0 && c.popularityRank <= 500;
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, 30);

  const sorted = [...eligible].sort((a, b) => (b[catDef.key] as number) - (a[catDef.key] as number));
  const step = Math.floor(sorted.length / coastersPerRound);
  const picks: SpeedSorterCoaster[] = [];
  for (let i = 0; i < coastersPerRound && i * step < sorted.length; i++) {
    const c = sorted[i * step];
    picks.push({ id: c.id, name: c.name, park: c.park, value: c[catDef.key] as number });
  }

  const correctOrder = [...picks].sort((a, b) => b.value - a.value).map((c) => c.id);

  return {
    category: catDef.cat,
    categoryLabel: catDef.label,
    unit: catDef.unit,
    coasters: shuffleArray(picks),
    correctOrder,
  };
}

// ============================================
// Stats Persistence
// ============================================

async function loadStats() {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (raw) { stats = JSON.parse(raw); notify(); }
  } catch {}
}
async function saveStats() {
  try { await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
}
loadStats();

async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) { settings = { ...settings, ...JSON.parse(raw) }; notify(); }
  } catch {}
}
async function saveSettings() {
  try { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}
loadSettings();

export function setHardMode(value: boolean): void {
  settings = { ...settings, hardMode: value };
  notify();
  saveSettings();
}

export function setShowTimer(value: boolean): void {
  settings = { ...settings, showTimer: value };
  notify();
  saveSettings();
}

// ============================================
// Actions
// ============================================

export function startGame(): void {
  const coastersPerRound = settings.hardMode ? 7 : COASTERS_PER_ROUND;
  const shuffledCats = shuffleArray(CATEGORIES);
  const rounds = shuffledCats.slice(0, ROUNDS_PER_GAME).map((c) => generateRound(c, coastersPerRound));

  gameState = {
    status: 'playing',
    rounds,
    currentRoundIndex: 0,
    userOrder: rounds[0].coasters.map((c) => c.id),
    roundScores: [],
    roundTimes: [],
    totalScore: 0,
    totalTime: 0,
    roundStartTime: Date.now(),
  };
  notify();
}

export function moveItem(fromIndex: number, toIndex: number): void {
  if (gameState.status !== 'playing') return;
  const order = [...gameState.userOrder];
  const [item] = order.splice(fromIndex, 1);
  order.splice(toIndex, 0, item);
  gameState = { ...gameState, userOrder: order };
  notify();
}

export function submitRound(): void {
  if (gameState.status !== 'playing') return;
  const round = gameState.rounds[gameState.currentRoundIndex];
  const roundTime = Date.now() - gameState.roundStartTime;

  let correct = 0;
  for (let i = 0; i < round.correctOrder.length; i++) {
    if (gameState.userOrder[i] === round.correctOrder[i]) correct++;
  }
  const accuracy = Math.round((correct / round.correctOrder.length) * 100);

  const newScores = [...gameState.roundScores, accuracy];
  const newTimes = [...gameState.roundTimes, roundTime];
  stats.totalRounds += 1;
  if (accuracy === 100) stats.perfectRounds += 1;

  gameState = { ...gameState, status: 'checking', roundScores: newScores, roundTimes: newTimes };
  notify();
}

export function nextRound(): void {
  const nextIdx = gameState.currentRoundIndex + 1;
  if (nextIdx >= gameState.rounds.length) {
    const totalScore = Math.round(
      gameState.roundScores.reduce((a, b) => a + b, 0) / gameState.roundScores.length,
    );
    const totalTime = gameState.roundTimes.reduce((a, b) => a + b, 0);
    stats.gamesPlayed += 1;
    if (totalScore > stats.bestScore) stats.bestScore = totalScore;
    if (stats.bestTime === 0 || totalTime < stats.bestTime) stats.bestTime = totalTime;
    saveStats();
    gameState = { ...gameState, status: 'results', totalScore, totalTime };
  } else {
    const nextRnd = gameState.rounds[nextIdx];
    gameState = {
      ...gameState,
      status: 'playing',
      currentRoundIndex: nextIdx,
      userOrder: nextRnd.coasters.map((c) => c.id),
      roundStartTime: Date.now(),
    };
  }
  notify();
}

export function resetGame(): void {
  gameState = {
    status: 'idle', rounds: [], currentRoundIndex: 0, userOrder: [],
    roundScores: [], roundTimes: [], totalScore: 0, totalTime: 0, roundStartTime: 0,
  };
  notify();
}

// ============================================
// React Hook
// ============================================

export function useSpeedSorterStore() {
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    listeners.add(forceUpdate);
    return () => { listeners.delete(forceUpdate); };
  }, []);
  return { game: gameState, stats, settings };
}
