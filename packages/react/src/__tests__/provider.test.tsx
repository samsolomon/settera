import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettaraProvider } from "../provider.js";
import { SettaraSchemaContext, SettaraNavigationContext } from "../context.js";
import type { SettaraSchema } from "@settara/schema";

const minimalSchema: SettaraSchema = {
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
  const ctx = React.useContext(SettaraSchemaContext);
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
  const ctx = React.useContext(SettaraNavigationContext);
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

describe("SettaraProvider", () => {
  it("provides schema context", () => {
    render(
      <SettaraProvider schema={minimalSchema}>
        <SchemaConsumer />
      </SettaraProvider>,
    );
    expect(screen.getByTestId("version").textContent).toBe("1.0");
    expect(screen.getByTestId("flat-count").textContent).toBe("1");
    expect(screen.getByTestId("found-setting").textContent).toBe("Toggle");
    expect(screen.getByTestId("found-page").textContent).toBe("Appearance");
  });

  it("provides navigation context with first page as default", () => {
    render(
      <SettaraProvider schema={minimalSchema}>
        <NavConsumer />
      </SettaraProvider>,
    );
    expect(screen.getByTestId("active-page").textContent).toBe("general");
  });

  it("allows page navigation", async () => {
    const { user } = await import("@testing-library/user-event").then((m) => ({
      user: m.default.setup(),
    }));
    render(
      <SettaraProvider schema={minimalSchema}>
        <NavConsumer />
      </SettaraProvider>,
    );
    await user.click(screen.getByText("go"));
    expect(screen.getByTestId("active-page").textContent).toBe("appearance");
  });

  it("allows toggling expanded groups", async () => {
    const { user } = await import("@testing-library/user-event").then((m) => ({
      user: m.default.setup(),
    }));
    render(
      <SettaraProvider schema={minimalSchema}>
        <NavConsumer />
      </SettaraProvider>,
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
      <SettaraProvider schema={badSchema}>
        <div>child</div>
      </SettaraProvider>,
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("INVALID_VERSION"),
    );
    warnSpy.mockRestore();
  });

  it("does not warn on valid schema", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <SettaraProvider schema={minimalSchema}>
        <div>child</div>
      </SettaraProvider>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("renders children", () => {
    render(
      <SettaraProvider schema={minimalSchema}>
        <span data-testid="child">hello</span>
      </SettaraProvider>,
    );
    expect(screen.getByTestId("child").textContent).toBe("hello");
  });
});
