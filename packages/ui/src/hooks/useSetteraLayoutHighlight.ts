import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

export interface UseSetteraLayoutHighlightOptions {
  activePage: string;
  mainRef: RefObject<HTMLElement | null>;
  prefersReducedMotion: boolean;
  setHighlightedSettingKey: (key: string | null) => void;
}

/** @internal SetteraLayout implementation detail; not part of public API. */
export function useSetteraLayoutHighlight({
  activePage,
  mainRef,
  prefersReducedMotion,
  setHighlightedSettingKey,
}: UseSetteraLayoutHighlightOptions) {
  const pendingScrollKeyRef = useRef<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const escapeSelectorValue = useCallback((value: string) => {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/["\\]/g, "\\$&");
  }, []);

  const scrollToSettingNow = useCallback(
    (key: string) => {
      const main = mainRef.current;
      if (!main) return false;
      const el = main.querySelector(
        `[data-setting-key="${escapeSelectorValue(key)}"]`,
      );
      if (!el) return false;

      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({
          behavior: prefersReducedMotion ? "instant" : "smooth",
          block: "center",
        });
      }
      setHighlightedSettingKey(key);
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(
        () => setHighlightedSettingKey(null),
        2000,
      );
      return true;
    },
    [escapeSelectorValue, mainRef, prefersReducedMotion, setHighlightedSettingKey],
  );

  const scrollToSetting = useCallback(
    (key: string) => {
      requestAnimationFrame(() => {
        void scrollToSettingNow(key);
      });
    },
    [scrollToSettingNow],
  );

  const setPendingScrollKey = useCallback((key: string | null) => {
    pendingScrollKeyRef.current = key;
  }, []);

  useEffect(() => {
    return () => clearTimeout(highlightTimerRef.current);
  }, []);

  // Consume pending scroll key after page renders.
  useEffect(() => {
    const key = pendingScrollKeyRef.current;
    if (!key) return;

    if (scrollToSettingNow(key)) {
      pendingScrollKeyRef.current = null;
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const attemptScroll = () => {
      if (cancelled) return;

      const didScroll = scrollToSettingNow(key);
      if (didScroll) {
        pendingScrollKeyRef.current = null;
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) return;
      requestAnimationFrame(attemptScroll);
    };

    requestAnimationFrame(attemptScroll);

    return () => {
      cancelled = true;
    };
  }, [activePage, scrollToSettingNow]);

  return {
    setPendingScrollKey,
    scrollToSetting,
  };
}
