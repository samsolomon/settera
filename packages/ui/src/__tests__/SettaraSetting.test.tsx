import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettaraProvider, SettaraRenderer } from "@settara/react";
import { SettaraSetting } from "../components/SettaraSetting.js";
import type { SettaraSchema } from "@settara/schema";

const schema: SettaraSchema = {
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
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={values} onChange={() => {}}>
        <SettaraSetting settingKey={settingKey} />
      </SettaraRenderer>
    </SettaraProvider>,
  );
}

describe("SettaraSetting", () => {
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

  it("renders placeholder for unsupported types", () => {
    renderSetting("tags");
    expect(screen.getByTestId("unsupported-tags")).toBeDefined();
    expect(screen.getByTestId("unsupported-tags").textContent).toBe(
      "multiselect",
    );
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
