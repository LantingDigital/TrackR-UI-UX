/**
 * Feed section entrance animation coordinator.
 *
 * Module-level pub/sub that lets feed sections register animation callbacks
 * and triggers them when FlatList's onViewableItemsChanged reports the section
 * has entered the viewport. Each section animates exactly once -- the triggered
 * Set persists across tab switches but resets on app restart.
 *
 * Zero re-renders: callbacks fire directly, no React state involved.
 */

type Callback = () => void;

const listeners = new Map<string, Callback>();
const triggered = new Set<string>();

/**
 * Register a callback to fire when the section with `id` enters the viewport.
 * If the section was already visible (triggered), the callback fires immediately.
 */
export function onBecomeVisible(id: string, cb: Callback): void {
  listeners.set(id, cb);
  if (triggered.has(id)) {
    cb();
  }
}

/**
 * Unregister the callback for `id` (call in useEffect cleanup).
 */
export function offBecomeVisible(id: string): void {
  listeners.delete(id);
}

/**
 * Called from HomeScreen's onViewableItemsChanged.
 * Triggers animation callbacks for newly visible items.
 */
export function triggerVisible(ids: string[]): void {
  for (const id of ids) {
    if (!triggered.has(id)) {
      triggered.add(id);
      listeners.get(id)?.();
    }
  }
}

/**
 * Check if a section has already been animated (used to set initial value).
 */
export function hasBeenVisible(id: string): boolean {
  return triggered.has(id);
}
