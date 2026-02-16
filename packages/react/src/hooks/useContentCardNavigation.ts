import { useCallback } from "react";
import type { RefObject, KeyboardEvent } from "react";
import { isTextInput } from "./useSetteraGlobalKeys.js";

export interface UseContentCardNavigationOptions {
  mainRef: RefObject<HTMLElement | null>;
}

/**
 * Card-level keyboard navigation within the content area.
 *
 * Returns an `onKeyDown` handler to attach to `<main>`.
 * DOM-based — queries `[data-setting-key]` on each keypress so
 * dynamic visibility (search filtering, conditional settings) is
 * handled automatically.
 *
 * Card-focused keys:
 * - ArrowDown/Up (without Ctrl): move to next/prev card
 * - Home/End: first/last card
 * - Enter: drill into the primary control inside the card
 *
 * Multiselect drilled-in keys:
 * - When activeElement is a checkbox inside a card, ArrowDown/Up
 *   moves between checkboxes in that card
 */
export function useContentCardNavigation(
  options: UseContentCardNavigationOptions,
) {
  const { mainRef } = options;

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const main = mainRef.current;
      if (!main) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (!activeEl) return;

      // --- Multiselect checkbox navigation ---
      // When focused on a checkbox inside a card, ArrowDown/Up moves between checkboxes
      if (
        activeEl instanceof HTMLInputElement &&
        activeEl.type === "checkbox"
      ) {
        const card = activeEl.closest<HTMLElement>("[data-setting-key]");
        if (card && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          const checkboxes = Array.from(
            card.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
          );
          const idx = checkboxes.indexOf(activeEl);
          if (idx === -1) return;

          let nextIdx: number;
          if (e.key === "ArrowDown") {
            nextIdx = idx + 1;
          } else {
            nextIdx = idx - 1;
          }

          // Stop at edges (no wrap)
          if (nextIdx < 0 || nextIdx >= checkboxes.length) return;

          e.preventDefault();
          checkboxes[nextIdx].focus();
          return;
        }
      }

      // --- Card-level navigation ---
      // Only handle when a card itself is focused (not a child control)
      const focusedCard = activeEl.closest<HTMLElement>("[data-setting-key]");
      const isCardItself = focusedCard && activeEl === focusedCard;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // Don't interfere with Ctrl+Arrow (section jumping) or text input cursor
        if (e.ctrlKey || e.metaKey) return;
        if (isTextInput(activeEl)) return;

        // Only navigate between cards when the card itself is focused
        if (!isCardItself) return;

        const cards = Array.from(
          main.querySelectorAll<HTMLElement>("[data-setting-key]"),
        );
        const idx = cards.indexOf(focusedCard);
        if (idx === -1) return;

        let nextIdx: number;
        if (e.key === "ArrowDown") {
          nextIdx = idx + 1;
        } else {
          nextIdx = idx - 1;
        }

        // Stop at edges (no wrap)
        if (nextIdx < 0 || nextIdx >= cards.length) return;

        e.preventDefault();
        cards[nextIdx].focus();
        cards[nextIdx].scrollIntoView?.({ block: "nearest" });
        return;
      }

      if (e.key === "Home" || e.key === "End") {
        if (!isCardItself) return;

        const cards = Array.from(
          main.querySelectorAll<HTMLElement>("[data-setting-key]"),
        );
        if (cards.length === 0) return;

        e.preventDefault();
        const target =
          e.key === "Home" ? cards[0] : cards[cards.length - 1];
        target.focus();
        target.scrollIntoView?.({ block: "nearest" });
        return;
      }

      if (e.key === "Enter") {
        if (!isCardItself) return;

        e.preventDefault();

        // Multiselect: drill into first checkbox
        const checkbox = focusedCard.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        );
        if (checkbox) {
          checkbox.focus();
          return;
        }

        // Other controls: find first interactive element
        const control = focusedCard.querySelector<HTMLElement>(
          "button, input, select, textarea",
        );
        if (control) {
          control.focus();
        }
        return;
      }
    },
    [mainRef],
  );

  return { onKeyDown };
}
