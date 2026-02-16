import React, { useRef, useCallback, useEffect } from "react";
import {
  useSetteraSearch,
  useSetteraNavigation,
  useSetteraGlobalKeys,
  useContentCardNavigation,
  isTextInput,
} from "@settera/react";
import { SetteraSidebar } from "./SetteraSidebar.js";
import { SetteraPage } from "./SetteraPage.js";
import { ConfirmDialog } from "./ConfirmDialog.js";

export interface SetteraLayoutProps {
  renderIcon?: (iconName: string) => React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Two-column layout shell: sidebar navigation + content area.
 * When children are provided, they replace the auto-rendered SetteraPage.
 * Integrates global keyboard shortcuts and section heading jumping.
 */
export function SetteraLayout({ renderIcon, children }: SetteraLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const { query: searchQuery, setQuery } = useSetteraSearch();
  const { registerFocusContentHandler } = useSetteraNavigation();

  const clearSearch = useCallback(() => setQuery(""), [setQuery]);

  useSetteraGlobalKeys({ containerRef, clearSearch, searchQuery });

  const { onKeyDown: cardNavKeyDown } = useContentCardNavigation({ mainRef });

  // Register handler so sidebar Enter can focus the first card in content
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
  }, [registerFocusContentHandler]);

  // Ctrl+ArrowDown/Up section heading jumping within <main>
  const handleSectionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!e.ctrlKey) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      // Don't hijack Ctrl+Arrow in text inputs (word-level navigation)
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

      // Find current heading index
      let currentIndex = -1;
      for (let i = 0; i < headings.length; i++) {
        if (headings[i] === activeEl || headings[i].contains(activeEl)) {
          currentIndex = i;
          break;
        }
      }

      let nextIndex: number;
      if (e.key === "ArrowDown") {
        nextIndex = currentIndex < headings.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : headings.length - 1;
      }

      headings[nextIndex].focus();
    },
    [],
  );

  // Compose card navigation + section heading jumping
  const handleComposedKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      cardNavKeyDown(e);
      if (!e.defaultPrevented) {
        handleSectionKeyDown(e);
      }
    },
    [cardNavKeyDown, handleSectionKeyDown],
  );

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        height: "100%",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <SetteraSidebar renderIcon={renderIcon} />
      <main
        ref={mainRef}
        tabIndex={-1}
        onKeyDown={handleComposedKeyDown}
        style={{
          flex: 1,
          padding: "var(--settera-page-padding, 24px 32px)",
          overflowY: "auto",
          outline: "none",
        }}
      >
        <div
          style={{
            maxWidth: "var(--settera-content-max-width, 640px)",
          }}
        >
          {children ?? <SetteraPage />}
        </div>
      </main>
      <ConfirmDialog />
    </div>
  );
}
