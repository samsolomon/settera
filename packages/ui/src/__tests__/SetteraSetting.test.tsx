import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SetteraProvider, SetteraRenderer } from "@settera/react";
import { SetteraSetting } from "../components/SetteraSetting.js";
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
              key: "toggle",
              title: "Auto Save",
              type: "boolean",
              default: false,
            },
            {
              key: "name",
              title: "Name",
              type: "text",
              placeholder: "Enter name",
            },
            {
              key: "count",
              title: "Count",
              type: "number",
              placeholder: "0",
            },
            {
              key: "theme",
              title: "Theme",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
            },
            {
              key: "doExport",
              title: "Export Data",
              type: "action",
              buttonLabel: "Export",
              actionType: "callback",
            },
            {
              key: "tags",
              title: "Tags",
              type: "multiselect",
              options: [{ value: "a", label: "A" }],
            },
            {
              key: "startDate",
              title: "Start Date",
              type: "date",
            },
            {
              key: "hidden",
              title: "Hidden Setting",
              type: "boolean",
              visibleWhen: { setting: "toggle", equals: true },
            },
          ],
        },
      ],
    },
  ],
};

function renderSetting(
  settingKey: string,
  values: Record<string, unknown> = {},
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={values} onChange={() => {}}>
        <SetteraSetting settingKey={settingKey} />
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("SetteraSetting", () => {
  it("renders BooleanSwitch for boolean type", () => {
    renderSetting("toggle", { toggle: false });
    expect(screen.getByRole("switch")).toBeDefined();
  });

  it("renders TextInput for text type", () => {
    renderSetting("name");
    expect(screen.getByRole("textbox")).toBeDefined();
  });

  it("renders NumberInput for number type", () => {
    renderSetting("count");
    expect(screen.getByRole("spinbutton")).toBeDefined();
  });

  it("renders Select for select type", () => {
    renderSetting("theme");
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("renders ActionButton for action type", () => {
    renderSetting("doExport");
    expect(screen.getByRole("button")).toBeDefined();
    expect(screen.getByText("Export")).toBeDefined();
  });

  it("renders MultiSelect for multiselect type", () => {
    renderSetting("tags");
    // MultiSelect renders checkboxes inside the setting row
    expect(screen.getAllByRole("checkbox").length).toBe(1);
  });

  it("renders DateInput for date type", () => {
    renderSetting("startDate");
    const input = screen.getByLabelText("Start Date", {
      selector: "input",
    }) as HTMLInputElement;
    expect(input.type).toBe("date");
  });

  it("wraps control in SettingRow with title", () => {
    renderSetting("toggle", { toggle: false });
    expect(screen.getByText("Auto Save")).toBeDefined();
    expect(screen.getByRole("group")).toBeDefined();
  });

  it("respects visibility — hidden when condition not met", () => {
    renderSetting("hidden", { toggle: false });
    expect(screen.queryByText("Hidden Setting")).toBeNull();
  });
});
