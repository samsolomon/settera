import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { Select } from "../components/Select.js";
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
              key: "theme",
              title: "Theme",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ],
              default: "light",
            },
            {
              key: "required-select",
              title: "Required Select",
              type: "select",
              options: [
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
              ],
              validation: {
                required: true,
              },
            },
            {
              key: "dangerous-select",
              title: "Dangerous Select",
              type: "select",
              options: [
                { value: "x", label: "X" },
                { value: "y", label: "Y" },
              ],
              dangerous: true,
            },
          ],
        },
      ],
    },
  ],
};

function renderSelect(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={values} onChange={onChange}>
        <Select settingKey={settingKey} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("Select", () => {
  it("renders a select element", () => {
    renderSelect("theme", { theme: "light" });
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders correct number of options (with placeholder)", () => {
    renderSelect("theme", { theme: "light" });
    const options = screen.getAllByRole("option");
    // 3 options + 1 "Select…" placeholder
    expect(options.length).toBe(4);
  });

  it("renders option values and labels", () => {
    renderSelect("theme", { theme: "light" });
    expect(screen.getByText("Light")).toBeDefined();
    expect(screen.getByText("Dark")).toBeDefined();
    expect(screen.getByText("System")).toBeDefined();
  });

  it("includes placeholder option when not required", () => {
    renderSelect("theme", { theme: "" });
    expect(screen.getByText("Select…")).toBeDefined();
  });

  it("omits placeholder option when required", () => {
    renderSelect("required-select", { "required-select": "a" });
    expect(screen.queryByText("Select…")).toBeNull();
  });

  it("displays selected value", () => {
    renderSelect("theme", { theme: "dark" });
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("dark");
  });

  it("calls onChange when selection changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelect("theme", { theme: "light" }, onChange);
    await user.selectOptions(screen.getByRole("combobox"), "dark");
    expect(onChange).toHaveBeenCalledWith("theme", "dark");
  });

  it("uses default value when not in values", () => {
    renderSelect("theme", {});
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("light");
  });

  it("has aria-label from definition title", () => {
    renderSelect("theme", { theme: "light" });
    expect(screen.getByLabelText("Theme")).toBeDefined();
  });

  it("has aria-invalid='false' when no error", () => {
    renderSelect("theme", { theme: "light" });
    const select = screen.getByRole("combobox");
    expect(select.getAttribute("aria-invalid")).toBe("false");
  });

  it("shows focus ring on keyboard focus", async () => {
    const user = userEvent.setup();
    renderSelect("theme", { theme: "light" });
    await user.tab();
    const select = screen.getByRole("combobox");
    expect(select.style.boxShadow).toContain("0 0 0 2px");
  });

  it("applies dangerous styling", () => {
    renderSelect("dangerous-select", { "dangerous-select": "x" });
    const select = screen.getByRole("combobox");
    expect(select.style.color).toContain("--settera-dangerous-color");
  });

  it("does not apply dangerous styling to normal selects", () => {
    renderSelect("theme", { theme: "light" });
    const select = screen.getByRole("combobox");
    expect(select.style.color).not.toContain("--settera-dangerous-color");
  });

  it("uses default value when values is empty", () => {
    renderSelect("theme", {});
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("light");
  });

  it("runs async validation on change (not just blur)", async () => {
    const user = userEvent.setup();
    const asyncValidator = vi.fn().mockResolvedValue("Invalid choice");
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer
          values={{ theme: "light" }}
          onChange={() => {}}
          onValidate={{ theme: asyncValidator }}
        >
          <SettingRow settingKey="theme">
            <Select settingKey="theme" />
          </SettingRow>
        </SetteraRenderer>
      </SetteraProvider>,
    );

    await act(async () => {
      await user.selectOptions(screen.getByRole("combobox"), "dark");
    });

    expect(asyncValidator).toHaveBeenCalledWith("dark");
    expect(screen.getByRole("alert").textContent).toBe("Invalid choice");
  });
});
