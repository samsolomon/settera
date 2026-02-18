import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { MultiSelect } from "../components/MultiSelect.js";
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
              key: "channels",
              title: "Notification Channels",
              type: "multiselect",
              options: [
                { value: "email", label: "Email" },
                { value: "sms", label: "SMS" },
                { value: "push", label: "Push" },
              ],
              default: ["email"],
            },
            {
              key: "required-multi",
              title: "Required Multi",
              type: "multiselect",
              options: [
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
              ],
              validation: {
                required: true,
              },
            },
            {
              key: "min-multi",
              title: "Min Multi",
              type: "multiselect",
              options: [
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
                { value: "c", label: "Option C" },
              ],
              validation: {
                minSelections: 2,
              },
            },
            {
              key: "max-multi",
              title: "Max Multi",
              type: "multiselect",
              options: [
                { value: "a", label: "Option A" },
                { value: "b", label: "Option B" },
                { value: "c", label: "Option C" },
              ],
              validation: {
                maxSelections: 1,
              },
            },
            {
              key: "dangerous-multi",
              title: "Dangerous Multi",
              type: "multiselect",
              options: [
                { value: "x", label: "X" },
                { value: "y", label: "Y" },
              ],
              dangerous: true,
            },
            {
              key: "disabled-multi",
              title: "Disabled Multi",
              type: "multiselect",
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

function renderMultiSelect(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <Settera schema={schema} values={values} onChange={onChange}>
      <MultiSelect settingKey={settingKey} />
    </Settera>,
  );
}

describe("MultiSelect", () => {
  it("renders checkboxes for each option", () => {
    renderMultiSelect("channels", { channels: [] });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(3);
  });

  it("displays option labels", () => {
    renderMultiSelect("channels", { channels: [] });
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("SMS")).toBeDefined();
    expect(screen.getByText("Push")).toBeDefined();
  });

  it("reflects checked state from value", () => {
    renderMultiSelect("channels", { channels: ["email", "push"] });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0].getAttribute("aria-checked")).toBe("true"); // email
    expect(checkboxes[1].getAttribute("aria-checked")).toBe("false"); // sms
    expect(checkboxes[2].getAttribute("aria-checked")).toBe("true"); // push
  });

  it("toggles value — checking adds to array", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderMultiSelect("channels", { channels: ["email"] }, onChange);

    await user.click(screen.getByText("SMS"));
    expect(onChange).toHaveBeenCalledWith("channels", ["email", "sms"]);
  });

  it("toggles value — unchecking removes from array", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderMultiSelect("channels", { channels: ["email", "sms"] }, onChange);

    await user.click(screen.getByText("Email"));
    expect(onChange).toHaveBeenCalledWith("channels", ["sms"]);
  });

  it("uses default value when not in values", () => {
    renderMultiSelect("channels", {});
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0].getAttribute("aria-checked")).toBe("true"); // email (default)
    expect(checkboxes[1].getAttribute("aria-checked")).toBe("false");
    expect(checkboxes[2].getAttribute("aria-checked")).toBe("false");
  });

  it("does not add its own role=group (SettingRow provides it)", () => {
    renderMultiSelect("channels", { channels: [] });
    // The wrapper div should not have role="group" — SettingRow handles grouping
    const wrapper = screen.getByTestId("multiselect-channels");
    expect(wrapper.getAttribute("role")).toBeNull();
  });

  it("has aria-invalid=false when no error", () => {
    renderMultiSelect("channels", { channels: ["email"] });
    const wrapper = screen.getByTestId("multiselect-channels");
    expect(wrapper.getAttribute("aria-invalid")).toBe("false");
  });

  it("shows required validation error on change", async () => {
    const user = userEvent.setup();
    render(
      <Settera
        schema={schema}
        values={{ "required-multi": ["a"] }}
        onChange={() => {}}
      >
        <SettingRow settingKey="required-multi">
          <MultiSelect settingKey="required-multi" />
        </SettingRow>
      </Settera>,
    );

    // Uncheck the only selected option
    await user.click(screen.getByText("Option A"));

    expect(screen.getByRole("alert").textContent).toBe(
      "At least one selection is required",
    );
  });

  it("shows minSelections error on change", async () => {
    const user = userEvent.setup();
    render(
      <Settera
        schema={schema}
        values={{ "min-multi": ["a", "b"] }}
        onChange={() => {}}
      >
        <SettingRow settingKey="min-multi">
          <MultiSelect settingKey="min-multi" />
        </SettingRow>
      </Settera>,
    );

    // Uncheck one to go below minimum
    await user.click(screen.getByText("Option A"));

    expect(screen.getByRole("alert").textContent).toBe("Select at least 2");
  });

  it("shows maxSelections error on change", async () => {
    const user = userEvent.setup();
    render(
      <Settera schema={schema} values={{ "max-multi": ["a"] }} onChange={() => {}}>
        <SettingRow settingKey="max-multi">
          <MultiSelect settingKey="max-multi" />
        </SettingRow>
      </Settera>,
    );

    // Check another to exceed maximum
    await user.click(screen.getByText("Option B"));

    expect(screen.getByRole("alert").textContent).toBe("Select at most 1");
  });

  it("applies dangerous styling", () => {
    renderMultiSelect("dangerous-multi", { "dangerous-multi": [] });
    const wrapper = screen.getByTestId("multiselect-dangerous-multi");
    const labels = wrapper.querySelectorAll("label");
    expect(labels[0].style.color).toContain("--settera-dangerous-color");
  });

  it("shows focus ring on keyboard focus", async () => {
    const user = userEvent.setup();
    renderMultiSelect("channels", { channels: [] });
    await user.tab();
    const checkbox = screen.getAllByRole("checkbox")[0];
    expect(checkbox.style.boxShadow).toContain("0 0 0 2px");
  });

  it("runs async validation on change", async () => {
    const user = userEvent.setup();
    const asyncValidator = vi.fn().mockResolvedValue("Too many selected");
    render(
      <Settera
        schema={schema}
        values={{ channels: ["email"] }}
        onChange={() => {}}
        onValidate={{ channels: asyncValidator }}
      >
        <SettingRow settingKey="channels">
          <MultiSelect settingKey="channels" />
        </SettingRow>
      </Settera>,
    );

    await user.click(screen.getByText("SMS"));

    await waitFor(() => {
      expect(asyncValidator).toHaveBeenCalledWith(["email", "sms"]);
    });
    expect(screen.getByRole("alert").textContent).toBe("Too many selected");
  });

  describe("disabled", () => {
    it("renders disabled checkboxes", () => {
      renderMultiSelect("disabled-multi", { "disabled-multi": [] });
      const checkboxes = screen.getAllByRole("checkbox");
      for (const checkbox of checkboxes) {
        expect((checkbox as HTMLButtonElement).disabled).toBe(true);
      }
    });

    it("does not call onChange when disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      renderMultiSelect("disabled-multi", { "disabled-multi": [] }, onChange);
      await user.click(screen.getByText("A"));
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
