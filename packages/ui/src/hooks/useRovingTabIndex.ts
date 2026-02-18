import { useState, useCallback, useEffect } from "react";
import type { KeyboardEvent } from "react";

export interface UseRovingTabIndexOptions {
  itemCount: number;
  orientation?: "vertical" | "horizontal";
  wrap?: boolean;
}

export interface UseRovingTabIndexResult {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  getTabIndex: (index: number) => 0 | -1;
  onKeyDown: (e: KeyboardEvent) => void;
}

/**
 * Generic roving tabindex utility.
 * Manages a single focused index within a group of items.
 * Handles ArrowUp/Down (or Left/Right for horizontal), Home, and End.
 */
export function useRovingTabIndex(
  options: UseRovingTabIndexOptions,
): UseRovingTabIndexResult {
  const { itemCount, orientation = "vertical", wrap = true } = options;

  const [focusedIndex, setFocusedIndex] = useState(0);

  // Clamp focusedIndex when itemCount shrinks
  useEffect(() => {
    if (itemCount > 0 && focusedIndex >= itemCount) {
      setFocusedIndex(itemCount - 1);
    }
  }, [itemCount, focusedIndex]);

  const getTabIndex = useCallback(
    (index: number): 0 | -1 => (index === focusedIndex ? 0 : -1),
    [focusedIndex],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (itemCount === 0) return;

      const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
      const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

      let nextIndex: number | null = null;

      if (e.key === nextKey) {
        if (focusedIndex < itemCount - 1) {
          nextIndex = focusedIndex + 1;
        } else if (wrap) {
          nextIndex = 0;
        }
      } else if (e.key === prevKey) {
        if (focusedIndex > 0) {
          nextIndex = focusedIndex - 1;
        } else if (wrap) {
          nextIndex = itemCount - 1;
        }
      } else if (e.key === "Home") {
        nextIndex = 0;
      } else if (e.key === "End") {
        nextIndex = itemCount - 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        setFocusedIndex(nextIndex);
      }
    },
    [focusedIndex, itemCount, orientation, wrap],
  );

  return { focusedIndex, setFocusedIndex, getTabIndex, onKeyDown };
}
