import { useCallback, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COASTER_DATABASE } from '../../coastle/data/coastleDatabase';
import type {
  BattleState,
  BattlePreference,
  BattleResult,
  BattleCoasterStats,
  BattleInsight,
} from '../types/battle';

// ============================================
// AsyncStorage Key
// ============================================
const STORAGE_KEY = '@battle_history';

// ============================================
// Module-Level State
// ============================================
let state: BattleState = {
  currentRound: 0,
  totalRounds: 15,
  results: [],
  matchups: [],
  isComplete: false,
};

// Persisted history of all past battle results
let allResults: BattleResult[] = [];
let historyLoaded = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ============================================
// Persistence
// ============================================
async function loadHistory(): Promise<void> {
  if (historyLoaded) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      allResults = JSON.parse(raw);
    }
  } catch {}
  historyLoaded = true;
}

async function saveHistory(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(allResults));
  } catch {}
}

// ============================================
// Matchup Generation
// ============================================
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateMatchups(totalRounds: number): [string, string][] {
  const ids = COASTER_DATABASE.map((c) => c.id);
  const shuffled = shuffleArray(ids);
  const pairs: [string, string][] = [];
  const usedInRound = new Set<string>();

  for (let i = 0; i < shuffled.length - 1 && pairs.length < totalRounds; i += 2) {
    if (!usedInRound.has(shuffled[i]) && !usedInRound.has(shuffled[i + 1])) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
      usedInRound.add(shuffled[i]);
      usedInRound.add(shuffled[i + 1]);
    }
  }

  // If we didn't get enough pairs (unlikely with 150+ coasters), fill in more
  while (pairs.length < totalRounds) {
    const a = shuffled[Math.floor(Math.random() * shuffled.length)];
    let b = shuffled[Math.floor(Math.random() * shuffled.length)];
    while (b === a) {
      b = shuffled[Math.floor(Math.random() * shuffled.length)];
    }
    pairs.push([a, b]);
  }

  return pairs;
}

// ============================================
// Actions
// ============================================
export function initBattle(totalRounds = 15) {
  loadHistory();
  const matchups = generateMatchups(totalRounds);
  state = {
    currentRound: 0,
    totalRounds,
    results: [],
    matchups,
    isComplete: false,
  };
  notify();
}

export function submitBattle(preference: BattlePreference) {
  if (state.isComplete || state.currentRound >= state.totalRounds) return;

  const [coasterA, coasterB] = state.matchups[state.currentRound];
  const result: BattleResult = {
    coasterA,
    coasterB,
    preference,
    timestamp: Date.now(),
  };

  const newResults = [...state.results, result];
  const nextRound = state.currentRound + 1;
  const isComplete = nextRound >= state.totalRounds;

  state = {
    ...state,
    currentRound: nextRound,
    results: newResults,
    isComplete,
  };

  // Persist to history
  allResults = [...allResults, result];
  saveHistory();

  notify();
}

export function getCurrentMatchup() {
  if (state.isComplete || state.currentRound >= state.matchups.length) return null;
  const [idA, idB] = state.matchups[state.currentRound];
  const coasterA = COASTER_DATABASE.find((c) => c.id === idA);
  const coasterB = COASTER_DATABASE.find((c) => c.id === idB);
  if (!coasterA || !coasterB) return null;
  return { coasterA, coasterB };
}

