import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Settera } from "@settera/react";
import type { SetteraSchema } from "@settera/schema";
import { SetteraDeepLinkContext } from "../settera/settera-deep-link-context";
import { SetteraSection } from "../settera/settera-section";

// Minimal provider wrapper for search context (SetteraSection calls useSetteraSearch)
import { SetteraNavigationProvider } from "../settera/settera-navigation-provider";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "appearance",
          title: "Appearance",
          settings: [
            { key: "theme", title: "Theme", type: "boolean", default: false },
          ],
        },
        {
          key: "collapsible-section",
          title: "Advanced",
          collapsible: true,
          settings: [
            { key: "debug", title: "Debug", type: "boolean", default: false },
          ],
        },
      ],
    },
  ],
};

const deepLinkValue = {
  getSettingUrl: (key: string) =>
    `https://example.com/?setteraSetting=${key}`,
  getSectionUrl: (page: string, section: string) =>
    `https://example.com/?setteraPage=${page}&section=${section}`,
};

function renderSection(
  sectionKey: string,
  { withDeepLink = true }: { withDeepLink?: boolean } = {},
) {
  const inner = (
    <SetteraNavigationProvider>
      <SetteraSection pageKey="general" sectionKey={sectionKey} />
    </SetteraNavigationProvider>
  );

  return render(
    <Settera schema={schema} values={{ theme: false, debug: false }} onChange={() => {}}>
      {withDeepLink ? (
        <SetteraDeepLinkContext.Provider value={deepLinkValue}>
          {inner}
        </SetteraDeepLinkContext.Provider>
      ) : (
        inner
      )}
    </Settera>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SetteraSection copy-link", () => {
  it("does not show copy button without deep link context", () => {
    renderSection("appearance", { withDeepLink: false });
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy link to section" }),
    ).not.toBeInTheDocument();
  });

  it("shows copy button on hover for non-collapsible section", () => {
    renderSection("appearance");
    const heading = screen.getByText("Appearance");
    const hoverTarget = heading.closest("[class*='flex']")!;

    expect(
      screen.queryByRole("button", { name: "Copy link to section" }),
    ).not.toBeInTheDocument();

    fireEvent.mouseEnter(hoverTarget);

    expect(
      screen.getByRole("button", { name: "Copy link to section" }),
    ).toBeInTheDocument();

    fireEvent.mouseLeave(hoverTarget);

    expect(
      screen.queryByRole("button", { name: "Copy link to section" }),
    ).not.toBeInTheDocument();
  });

  it("copies section URL on click and shows check feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderSection("appearance");
    const heading = screen.getByText("Appearance");
    const hoverTarget = heading.closest("[class*='flex']")!;
    fireEvent.mouseEnter(hoverTarget);

    const copyButton = screen.getByRole("button", {
      name: "Copy link to section",
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "https://example.com/?setteraPage=general&section=appearance",
      );
    });

    // Check icon should be showing (feedback state) — green success color
    expect(copyButton.querySelector("svg")?.style.color).toBe(
      "var(--settera-success-color, #16a34a)",
    );
  });

  it("does not show check feedback when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderSection("appearance");
    const heading = screen.getByText("Appearance");
    const hoverTarget = heading.closest("[class*='flex']")!;
    fireEvent.mouseEnter(hoverTarget);

    const copyButton = screen.getByRole("button", {
      name: "Copy link to section",
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });

    // Should still show link icon, not check icon — no success color
    expect(copyButton.querySelector("svg")?.style.color).not.toBe(
      "var(--settera-success-color, #16a34a)",
    );
  });

  it("shows copy button on hover for collapsible section", () => {
    renderSection("collapsible-section");
    const heading = screen.getByText("Advanced");
    const hoverTarget = heading.closest("[class*='flex items-center']")!;

    fireEvent.mouseEnter(hoverTarget);

    expect(
      screen.getByRole("button", { name: "Copy link to section" }),
    ).toBeInTheDocument();
  });

  it("does not toggle collapse when clicking copy button on collapsible section", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    renderSection("collapsible-section");

    // Section content should be visible (not collapsed by default)
    expect(screen.getByText("Debug")).toBeInTheDocument();

    const heading = screen.getByText("Advanced");
    const hoverTarget = heading.closest("[class*='flex items-center']")!;
    fireEvent.mouseEnter(hoverTarget);

    const copyButton = screen.getByRole("button", {
      name: "Copy link to section",
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "https://example.com/?setteraPage=general&section=collapsible-section",
      );
    });

    // Section content should still be visible (not collapsed)
    expect(screen.getByText("Debug")).toBeInTheDocument();
  });
});
