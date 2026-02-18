import { useRef, useSyncExternalStore } from "react";
import type { SetteraValuesStore } from "../stores/index.js";

/**
 * Subscribe to a scalar/reference-stable selection from the store.
 * Re-renders only when `Object.is(prev, next)` is false.
 */
export function useStoreSelector<T>(
  store: SetteraValuesStore,
  selector: (state: ReturnType<SetteraValuesStore["getState"]>) => T,
): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const prevRef = useRef<T | undefined>(undefined);
  const initialized = useRef(false);

  const getSnapshot = () => {
    const next = selectorRef.current(store.getState());
    if (initialized.current && Object.is(prevRef.current, next)) {
      return prevRef.current as T;
    }
    initialized.current = true;
    prevRef.current = next;
    return next;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribe to a compound selection (object with multiple fields).
 * Uses shallow equality on each field to return the previous reference
 * when all fields are `===`, avoiding unnecessary re-renders.
 */
export function useStoreSlice<T extends Record<string, unknown>>(
  store: SetteraValuesStore,
  selector: (state: ReturnType<SetteraValuesStore["getState"]>) => T,
): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const prevRef = useRef<T | undefined>(undefined);
  const initialized = useRef(false);

  const getSnapshot = () => {
    const next = selectorRef.current(store.getState());
    if (initialized.current && prevRef.current !== undefined) {
      const prev = prevRef.current;
      let same = true;
      for (const k in next) {
        if (!Object.is(prev[k], next[k])) {
          same = false;
          break;
        }
      }
      if (same) return prev;
    }
    initialized.current = true;
    prevRef.current = next;
    return next;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
