import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SetteraProvider } from "../provider.js";
import { SetteraSchemaContext } from "../context.js";
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
});
