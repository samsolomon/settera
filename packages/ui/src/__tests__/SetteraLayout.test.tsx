import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
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

function renderLayout(
  props: {
    renderIcon?: (name: string) => React.ReactNode;
    children?: React.ReactNode;
  } = {},
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={{}} onChange={() => {}}>
        <SetteraLayout {...props} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

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
});
