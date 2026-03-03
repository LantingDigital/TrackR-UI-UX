// Resume-safe progress tracking with atomic writes.

import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Atomically write a JSON file (write to .tmp, then rename).
 */
export function writeJsonAtomic(filepath, data) {
  const dir = dirname(filepath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const tmp = filepath + '.tmp';
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, filepath);
}

/**
 * Read a JSON file, returning defaultValue if it doesn't exist.
 */
export function readJson(filepath, defaultValue = null) {
  if (!existsSync(filepath)) return defaultValue;
  try {
    return JSON.parse(readFileSync(filepath, 'utf-8'));
  } catch {
    console.warn(`  Warning: could not parse ${filepath}, using default`);
    return defaultValue;
  }
}

/**
 * Create a progress tracker for a pipeline phase.
 * Batches writes to disk every `flushInterval` updates.
 */
export function createProgressTracker(filepath, flushInterval = 10) {
  let data = readJson(filepath, {});
  let pendingWrites = 0;

  function flush() {
    if (pendingWrites > 0) {
      writeJsonAtomic(filepath, data);
      pendingWrites = 0;
    }
  }

  // Flush on process exit
  const onExit = () => {
    flush();
    process.exit(0);
  };
  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);

  return {
    get(key) {
      return data[key];
    },

    set(key, value) {
      data[key] = value;
      pendingWrites++;
      if (pendingWrites >= flushInterval) flush();
    },

    getAll() {
      return { ...data };
    },

    setAll(newData) {
      data = newData;
      pendingWrites++;
      if (pendingWrites >= flushInterval) flush();
    },

    flush,

    /** Check if an article has already been successfully processed. */
    isDone(key) {
      const entry = data[key];
      return entry && (entry.status === 'success' || entry.status === 'skipped');
    },

    /** Check if an article should be retried. */
    shouldRetry(key) {
      const entry = data[key];
      if (!entry) return true;
      if (entry.status === 'error' && (entry.attempts || 0) < 3) return true;
      return false;
    },
  };
}
