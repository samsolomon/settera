import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Settera } from "../settera.js";
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
  const { schema: s, values, setValue } = useSettera();
  return (
    <div>
      <span data-testid="schema-version">{s.version}</span>
      <span data-testid="page-count">{s.pages.length}</span>
      <span data-testid="autoSave">{String(values.autoSave)}</span>
      <span data-testid="theme">{String(values.theme)}</span>
      <span data-testid="has-setValue">{typeof setValue}</span>
      <button onClick={() => setValue("theme", "dark")}>set-dark</button>
    </div>
  );
}

describe("useSettera", () => {
  it("returns schema with correct version and pages", () => {
    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <SetteraConsumer />
      </Settera>,
    );
    expect(screen.getByTestId("schema-version").textContent).toBe("1.0");
    expect(screen.getByTestId("page-count").textContent).toBe("1");
  });

  it("returns resolved values with defaults applied", () => {
    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <SetteraConsumer />
      </Settera>,
    );
    expect(screen.getByTestId("autoSave").textContent).toBe("true");
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("returns explicit values over defaults", () => {
    render(
      <Settera
        schema={schema}
        values={{ autoSave: false, theme: "dark" }}
        onChange={() => {}}
      >
        <SetteraConsumer />
      </Settera>,
    );
    expect(screen.getByTestId("autoSave").textContent).toBe("false");
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("exposes setValue that calls onChange", async () => {
    const onChange = vi.fn();
    render(
      <Settera schema={schema} values={{}} onChange={onChange}>
        <SetteraConsumer />
      </Settera>,
    );
    screen.getByText("set-dark").click();
    expect(onChange).toHaveBeenCalledWith("theme", "dark");
  });

  it("throws when used outside Settera", () => {
    expect(() => {
      render(<SetteraConsumer />);
    }).toThrow("useSettera must be used within a Settera component");
  });
});
