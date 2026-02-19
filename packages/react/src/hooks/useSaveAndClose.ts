import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks an async save operation and calls `onComplete` when it finishes.
 *
 * `statusOrLoading` is either a saveStatus string ("idle" | "saving" | "saved" | "error")
 * or a boolean `isLoading` flag (for action pages).
 *
 * Call `trigger()` to begin watching. Once the in-flight indicator resolves,
 * `onComplete` fires and the hook resets.
 *
 * For sync operations (status never becomes "saving" / isLoading never becomes true),
 * onComplete fires immediately after `trigger()`.
 */
export function useSaveAndClose(
  statusOrLoading: string | boolean,
  onComplete: () => void,
): { trigger: () => void; isBusy: boolean } {
  const [isWaiting, setIsWaiting] = useState(false);
  const sawBusyRef = useRef(false);

  const isBusyNow =
    typeof statusOrLoading === "boolean"
      ? statusOrLoading
      : statusOrLoading === "saving";

  useEffect(() => {
    if (isBusyNow) {
      sawBusyRef.current = true;
    }
    if (!isWaiting) return;
    // Still busy — keep waiting
    if (sawBusyRef.current && isBusyNow) return;
    // Done (or was sync — never went busy)
    setIsWaiting(false);
    sawBusyRef.current = false;
    onComplete();
  }, [isBusyNow, isWaiting, onComplete]);

  const trigger = useCallback(() => {
    setIsWaiting(true);
  }, []);

  return { trigger, isBusy: isWaiting && isBusyNow };
}
