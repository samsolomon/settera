import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SetteraProvider } from "../provider.js";
import { SetteraSchemaContext, SetteraNavigationContext } from "../context.js";
import type { SetteraSchema } from "@settera/schema";

const minimalSchema: SetteraSchema = {
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
            { key: "toggle", title: "Toggle", type: "boolean", default: false },
          ],
        },
      ],
    },
    {
      key: "appearance",
      title: "Appearance",
    },
  ],
};

function SchemaConsumer() {
  const ctx = React.useContext(SetteraSchemaContext);
  if (!ctx) return <div>no schema</div>;
  return (
    <div>
      <span data-testid="version">{ctx.schema.version}</span>
      <span data-testid="flat-count">{ctx.flatSettings.length}</span>
      <span data-testid="found-setting">
        {ctx.getSettingByKey("toggle")?.title ?? "not found"}
      </span>
      <span data-testid="found-page">
        {ctx.getPageByKey("appearance")?.title ?? "not found"}
      </span>
    </div>
  );
}

function NavConsumer() {
  const ctx = React.useContext(SetteraNavigationContext);
  if (!ctx) return <div>no nav</div>;
  return (
    <div>
      <span data-testid="active-page">{ctx.activePage}</span>
      <button onClick={() => ctx.setActivePage("appearance")}>go</button>
      <button onClick={() => ctx.toggleGroup("general")}>toggle</button>
      <span data-testid="expanded">
        {ctx.expandedGroups.has("general") ? "yes" : "no"}
      </span>
    </div>
  );
}

describe("SetteraProvider", () => {
  it("provides schema context", () => {
    render(
      <SetteraProvider schema={minimalSchema}>
        <SchemaConsumer />
      </SetteraProvider>,
    );
    expect(screen.getByTestId("version").textContent).toBe("1.0");
    expect(screen.getByTestId("flat-count").textContent).toBe("1");
    expect(screen.getByTestId("found-setting").textContent).toBe("Toggle");
    expect(screen.getByTestId("found-page").textContent).toBe("Appearance");
  });

  it("provides navigation context with first page as default", () => {
    render(
      <SetteraProvider schema={minimalSchema}>
        <NavConsumer />
      </SetteraProvider>,
    );
    expect(screen.getByTestId("active-page").textContent).toBe("general");
  });

  it("allows page navigation", async () => {
    const { user } = await import("@testing-library/user-event").then((m) => ({
      user: m.default.setup(),
    }));
    render(
      <SetteraProvider schema={minimalSchema}>
        <NavConsumer />
      </SetteraProvider>,
    );
    await user.click(screen.getByText("go"));
    expect(screen.getByTestId("active-page").textContent).toBe("appearance");
  });

  it("allows toggling expanded groups", async () => {
    const { user } = await import("@testing-library/user-event").then((m) => ({
      user: m.default.setup(),
    }));
    render(
      <SetteraProvider schema={minimalSchema}>
        <NavConsumer />
      </SetteraProvider>,
    );
    expect(screen.getByTestId("expanded").textContent).toBe("no");
    await user.click(screen.getByText("toggle"));
    expect(screen.getByTestId("expanded").textContent).toBe("yes");
    await user.click(screen.getByText("toggle"));
    expect(screen.getByTestId("expanded").textContent).toBe("no");
  });

  it("warns on invalid schema", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const badSchema = {
      version: "2.0" as "1.0",
      pages: [{ key: "p", title: "P" }],
    };
    render(
      <SetteraProvider schema={badSchema}>
        <div>child</div>
      </SetteraProvider>,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("INVALID_VERSION"),
    );
    warnSpy.mockRestore();
  });

  it("does not warn on valid schema", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <SetteraProvider schema={minimalSchema}>
        <div>child</div>
      </SetteraProvider>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("renders children", () => {
    render(
      <SetteraProvider schema={minimalSchema}>
        <span data-testid="child">hello</span>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("child").textContent).toBe("hello");
  });

  it("resolves initial activePage to child key when first page is flattened", () => {
    const flattenedSchema: SetteraSchema = {
      version: "1.0",
      pages: [
        {
          key: "parent",
          title: "Parent",
          pages: [
            {
              key: "only-child",
              title: "Only Child",
              sections: [
                {
                  key: "s1",
                  title: "S1",
                  settings: [
                    { key: "setting1", title: "Setting 1", type: "boolean" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    render(
      <SetteraProvider schema={flattenedSchema}>
        <NavConsumer />
      </SetteraProvider>,
    );
    expect(screen.getByTestId("active-page").textContent).toBe("only-child");
  });
});
