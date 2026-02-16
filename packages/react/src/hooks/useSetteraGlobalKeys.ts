import { useEffect } from "react";
import type { RefObject } from "react";

export interface UseSetteraGlobalKeysOptions {
  containerRef: RefObject<HTMLElement | null>;
  clearSearch: () => void;
  searchQuery: string;
}

/**
 * Returns true if the element is a text-entry input where single-key
 * shortcuts (like `/`) should not trigger.
 */
export function isTextInput(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLInputElement) {
    return [
      "text",
      "email",
      "url",
      "password",
      "search",
      "number",
      "tel",
    ].includes(el.type);
  }
  return el instanceof HTMLTextAreaElement;
}

/**
 * Document-level keyboard shortcut handler for Settera.
 *
 * - `/` — Focus the search input (blocked when typing in text inputs)
 * - `Cmd+K` / `Ctrl+K` — Focus the search input (works everywhere)
 * - `Escape` — Clear search (when search has a query)
 * - `F6` / `Shift+F6` — Cycle focus between sidebar and content panes
 */
export function useSetteraGlobalKeys(
  options: UseSetteraGlobalKeysOptions,
): void {
  const { containerRef, clearSearch, searchQuery } = options;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const container = containerRef.current;
      if (!container) return;

      // / — Focus search (unless in a text input)
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (isTextInput(e.target)) return;
        const searchInput = container.querySelector<HTMLElement>(
          'input[role="searchbox"]',
        );
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        return;
      }

      // Cmd+K / Ctrl+K — Focus search (works everywhere)
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        const searchInput = container.querySelector<HTMLElement>(
          'input[role="searchbox"]',
        );
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        return;
      }

      // Escape — Clear search when there is a query.
      // Skip if the search input itself is focused — SetteraSearch handles
      // its own Escape so it works standalone without SetteraLayout.
      if (e.key === "Escape") {
        const searchInput = container.querySelector('input[role="searchbox"]');
        if (searchQuery && e.target !== searchInput) {
          e.preventDefault();
          clearSearch();
        }
        return;
      }

      // F6 / Shift+F6 — Pane cycling
      if (e.key === "F6") {
        e.preventDefault();
        const sidebar =
          container.querySelector<HTMLElement>('nav[role="tree"]');
        const main = container.querySelector<HTMLElement>("main");
        if (!sidebar || !main) return;

        const activeEl = document.activeElement;
        const isInSidebar = sidebar.contains(activeEl);
        const isInMain = main.contains(activeEl);

        if (e.shiftKey) {
          // Shift+F6: reverse direction
          if (isInMain) {
            // Move to sidebar — focus the button with tabIndex=0
            const target =
              sidebar.querySelector<HTMLElement>('[tabindex="0"]') || sidebar;
            target.focus();
          } else {
            // Move to main — focus first focusable element
            const target =
              main.querySelector<HTMLElement>(
                'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
              ) || main;
            target.focus();
          }
        } else {
          // F6: forward direction
          if (isInSidebar) {
            // Move to main — focus first focusable element
            const target =
              main.querySelector<HTMLElement>(
                'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
              ) || main;
            target.focus();
          } else {
            // Move to sidebar — focus the button with tabIndex=0
            const target =
              sidebar.querySelector<HTMLElement>('[tabindex="0"]') || sidebar;
            target.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, clearSearch, searchQuery]);
}
