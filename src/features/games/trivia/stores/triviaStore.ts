// ─── Trivia Store ──────────────────────────────────────────
//
// Module-level store for trivia game state + AsyncStorage stats.

import { useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TriviaGameState, TriviaStats, TriviaQuestion, TriviaCategory } from '../types/trivia';
import { TRIVIA_QUESTIONS } from '../data/triviaQuestions';
import { submitTriviaResult } from '../../../../services/firebase/gameStatsSync';

const STATS_KEY = '@trackr:trivia_stats';
const SETTINGS_KEY = '@trackr:trivia_settings';
const QUESTIONS_PER_ROUND = 10;

// ============================================
// Settings
// ============================================

export interface TriviaSettings {
  hardMode: boolean;
}

let settings: TriviaSettings = {
  hardMode: false,
};

// ============================================
// Module-Level State
// ============================================

let gameState: TriviaGameState = {
  status: 'idle',
  questions: [],
  currentIndex: 0,
  selectedAnswer: null,
  isRevealed: false,
  score: 0,
  streak: 0,
  answers: [],
};

let stats: TriviaStats = {
  gamesPlayed: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  bestStreak: 0,
  categoryBreakdown: {
    parks: { correct: 0, total: 0 },
    coasters: { correct: 0, total: 0 },
    manufacturers: { correct: 0, total: 0 },
    history: { correct: 0, total: 0 },
  },
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

function prepareQuestion(raw: typeof TRIVIA_QUESTIONS[0], id: string, hardMode: boolean): TriviaQuestion {
  const correctAnswer = raw.answers[0];
  let answers = [...raw.answers];

  // Hard mode: ADD two extra plausible wrong answers → 6 choices (harder to guess)
  if (hardMode) {
    const extraWrong = [
      'Bolliger & Mabillard', 'Intamin', 'Vekoma', 'Arrow Dynamics',
      'Great Coasters International', 'Philadelphia Toboggan Coasters',
      'Mack Rides', 'Zamperla', 'Premier Rides', 'S&S Worldwide',
      'Rocky Mountain Construction', 'Schwarzkopf', 'Gravity Group',
    ].filter(a => !answers.includes(a));
    const shuffledExtra = shuffleArray(extraWrong);
    answers = [...answers, ...shuffledExtra.slice(0, 2)];
  }

  const shuffled = shuffleArray(answers);
  return {
    id,
    category: raw.category,
    question: raw.question,
    answers: shuffled,
    correctIndex: shuffled.indexOf(correctAnswer),
  };
}

// ============================================
// Stats Persistence
// ============================================

async function loadStats() {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (raw) {
      stats = JSON.parse(raw);
      notify();
    }
  } catch {}
}

async function saveStats() {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

// Load on import
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

// ============================================
// Actions
// ============================================

export function startGame(): void {
  const shuffled = shuffleArray(TRIVIA_QUESTIONS);
  const selected = shuffled.slice(0, QUESTIONS_PER_ROUND);
  const questions = selected.map((q, i) => prepareQuestion(q, `tq-${i}`, settings.hardMode));

  gameState = {
    status: 'playing',
    questions,
    currentIndex: 0,
    selectedAnswer: null,
    isRevealed: false,
    score: 0,
    streak: 0,
    answers: [],
  };
  notify();
}

export function selectAnswer(answerIndex: number): void {
  if (gameState.isRevealed || gameState.selectedAnswer !== null) return;

  const question = gameState.questions[gameState.currentIndex];
  const correct = answerIndex === question.correctIndex;

  gameState = {
    ...gameState,
    selectedAnswer: answerIndex,
    isRevealed: true,
    score: correct ? gameState.score + 1 : gameState.score,
    streak: correct ? gameState.streak + 1 : 0,
    answers: [...gameState.answers, { questionId: question.id, correct }],
  };

  // Update stats
  const cat = question.category;
  stats.totalQuestions += 1;
  stats.categoryBreakdown[cat].total += 1;
  if (correct) {
    stats.totalCorrect += 1;
    stats.categoryBreakdown[cat].correct += 1;
  }
  if (gameState.streak > stats.bestStreak) {
    stats.bestStreak = gameState.streak;
  }

  notify();
}

export function nextQuestion(): void {
  const nextIdx = gameState.currentIndex + 1;
  if (nextIdx >= gameState.questions.length) {
    // Game over
    stats.gamesPlayed += 1;
    saveStats();
    const correctPct = stats.totalQuestions > 0
      ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
      : 0;
    submitTriviaResult({
      score: gameState.score,
      total: gameState.questions.length,
      gamesPlayed: stats.gamesPlayed,
      highScore: Math.max(gameState.score, stats.bestStreak),
      correctPercentage: correctPct,
    }).catch(() => {});
    gameState = { ...gameState, status: 'results' };
  } else {
    gameState = {
      ...gameState,
      currentIndex: nextIdx,
      selectedAnswer: null,
      isRevealed: false,
    };
  }
  notify();
}

export function resetGame(): void {
  gameState = {
    status: 'idle',
    questions: [],
    currentIndex: 0,
    selectedAnswer: null,
    isRevealed: false,
    score: 0,
    streak: 0,
    answers: [],
  };
  notify();
}

// ============================================
// Getters
// ============================================

export function getGameState(): TriviaGameState { return gameState; }
export function getStats(): TriviaStats { return stats; }

// ============================================
// React Hook
// ============================================

export function useTriviaStore() {
  const [, forceUpdate] = useReducer((c: number) => c + 1, 0);

  useEffect(() => {
    listeners.add(forceUpdate);
    return () => { listeners.delete(forceUpdate); };
  }, []);

  return { game: gameState, stats, settings };
}
