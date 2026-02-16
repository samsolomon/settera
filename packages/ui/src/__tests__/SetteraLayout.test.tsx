import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, within } from "@testing-library/react";
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
          settings: [{ key: "debug", title: "Debug Mode", type: "boolean" }],
        },
      ],
    },
  ],
};

const nestedSchema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "base",
          title: "Base",
          settings: [
            { key: "general.autoSave", title: "Auto Save", type: "boolean" },
          ],
        },
      ],
      pages: [
        {
          key: "privacy",
          title: "Privacy",
          sections: [
            {
              key: "tracking",
              title: "Tracking",
              settings: [
                {
                  key: "privacy.analytics",
                  title: "Usage Analytics",
                  type: "boolean",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const DEFAULT_WIDTH = 1200;

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    writable: true,
    configurable: true,
  });
  window.dispatchEvent(new Event("resize"));
}

function setLocationSearch(search: string) {
  const suffix = search.length > 0 ? `/${search}` : "/";
  window.history.replaceState({}, "", suffix);
}

function renderLayout(
  props: {
    renderIcon?: (name: string) => React.ReactNode;
    children?: React.ReactNode;
    mobileBreakpoint?: number;
    showBreadcrumbs?: boolean;
    mobileTitle?: string;
    syncActivePageWithUrl?: boolean;
    activePageQueryParam?: string;
    backToApp?: {
      label?: string;
      href?: string;
      onClick?: () => void;
    };
  } = {},
  customSchema: SetteraSchema = schema,
) {
  return render(
    <SetteraProvider schema={customSchema}>
      <SetteraRenderer values={{}} onChange={() => {}}>
        <SetteraLayout {...props} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

beforeEach(() => {
  setViewportWidth(DEFAULT_WIDTH);
  setLocationSearch("");
});

afterEach(() => {
  setViewportWidth(DEFAULT_WIDTH);
  setLocationSearch("");
});

describe("SetteraLayout", () => {
  it("renders sidebar and content area", () => {
    renderLayout();
    expect(screen.getByRole("tree")).toBeDefined();
    expect(screen.getByRole("main")).toBeDefined();
  });

  it("renders first page content by default", () => {
    renderLayout();
    // "General" appears in sidebar AND as page h1 title
    expect(screen.getAllByText("General").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Auto Save")).toBeDefined();
  });

  it("switches content on sidebar click", () => {
    renderLayout();
    act(() => {
      screen.getByText("Advanced").click();
    });
    expect(screen.getByText("Experimental")).toBeDefined();
    expect(screen.getByText("Debug Mode")).toBeDefined();
  });

  it("renders children instead of auto-rendered page when provided", () => {
    renderLayout({ children: <div data-testid="custom-content">Custom</div> });
    expect(screen.getByTestId("custom-content")).toBeDefined();
    // Auto-rendered page content should not be present
    expect(screen.queryByText("Behavior")).toBeNull();
  });

  it("forwards renderIcon to sidebar", () => {
    renderLayout({
      renderIcon: (name) => <span data-testid={`icon-${name}`}>{name}</span>,
    });
    expect(screen.getByTestId("icon-settings")).toBeDefined();
  });

  it("has correct layout structure", () => {
    renderLayout();
    const nav = screen.getByRole("tree");
    const main = screen.getByRole("main");
    // Both should be siblings in the same flex container
    expect(nav.parentElement).toBe(main.parentElement);
  });

  it("uses mobile drawer navigation below breakpoint", () => {
    setViewportWidth(480);
    renderLayout({ mobileBreakpoint: 900 });

    expect(screen.queryByRole("tree")).toBeNull();

    act(() => {
      screen.getByLabelText("Open navigation").click();
    });

    expect(
      screen.getByRole("dialog", { name: "Settings navigation" }),
    ).toBeDefined();
    expect(screen.getByRole("tree")).toBeDefined();

    act(() => {
      screen.getByText("Advanced").click();
    });

    expect(
      screen.queryByRole("dialog", { name: "Settings navigation" }),
    ).toBeNull();
  });

  it("renders back-to-app button in mobile drawer and prefers onClick", () => {
    const onBack = vi.fn();
    setViewportWidth(480);
    renderLayout({
      mobileBreakpoint: 900,
      backToApp: {
        label: "Back to app",
        href: "https://example.com",
        onClick: onBack,
      },
    });

    act(() => {
      screen.getByLabelText("Open navigation").click();
    });

    act(() => {
      screen.getByRole("button", { name: "Back to app" }).click();
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("dialog", { name: "Settings navigation" }),
    ).toBeNull();
  });

  it("renders back-to-app control above sidebar search", () => {
    renderLayout({
      backToApp: {
        label: "Back to app",
        href: "https://example.com",
      },
    });

    const backLink = screen.getByRole("link", { name: "Back to app" });
    const searchbox = screen.getByRole("searchbox", {
      name: "Search settings",
    });
    expect(
      backLink.compareDocumentPosition(searchbox) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows breadcrumb path for nested pages on mobile", () => {
    setViewportWidth(480);
    renderLayout(
      { mobileBreakpoint: 900, showBreadcrumbs: true },
      nestedSchema,
    );

    act(() => {
      screen.getByLabelText("Open navigation").click();
    });

    const drawer = screen.getByRole("dialog", { name: "Settings navigation" });

    act(() => {
      within(drawer).getByRole("button", { name: "General" }).click();
    });

    act(() => {
      within(drawer).getByRole("button", { name: "Privacy" }).click();
    });

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb.textContent).toContain("Settings");
    expect(breadcrumb.textContent).toContain("General");
    expect(breadcrumb.textContent).toContain("Privacy");
  });

  it("syncs active page to URL query param", () => {
    renderLayout({ activePageQueryParam: "settingsPage" });

    act(() => {
      screen.getByText("Advanced").click();
    });

    const params = new URL(window.location.href).searchParams;
    expect(params.get("settingsPage")).toBe("advanced");
  });

  it("hydrates active page from URL query param", () => {
    setLocationSearch("?settingsPage=advanced");
    renderLayout({ activePageQueryParam: "settingsPage" });

    expect(screen.getByText("Experimental")).toBeDefined();
    expect(screen.getByText("Debug Mode")).toBeDefined();
  });
});
