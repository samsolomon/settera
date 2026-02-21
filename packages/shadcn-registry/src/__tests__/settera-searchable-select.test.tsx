import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
              key: "timezone",
              title: "Timezone",
              type: "select",
              searchable: true,
              options: [
                { value: "America/New_York", label: "Eastern Time (New York)", group: "Americas" },
                { value: "America/Chicago", label: "Central Time (Chicago)", group: "Americas" },
                { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)", group: "Americas" },
                { value: "Europe/London", label: "GMT (London)", group: "Europe" },
                { value: "Europe/Berlin", label: "CET (Berlin)", group: "Europe" },
                { value: "Asia/Tokyo", label: "JST (Tokyo)", group: "Asia" },
              ],
            },
            {
              key: "required-tz",
              title: "Required Timezone",
              type: "select",
              searchable: true,
              options: [
                { value: "America/New_York", label: "Eastern Time (New York)" },
                { value: "Europe/London", label: "GMT (London)" },
              ],
              validation: { required: true },
            },
          ],
        },
      ],
    },
  ],
};

function renderSearchableSelect(
  settingKey: string,
  values?: Record<string, unknown>,
  onChange?: (key: string, value: unknown) => void,
) {
  return render(
    <Settera
      schema={schema}
      values={values ?? { timezone: "America/New_York" }}
      onChange={onChange ?? vi.fn()}
    >
      <SetteraSelect settingKey={settingKey} />
    </Settera>,
  );
}

describe("SetteraSearchableSelect", () => {
  it("renders trigger with selected value label", () => {
    renderSearchableSelect("timezone", { timezone: "Europe/London" });
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent("GMT (London)");
  });

  it("opens popover on click, shows input and all options", async () => {
    const user = userEvent.setup();
    renderSearchableSelect("timezone");

    await user.click(screen.getByRole("combobox"));

    // Search input should be visible
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    // All 6 options + empty option (non-required) = 7
    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(7);
  });

  it("typing in input filters options (case-insensitive)", async () => {
    const user = userEvent.setup();
    renderSearchableSelect("timezone");

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("textbox"), "london");

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("GMT (London)");
  });

  it("selecting an option calls onChange and closes popover", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderSearchableSelect("timezone", { timezone: "America/New_York" }, onChange);

    await user.click(screen.getByRole("combobox"));

    const listbox = screen.getByRole("listbox");
    const londonOption = within(listbox).getByRole("option", { name: "GMT (London)" });
    await user.click(londonOption);

    expect(onChange).toHaveBeenCalledWith("timezone", "Europe/London");
    // Popover should be closed — listbox should not be in document
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows 'No results' when filter matches nothing", async () => {
    const user = userEvent.setup();
    renderSearchableSelect("timezone");

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("textbox"), "zzzzzzzzz");

    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });

  it("non-required shows empty option; required does not", async () => {
    const user = userEvent.setup();

    // Non-required
    const { unmount } = renderSearchableSelect("timezone");
    await user.click(screen.getByRole("combobox"));
    let listbox = screen.getByRole("listbox");
    let options = within(listbox).getAllByRole("option");
    // 6 real options + 1 empty = 7
    expect(options).toHaveLength(7);
    unmount();

    // Required
    renderSearchableSelect("required-tz", { "required-tz": "America/New_York" });
    await user.click(screen.getByRole("combobox"));
    listbox = screen.getByRole("listbox");
    options = within(listbox).getAllByRole("option");
    // Only 2 real options, no empty
    expect(options).toHaveLength(2);
  });

  it("filters by group name", async () => {
    const user = userEvent.setup();
    renderSearchableSelect("timezone");

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByRole("textbox"), "Europe");

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(2); // London + Berlin
  });

  it("shows placeholder when no value selected", () => {
    renderSearchableSelect("timezone", { timezone: "" });
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("Select\u2026");
  });

  it("escape closes popover", async () => {
    const user = userEvent.setup();
    renderSearchableSelect("timezone");

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("arrow key navigation highlights options", async () => {
    const user = userEvent.setup();
    renderSearchableSelect("timezone");

    await user.click(screen.getByRole("combobox"));

    // Focus the search input explicitly
    const input = screen.getByRole("textbox");
    input.focus();

    // Press down twice to move highlight
    await user.keyboard("{ArrowDown}{ArrowDown}");

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    // The third option (index 2) should be highlighted
    expect(options[2]).toHaveAttribute("data-highlighted", "true");
  });

  it("enter selects highlighted option", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderSearchableSelect("timezone", { timezone: "America/New_York" }, onChange);

    await user.click(screen.getByRole("combobox"));

    // Focus the search input explicitly
    const input = screen.getByRole("textbox");
    input.focus();

    // Skip empty option (index 0), go to first real option (index 1) then to second (index 2)
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    // Index 2 = America/Chicago (after empty option at index 0, America/New_York at index 1)
    expect(onChange).toHaveBeenCalledWith("timezone", "America/Chicago");
  });
});
