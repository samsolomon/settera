import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraNavigationProvider } from "../providers/SetteraNavigationProvider.js";
import { SetteraSidebar } from "../components/SetteraSidebar.js";
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
        },
        {
          key: "time",
          title: "Time preferences",
          settings: [{ key: "timezone", title: "Timezone", type: "text" }],
        },
      ],
      pages: [
        {
          key: "privacy",
          title: "Privacy",
          sections: [
            {
              key: "data",
              title: "Data",
              settings: [
                { key: "tracking", title: "Tracking", type: "boolean" },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "advanced",
      title: "Advanced",
      icon: "zap",
      sections: [
        {
          key: "experimental",
          title: "Experimental",
          settings: [{ key: "debug", title: "Debug", type: "boolean" }],
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

function renderSidebar() {
  return render(
    <Settera schema={schema} values={{}} onChange={() => {}}>
      <SetteraNavigationProvider>
        <SetteraSidebar />
      </SetteraNavigationProvider>
    </Settera>,
  );
}

function getButton(name: string): HTMLButtonElement {
  return screen.getByText(name).closest("button")! as HTMLButtonElement;
}

describe("SetteraSidebar keyboard navigation", () => {
  describe("roving tabindex setup", () => {
    it("first button has tabIndex=0, others have tabIndex=-1", () => {
      renderSidebar();
      const generalBtn = getButton("General");
      const advancedBtn = getButton("Advanced");
      const parentOnlyBtn = getButton("Parent Only");

      expect(generalBtn.tabIndex).toBe(0);
      expect(advancedBtn.tabIndex).toBe(-1);
      expect(parentOnlyBtn.tabIndex).toBe(-1);
    });

    it("exactly one button has tabIndex=0", () => {
      renderSidebar();
      const nav = screen.getByRole("tree");
      const buttons = nav.querySelectorAll("button");
      const zeroTabButtons = Array.from(buttons).filter(
        (b) => b.tabIndex === 0,
      );
      expect(zeroTabButtons.length).toBe(1);
    });
  });

  describe("ArrowDown/Up navigation", () => {
    it("ArrowDown moves focus to next item", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      await user.keyboard("{ArrowDown}");

      expect(document.activeElement).toBe(getButton("Advanced"));
    });

    it("ArrowUp moves focus to previous item", async () => {
      const user = userEvent.setup();
      renderSidebar();

      // Focus General, then ArrowDown to Advanced
      const generalBtn = getButton("General");
      generalBtn.focus();
      await user.keyboard("{ArrowDown}");

      // Now ArrowUp back to General
      await user.keyboard("{ArrowUp}");
      expect(document.activeElement).toBe(getButton("General"));
    });

    it("ArrowDown wraps from last to first", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Navigate to last item via End, then ArrowDown should wrap
      await user.keyboard("{End}");
      expect(document.activeElement).toBe(getButton("Parent Only"));

      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(getButton("General"));
    });

    it("ArrowUp wraps from first to last", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      await user.keyboard("{ArrowUp}");
      expect(document.activeElement).toBe(getButton("Parent Only"));
    });
  });

  describe("Home/End navigation", () => {
    it("Home moves to first item", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Navigate to Advanced via ArrowDown
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(getButton("Advanced"));

      // Home should go back to first
      await user.keyboard("{Home}");
      expect(document.activeElement).toBe(getButton("General"));
    });

    it("End moves to last item", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      await user.keyboard("{End}");
      expect(document.activeElement).toBe(getButton("Parent Only"));
    });
  });

  describe("ArrowRight expand/collapse", () => {
    it("ArrowRight expands a collapsed group", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Privacy should not be visible yet
      expect(screen.queryByText("Privacy")).toBeNull();

      await user.keyboard("{ArrowRight}");

      // Now Privacy should be visible
      expect(screen.getByText("Privacy")).toBeDefined();
    });

    it("ArrowRight on expanded group moves to first child", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Expand first
      await user.keyboard("{ArrowRight}");
      // ArrowRight again should move to first child
      await user.keyboard("{ArrowRight}");

      expect(document.activeElement).toBe(getButton("Privacy"));
    });
  });

  describe("ArrowLeft collapse/parent", () => {
    it("ArrowLeft collapses an expanded group", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Expand General
      await user.keyboard("{ArrowRight}");
      expect(screen.getByText("Privacy")).toBeDefined();

      // Collapse General
      await user.keyboard("{ArrowLeft}");
      expect(screen.queryByText("Privacy")).toBeNull();
    });

    it("ArrowLeft on child moves to parent", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Expand and move to child
      await user.keyboard("{ArrowRight}"); // expand
      await user.keyboard("{ArrowRight}"); // move to Privacy

      expect(document.activeElement).toBe(getButton("Privacy"));

      // ArrowLeft should go back to parent
      await user.keyboard("{ArrowLeft}");
      expect(document.activeElement).toBe(getButton("General"));
    });
  });

  describe("Enter navigation", () => {
    it("Enter navigates to the focused page", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Move to Advanced
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(getButton("Advanced"));

      // Press Enter
      await user.keyboard("{Enter}");

      // Advanced should now be active
      const advancedBtn = getButton("Advanced");
      expect(advancedBtn.getAttribute("aria-current")).toBe("page");
    });

    it("Enter on a parent with children expands/toggles it", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Move to Parent Only (index 2)
      await user.keyboard("{ArrowDown}{ArrowDown}");

      // Enter on Parent Only should toggle expand (no sections)
      await user.keyboard("{Enter}");
      expect(screen.getByText("Child One")).toBeDefined();
    });
  });

  describe("includes children in navigation", () => {
    it("ArrowDown navigates through expanded children", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Expand General
      await user.keyboard("{ArrowRight}");

      // Now flat list is: General, Privacy, Advanced, Parent Only
      // ArrowDown from General → Privacy
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(getButton("Privacy"));

      // ArrowDown from Privacy → Advanced
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(getButton("Advanced"));
    });
  });

  it("includes matching section subnav items in arrow-key navigation during search", async () => {
    const user = userEvent.setup();
    renderSidebar();

    const search = screen.getByRole("searchbox");
    await user.type(search, "timezone");
    for (let i = 0; i < 3; i += 1) {
      await user.keyboard("{ArrowDown}");
      if (document.activeElement === getButton("Time preferences")) {
        break;
      }
    }
    expect(document.activeElement).toBe(getButton("Time preferences"));
  });

  describe("multiple levels", () => {
    it("expanding parentOnly shows children in flat navigation", async () => {
      const user = userEvent.setup();
      renderSidebar();
      const generalBtn = getButton("General");
      generalBtn.focus();

      // Navigate to Parent Only and expand
      await user.keyboard("{End}"); // Last item: Parent Only
      await user.keyboard("{ArrowRight}"); // Expand

      // Children should be visible
      expect(screen.getByText("Child One")).toBeDefined();
      expect(screen.getByText("Child Two")).toBeDefined();

      // ArrowDown from Parent Only → Child One
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(getButton("Child One"));

      // ArrowDown from Child One → Child Two
      await user.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(getButton("Child Two"));
    });
  });
});
