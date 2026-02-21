import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
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
    {
      key: "expandOnly",
      title: "Expand Only",
      pages: [
        {
          key: "sub1",
          title: "Sub One",
          sections: [
            {
              key: "s2",
              title: "S2",
              settings: [
                { key: "sub1set", title: "Sub1 Setting", type: "boolean" },
              ],
            },
          ],
        },
        {
          key: "sub2",
          title: "Sub Two",
          sections: [
            {
              key: "s3",
              title: "S3",
              settings: [
                { key: "sub2set", title: "Sub2 Setting", type: "boolean" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function renderSidebar(
  renderIcon?: (iconName: string) => React.ReactNode,
  opts?: { getPageUrl?: (key: string) => string; activePage?: string; onPageChange?: (key: string) => void },
) {
  return render(
    <Settera schema={schema} values={{}} onChange={() => {}}>
      <SetteraNavigationProvider
        activePage={opts?.activePage}
        onPageChange={opts?.onPageChange}
        getPageUrl={opts?.getPageUrl}
      >
        <SetteraSidebar renderIcon={renderIcon} />
      </SetteraNavigationProvider>
    </Settera>,
  );
}

describe("SetteraSidebar", () => {
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

  it("flattened parent navigates to child on click", () => {
    renderSidebar();
    // parentOnly has one child, no sections — should be flattened
    act(() => {
      screen.getByText("Parent Only").click();
    });
    // Should be active (navigates to child's content)
    const parentBtn = screen.getByText("Parent Only").closest("button")!;
    expect(parentBtn.getAttribute("aria-current")).toBe("page");
    // Child should NOT appear as a separate sidebar item
    expect(screen.queryByText("Child One")).toBeNull();
  });

  it("flattened parent has no aria-expanded", () => {
    renderSidebar();
    const parentItem = screen
      .getByText("Parent Only")
      .closest("[role='treeitem']")!;
    expect(parentItem.getAttribute("aria-expanded")).toBeNull();
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

  it("flattened parent visible during search when child matches, child NOT visible", async () => {
    const user = userEvent.setup();
    renderSidebar();
    // Search for the child's setting title
    await user.type(screen.getByRole("searchbox"), "C1 Setting");
    // Parent Only should be visible (its child has a matching setting)
    expect(screen.getByText("Parent Only")).toBeDefined();
    // But Child One should NOT appear as a separate item
    expect(screen.queryByText("Child One")).toBeNull();
  });

  describe("controlled navigation with getPageUrl", () => {
    const getPageUrl = (key: string) => `/settings/${key}`;

    it("renders <a> tags with href when getPageUrl is provided", () => {
      renderSidebar(undefined, {
        activePage: "general",
        onPageChange: () => {},
        getPageUrl,
      });
      const generalLink = screen.getByText("General").closest("a");
      expect(generalLink).not.toBeNull();
      expect(generalLink!.getAttribute("href")).toBe("/settings/general");
    });

    it("renders <button> tags when getPageUrl is not provided", () => {
      renderSidebar();
      const generalBtn = screen.getByText("General").closest("button");
      expect(generalBtn).not.toBeNull();
      const generalLink = screen.getByText("General").closest("a");
      expect(generalLink).toBeNull();
    });

    it("calls onPageChange on click instead of navigating", () => {
      const onPageChange = vi.fn();
      renderSidebar(undefined, {
        activePage: "general",
        onPageChange,
        getPageUrl,
      });
      act(() => {
        screen.getByText("Advanced").click();
      });
      expect(onPageChange).toHaveBeenCalledWith("advanced");
    });

    it("renders child page links when parent is expanded", () => {
      renderSidebar(undefined, {
        activePage: "general",
        onPageChange: () => {},
        getPageUrl,
      });
      // Expand General to show Privacy child
      act(() => {
        screen.getByText("General").click();
      });
      const privacyLink = screen.getByText("Privacy").closest("a");
      expect(privacyLink).not.toBeNull();
      expect(privacyLink!.getAttribute("href")).toBe("/settings/privacy");
    });

    it("renders flattened parent as <a> with resolved child key", () => {
      renderSidebar(undefined, {
        activePage: "general",
        onPageChange: () => {},
        getPageUrl,
      });
      // parentOnly is flattened — should link to child1 key
      const parentLink = screen.getByText("Parent Only").closest("a");
      expect(parentLink).not.toBeNull();
      expect(parentLink!.getAttribute("href")).toBe("/settings/child1");
    });

    it("renders expand-only parent as <button>, not <a>", () => {
      renderSidebar(undefined, {
        activePage: "general",
        onPageChange: () => {},
        getPageUrl,
      });
      // expandOnly has 2 children, no sections — expand-only, no href
      const expandBtn = screen.getByText("Expand Only").closest("button");
      expect(expandBtn).not.toBeNull();
      const expandLink = screen.getByText("Expand Only").closest("a");
      expect(expandLink).toBeNull();
    });

    it("does not call onPageChange on modifier-click (new tab)", () => {
      const onPageChange = vi.fn();
      renderSidebar(undefined, {
        activePage: "general",
        onPageChange,
        getPageUrl,
      });
      const advancedLink = screen.getByText("Advanced").closest("a")!;
      // Simulate cmd-click (metaKey)
      fireEvent.click(advancedLink, { metaKey: true });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("does not call onPageChange on ctrl-click", () => {
      const onPageChange = vi.fn();
      renderSidebar(undefined, {
        activePage: "general",
        onPageChange,
        getPageUrl,
      });
      const advancedLink = screen.getByText("Advanced").closest("a")!;
      // Simulate ctrl-click
      fireEvent.click(advancedLink, { ctrlKey: true });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("prevents default on normal click to avoid navigation", () => {
      renderSidebar(undefined, {
        activePage: "general",
        onPageChange: () => {},
        getPageUrl,
      });
      const advancedLink = screen.getByText("Advanced").closest("a")!;
      const prevented = !fireEvent.click(advancedLink);
      // fireEvent.click returns false when preventDefault was called
      expect(prevented).toBe(true);
    });
  });

  describe("navigation provider warnings", () => {
    it("warns when getPageUrl provided without activePage", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      renderSidebar(undefined, {
        getPageUrl: (key: string) => `/settings/${key}`,
      });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("`getPageUrl` was provided without `activePage`"),
      );
      spy.mockRestore();
    });
  });
});
