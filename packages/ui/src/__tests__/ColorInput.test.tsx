import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { ColorInput } from "../components/ColorInput.js";
import { SettingRow } from "../components/SettingRow.js";
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
              key: "brand-color",
              title: "Brand Color",
              type: "color",
              default: "#ff0000",
            },
            {
              key: "required-color",
              title: "Required Color",
              type: "color",
              validation: { required: true },
            },
            {
              key: "disabled-color",
              title: "Disabled Color",
              type: "color",
              disabled: true,
            },
          ],
        },
      ],
    },
  ],
};

function renderColorInput(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
  onValidate?: Record<
    string,
    (value: unknown) => string | null | Promise<string | null>
  >,
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer
        values={values}
        onChange={onChange}
        onValidate={onValidate}
      >
        <SettingRow settingKey={settingKey}>
          <ColorInput settingKey={settingKey} />
        </SettingRow>
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

function getInput(label: string) {
  return screen.getByLabelText(label, { selector: "input" }) as HTMLInputElement;
}

describe("ColorInput", () => {
  it("renders a color input", () => {
    renderColorInput("brand-color", { "brand-color": "#ff0000" });
    const input = getInput("Brand Color");
    expect(input.type).toBe("color");
  });

  it("displays the current value", () => {
    renderColorInput("brand-color", { "brand-color": "#00ff00" });
    const input = getInput("Brand Color");
    expect(input.value).toBe("#00ff00");
  });

  it("uses default value from schema when not in values", () => {
    renderColorInput("brand-color", {});
    const input = getInput("Brand Color");
    expect(input.value).toBe("#ff0000");
  });

  it("calls onChange when value changes", () => {
    const onChange = vi.fn();
    renderColorInput("brand-color", { "brand-color": "#ff0000" }, onChange);
    const input = getInput("Brand Color");
    fireEvent.change(input, { target: { value: "#0000ff" } });
    expect(onChange).toHaveBeenCalledWith("brand-color", "#0000ff");
  });

  it("has aria-label from definition title", () => {
    renderColorInput("brand-color", { "brand-color": "#ff0000" });
    expect(getInput("Brand Color")).toBeDefined();
  });

  it("has aria-invalid=false when no error", () => {
    renderColorInput("brand-color", { "brand-color": "#ff0000" });
    const input = getInput("Brand Color");
    expect(input.getAttribute("aria-invalid")).toBe("false");
  });

  it("shows required validation error on blur", async () => {
    const user = userEvent.setup();
    renderColorInput("required-color", { "required-color": "" });
    const input = getInput("Required Color");
    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toBe(
        "This field is required",
      );
    });
  });

  it("runs async validation on blur", async () => {
    const user = userEvent.setup();
    const asyncValidator = vi.fn().mockResolvedValue("Invalid color");
    renderColorInput(
      "brand-color",
      { "brand-color": "#ff0000" },
      () => {},
      { "brand-color": asyncValidator },
    );

    const input = getInput("Brand Color");
    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(asyncValidator).toHaveBeenCalledWith("#ff0000");
    });
    expect(screen.getByRole("alert").textContent).toBe("Invalid color");
  });

  describe("disabled", () => {
    it("renders a disabled input", () => {
      renderColorInput("disabled-color", { "disabled-color": "#ff0000" });
      const input = getInput("Disabled Color");
      expect(input.disabled).toBe(true);
    });

    it("has not-allowed cursor and reduced opacity", () => {
      renderColorInput("disabled-color", { "disabled-color": "#ff0000" });
      const input = getInput("Disabled Color");
      expect(input.style.cursor).toBe("not-allowed");
      expect(input.style.opacity).toBe("0.5");
    });
  });
});
