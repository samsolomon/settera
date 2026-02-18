import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
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
            {
              key: "disabled-num",
              title: "Disabled Number",
              type: "number",
              disabled: true,
            },
            {
              key: "readonly-num",
              title: "Readonly Number",
              type: "number",
              readonly: true,
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
    <Settera schema={schema} values={values} onChange={onChange}>
      <NumberInput settingKey={settingKey} />
    </Settera>,
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

  it("does not call onChange on keystroke (buffered)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderNumberInput("simple", { simple: undefined }, onChange);
    const input = screen.getByRole("spinbutton");
    await user.type(input, "42");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("commits on blur with parsed number", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderNumberInput("simple", { simple: undefined }, onChange);
    const input = screen.getByRole("spinbutton");
    await user.type(input, "42");
    await user.tab();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("simple", 42);
  });

  it("commits on Enter", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderNumberInput("simple", { simple: undefined }, onChange);
    const input = screen.getByRole("spinbutton");
    await user.type(input, "99");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("simple", 99);
  });

  it("commits undefined when cleared and blurred", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderNumberInput("port", { port: 3000 }, onChange);
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    await user.tab();
    expect(onChange).toHaveBeenCalledWith("port", undefined);
  });

  it("external value updates sync when not focused", () => {
    const { rerender } = render(
      <Settera schema={schema} values={{ simple: 10 }} onChange={() => {}}>
        <NumberInput settingKey="simple" />
      </Settera>,
    );
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.value).toBe("10");

    rerender(
      <Settera schema={schema} values={{ simple: 20 }} onChange={() => {}}>
        <NumberInput settingKey="simple" />
      </Settera>,
    );
    expect(input.value).toBe("20");
  });

  it("external value updates ignored when focused", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Settera schema={schema} values={{ simple: 10 }} onChange={() => {}}>
        <NumberInput settingKey="simple" />
      </Settera>,
    );
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    await user.click(input);
    await user.type(input, "5");

    rerender(
      <Settera schema={schema} values={{ simple: 99 }} onChange={() => {}}>
        <NumberInput settingKey="simple" />
      </Settera>,
    );
    expect(input.value).toBe("105");
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
    await user.type(input, "e");
    await user.tab();
    // Should not have called onChange with a NaN-derived number
    for (const call of onChange.mock.calls) {
      const val = call[1];
      if (typeof val === "number") {
        expect(Number.isNaN(val)).toBe(false);
      }
    }
  });

  it("Escape reverts input value to committed", async () => {
    const user = userEvent.setup();
    renderNumberInput("port", { port: 3000 });
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    await user.click(input);
    await user.clear(input);
    await user.type(input, "9999");
    expect(input.value).toBe("9999");
    await user.keyboard("{Escape}");
    expect(input.value).toBe("3000");
  });

  it("Escape + blur does not call onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderNumberInput("port", { port: 3000 }, onChange);
    const input = screen.getByRole("spinbutton");
    await user.click(input);
    await user.clear(input);
    await user.type(input, "9999");
    await user.keyboard("{Escape}");
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
  });

  describe("disabled", () => {
    it("renders a disabled input", () => {
      renderNumberInput("disabled-num", { "disabled-num": 42 });
      const input = screen.getByLabelText("Disabled Number") as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });
  });

  describe("readonly", () => {
    it("renders a readonly input", () => {
      renderNumberInput("readonly-num", { "readonly-num": 42 });
      const input = screen.getByLabelText("Readonly Number") as HTMLInputElement;
      expect(input.readOnly).toBe(true);
    });
  });
});
