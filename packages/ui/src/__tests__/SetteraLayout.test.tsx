import React, { useContext } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraLayout } from "../components/SetteraLayout.js";
import { SetteraDeepLinkContext } from "../contexts/SetteraDeepLinkContext.js";
import type { SetteraCustomPageProps } from "../components/SetteraPage.js";
import type { SetteraCustomSettingProps } from "../components/SetteraSetting.js";
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
let rafQueue: FrameRequestCallback[] = [];

function setViewportWidth(width: number) {
  act(() => {
    Object.defineProperty(window, "innerWidth", {
      value: width,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event("resize"));
  });
}

function setLocationSearch(search: string) {
  const suffix = search.length > 0 ? `/${search}` : "/";
  window.history.replaceState({}, "", suffix);
}

async function flushRaf() {
  await act(async () => {
    while (rafQueue.length > 0) {
      const callbacks = rafQueue;
      rafQueue = [];
      callbacks.forEach((cb) => cb(performance.now()));
    }
  });
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
    customPages?: Record<string, React.ComponentType<SetteraCustomPageProps>>;
    customSettings?: Record<
      string,
      React.ComponentType<SetteraCustomSettingProps>
    >;
    backToApp?: {
      label?: string;
      href?: string;
      onClick?: () => void;
    };
    activePage?: string;
    onPageChange?: (key: string) => void;
    getPageUrl?: (pageKey: string) => string;
  } = {},
  customSchema: SetteraSchema = schema,
) {
  return render(
    <Settera schema={customSchema} values={{}} onChange={() => {}}>
      <SetteraLayout {...props} />
    </Settera>,
  );
}

beforeEach(() => {
  rafQueue = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    const index = Number(id) - 1;
    if (index >= 0 && index < rafQueue.length) {
      rafQueue.splice(index, 1);
    }
  });
  setViewportWidth(DEFAULT_WIDTH);
  setLocationSearch("");
});

