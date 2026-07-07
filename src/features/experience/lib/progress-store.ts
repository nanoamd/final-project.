/**
 * Shared scroll-progress value (0 → 1) for "The Becoming".
 *
 * The 3D scene reads `progressStore.value` directly inside each frame
 * (via useFrame) — it must NEVER trigger a React re-render, or the whole
 * component tree would re-render 60 times a second while scrolling.
 *
 * UI that genuinely needs to react to progress (a progress bar, captions,
 * the "unlock" transition) should use `useProgressValue()` instead, which is
 * throttled-by-nature through React's external store batching.
 */
import { useSyncExternalStore } from "react";

type Listener = () => void;

class ProgressStore {
  value = 0;
  private listeners = new Set<Listener>();

  set(next: number) {
    this.value = next;
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.value;
}

export const progressStore = new ProgressStore();

/** React-reactive read of progress. Use sparingly (UI only, not the 3D scene). */
export function useProgressValue() {
  return useSyncExternalStore(
    progressStore.subscribe,
    progressStore.getSnapshot,
    () => 0,
  );
}
