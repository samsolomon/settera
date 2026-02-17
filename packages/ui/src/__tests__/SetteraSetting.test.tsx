import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
              key: "aliases",
              title: "Aliases",
              type: "repeatable",
              itemType: "text",
              default: ["alpha"],
            },
            {
              key: "hidden",
              title: "Hidden Setting",
              type: "boolean",
              visibleWhen: { setting: "toggle", equals: true },
            },
            {
              key: "profile",
              title: "Profile",
              type: "compound",
              displayStyle: "inline",
              fields: [
                {
                  key: "nickname",
                  title: "Nickname",
                  type: "text",
                },
                {
                  key: "public",
                  title: "Public",
                  type: "boolean",
                  default: false,
                },
              ],
            },
            {
              key: "customCard",
              title: "Custom Card",
              type: "custom",
              renderer: "customCard",
              config: {
                tone: "info",
              },
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
  customSettings?: React.ComponentProps<
    typeof SetteraSetting
  >["customSettings"],
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer values={values} onChange={() => {}}>
        <SetteraSetting
          settingKey={settingKey}
          customSettings={customSettings}
        />
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

  it("renders RepeatableInput for repeatable type", () => {
    renderSetting("aliases");
    expect(screen.getByTestId("repeatable-aliases")).toBeDefined();
  });

  it("renders custom setting renderer when provided", () => {
    renderSetting(
      "customCard",
      {},
      {
        customCard: ({ settingKey, definition }) => (
          <div data-testid="custom-setting-renderer">
            {settingKey}:{String(definition.config?.tone)}
          </div>
        ),
      },
    );

    expect(screen.getByTestId("custom-setting-renderer").textContent).toBe(
      "customCard:info",
    );
  });

  it("shows fallback when custom setting renderer is missing", () => {
    renderSetting("customCard");
    expect(
      screen.getByTestId("missing-custom-setting-customCard").textContent,
    ).toContain("customCard");
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

  it("renders CompoundInput fields for compound type", () => {
    renderSetting("profile", { profile: { nickname: "Sam" } });
    expect(screen.getByLabelText("Nickname")).toBeDefined();
    expect(screen.getByLabelText("Public")).toBeDefined();
  });

  it("updates compound value as a single object", () => {
    const onChange = vi.fn();
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer
          values={{ profile: { nickname: "Sam", public: false } }}
          onChange={onChange}
        >
          <SetteraSetting settingKey="profile" />
        </SetteraRenderer>
      </SetteraProvider>,
    );

    fireEvent.change(screen.getByLabelText("Nickname"), {
      target: { value: "Alex" },
    });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByLabelText("Nickname"));

    expect(onChange).toHaveBeenCalledWith("profile", {
      nickname: "Alex",
      public: false,
    });
  });

  it("keeps defaulted compound fields in emitted object", () => {
    const onChange = vi.fn();
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer
          values={{ profile: { nickname: "Sam" } }}
          onChange={onChange}
        >
          <SetteraSetting settingKey="profile" />
        </SetteraRenderer>
      </SetteraProvider>,
    );

    fireEvent.change(screen.getByLabelText("Nickname"), {
      target: { value: "Alex" },
    });
    fireEvent.blur(screen.getByLabelText("Nickname"));

    expect(onChange).toHaveBeenCalledWith("profile", {
      nickname: "Alex",
      public: false,
    });
  });
});
