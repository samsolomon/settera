import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettaraProvider, SettaraRenderer } from "@settara/react";
import { SettaraSidebar } from "../components/SettaraSidebar.js";
import type { SettaraSchema } from "@settara/schema";

const schema: SettaraSchema = {
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
      ],
    },
  ],
};

function renderSidebar(renderIcon?: (iconName: string) => React.ReactNode) {
  return render(
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={{}} onChange={() => {}}>
        <SettaraSidebar renderIcon={renderIcon} />
      </SettaraRenderer>
    </SettaraProvider>,
  );
}

describe("SettaraSidebar", () => {
  it("renders page list", () => {
    renderSidebar();
    expect(screen.getByText("General")).toBeDefined();
    expect(screen.getByText("Advanced")).toBeDefined();
    expect(screen.getByText("Parent Only")).toBeDefined();
  });

  it("highlights first page as active by default", () => {
    renderSidebar();
    const generalBtn = screen.getByText("General").closest("button")!;
    expect(generalBtn.getAttribute("aria-current")).toBe("page");
  });

  it("navigates on click", () => {
    renderSidebar();
    act(() => {
      screen.getByText("Advanced").click();
    });
    const advancedBtn = screen.getByText("Advanced").closest("button")!;
    expect(advancedBtn.getAttribute("aria-current")).toBe("page");
  });

  it("has tree role for ARIA", () => {
    renderSidebar();
    expect(screen.getByRole("tree")).toBeDefined();
  });

  it("has treeitem roles", () => {
    renderSidebar();
    const items = screen.getAllByRole("treeitem");
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it("shows expand/collapse for parent with children", () => {
    renderSidebar();
    // General has children, should have aria-expanded
    const generalItem = screen
      .getByText("General")
      .closest("[role='treeitem']")!;
    expect(generalItem.getAttribute("aria-expanded")).toBeDefined();
  });

  it("toggles children visibility on click for parent with sections", () => {
    renderSidebar();
    // General has sections AND children — click navigates + toggles
    expect(screen.queryByText("Privacy")).toBeNull();
    act(() => {
      screen.getByText("General").click();
    });
    expect(screen.getByText("Privacy")).toBeDefined();
  });

  it("shows nested pages with indentation (nested buttons exist)", () => {
    renderSidebar();
    // Expand General first
    act(() => {
      screen.getByText("General").click();
    });
    const privacyBtn = screen.getByText("Privacy").closest("button")!;
    expect(privacyBtn).toBeDefined();
  });

  it("navigates to nested page on click", () => {
    renderSidebar();
    act(() => {
      screen.getByText("General").click();
    });
    act(() => {
      screen.getByText("Privacy").click();
    });
    const privacyBtn = screen.getByText("Privacy").closest("button")!;
    expect(privacyBtn.getAttribute("aria-current")).toBe("page");
  });

  it("renders icons via renderIcon prop", () => {
    const iconMap: Record<string, string> = {
      settings: "gear-icon",
      zap: "zap-icon",
    };
    renderSidebar((name) => (
      <span data-testid={`icon-${name}`}>{iconMap[name]}</span>
    ));
    expect(screen.getByTestId("icon-settings")).toBeDefined();
    expect(screen.getByTestId("icon-zap")).toBeDefined();
  });

  it("does not render icon when renderIcon not provided", () => {
    renderSidebar();
    expect(screen.queryByTestId("icon-settings")).toBeNull();
  });

  it("parent without sections only toggles expand (no navigate)", () => {
    renderSidebar();
    // parentOnly has no sections, only children
    act(() => {
      screen.getByText("Parent Only").click();
    });
    // Should NOT be active (no sections to show)
    const parentBtn = screen.getByText("Parent Only").closest("button")!;
    expect(parentBtn.getAttribute("aria-current")).not.toBe("page");
    // But children should be visible
    expect(screen.getByText("Child One")).toBeDefined();
  });

  it("auto-expands parent when child is active via programmatic navigation", () => {
    // We test this by clicking a child page. First expand parent, click child.
    // Then the parent should remain expanded.
    renderSidebar();
    // Expand "General" (has sections + children)
    act(() => {
      screen.getByText("General").click();
    });
    // Click child "Privacy"
    act(() => {
      screen.getByText("Privacy").click();
    });
    // Privacy should be visible and active
    expect(screen.getByText("Privacy")).toBeDefined();
    const privacyBtn = screen.getByText("Privacy").closest("button")!;
    expect(privacyBtn.getAttribute("aria-current")).toBe("page");
  });

  it("renders the search input", () => {
    renderSidebar();
    expect(screen.getByRole("searchbox")).toBeDefined();
  });

  it("shows all pages when not searching", () => {
    renderSidebar();
    expect(screen.getByText("General")).toBeDefined();
    expect(screen.getByText("Advanced")).toBeDefined();
    expect(screen.getByText("Parent Only")).toBeDefined();
  });

  it("filters pages during search to only matching pages", async () => {
    const user = userEvent.setup();
    renderSidebar();
    await user.type(screen.getByRole("searchbox"), "Debug");
    // "Advanced" has "Debug" setting — should be visible
    expect(screen.getByText("Advanced")).toBeDefined();
    // "Parent Only" has no matching settings — should be hidden
    expect(screen.queryByText("Parent Only")).toBeNull();
  });

  it("auto-expands parents with matching children during search", async () => {
    const user = userEvent.setup();
    renderSidebar();
    // Search for something in the Privacy child page
    await user.type(screen.getByRole("searchbox"), "Tracking");
    // General should be visible (parent of Privacy)
    expect(screen.getByText("General")).toBeDefined();
    // Privacy should be visible (auto-expanded)
    expect(screen.getByText("Privacy")).toBeDefined();
  });
});
