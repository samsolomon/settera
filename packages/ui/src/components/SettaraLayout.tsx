import React, { useRef, useCallback } from "react";
import {
  useSettaraSearch,
  useSettaraGlobalKeys,
  isTextInput,
} from "@settara/react";
import { SettaraSidebar } from "./SettaraSidebar.js";
import { SettaraPage } from "./SettaraPage.js";

export interface SettaraLayoutProps {
  renderIcon?: (iconName: string) => React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Two-column layout shell: sidebar navigation + content area.
 * When children are provided, they replace the auto-rendered SettaraPage.
 * Integrates global keyboard shortcuts and section heading jumping.
 */
export function SettaraLayout({ renderIcon, children }: SettaraLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { query: searchQuery, setQuery } = useSettaraSearch();

  const clearSearch = useCallback(() => setQuery(""), [setQuery]);

  useSettaraGlobalKeys({ containerRef, clearSearch, searchQuery });

  // Ctrl+ArrowDown/Up section heading jumping within <main>
  const handleMainKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!e.ctrlKey) return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      // Don't hijack Ctrl+Arrow in text inputs (word-level navigation)
      if (isTextInput(e.target)) return;

      const main = e.currentTarget;
      const headings = Array.from(
        main.querySelectorAll<HTMLElement>(
          'h2[id^="settara-section-"], h3[id^="settara-subsection-"]',
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
      <SettaraSidebar renderIcon={renderIcon} />
      <main
        onKeyDown={handleMainKeyDown}
        style={{
          flex: 1,
          padding: "var(--settara-page-padding, 24px 32px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "var(--settara-content-max-width, 640px)",
          }}
        >
          {children ?? <SettaraPage />}
        </div>
      </main>
    </div>
  );
}
