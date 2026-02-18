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

  const getCheckboxControls = useCallback((scope: ParentNode) => {
    const roleCheckboxes = Array.from(
      scope.querySelectorAll<HTMLElement>('[role="checkbox"]'),
    ).filter((el) => {
      if (
        el.hasAttribute("hidden") ||
        el.getAttribute("aria-hidden") === "true"
      ) {
        return false;
      }
      return true;
    });

    if (roleCheckboxes.length > 0) {
      return roleCheckboxes;
    }

    return Array.from(
      scope.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    ).filter((el) => {
      if (
        el.hasAttribute("hidden") ||
        el.getAttribute("aria-hidden") === "true"
      ) {
        return false;
      }
      return !el.disabled && el.tabIndex !== -1;
    });
  }, []);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const main = mainRef.current;
      if (!main) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (!activeEl) return;

      // --- Multiselect checkbox navigation ---
      // When focused on a checkbox inside a card, ArrowDown/Up moves between checkboxes
      const activeIsCheckbox =
        (activeEl instanceof HTMLInputElement &&
          activeEl.type === "checkbox") ||
        activeEl.getAttribute("role") === "checkbox";

      if (activeIsCheckbox) {
        const card = activeEl.closest<HTMLElement>("[data-setting-key]");
        if (card && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
          const checkboxes = getCheckboxControls(card);
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
        const target = e.key === "Home" ? cards[0] : cards[cards.length - 1];
        target.focus();
        target.scrollIntoView?.({ block: "nearest" });
        return;
      }

      if (e.key === "Enter") {
        if (!isCardItself) return;

        e.preventDefault();

        // Multiselect: drill into first checkbox
        const checkbox = getCheckboxControls(focusedCard)[0];
        if (checkbox) {
          checkbox.focus();
          return;
        }

        // Other controls: find first interactive element (skip tabIndex=-1 utility buttons)
        const control = Array.from(
          focusedCard.querySelectorAll<HTMLElement>(
            "button, input, select, textarea",
          ),
        ).find((el) => {
          if (el.getAttribute("data-settera-copy-link") === "true")
            return false;
          if (el.tabIndex === -1) return false;
          if (
            el instanceof HTMLInputElement ||
            el instanceof HTMLButtonElement ||
            el instanceof HTMLSelectElement ||
            el instanceof HTMLTextAreaElement
          ) {
            if (el.disabled) return false;
          }
          return true;
        });
        if (control) {
          control.focus();
        }
        return;
      }
    },
    [getCheckboxControls, mainRef],
  );

  return { onKeyDown };
}
