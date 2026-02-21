import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraLayout } from "../components/SetteraLayout.js";
import type { SetteraSchema } from "@settera/schema";

/**
 * Schema with multiple sections and setting types for thorough card nav testing.
 * - Section A: boolean (autoSave), text (username)
 * - Section B: select (theme), multiselect (features)
 * - Section C: boolean (debug) — used for cross-section boundary tests
 */
const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      icon: "settings",
      sections: [
        {
          key: "sectionA",
          title: "Section A",
          settings: [
            { key: "autoSave", title: "Auto Save", type: "boolean" },
            { key: "username", title: "Username", type: "text" },
          ],
        },
        {
          key: "sectionB",
          title: "Section B",
          settings: [
            {
              key: "theme",
              title: "Theme",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
            },
            {
              key: "features",
              title: "Features",
              type: "multiselect",
              options: [
                { value: "alpha", label: "Alpha" },
                { value: "beta", label: "Beta" },
                { value: "gamma", label: "Gamma" },
              ],
            },
          ],
        },
        {
          key: "sectionC",
          title: "Section C",
          settings: [{ key: "debug", title: "Debug Mode", type: "boolean" }],
        },
      ],
    },
    {
      key: "advanced",
      title: "Advanced",
      sections: [
        {
          key: "hidden",
          title: "Hidden",
          settings: [
            {
              key: "hiddenSetting",
              title: "Hidden Setting",
              type: "boolean",
              visibleWhen: { setting: "debug", equals: true },
            },
          ],
        },
      ],
    },
  ],
};

function renderLayout(values: Record<string, unknown> = {}) {
  return render(
    <Settera schema={schema} values={values} onChange={() => {}}>
      <SetteraLayout />
    </Settera>,
  );
}

