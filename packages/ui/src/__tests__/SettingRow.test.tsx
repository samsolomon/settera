import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import {
  Settera,
  SetteraValuesContext,
  useSetteraSetting,
} from "@settera/react";
import { SettingRow } from "../components/SettingRow.js";
import type { SetteraSchema } from "@settera/schema";
import { SetteraDeepLinkContext } from "../contexts/SetteraDeepLinkContext.js";

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
            {
              key: "username",
              title: "Username",
              type: "text",
              validation: { required: true },
            },
            {
              key: "disabledSetting",
              title: "Disabled Setting",
              type: "boolean",
              disabled: true,
              default: false,
            },
          ],
        },
      ],
    },
  ],
};

// Helper component that triggers a validation error by calling setValue with empty string
function ErrorTrigger({ settingKey }: { settingKey: string }) {
  const { setValue } = useSetteraSetting(settingKey);
  return (
    <button data-testid="trigger-error" onClick={() => setValue("")}>
      trigger
    </button>
  );
}

function renderRow(
  settingKey: string,
  values: Record<string, unknown>,
  children: React.ReactNode = <span>control</span>,
) {
  return render(
    <Settera schema={schema} values={values} onChange={() => {}}>
      <SettingRow settingKey={settingKey}>{children}</SettingRow>
    </Settera>,
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

  // ---- Error display tests ----

  it("does not render error element when no error", () => {
    renderRow("toggle", { toggle: false });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders error with role='alert' when error exists", () => {
    render(
      <Settera schema={schema} values={{ username: "" }} onChange={() => {}}>
        <SettingRow settingKey="username">
          <ErrorTrigger settingKey="username" />
        </SettingRow>
      </Settera>,
    );

    act(() => {
      screen.getByTestId("trigger-error").click();
    });

    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toBe("This field is required");
  });

  it("error element has correct id", () => {
    render(
      <Settera schema={schema} values={{ username: "" }} onChange={() => {}}>
        <SettingRow settingKey="username">
          <ErrorTrigger settingKey="username" />
        </SettingRow>
      </Settera>,
    );

    act(() => {
      screen.getByTestId("trigger-error").click();
    });
    const alert = screen.getByRole("alert");
    expect(alert.id).toBe("settera-error-username");
  });

  it("hides error when no error present", () => {
    renderRow("username", { username: "valid" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // ---- Disabled state tests ----

  it("sets aria-disabled on group when disabled", () => {
    // Note: Disabled opacity uses CSS custom property tokens which jsdom
    // cannot parse — visual opacity is verified via browser testing only.
    renderRow("disabledSetting", { disabledSetting: false });
    const group = screen.getByRole("group", { name: "Disabled Setting" });
    expect(group.getAttribute("aria-disabled")).toBe("true");
  });

  it("does not set aria-disabled on non-disabled settings", () => {
    renderRow("toggle", { toggle: false });
    const group = screen.getByRole("group", { name: "Auto Save" });
    expect(group.getAttribute("aria-disabled")).toBeNull();
  });

  it("shows copy feedback only when clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={() => {}}>
        <SetteraDeepLinkContext.Provider
          value={{
            getSettingUrl: (key) =>
              `https://example.com/?setteraSetting=${key}`,
          }}
        >
          <SettingRow settingKey="toggle">
            <span>control</span>
          </SettingRow>
        </SetteraDeepLinkContext.Provider>
      </Settera>,
    );

    const group = screen.getByRole("group", { name: "Auto Save" });
    fireEvent.mouseEnter(group);
    const copyButton = screen.getByRole("button", {
      name: "Copy link to setting",
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "https://example.com/?setteraSetting=toggle",
      );
      const checkPath = copyButton.querySelector("path");
      expect(checkPath?.getAttribute("d")).toBe("M3 8.5l3.5 3.5L13 4");
    });
  });

  it("does not show copy feedback when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={() => {}}>
        <SetteraDeepLinkContext.Provider
          value={{
            getSettingUrl: (key) =>
              `https://example.com/?setteraSetting=${key}`,
          }}
        >
          <SettingRow settingKey="toggle">
            <span>control</span>
          </SettingRow>
        </SetteraDeepLinkContext.Provider>
      </Settera>,
    );

    const group = screen.getByRole("group", { name: "Auto Save" });
    fireEvent.mouseEnter(group);
    const copyButton = screen.getByRole("button", {
      name: "Copy link to setting",
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    const iconPath = copyButton.querySelector("path");
    expect(iconPath?.getAttribute("d")?.startsWith("M6.5 8.5")).toBe(true);
  });
});

// ---- Save status indicator ----

function SetValueButton() {
  const store = React.useContext(SetteraValuesContext);
  return (
    <button onClick={() => store!.setValue("toggle", true)}>save-setting</button>
  );
}

describe("save status indicator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows no indicator when idle", () => {
    renderRow("toggle", { toggle: false });
    expect(screen.queryByLabelText("Saving")).toBeNull();
    expect(screen.queryByLabelText("Saved")).toBeNull();
    expect(screen.queryByLabelText("Save failed")).toBeNull();
  });

  it("shows 'Saving...' during async save", async () => {
    let resolveSave!: () => void;
    const onChange = vi.fn(() => new Promise<void>((r) => (resolveSave = r)));
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SettingRow settingKey="toggle">
          <SetValueButton />
        </SettingRow>
      </Settera>,
    );
    act(() => screen.getByText("save-setting").click());
    expect(screen.getByLabelText("Saving")).toBeDefined();
    await act(async () => resolveSave());
  });

  it("shows 'Saved' after success", async () => {
    let resolveSave!: () => void;
    const onChange = vi.fn(() => new Promise<void>((r) => (resolveSave = r)));
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SettingRow settingKey="toggle">
          <SetValueButton />
        </SettingRow>
      </Settera>,
    );
    act(() => screen.getByText("save-setting").click());
    await act(async () => resolveSave());
    expect(screen.getByLabelText("Saved")).toBeDefined();
  });

  it("shows 'Save failed' after error", async () => {
    let rejectSave!: (err: Error) => void;
    const onChange = vi.fn(
      () => new Promise<void>((_r, rej) => (rejectSave = rej)),
    );
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SettingRow settingKey="toggle">
          <SetValueButton />
        </SettingRow>
      </Settera>,
    );
    act(() => screen.getByText("save-setting").click());
    await act(async () => rejectSave(new Error("fail")));
    expect(screen.getByLabelText("Save failed")).toBeDefined();
  });

  it("'Saved' auto-clears after 2s", async () => {
    let resolveSave!: () => void;
    const onChange = vi.fn(() => new Promise<void>((r) => (resolveSave = r)));
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SettingRow settingKey="toggle">
          <SetValueButton />
        </SettingRow>
      </Settera>,
    );
    act(() => screen.getByText("save-setting").click());
    await act(async () => resolveSave());
    expect(screen.getByLabelText("Saved")).toBeDefined();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByLabelText("Saved")).toBeNull();
  });
});
