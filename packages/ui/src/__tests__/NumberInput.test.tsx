import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { NumberInput } from "../components/NumberInput.js";
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
              key: "port",
              title: "Port Number",
              type: "number",
              placeholder: "8080",
              default: 3000,
              validation: {
                required: true,
                min: 1,
                max: 65535,
              },
            },
            {
              key: "simple",
              title: "Simple Number",
              type: "number",
            },
            {
              key: "dangerous",
              title: "Dangerous Number",
              type: "number",
              dangerous: true,
            },
          ],
        },
      ],
    },
  ],
};

function renderNumberInput(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={values} onChange={onChange}>
        <NumberInput settingKey={settingKey} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("NumberInput", () => {
  it("renders with type='number'", () => {
    renderNumberInput("port", { port: 3000 });
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.type).toBe("number");
  });

  it("displays placeholder text", () => {
    renderNumberInput("port", {});
    const input = screen.getByPlaceholderText("8080");
    expect(input).toBeDefined();
  });

  it("displays current value", () => {
    renderNumberInput("port", { port: 8080 });
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("8080");
  });

  it("calls onChange with parsed number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderNumberInput("simple", { simple: undefined }, onChange);
    const input = screen.getByRole("spinbutton");
    await user.type(input, "42");
    // Controlled component with no re-render: each keystroke fires independently
    expect(onChange).toHaveBeenCalledWith("simple", 4);
    expect(onChange).toHaveBeenCalledWith("simple", 2);
  });

  it("calls onChange with undefined when cleared", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderNumberInput("port", { port: 3000 }, onChange);
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    expect(onChange).toHaveBeenCalledWith("port", undefined);
  });

  it("has min/max attributes from validation", () => {
    renderNumberInput("port", { port: 3000 });
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.min).toBe("1");
    expect(input.max).toBe("65535");
  });

  it("has aria-label from definition title", () => {
    renderNumberInput("port", { port: 3000 });
    expect(screen.getByLabelText("Port Number")).toBeDefined();
  });

  it("has aria-invalid='false' when no error", () => {
    renderNumberInput("port", { port: 3000 });
    const input = screen.getByRole("spinbutton");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("shows focus ring on keyboard focus", async () => {
    const user = userEvent.setup();
    renderNumberInput("simple", {});
    await user.tab();
    const input = screen.getByRole("spinbutton");
    expect(input.style.boxShadow).toContain("0 0 0 2px");
  });

  it("uses default value when not in values", () => {
    renderNumberInput("port", {});
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("3000");
  });

  it("applies dangerous styling", () => {
    renderNumberInput("dangerous", { dangerous: 5 });
    const input = screen.getByRole("spinbutton");
    expect(input.style.color).toContain("--settera-dangerous-color");
  });

  it("does not apply dangerous styling to normal inputs", () => {
    renderNumberInput("simple", {});
    const input = screen.getByRole("spinbutton");
    expect(input.style.color).not.toContain("--settera-dangerous-color");
  });

  it("ignores NaN input values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderNumberInput("simple", {}, onChange);
    const input = screen.getByRole("spinbutton");
    // Typing "e" into a number input produces NaN via Number("e")
    // The component should not call onChange for NaN values
    await user.type(input, "e");
    // "e" alone in a number input yields empty string change event, calling setValue(undefined)
    // Filter out the undefined calls and check no NaN-derived number was passed
    for (const call of onChange.mock.calls) {
      const val = call[1];
      if (typeof val === "number") {
        expect(Number.isNaN(val)).toBe(false);
      }
    }
  });
});
