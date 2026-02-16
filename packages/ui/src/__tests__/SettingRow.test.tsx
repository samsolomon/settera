import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettaraProvider, SettaraRenderer } from "@settara/react";
import { SettingRow } from "../components/SettingRow.js";
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
              description: "Automatically save your work.",
              type: "boolean",
              default: false,
            },
            {
              key: "dangerous",
              title: "Danger Setting",
              description: "This is dangerous.",
              type: "boolean",
              dangerous: true,
            },
            {
              key: "dependent",
              title: "Dependent Setting",
              type: "boolean",
              visibleWhen: { setting: "toggle", equals: true },
            },
          ],
        },
      ],
    },
  ],
};

function renderRow(
  settingKey: string,
  values: Record<string, unknown>,
  children: React.ReactNode = <span>control</span>,
) {
  return render(
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={values} onChange={() => {}}>
        <SettingRow settingKey={settingKey}>{children}</SettingRow>
      </SettaraRenderer>
    </SettaraProvider>,
  );
}

describe("SettingRow", () => {
  it("renders with role='group'", () => {
    renderRow("toggle", { toggle: false });
    expect(screen.getByRole("group")).toBeDefined();
  });

  it("displays setting title", () => {
    renderRow("toggle", { toggle: false });
    expect(screen.getByText("Auto Save")).toBeDefined();
  });

  it("displays setting description", () => {
    renderRow("toggle", { toggle: false });
    expect(screen.getByText("Automatically save your work.")).toBeDefined();
  });

  it("renders children (control)", () => {
    renderRow("toggle", { toggle: false }, <button>Switch</button>);
    expect(screen.getByText("Switch")).toBeDefined();
  });

  it("hides when isVisible is false", () => {
    renderRow("dependent", { toggle: false });
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("shows when isVisible is true", () => {
    renderRow("dependent", { toggle: true });
    expect(screen.getByRole("group")).toBeDefined();
    expect(screen.getByText("Dependent Setting")).toBeDefined();
  });
});
