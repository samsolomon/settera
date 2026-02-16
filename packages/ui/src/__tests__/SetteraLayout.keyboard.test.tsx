import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { SetteraLayout } from "../components/SetteraLayout.js";
import type { SetteraSchema } from "@settera/schema";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      icon: "settings",
      sections: [
        {
          key: "behavior",
          title: "Behavior",
          settings: [{ key: "autoSave", title: "Auto Save", type: "boolean" }],
          subsections: [
            {
              key: "subBehavior",
              title: "Sub Behavior",
              settings: [
                {
                  key: "subSetting",
                  title: "Sub Setting",
                  type: "boolean",
                },
              ],
            },
          ],
        },
        {
          key: "appearance",
          title: "Appearance",
          settings: [{ key: "theme", title: "Theme", type: "boolean" }],
        },
      ],
    },
    {
      key: "advanced",
      title: "Advanced",
      sections: [
        {
          key: "experimental",
          title: "Experimental",
          settings: [
            { key: "debug", title: "Debug Mode", type: "boolean" },
            { key: "apiKey", title: "API Key", type: "text" },
          ],
        },
      ],
    },
    {
      key: "parentOnly",
      title: "Parent Only",
      pages: [
        {
          key: "child1",
          title: "Child One",
          sections: [
            {
              key: "s1",
              title: "S1",
              settings: [
                { key: "c1set", title: "C1 Setting", type: "boolean" },
              ],
            },
          ],
        },
        {
          key: "child2",
          title: "Child Two",
          sections: [
            {
              key: "s2",
              title: "S2",
              settings: [
                { key: "c2set", title: "C2 Setting", type: "boolean" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function renderLayout() {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={{}} onChange={() => {}}>
        <SetteraLayout />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

/** Get a sidebar button by text (scoped to nav[role="tree"]) */
function getSidebarButton(name: string): HTMLButtonElement {
  const nav = screen.getByRole("tree");
  const buttons = Array.from(nav.querySelectorAll("button"));
  const match = buttons.find((b) => b.textContent?.trim() === name);
  if (!match) throw new Error(`Sidebar button "${name}" not found`);
  return match;
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

describe("SetteraLayout keyboard navigation", () => {
  describe("/ shortcut", () => {
    it("focuses search input when pressing /", () => {
      renderLayout();
      const searchInput = screen.getByRole("searchbox");
      const sidebarBtn = getSidebarButton("General");
      sidebarBtn.focus();

      fireKey("/");
      expect(document.activeElement).toBe(searchInput);
    });

    it("does not fire / when focused on search input itself", () => {
      renderLayout();
      const searchInput = screen.getByRole("searchbox") as HTMLInputElement;
      searchInput.focus();

      fireKey("/", {}, searchInput);
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe("Cmd+K shortcut", () => {
    it("focuses search input on Cmd+K", () => {
      renderLayout();
      const searchInput = screen.getByRole("searchbox");
      const btn = getSidebarButton("General");
      btn.focus();

      fireKey("k", { metaKey: true });
      expect(document.activeElement).toBe(searchInput);
    });

    it("works from content area", () => {
      renderLayout();
      const searchInput = screen.getByRole("searchbox");
      const main = screen.getByRole("main");
      const heading = main.querySelector("h2")!;
      heading.focus();

      fireKey("k", { metaKey: true }, heading);
      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe("Escape shortcut", () => {
    it("clears search when query is active", async () => {
      const user = userEvent.setup();
      renderLayout();
      const searchInput = screen.getByRole("searchbox") as HTMLInputElement;

      await user.type(searchInput, "Debug");
      expect(searchInput.value).toBe("Debug");

      act(() => {
        fireKey("Escape");
      });
      expect(searchInput.value).toBe("");
    });

    it("does not clear search when query is empty", () => {
      renderLayout();
      const searchInput = screen.getByRole("searchbox") as HTMLInputElement;
      expect(searchInput.value).toBe("");

      fireKey("Escape");
      expect(searchInput.value).toBe("");
    });
  });

  describe("F6 pane cycling", () => {
    it("F6 moves focus from sidebar to content", () => {
      renderLayout();
      const sidebarBtn = getSidebarButton("General");
      sidebarBtn.focus();

      fireKey("F6");

      const main = screen.getByRole("main");
      expect(main.contains(document.activeElement)).toBe(true);
    });

    it("F6 moves focus from content to sidebar", () => {
      renderLayout();
      const main = screen.getByRole("main");
      const heading = main.querySelector("h2")!;
      heading.focus();

      fireKey("F6", {}, heading);

      const sidebar = screen.getByRole("tree");
      expect(sidebar.contains(document.activeElement)).toBe(true);
    });

    it("Shift+F6 reverses direction", () => {
      renderLayout();
      const sidebarBtn = getSidebarButton("General");
      sidebarBtn.focus();

      fireKey("F6", { shiftKey: true });

      const main = screen.getByRole("main");
      expect(main.contains(document.activeElement)).toBe(true);
    });
  });

  describe("Ctrl+Arrow section heading jumping", () => {
    it("Ctrl+ArrowDown focuses the first section heading", () => {
      renderLayout();
      const main = screen.getByRole("main");
      // Focus a switch button in main
      const switchBtn = main.querySelector('button[role="switch"]');
      if (switchBtn) {
        (switchBtn as HTMLElement).focus();
      }

      fireKey("ArrowDown", { ctrlKey: true }, document.activeElement!);

      const firstHeading = main.querySelector('h2[id^="settera-section-"]')!;
      expect(document.activeElement).toBe(firstHeading);
    });

    it("Ctrl+ArrowDown cycles through section headings", () => {
      renderLayout();
      const main = screen.getByRole("main");
      const headings = main.querySelectorAll(
        'h2[id^="settera-section-"], h3[id^="settera-subsection-"]',
      );

      (headings[0] as HTMLElement).focus();
      expect(document.activeElement).toBe(headings[0]);

      fireKey("ArrowDown", { ctrlKey: true }, headings[0]);
      expect(document.activeElement).toBe(headings[1]);
    });

    it("Ctrl+ArrowUp moves to previous section heading", () => {
      renderLayout();
      const main = screen.getByRole("main");
      const headings = main.querySelectorAll(
        'h2[id^="settera-section-"], h3[id^="settera-subsection-"]',
      );

      (headings[1] as HTMLElement).focus();

      fireKey("ArrowUp", { ctrlKey: true }, headings[1]);
      expect(document.activeElement).toBe(headings[0]);
    });

    it("Ctrl+ArrowDown wraps from last to first heading", () => {
      renderLayout();
      const main = screen.getByRole("main");
      const headings = main.querySelectorAll(
        'h2[id^="settera-section-"], h3[id^="settera-subsection-"]',
      );
      const lastHeading = headings[headings.length - 1] as HTMLElement;

      lastHeading.focus();
      fireKey("ArrowDown", { ctrlKey: true }, lastHeading);
      expect(document.activeElement).toBe(headings[0]);
    });

    it("Ctrl+ArrowUp wraps from first to last heading", () => {
      renderLayout();
      const main = screen.getByRole("main");
      const headings = main.querySelectorAll(
        'h2[id^="settera-section-"], h3[id^="settera-subsection-"]',
      );
      const firstHeading = headings[0] as HTMLElement;

      firstHeading.focus();
      fireKey("ArrowUp", { ctrlKey: true }, firstHeading);
      expect(document.activeElement).toBe(headings[headings.length - 1]);
    });

    it("section headings have tabIndex={-1} for programmatic focus", () => {
      renderLayout();
      const main = screen.getByRole("main");
      const headings = main.querySelectorAll(
        'h2[id^="settera-section-"], h3[id^="settera-subsection-"]',
      );

      for (const heading of headings) {
        expect((heading as HTMLElement).tabIndex).toBe(-1);
      }
    });

    it("includes subsection headings in navigation", () => {
      renderLayout();
      const main = screen.getByRole("main");
      const headings = main.querySelectorAll(
        'h2[id^="settera-section-"], h3[id^="settera-subsection-"]',
      );

      // Should have: Behavior (h2), Sub Behavior (h3), Appearance (h2)
      expect(headings.length).toBe(3);
    });
  });

  describe("Arrow keys in sidebar update content", () => {
    it("ArrowDown in sidebar updates content to show the new page", async () => {
      const user = userEvent.setup();
      renderLayout();

      const generalBtn = getSidebarButton("General");
      generalBtn.focus();

      // Initially General is active
      expect(generalBtn.getAttribute("aria-current")).toBe("page");

      // ArrowDown to Advanced
      await user.keyboard("{ArrowDown}");

      const advancedBtn = getSidebarButton("Advanced");
      expect(document.activeElement).toBe(advancedBtn);
      // Content should now show the Advanced page
      expect(advancedBtn.getAttribute("aria-current")).toBe("page");
    });
  });

  describe("Enter focuses content", () => {
    it("Enter on sidebar page focuses first content control", async () => {
      const user = userEvent.setup();
      renderLayout();

      const generalBtn = getSidebarButton("General");
      generalBtn.focus();

      await user.keyboard("{Enter}");

      // Wait for requestAnimationFrame
      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r));
      });

      const main = screen.getByRole("main");
      expect(main.contains(document.activeElement)).toBe(true);
      // First focusable element should be the first switch button
      expect(document.activeElement?.tagName).toBe("BUTTON");
    });

    it("Enter on expand-only parent toggles expansion, does NOT focus content", async () => {
      const user = userEvent.setup();
      renderLayout();

      const generalBtn = getSidebarButton("General");
      generalBtn.focus();

      // Navigate to Parent Only (General → Advanced → Parent Only)
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(document.activeElement).toBe(getSidebarButton("Parent Only"));

      // Press Enter — should expand, not focus content
      await user.keyboard("{Enter}");

      // Wait for potential requestAnimationFrame
      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r));
      });

      // Child One should now be visible (expanded)
      expect(screen.getByText("Child One")).toBeDefined();

      // Focus should still be in sidebar
      const sidebar = screen.getByRole("tree");
      expect(sidebar.contains(document.activeElement)).toBe(true);
    });
  });

  describe("Escape from content returns to sidebar", () => {
    it("Escape from a non-input in content returns to correct sidebar item", async () => {
      const user = userEvent.setup();
      renderLayout();

      const advancedBtn = getSidebarButton("Advanced");
      advancedBtn.focus();

      // Navigate to Advanced and Enter to focus content
      await user.keyboard("{Enter}");
      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r));
      });

      const main = screen.getByRole("main");
      expect(main.contains(document.activeElement)).toBe(true);

      // Press Escape — should return to sidebar
      fireKey("Escape");

      const sidebar = screen.getByRole("tree");
      expect(sidebar.contains(document.activeElement)).toBe(true);
    });

    it("Escape from a text input blurs it, second Escape returns to sidebar", async () => {
      const user = userEvent.setup();
      renderLayout();

      // Navigate to Advanced page which has a text input
      const generalBtn = getSidebarButton("General");
      generalBtn.focus();
      await user.keyboard("{ArrowDown}"); // Advanced
      await user.keyboard("{Enter}");
      await act(async () => {
        await new Promise((r) => requestAnimationFrame(r));
      });

      const main = screen.getByRole("main");

      // Find and focus the text input
      const textInput = main.querySelector<HTMLInputElement>('input[type="text"]');
      expect(textInput).not.toBeNull();
      textInput!.focus();
      expect(document.activeElement).toBe(textInput);

      // First Escape — blurs input, focus moves to main
      fireKey("Escape");
      expect(document.activeElement).not.toBe(textInput);
      expect(main.contains(document.activeElement) || document.activeElement === main).toBe(true);

      // Second Escape — returns to sidebar
      fireKey("Escape");
      const sidebar = screen.getByRole("tree");
      expect(sidebar.contains(document.activeElement)).toBe(true);
    });

    it("Escape does not fire when dialog is open", async () => {
      const user = userEvent.setup();

      const confirmSchema: SetteraSchema = {
        version: "1.0",
        pages: [
          {
            key: "danger",
            title: "Danger",
            sections: [
              {
                key: "reset",
                title: "Reset",
                settings: [
                  {
                    key: "resetAll",
                    title: "Reset All",
                    type: "boolean",
                    confirm: {
                      title: "Are you sure?",
                      description: "This will reset everything.",
                      confirmLabel: "Reset",
                      cancelLabel: "Cancel",
                      dangerous: true,
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      render(
        <SetteraProvider schema={confirmSchema}>
          <SetteraRenderer
            values={{ resetAll: false }}
            onChange={() => {}}
          >
            <SetteraLayout />
          </SetteraRenderer>
        </SetteraProvider>,
      );

      // Click the switch to trigger the confirm dialog
      const main = screen.getByRole("main");
      const switchBtn = main.querySelector<HTMLElement>('button[role="switch"]');
      expect(switchBtn).not.toBeNull();
      await user.click(switchBtn!);

      // Dialog should be open
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeDefined();

      // Focus something in main
      const cancelBtn = dialog.querySelector<HTMLElement>("button");
      if (cancelBtn) cancelBtn.focus();

      // Escape should NOT return to sidebar (dialog handles it)
      fireKey("Escape");

      // Focus should NOT have moved to sidebar
      const sidebar = screen.getByRole("tree");
      expect(sidebar.contains(document.activeElement)).toBe(false);
    });
  });
});
