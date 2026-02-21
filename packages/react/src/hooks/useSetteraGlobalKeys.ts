import { useEffect, useRef } from "react";
import type { RefObject } from "react";

export interface UseSetteraGlobalKeysOptions {
  containerRef: RefObject<HTMLElement | null>;
  clearSearch: () => void;
  searchQuery: string;
  closeSubpage?: (() => void) | null;
  subpageSettingKey?: string | null;
  /** CSS selector for the sidebar element. Defaults to `'nav[role="tree"]'`. */
  sidebarSelector?: string;
}

const DEFAULT_SIDEBAR_SELECTOR = 'nav[role="tree"]';

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
 * - `Escape` — Close subpage / clear search / blur input (layered priority)
 * - `F6` / `Shift+F6` — Cycle focus between sidebar and content panes
 */
export function useSetteraGlobalKeys(
  options: UseSetteraGlobalKeysOptions,
): void {
  const {
    containerRef,
    clearSearch,
    searchQuery,
    closeSubpage,
    subpageSettingKey,
    sidebarSelector = DEFAULT_SIDEBAR_SELECTOR,
  } = options;

  // Use refs for volatile values so the effect doesn't re-run on every change
  const searchQueryRef = useRef(searchQuery);
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const closeSubpageRef = useRef(closeSubpage);
  useEffect(() => {
    closeSubpageRef.current = closeSubpage;
  }, [closeSubpage]);

  const subpageSettingKeyRef = useRef(subpageSettingKey);
  useEffect(() => {
    subpageSettingKeyRef.current = subpageSettingKey;
  }, [subpageSettingKey]);

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

      // Escape — layered priority:
      if (e.key === "Escape") {
        // 1. Dialog open — let the dialog handle Escape
        if (container.querySelector('[role="dialog"], [role="alertdialog"]'))
          return;

        // 2. Subpage open — navigate back and focus the originating setting card
        if (subpageSettingKeyRef.current && closeSubpageRef.current) {
          e.preventDefault();
          const settingKey = subpageSettingKeyRef.current;
          closeSubpageRef.current();
          requestAnimationFrame(() => {
            const card = container.querySelector<HTMLElement>(
              `[data-setting-key="${CSS.escape(settingKey)}"]`,
            );
            if (card) card.focus();
          });
          return;
        }

        const searchInput = container.querySelector('input[role="searchbox"]');
        const activeEl = document.activeElement as HTMLElement | null;

        // 3. Search input focused — let SetteraSearch handle it
        if (activeEl === searchInput) return;

        const main = container.querySelector<HTMLElement>("main");
        const sidebar =
          container.querySelector<HTMLElement>(sidebarSelector);

        // 4. Text/number input in content → blur, focus enclosing card
        if (
          main &&
          activeEl &&
          main.contains(activeEl) &&
          isTextInput(activeEl)
        ) {
          e.preventDefault();
          (activeEl as HTMLElement).blur();
          const card = activeEl.closest<HTMLElement>("[data-setting-key]");
          if (card) {
            card.focus();
          } else {
            main.focus();
          }
          return;
        }

        // 5. Control inside a card (non-text) → drill out to enclosing card
        if (main && activeEl && main.contains(activeEl)) {
          const card = activeEl.closest<HTMLElement>("[data-setting-key]");
          if (card && activeEl !== card) {
            e.preventDefault();
            card.focus();
            return;
          }
        }

        // 6. Focus on card or <main> → return to sidebar
        if (main && sidebar && main.contains(activeEl)) {
          e.preventDefault();
          const target =
            sidebar.querySelector<HTMLElement>('[tabindex="0"]') || sidebar;
          target.focus();
          return;
        }

        // 7. Search query active — clear search
        if (searchQueryRef.current) {
          e.preventDefault();
          clearSearch();
        }
        return;
      }

      // F6 / Shift+F6 — Pane cycling
      if (e.key === "F6") {
        e.preventDefault();
        const sidebar =
          container.querySelector<HTMLElement>(sidebarSelector);
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
            // Move to main — focus first card
            const target =
              main.querySelector<HTMLElement>("[data-setting-key]") || main;
            target.focus();
          }
        } else {
          // F6: forward direction
          if (isInSidebar) {
            // Move to main — focus first card
            const target =
              main.querySelector<HTMLElement>("[data-setting-key]") || main;
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
  }, [containerRef, clearSearch, sidebarSelector]);
}
