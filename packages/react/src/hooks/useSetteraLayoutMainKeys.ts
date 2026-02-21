import { useCallback, useEffect } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { useSetteraGlobalKeys, isTextInput } from "./useSetteraGlobalKeys.js";
import { useContentCardNavigation } from "./useContentCardNavigation.js";

export interface UseSetteraLayoutMainKeysOptions {
  containerRef: RefObject<HTMLElement | null>;
  mainRef: RefObject<HTMLElement | null>;
  clearSearch: () => void;
  searchQuery: string;
  registerFocusContentHandler: (handler: () => void) => () => void;
  closeSubpage?: (() => void) | null;
  subpageSettingKey?: string | null;
  /** CSS selector for the sidebar element. Passed to useSetteraGlobalKeys. */
  sidebarSelector?: string;
}

/** @internal SetteraLayout implementation detail; not part of public API. */
export function useSetteraLayoutMainKeys({
  containerRef,
  mainRef,
  clearSearch,
  searchQuery,
  registerFocusContentHandler,
  closeSubpage,
  subpageSettingKey,
  sidebarSelector,
}: UseSetteraLayoutMainKeysOptions) {
  useSetteraGlobalKeys({
    containerRef,
    clearSearch,
    searchQuery,
    closeSubpage,
    subpageSettingKey,
    sidebarSelector,
  });
  const { onKeyDown: cardNavKeyDown } = useContentCardNavigation({ mainRef });

  // Register handler so sidebar Enter can focus the first card in content.
  useEffect(() => {
    return registerFocusContentHandler(() => {
      requestAnimationFrame(() => {
        const main = mainRef.current;
        if (!main) return;
        const target = main.querySelector<HTMLElement>("[data-setting-key]");
        if (target) {
          target.focus();
        } else {
          main.focus();
        }
      });
    });
  }, [mainRef, registerFocusContentHandler]);

  const handleSectionKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (!e.ctrlKey) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (isTextInput(e.target)) return;

      const main = e.currentTarget;
      const headings = Array.from(
        main.querySelectorAll<HTMLElement>(
          'h2[id^="settera-section-"], h3[id^="settera-subsection-"]',
        ),
      );
      if (headings.length === 0) return;

      e.preventDefault();

      const activeEl = document.activeElement;
      let currentIndex = -1;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i] === activeEl || headings[i].contains(activeEl)) {
          currentIndex = i;
          break;
        }
      }

      const nextIndex =
        e.key === "ArrowDown"
          ? currentIndex < headings.length - 1
            ? currentIndex + 1
            : 0
          : currentIndex > 0
            ? currentIndex - 1
            : headings.length - 1;

      headings[nextIndex].focus();
    },
    [],
  );

  const handleComposedKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      cardNavKeyDown(e);
      if (!e.defaultPrevented) {
        handleSectionKeyDown(e);
      }
    },
    [cardNavKeyDown, handleSectionKeyDown],
  );

  return {
    handleComposedKeyDown,
  };
}