afterEach(() => {
  vi.restoreAllMocks();
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

  it("switches content on sidebar click", async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByText("Advanced"));
    await waitFor(() => {
      expect(screen.getByText("Experimental")).toBeDefined();
      expect(screen.getByText("Debug Mode")).toBeDefined();
    });
  });

  it("renders children instead of auto-rendered page when provided", () => {
    renderLayout({ children: <div data-testid="custom-content">Custom</div> });
    expect(screen.getByTestId("custom-content")).toBeDefined();
    // Auto-rendered page content should not be present
    expect(screen.queryByText("Behavior")).toBeNull();
  });

  it("renders custom page content via customPages registry", () => {
    const customSchema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "users",
          title: "Users",
          mode: "custom",
          renderer: "usersPage",
        },
      ],
    };

    renderLayout(
      {
        customPages: {
          usersPage: ({ page }: SetteraCustomPageProps) => (
            <div data-testid="users-page">Custom {page.title}</div>
          ),
        },
      },
      customSchema,
    );

    expect(screen.getByTestId("users-page").textContent).toContain(
      "Custom Users",
    );
  });

  it("renders custom setting content via customSettings registry", () => {
    const customSchema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "general",
          title: "General",
          sections: [
            {
              key: "main",
              title: "Main",
              settings: [
                {
                  key: "customCard",
                  title: "Custom Card",
                  type: "custom",
                  renderer: "customCard",
                  config: { tone: "info" },
                },
              ],
            },
          ],
        },
      ],
    };

    renderLayout(
      {
        customSettings: {
          customCard: ({ settingKey }: SetteraCustomSettingProps) => (
            <div data-testid="custom-setting">Renderer {settingKey}</div>
          ),
        },
      },
      customSchema,
    );

    expect(screen.getByTestId("custom-setting").textContent).toContain(
      "Renderer customCard",
    );
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

  it("uses mobile drawer navigation below breakpoint", async () => {
    const user = userEvent.setup();
    setViewportWidth(480);
    renderLayout({ mobileBreakpoint: 900 });

    expect(screen.queryByRole("tree")).toBeNull();

    await user.click(screen.getByLabelText("Open navigation"));
    await flushRaf();

    expect(
      screen.getByRole("dialog", { name: "Settings navigation" }),
    ).toBeDefined();
    expect(screen.getByRole("tree")).toBeDefined();

    await user.click(screen.getByText("Advanced"));
    await flushRaf();

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Settings navigation" }),
      ).toBeNull();
    });
  });

  it("renders back-to-app button in mobile drawer and prefers onClick", async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByLabelText("Open navigation"));
    await flushRaf();

    await user.click(screen.getByRole("button", { name: "Back to app" }));
    await flushRaf();

    expect(onBack).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Settings navigation" }),
      ).toBeNull();
    });
  });

  it("keeps back-to-app as a link in mobile drawer when only href is provided", async () => {
    const user = userEvent.setup();
    setViewportWidth(480);
    renderLayout({
      mobileBreakpoint: 900,
      backToApp: {
        label: "Back to app",
        href: "https://example.com/app",
      },
    });

    await user.click(screen.getByLabelText("Open navigation"));
    await flushRaf();

    const backLink = screen.getByRole("link", { name: "Back to app" });
    expect(backLink.getAttribute("href")).toBe("https://example.com/app");
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

  it("shows breadcrumb path for nested pages on mobile", async () => {
    const user = userEvent.setup();
    setViewportWidth(480);
    renderLayout(
      { mobileBreakpoint: 900, showBreadcrumbs: true },
      nestedSchema,
    );

    await user.click(screen.getByLabelText("Open navigation"));
    await flushRaf();

    const drawer = screen.getByRole("dialog", { name: "Settings navigation" });

    await user.click(within(drawer).getByRole("button", { name: "General" }));
    await flushRaf();

    await user.click(within(drawer).getByRole("button", { name: "Privacy" }));
    await flushRaf();

    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb.textContent).toContain("Settings");
    expect(breadcrumb.textContent).toContain("General");
    expect(breadcrumb.textContent).toContain("Privacy");
  });

  it("syncs active page to URL query param", async () => {
    const user = userEvent.setup();
    renderLayout({ activePageQueryParam: "settingsPage" });

    await user.click(screen.getByText("Advanced"));
    await waitFor(() => {
      const params = new URL(window.location.href).searchParams;
      expect(params.get("settingsPage")).toBe("advanced");
    });
  });

  it("hydrates active page from URL query param", async () => {
    setLocationSearch("?settingsPage=advanced");
    renderLayout({ activePageQueryParam: "settingsPage" });
    await waitFor(() => {
      expect(screen.getByText("Experimental")).toBeDefined();
      expect(screen.getByText("Debug Mode")).toBeDefined();
    });
  });

  it("hydrates active page from setting deep-link query param", async () => {
    setLocationSearch("?setting=debug");
    renderLayout();

    await waitFor(() => {
      expect(screen.getByText("Experimental")).toBeDefined();
      expect(screen.getByText("Debug Mode")).toBeDefined();
    });
    expect(screen.queryByText("Auto Save")).toBeNull();
  });

  it("shows matching section results in sidebar search and syncs section to URL", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.type(screen.getByRole("searchbox"), "timezone");
    const sectionButton = await screen.findByRole("button", {
      name: "Time preferences",
    });
    await user.click(sectionButton);

    await waitFor(() => {
      const params = new URL(window.location.href).searchParams;
      expect(params.get("setteraPage")).toBe("general");
      expect(params.get("section")).toBe("time");
    });
  });

  it("clears section query param when navigating to page root", async () => {
    const user = userEvent.setup();
    setLocationSearch("?setteraPage=general&section=time");
    renderLayout();

    await waitFor(() => {
      expect(screen.getByText("Time preferences")).toBeDefined();
    });

    await user.click(screen.getByRole("button", { name: "General" }));
    await waitFor(() => {
      const params = new URL(window.location.href).searchParams;
      expect(params.get("setteraPage")).toBe("general");
      expect(params.get("section")).toBeNull();
    });
  });

  describe("controlled navigation with getPageUrl", () => {
    const getPageUrl = (key: string) => `/settings/${key}`;

    // Helper component that reads deep link context and displays URLs
    function DeepLinkProbe() {
      const ctx = useContext(SetteraDeepLinkContext);
      if (!ctx) return <div data-testid="probe">no-context</div>;
      return (
        <div data-testid="probe">
          <span data-testid="setting-url">
            {ctx.getSettingUrl("autoSave")}
          </span>
          <span data-testid="section-url">
            {ctx.getSectionUrl("general", "behavior")}
          </span>
        </div>
      );
    }

    it("renders controlled page content based on activePage prop", () => {
      renderLayout({
        activePage: "advanced",
        onPageChange: () => {},
        getPageUrl,
      });
      expect(screen.getByText("Experimental")).toBeDefined();
      expect(screen.getByText("Debug Mode")).toBeDefined();
    });

    it("builds path-based setting URLs when getPageUrl is provided", () => {
      renderLayout({
        activePage: "general",
        onPageChange: () => {},
        getPageUrl,
        children: <DeepLinkProbe />,
      });
      const settingUrl = screen.getByTestId("setting-url").textContent!;
      // Should use getPageUrl base path, not query-param based
      expect(settingUrl).toBe("/settings/general?setting=autoSave");
    });

    it("builds path-based section URLs when getPageUrl is provided", () => {
      renderLayout({
        activePage: "general",
        onPageChange: () => {},
        getPageUrl,
        children: <DeepLinkProbe />,
      });
      const sectionUrl = screen.getByTestId("section-url").textContent!;
      expect(sectionUrl).toBe("/settings/general?section=behavior");
    });

    it("does not sync page to URL query params when getPageUrl is provided", () => {
      renderLayout({
        activePage: "advanced",
        onPageChange: () => {},
        getPageUrl,
      });
      const params = new URL(window.location.href).searchParams;
      // Page should NOT be in query params — consumer handles routing
      expect(params.get("setteraPage")).toBeNull();
    });
  });
});
