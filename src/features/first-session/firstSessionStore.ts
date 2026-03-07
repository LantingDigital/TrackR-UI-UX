import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// AsyncStorage Key
// ============================================
const STORAGE_KEY = '@trackr/first-session-dismissed';

// ============================================
// Module-Level State
// ============================================
let dismissed = new Set<string>();
let initialized = false;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

// ============================================
// Persistence
// ============================================
async function load(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      dismissed = new Set(JSON.parse(raw));
    }
  } catch {}
}

async function save(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch {}
}

// ============================================
// Init
// ============================================
async function init() {
  if (initialized) return;
  initialized = true;
  await load();
  notify();
}

// Auto-init on module load
init();

// ============================================
// Actions
// ============================================
export function dismissCard(id: string) {
  dismissed = new Set(dismissed);
  dismissed.add(id);
  save();
  notify();
}

export function resetCards() {
  dismissed = new Set();
  save();
  notify();
}

// ============================================
// Getters
// ============================================
export function isDismissed(id: string): boolean {
  return dismissed.has(id);
}

export function getDismissedIds(): Set<string> {
  return dismissed;
}

// ============================================
// Subscription
// ============================================
export function addListener(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
