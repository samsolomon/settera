import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SetteraProvider } from "../provider.js";
import { SetteraRenderer } from "../renderer.js";
import { useSettera } from "../hooks/useSettera.js";
import type { SetteraSchema } from "@settera/schema";

const schema: SetteraSchema = {
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
              key: "autoSave",
              title: "Auto Save",
              type: "boolean",
              default: true,
            },
            {
              key: "theme",
              title: "Theme",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
              default: "light",
            },
          ],
        },
      ],
    },
  ],
};

function SetteraConsumer() {
  const { schema: s, values, setValue, validate } = useSettera();
  return (
    <div>
      <span data-testid="schema-version">{s.version}</span>
      <span data-testid="page-count">{s.pages.length}</span>
      <span data-testid="autoSave">{String(values.autoSave)}</span>
      <span data-testid="theme">{String(values.theme)}</span>
      <span data-testid="has-setValue">{typeof setValue}</span>
      <span data-testid="has-validate">
        {validate === undefined ? "undefined" : "defined"}
      </span>
      <button onClick={() => setValue("theme", "dark")}>set-dark</button>
    </div>
  );
}

describe("useSettera", () => {
  it("returns schema with correct version and pages", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{}} onChange={() => {}}>
          <SetteraConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("schema-version").textContent).toBe("1.0");
    expect(screen.getByTestId("page-count").textContent).toBe("1");
  });

  it("returns resolved values with defaults applied", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{}} onChange={() => {}}>
          <SetteraConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("autoSave").textContent).toBe("true");
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("returns explicit values over defaults", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer
          values={{ autoSave: false, theme: "dark" }}
          onChange={() => {}}
        >
          <SetteraConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("autoSave").textContent).toBe("false");
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("exposes setValue that calls onChange", async () => {
    const onChange = vi.fn();
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{}} onChange={onChange}>
          <SetteraConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    screen.getByText("set-dark").click();
    expect(onChange).toHaveBeenCalledWith("theme", "dark");
  });

  it("exposes onValidate when provided", () => {
    const validator = vi.fn().mockReturnValue(null);
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer
          values={{}}
          onChange={() => {}}
          onValidate={{ autoSave: validator }}
        >
          <SetteraConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("has-validate").textContent).toBe("defined");
  });

  it("returns undefined for validate when no onValidate provided", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{}} onChange={() => {}}>
          <SetteraConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("has-validate").textContent).toBe("undefined");
  });

  it("throws when used outside SetteraProvider", () => {
    expect(() => {
      render(
        <SetteraRenderer values={{}} onChange={() => {}}>
          <SetteraConsumer />
        </SetteraRenderer>,
      );
    }).toThrow("useSettera must be used within a SetteraProvider");
  });

  it("throws when used outside SetteraRenderer", () => {
    expect(() => {
      render(
        <SetteraProvider schema={schema}>
          <SetteraConsumer />
        </SetteraProvider>,
      );
    }).toThrow("useSettera must be used within a SetteraRenderer");
  });
});