function fireKey(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
  target?: Element,
) {
  return fireEvent.keyDown(target ?? document.activeElement ?? document.body, {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
}

function getCards(): HTMLElement[] {
  const main = screen.getByRole("main");
  return Array.from(main.querySelectorAll<HTMLElement>("[data-setting-key]"));
}

function focusElement(element: HTMLElement) {
  act(() => {
    element.focus();
  });
}

function focusFirstCard() {
  const cards = getCards();
  expect(cards.length).toBeGreaterThan(0);
  focusElement(cards[0]);
  expect(document.activeElement).toBe(cards[0]);
  return cards;
}

describe("SetteraLayout card navigation", () => {
  describe("ArrowDown/Up moves between cards", () => {
    it("ArrowDown moves to next card", () => {
      renderLayout();
      const cards = focusFirstCard();

      fireKey("ArrowDown");
      expect(document.activeElement).toBe(cards[1]);
    });

    it("ArrowUp moves to previous card", () => {
      renderLayout();
      const cards = getCards();
      focusElement(cards[1]);

      fireKey("ArrowUp");
      expect(document.activeElement).toBe(cards[0]);
    });

    it("no wrap at bottom edge", () => {
      renderLayout();
      const cards = getCards();
      const lastCard = cards[cards.length - 1];
      focusElement(lastCard);

      fireKey("ArrowDown");
      // Should stay on last card
      expect(document.activeElement).toBe(lastCard);
    });

    it("no wrap at top edge", () => {
      renderLayout();
      const cards = focusFirstCard();

      fireKey("ArrowUp");
      // Should stay on first card
      expect(document.activeElement).toBe(cards[0]);
    });

    it("crosses section boundaries", () => {
      renderLayout();
      const cards = getCards();
      // autoSave and username are in sectionA, theme is in sectionB
      // Card 1 = username (index 1), Card 2 = theme (index 2)
      focusElement(cards[1]);

      fireKey("ArrowDown");
      expect(document.activeElement).toBe(cards[2]);
      expect(cards[2].getAttribute("data-setting-key")).toBe("theme");
    });
  });

  describe("Home/End", () => {
    it("Home jumps to first card", () => {
      renderLayout();
      const cards = getCards();
      focusElement(cards[2]);

      fireKey("Home");
      expect(document.activeElement).toBe(cards[0]);
    });

    it("End jumps to last card", () => {
      renderLayout();
      focusFirstCard();

      fireKey("End");
      expect(document.activeElement).toBe(getCards()[getCards().length - 1]);
    });
  });

  describe("Enter drills into control", () => {
    it("Enter on boolean card focuses the switch button", () => {
      renderLayout();
      const cards = focusFirstCard();
      expect(cards[0].getAttribute("data-setting-key")).toBe("autoSave");

      fireKey("Enter");

      const switchBtn = cards[0].querySelector('button[role="switch"]');
      expect(document.activeElement).toBe(switchBtn);
    });

    it("Enter on text card focuses the text input", () => {
      renderLayout();
      const cards = getCards();
      const textCard = cards.find(
        (c) => c.getAttribute("data-setting-key") === "username",
      )!;
      focusElement(textCard);

      fireKey("Enter");

      const input = textCard.querySelector('input[type="text"]');
      expect(document.activeElement).toBe(input);
    });

    it("Enter on select card focuses the select trigger", () => {
      renderLayout();
      const cards = getCards();
      const selectCard = cards.find(
        (c) => c.getAttribute("data-setting-key") === "theme",
      )!;
      focusElement(selectCard);

      fireKey("Enter");

      const select = selectCard.querySelector('button[role="combobox"]');
      expect(document.activeElement).toBe(select);
    });

    it("Enter on multiselect card focuses first checkbox", () => {
      renderLayout();
      const cards = getCards();
      const msCard = cards.find(
        (c) => c.getAttribute("data-setting-key") === "features",
      )!;
      focusElement(msCard);

      fireKey("Enter");

      const checkboxes = msCard.querySelectorAll('[role="checkbox"]');
      expect(document.activeElement).toBe(checkboxes[0]);
    });
  });

  describe("Escape drills out: control → card → sidebar", () => {
    it("Escape from switch button returns to card", () => {
      renderLayout();
      const cards = focusFirstCard();
      const switchBtn = cards[0].querySelector<HTMLElement>(
        'button[role="switch"]',
      )!;
      focusElement(switchBtn);

      fireKey("Escape");
      expect(document.activeElement).toBe(cards[0]);
    });

    it("Escape from select trigger returns to card", () => {
      renderLayout();
      const cards = getCards();
      const selectCard = cards.find(
        (c) => c.getAttribute("data-setting-key") === "theme",
      )!;
      const select = selectCard.querySelector<HTMLElement>(
        'button[role="combobox"]',
      )!;
      focusElement(select);

      fireKey("Escape");
      expect(document.activeElement).toBe(selectCard);
    });

    it("Escape from card returns to sidebar", () => {
      renderLayout();
      focusFirstCard();

      fireKey("Escape");

      const sidebar = screen.getByRole("tree");
      expect(sidebar.contains(document.activeElement)).toBe(true);
    });

    it("full cycle: sidebar → card → control → card → sidebar", async () => {
      const user = userEvent.setup();
      renderLayout();

      // Start in sidebar
      const sidebar = screen.getByRole("tree");
      const generalBtn = sidebar.querySelector<HTMLElement>(
        'button[aria-current="page"]',
      )!;
      focusElement(generalBtn);

      // Enter → first card
      await user.keyboard("{Enter}");
      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r));
      });
      expect(
        (document.activeElement as HTMLElement)?.hasAttribute(
          "data-setting-key",
        ),
      ).toBe(true);
      const card = document.activeElement as HTMLElement;

      // Enter → control
      fireKey("Enter");
      expect(document.activeElement).not.toBe(card);
      expect(card.contains(document.activeElement)).toBe(true);

      // Escape → card
      fireKey("Escape");
      expect(document.activeElement).toBe(card);

      // Escape → sidebar
      fireKey("Escape");
      expect(sidebar.contains(document.activeElement)).toBe(true);
    });
  });

  describe("Multiselect checkbox navigation", () => {
    it("ArrowDown/Up moves between checkboxes", () => {
      renderLayout();
      const cards = getCards();
      const msCard = cards.find(
        (c) => c.getAttribute("data-setting-key") === "features",
      )!;
      focusElement(msCard);

      // Enter to drill in
      fireKey("Enter");

      const checkboxes = Array.from(
        msCard.querySelectorAll<HTMLElement>('[role="checkbox"]'),
      );
      expect(document.activeElement).toBe(checkboxes[0]);

      // ArrowDown to second checkbox
      fireKey("ArrowDown");
      expect(document.activeElement).toBe(checkboxes[1]);

      // ArrowDown to third checkbox
      fireKey("ArrowDown");
      expect(document.activeElement).toBe(checkboxes[2]);

      // ArrowDown at bottom — no wrap
      fireKey("ArrowDown");
      expect(document.activeElement).toBe(checkboxes[2]);

      // ArrowUp back to second
      fireKey("ArrowUp");
      expect(document.activeElement).toBe(checkboxes[1]);

      // ArrowUp to first
      fireKey("ArrowUp");
      expect(document.activeElement).toBe(checkboxes[0]);

      // ArrowUp at top — no wrap
      fireKey("ArrowUp");
      expect(document.activeElement).toBe(checkboxes[0]);
    });

    it("Escape from checkbox returns to card", () => {
      renderLayout();
      const cards = getCards();
      const msCard = cards.find(
        (c) => c.getAttribute("data-setting-key") === "features",
      )!;
      focusElement(msCard);
      fireKey("Enter");

      const checkbox = msCard.querySelector<HTMLElement>('[role="checkbox"]')!;
      expect(document.activeElement).toBe(checkbox);

      fireKey("Escape");
      expect(document.activeElement).toBe(msCard);
    });
  });

  describe("Keys ignored when child control is focused", () => {
    it("Home/End do nothing when a child control is focused", () => {
      renderLayout();
      const cards = getCards();
      const switchBtn = cards[0].querySelector<HTMLElement>(
        'button[role="switch"]',
      )!;
      focusElement(switchBtn);

      fireKey("Home");
      expect(document.activeElement).toBe(switchBtn);

      fireKey("End");
      expect(document.activeElement).toBe(switchBtn);
    });

    it("Enter does nothing when a child control is focused", () => {
      renderLayout();
      const cards = getCards();
      const switchBtn = cards[0].querySelector<HTMLElement>(
        'button[role="switch"]',
      )!;
      focusElement(switchBtn);

      fireKey("Enter");
      // Should stay on the switch (not re-drill or navigate)
      expect(document.activeElement).toBe(switchBtn);
    });
  });

  describe("Text input — no interference with cursor keys", () => {
    it("ArrowDown/Up on focused text input does not navigate cards", () => {
      renderLayout();
      const cards = getCards();
      const textCard = cards.find(
        (c) => c.getAttribute("data-setting-key") === "username",
      )!;
      const input =
        textCard.querySelector<HTMLInputElement>('input[type="text"]')!;
      focusElement(input);

      fireKey("ArrowDown");
      // Should stay on the input (browser default)
      expect(document.activeElement).toBe(input);

      fireKey("ArrowUp");
      expect(document.activeElement).toBe(input);
    });
  });

  describe("Ctrl+Arrow still does section jumping from card", () => {
    it("Ctrl+ArrowDown from a card focuses section heading", () => {
      renderLayout();
      const cards = focusFirstCard();

      fireKey("ArrowDown", { ctrlKey: true }, cards[0]);

      const main = screen.getByRole("main");
      const heading = main.querySelector<HTMLElement>(
        'h2[id^="settera-section-"]',
      );
      expect(document.activeElement).toBe(heading);
    });
  });

  describe("Hidden settings skipped", () => {
    it("invisible setting cards are not in the navigation", () => {
      // hiddenSetting is only visible when debug === true
      // Render without debug = true, so it should be hidden
      renderLayout({ debug: false });

      const cards = getCards();
      const hiddenCard = cards.find(
        (c) => c.getAttribute("data-setting-key") === "hiddenSetting",
      );
      expect(hiddenCard).toBeUndefined();
    });
  });
});
