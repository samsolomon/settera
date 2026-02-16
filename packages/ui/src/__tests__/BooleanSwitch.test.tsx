import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettaraProvider, SettaraRenderer } from "@settara/react";
import { BooleanSwitch } from "../components/BooleanSwitch.js";
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
              title: "Toggle Setting",
              type: "boolean",
              default: false,
            },
            {
              key: "dangerous",
              title: "Dangerous Toggle",
              type: "boolean",
              dangerous: true,
            },
          ],
        },
      ],
    },
  ],
};

function renderSwitch(
  settingKey: string,
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={values} onChange={onChange}>
        <BooleanSwitch settingKey={settingKey} />
      </SettaraRenderer>
    </SettaraProvider>,
  );
}

describe("BooleanSwitch", () => {
  it("renders with role='switch'", () => {
    renderSwitch("toggle", { toggle: false });
    expect(screen.getByRole("switch")).toBeDefined();
  });

  it("has aria-checked='false' when off", () => {
    renderSwitch("toggle", { toggle: false });
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("has aria-checked='true' when on", () => {
    renderSwitch("toggle", { toggle: true });
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("has aria-label from definition title", () => {
    renderSwitch("toggle", { toggle: false });
    expect(screen.getByRole("switch").getAttribute("aria-label")).toBe(
      "Toggle Setting",
    );
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSwitch("toggle", { toggle: false }, onChange);
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("toggle", true);
  });

  it("toggles on Space key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSwitch("toggle", { toggle: true }, onChange);
    screen.getByRole("switch").focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith("toggle", false);
  });

  it("uses default value when not in values", () => {
    renderSwitch("toggle", {});
    // default is false
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("applies dangerous styling", () => {
    renderSwitch("dangerous", { dangerous: true });
    const switchEl = screen.getByRole("switch");
    // When dangerous and checked, should use dangerous color
    expect(switchEl.style.backgroundColor).toBeTruthy();
  });

  it("toggles from on to off on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSwitch("toggle", { toggle: true }, onChange);
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("toggle", false);
  });

  it("shows focus ring on keyboard focus", async () => {
    const user = userEvent.setup();
    renderSwitch("toggle", { toggle: false });
    await user.tab();
    const switchEl = screen.getByRole("switch");
    expect(switchEl.style.boxShadow).toContain("0 0 0 2px");
  });
});
