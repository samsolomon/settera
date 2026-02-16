import React, { useRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { useSetteraGlobalKeys } from "../hooks/useSetteraGlobalKeys.js";

function TestHarness({
  clearSearch,
  searchQuery,
}: {
  clearSearch: () => void;
  searchQuery: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useSetteraGlobalKeys({ containerRef, clearSearch, searchQuery });

  return (
    <div ref={containerRef}>
      <nav role="tree" aria-label="Settings navigation">
        <button tabIndex={0}>General</button>
        <button tabIndex={-1}>Advanced</button>
      </nav>
      <main>
        <input role="searchbox" type="text" aria-label="Search settings" />
        <input type="text" aria-label="Text field" />
        <textarea aria-label="Text area" />
        <button>Content Button</button>
        <h2 id="settera-section-a" tabIndex={-1}>
          Section A
        </h2>
      </main>
    </div>
  );
}

function setup(searchQuery = "") {
  const clearSearch = vi.fn();
  const result = render(
    <TestHarness clearSearch={clearSearch} searchQuery={searchQuery} />,
  );
  return { clearSearch, ...result };
}

function fireKey(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
  target?: Element,
) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  (target ?? document.activeElement ?? document.body).dispatchEvent(event);
  return event;
}

describe("useSetteraGlobalKeys", () => {
  describe("/ shortcut", () => {
    it("focuses search input when pressing /", () => {
      setup();
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[role="searchbox"]',
      )!;
      // Focus something else first
      const btn = document.querySelector<HTMLButtonElement>("button")!;
      btn.focus();
      expect(document.activeElement).toBe(btn);

      fireKey("/");
      expect(document.activeElement).toBe(searchInput);
    });

    it("does not focus search when typing / in a text input", () => {
      setup();
      const textInput = document.querySelector<HTMLInputElement>(
        'input[aria-label="Text field"]',
      )!;
      textInput.focus();

      fireKey("/", {}, textInput);
      // Should stay on the text input, not move to search
      expect(document.activeElement).toBe(textInput);
    });

    it("does not focus search when typing / in a textarea", () => {
      setup();
      const textarea = document.querySelector<HTMLTextAreaElement>("textarea")!;
      textarea.focus();

      fireKey("/", {}, textarea);
      expect(document.activeElement).toBe(textarea);
    });

    it("does not trigger when / is pressed with meta key", () => {
      setup();
      const btn = document.querySelector<HTMLButtonElement>("button")!;
      btn.focus();

      fireKey("/", { metaKey: true });
      expect(document.activeElement).toBe(btn);
    });
  });

  describe("Cmd+K / Ctrl+K shortcut", () => {
    it("focuses search input on Cmd+K", () => {
      setup();
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[role="searchbox"]',
      )!;
      const btn = document.querySelector<HTMLButtonElement>("button")!;
      btn.focus();

      fireKey("k", { metaKey: true });
      expect(document.activeElement).toBe(searchInput);
    });

    it("focuses search input on Ctrl+K", () => {
      setup();
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[role="searchbox"]',
      )!;
      const btn = document.querySelector<HTMLButtonElement>("button")!;
      btn.focus();

      fireKey("k", { ctrlKey: true });
      expect(document.activeElement).toBe(searchInput);
    });

    it("works even when focus is in a text input", () => {
      setup();
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[role="searchbox"]',
      )!;
      const textInput = document.querySelector<HTMLInputElement>(
        'input[aria-label="Text field"]',
      )!;
      textInput.focus();

      fireKey("k", { metaKey: true }, textInput);
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe("Escape shortcut", () => {
    it("calls clearSearch when search has a query", () => {
      const { clearSearch } = setup("hello");
      fireKey("Escape");
      expect(clearSearch).toHaveBeenCalledTimes(1);
    });

    it("does not call clearSearch when search is empty", () => {
      const { clearSearch } = setup("");
      fireKey("Escape");
      expect(clearSearch).not.toHaveBeenCalled();
    });
  });

  describe("F6 pane cycling", () => {
    it("moves focus from sidebar to main content", () => {
      setup();
      const sidebarBtn = document.querySelector<HTMLButtonElement>(
        'nav[role="tree"] button',
      )!;
      sidebarBtn.focus();
      expect(document.activeElement).toBe(sidebarBtn);

      fireKey("F6");

      // Should now be in main
      const main = document.querySelector("main")!;
      expect(main.contains(document.activeElement)).toBe(true);
    });

    it("moves focus from main to sidebar", () => {
      setup();
      const contentBtn =
        document.querySelector<HTMLButtonElement>("main button")!;
      contentBtn.focus();

      fireKey("F6");

      // Should now be in sidebar
      const sidebar = document.querySelector('nav[role="tree"]')!;
      expect(sidebar.contains(document.activeElement)).toBe(true);
    });

    it("focuses the tabIndex=0 button in sidebar", () => {
      setup();
      const contentBtn =
        document.querySelector<HTMLButtonElement>("main button")!;
      contentBtn.focus();

      fireKey("F6");

      // Should focus the button with tabIndex=0
      const target = document.querySelector<HTMLButtonElement>(
        'nav[role="tree"] [tabindex="0"]',
      )!;
      expect(document.activeElement).toBe(target);
    });

    it("Shift+F6 reverses direction: main to sidebar", () => {
      setup();
      const contentBtn =
        document.querySelector<HTMLButtonElement>("main button")!;
      contentBtn.focus();

      fireKey("F6", { shiftKey: true });

      // Shift+F6 from main → sidebar
      const sidebar = document.querySelector('nav[role="tree"]')!;
      expect(sidebar.contains(document.activeElement)).toBe(true);
    });

    it("Shift+F6 reverses direction: sidebar to main", () => {
      setup();
      const sidebarBtn = document.querySelector<HTMLButtonElement>(
        'nav[role="tree"] button',
      )!;
      sidebarBtn.focus();

      fireKey("F6", { shiftKey: true });

      const main = document.querySelector("main")!;
      expect(main.contains(document.activeElement)).toBe(true);
    });
  });
});
