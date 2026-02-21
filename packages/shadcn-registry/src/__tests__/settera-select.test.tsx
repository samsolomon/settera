import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraSelect } from "../settera/settera-select";
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
          ],
        },
      ],
    },
  ],
};

function renderSelect(
  settingKey: string,
  values?: Record<string, unknown>,
  onChange?: (key: string, value: unknown) => void,
) {
  return render(
    <Settera
      schema={schema}
      values={values ?? { theme: "light" }}
      onChange={onChange ?? vi.fn()}
    >
      <SetteraSelect settingKey={settingKey} />
    </Settera>,
  );
}

describe("SetteraSelect", () => {
  it("renders a select trigger", () => {
    renderSelect("theme");
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays the selected value label", () => {
    renderSelect("theme", { theme: "dark" });
    expect(screen.getByRole("combobox")).toHaveTextContent("Dark");
  });

  it("shows placeholder for non-required select with empty value", () => {
    renderSelect("theme", { theme: "" });
    // The trigger should still be present
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("opens dropdown and shows options on click", async () => {
    const user = userEvent.setup();
    renderSelect("theme");
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("option", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "System" })).toBeInTheDocument();
  });

  it("calls onChange when option is selected", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderSelect("theme", { theme: "light" }, onChange);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Dark" }));

    expect(onChange).toHaveBeenCalledWith("theme", "dark");
  });

  it("shows empty option for non-required select", async () => {
    const user = userEvent.setup();
    renderSelect("theme");
    await user.click(screen.getByRole("combobox"));
    // The empty option should be in the dropdown
    const options = screen.getAllByRole("option");
    // 3 real options + 1 empty "Select…" option
    expect(options.length).toBe(4);
  });

  it("does not show empty option for required select", async () => {
    const user = userEvent.setup();
    renderSelect("required-select", { "required-select": "a" });
    await user.click(screen.getByRole("combobox"));
    const options = screen.getAllByRole("option");
    // Only 2 real options, no empty
    expect(options.length).toBe(2);
  });
});