export function getBattleResults(): {
  topCoasters: BattleCoasterStats[];
  insights: BattleInsight[];
} {
  const statsMap = new Map<string, BattleCoasterStats>();

  const getOrCreate = (id: string): BattleCoasterStats => {
    if (!statsMap.has(id)) {
      const coaster = COASTER_DATABASE.find((c) => c.id === id);
      statsMap.set(id, {
        id,
        name: coaster?.name ?? id,
        park: coaster?.park ?? '',
        wins: 0,
        losses: 0,
        ties: 0,
        battles: 0,
        winRate: 0,
      });
    }
    return statsMap.get(id)!;
  };

  for (const result of state.results) {
    if (result.preference === 'skip') continue;

    const a = getOrCreate(result.coasterA);
    const b = getOrCreate(result.coasterB);
    a.battles++;
    b.battles++;

    switch (result.preference) {
      case 'strong_a':
      case 'slight_a':
        a.wins++;
        b.losses++;
        break;
      case 'strong_b':
      case 'slight_b':
        b.wins++;
        a.losses++;
        break;
      case 'tie':
        a.ties++;
        b.ties++;
        break;
    }
  }

  // Calculate win rates
  statsMap.forEach((s) => {
    s.winRate = s.battles > 0 ? s.wins / s.battles : 0;
  });

  const allStats = Array.from(statsMap.values());
  const topCoasters = allStats
    .filter((s) => s.battles > 0)
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)
    .slice(0, 5);

  // Generate insights
  const insights: BattleInsight[] = [];

  // Material preference
  const materialWins: Record<string, number> = {};
  for (const result of state.results) {
    if (result.preference === 'skip' || result.preference === 'tie') continue;
    const winnerId =
      result.preference === 'strong_a' || result.preference === 'slight_a'
        ? result.coasterA
        : result.coasterB;
    const winner = COASTER_DATABASE.find((c) => c.id === winnerId);
    if (winner) {
      materialWins[winner.material] = (materialWins[winner.material] || 0) + 1;
    }
  }

  const topMaterial = Object.entries(materialWins).sort(([, a], [, b]) => b - a)[0];
  if (topMaterial) {
    insights.push({
      label: 'Material preference',
      value: `You prefer ${topMaterial[0].toLowerCase()} coasters`,
    });
  }

  // Speed preference
  const nonSkipResults = state.results.filter((r) => r.preference !== 'skip' && r.preference !== 'tie');
  let fastWins = 0;
  for (const result of nonSkipResults) {
    const winnerId =
      result.preference === 'strong_a' || result.preference === 'slight_a'
        ? result.coasterA
        : result.coasterB;
    const loserId = winnerId === result.coasterA ? result.coasterB : result.coasterA;
    const winner = COASTER_DATABASE.find((c) => c.id === winnerId);
    const loser = COASTER_DATABASE.find((c) => c.id === loserId);
    if (winner && loser && winner.speedMph > loser.speedMph) {
      fastWins++;
    }
  }
  if (nonSkipResults.length > 0) {
    const fastRate = fastWins / nonSkipResults.length;
    if (fastRate > 0.6) {
      insights.push({ label: 'Speed lover', value: 'You tend to pick the faster coaster' });
    } else if (fastRate < 0.4) {
      insights.push({ label: 'Smooth rider', value: 'Speed isn\'t everything for you' });
    }
  }

  // Inversion preference
  let inversionWins = 0;
  for (const result of nonSkipResults) {
    const winnerId =
      result.preference === 'strong_a' || result.preference === 'slight_a'
        ? result.coasterA
        : result.coasterB;
    const winner = COASTER_DATABASE.find((c) => c.id === winnerId);
    if (winner && winner.inversions > 0) {
      inversionWins++;
    }
  }
  if (nonSkipResults.length > 0) {
    const invRate = inversionWins / nonSkipResults.length;
    if (invRate > 0.6) {
      insights.push({ label: 'Loop lover', value: 'Inversions are your thing' });
    }
  }

  return { topCoasters, insights };
}

// ============================================
// Getters
// ============================================
export function getBattleState(): BattleState {
  return state;
}

// ============================================
// React Hook
// ============================================
export function useBattleStore() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => {
      listeners.delete(forceUpdate);
    };
  }, []);

  return {
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    results: state.results,
    matchups: state.matchups,
    isComplete: state.isComplete,
    initBattle: useCallback(initBattle, []),
    submitBattle: useCallback(submitBattle, []),
    getCurrentMatchup: useCallback(getCurrentMatchup, []),
    getBattleResults: useCallback(getBattleResults, []),
  };
}
