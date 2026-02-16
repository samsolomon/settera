import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettaraProvider } from "../provider.js";
import { SettaraRenderer } from "../renderer.js";
import { useSettaraSetting } from "../hooks/useSettaraSetting.js";
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
              key: "autoSave",
              title: "Auto Save",
              type: "boolean",
              default: true,
            },
            {
              key: "theme",
              title: "Theme",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ],
              default: "light",
            },
            {
              key: "noDefault",
              title: "No Default",
              type: "boolean",
            },
            {
              key: "dependent",
              title: "Dependent",
              type: "text",
              visibleWhen: { setting: "autoSave", equals: true },
            },
            {
              key: "hidden",
              title: "Hidden",
              type: "text",
              visibleWhen: { setting: "autoSave", equals: false },
            },
          ],
        },
      ],
    },
  ],
};

function SettingDisplay({ settingKey }: { settingKey: string }) {
  const { value, setValue, isVisible, definition } =
    useSettaraSetting(settingKey);
  return (
    <div data-testid={`setting-${settingKey}`}>
      <span data-testid={`value-${settingKey}`}>{String(value)}</span>
      <span data-testid={`visible-${settingKey}`}>
        {isVisible ? "visible" : "hidden"}
      </span>
      <span data-testid={`title-${settingKey}`}>{definition.title}</span>
      <button onClick={() => setValue(!value)}>toggle</button>
    </div>
  );
}

function renderWithProviders(
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void,
  children: React.ReactNode,
) {
  return render(
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={values} onChange={onChange}>
        {children}
      </SettaraRenderer>
    </SettaraProvider>,
  );
}

describe("useSettaraSetting", () => {
  it("returns current value from values object", () => {
    renderWithProviders(
      { autoSave: false },
      () => {},
      <SettingDisplay settingKey="autoSave" />,
    );
    expect(screen.getByTestId("value-autoSave").textContent).toBe("false");
  });

  it("falls back to default when value is undefined", () => {
    renderWithProviders({}, () => {}, <SettingDisplay settingKey="autoSave" />);
    expect(screen.getByTestId("value-autoSave").textContent).toBe("true");
  });

  it("returns undefined when no value and no default", () => {
    renderWithProviders(
      {},
      () => {},
      <SettingDisplay settingKey="noDefault" />,
    );
    expect(screen.getByTestId("value-noDefault").textContent).toBe("undefined");
  });

  it("returns definition with correct title", () => {
    renderWithProviders({}, () => {}, <SettingDisplay settingKey="autoSave" />);
    expect(screen.getByTestId("title-autoSave").textContent).toBe("Auto Save");
  });

  it("calls onChange when setValue is called", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      { autoSave: true },
      onChange,
      <SettingDisplay settingKey="autoSave" />,
    );
    await user.click(screen.getByText("toggle"));
    expect(onChange).toHaveBeenCalledWith("autoSave", false);
  });

  it("evaluates visibility — visible", () => {
    renderWithProviders(
      { autoSave: true },
      () => {},
      <SettingDisplay settingKey="dependent" />,
    );
    expect(screen.getByTestId("visible-dependent").textContent).toBe("visible");
  });

  it("evaluates visibility — hidden", () => {
    renderWithProviders(
      { autoSave: true },
      () => {},
      <SettingDisplay settingKey="hidden" />,
    );
    expect(screen.getByTestId("visible-hidden").textContent).toBe("hidden");
  });

  it("uses default for visibility when value not in values", () => {
    // autoSave defaults to true, so dependent should be visible even
    // when the consumer hasn't explicitly set autoSave in values.
    renderWithProviders(
      {},
      () => {},
      <>
        <SettingDisplay settingKey="autoSave" />
        <SettingDisplay settingKey="dependent" />
      </>,
    );
    expect(screen.getByTestId("visible-dependent").textContent).toBe("visible");
  });

  it("throws when used outside SettaraProvider", () => {
    expect(() => {
      render(<SettingDisplay settingKey="autoSave" />);
    }).toThrow("useSettaraSetting must be used within a SettaraProvider");
  });
});
