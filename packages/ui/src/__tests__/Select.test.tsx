import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { Select } from "../components/Select.js";
import type { SetteraSchema } from "@settera/schema";

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {};
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {};
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

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
            {
              key: "collision-select",
              title: "Collision Select",
              type: "select",
              options: [
                { value: "normal", label: "Normal" },
                { value: "__settera_empty_option__", label: "Sentinel Value" },
              ],
              default: "normal",
            },
            {
              key: "disabled-select",
              title: "Disabled Select",
              type: "select",
              options: [
                { value: "a", label: "A" },
                { value: "b", label: "B" },
              ],
              disabled: true,
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
    <Settera schema={schema} values={values} onChange={onChange}>
      <Select settingKey={settingKey} />
    </Settera>,
  );
}

describe("Select", () => {
  async function openSelect(user: ReturnType<typeof userEvent.setup>) {
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await screen.findByRole("listbox");
  }

  it("renders a select element", () => {
    renderSelect("theme", { theme: "light" });
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders correct number of options (with placeholder)", async () => {
    const user = userEvent.setup();
    renderSelect("theme", { theme: "light" });
    await openSelect(user);
    const options = screen.getAllByRole("option");
    // 3 options + 1 "Select…" placeholder
    expect(options.length).toBe(4);
  });

  it("renders option values and labels", async () => {
    const user = userEvent.setup();
    renderSelect("theme", { theme: "light" });
    await openSelect(user);
    const listbox = screen.getByRole("listbox");
    expect(
      within(listbox).getByRole("option", { name: "Light" }),
    ).toBeDefined();
    expect(within(listbox).getByRole("option", { name: "Dark" })).toBeDefined();
    expect(
      within(listbox).getByRole("option", { name: "System" }),
    ).toBeDefined();
  });

  it("includes placeholder option when not required", async () => {
    const user = userEvent.setup();
    renderSelect("theme", { theme: "" });
    await openSelect(user);
    const listbox = screen.getByRole("listbox");
    expect(
      within(listbox).getByRole("option", { name: "Select…" }),
    ).toBeDefined();
  });

  it("omits placeholder option when required", async () => {
    const user = userEvent.setup();
    renderSelect("required-select", { "required-select": "a" });
    await openSelect(user);
    expect(screen.queryByText("Select…")).toBeNull();
  });

  it("displays selected value", () => {
    renderSelect("theme", { theme: "dark" });
    const select = screen.getByRole("combobox");
    expect(select.textContent).toContain("Dark");
  });

  it("calls onChange when selection changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelect("theme", { theme: "light" }, onChange);
    await openSelect(user);
    await user.click(screen.getByRole("option", { name: "Dark" }));
    expect(onChange).toHaveBeenCalledWith("theme", "dark");
  });

  it("does not treat a real option matching sentinel as empty", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelect(
      "collision-select",
      { "collision-select": "normal" },
      onChange,
    );

    await openSelect(user);
    await user.click(screen.getByRole("option", { name: "Sentinel Value" }));

    expect(onChange).toHaveBeenCalledWith(
      "collision-select",
      "__settera_empty_option__",
    );
  });

  it("uses default value when not in values", () => {
    renderSelect("theme", {});
    const select = screen.getByRole("combobox");
    expect(select.textContent).toContain("Light");
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
    const select = screen.getByRole("combobox");
    expect(select.textContent).toContain("Light");
  });

  it("runs async validation on change (not just blur)", async () => {
    const user = userEvent.setup();
    const asyncValidator = vi.fn(() => Promise.resolve("Invalid choice"));
    render(
      <Settera
        schema={schema}
        values={{ theme: "light" }}
        onChange={() => {}}
        onValidate={asyncValidator}
      >
        <Select settingKey="theme" />
      </Settera>,
    );

    await openSelect(user);
    await user.click(await screen.findByRole("option", { name: "Dark" }));

    await waitFor(() => {
      expect(asyncValidator).toHaveBeenCalledWith("theme", "dark");
    });
  });

  describe("disabled", () => {
    it("renders a disabled trigger", () => {
      renderSelect("disabled-select", { "disabled-select": "a" });
      const trigger = screen.getByRole("combobox") as HTMLButtonElement;
      expect(trigger.disabled).toBe(true);
    });

    it("does not open when disabled", async () => {
      const user = userEvent.setup();
      renderSelect("disabled-select", { "disabled-select": "a" });
      await user.click(screen.getByRole("combobox"));
      expect(screen.queryByRole("listbox")).toBeNull();
    });
  });
});
