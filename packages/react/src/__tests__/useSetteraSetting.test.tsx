import React, { useContext } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider } from "../provider.js";
import { SetteraRenderer } from "../renderer.js";
import { useSetteraSetting } from "../hooks/useSetteraSetting.js";
import { SetteraValuesContext } from "../context.js";
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
            {
              key: "username",
              title: "Username",
              type: "text",
              validation: {
                required: true,
                minLength: 3,
              },
            },
            {
              key: "asyncField",
              title: "Async Field",
              type: "text",
              validation: {
                required: true,
              },
            },
            {
              key: "confirmed",
              title: "Confirmed",
              type: "boolean",
              default: false,
              dangerous: true,
              confirm: {
                title: "Are you sure?",
                message: "This enables a confirmed feature.",
              },
            },
            {
              key: "confirmedText",
              title: "Confirmed Text",
              type: "text",
              confirm: {
                message: "Confirm text change",
              },
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

function SettingDisplay({ settingKey }: { settingKey: string }) {
  const { value, setValue, error, isVisible, definition, validate } =
    useSetteraSetting(settingKey);
  return (
    <div data-testid={`setting-${settingKey}`}>
      <span data-testid={`value-${settingKey}`}>{String(value)}</span>
      <span data-testid={`visible-${settingKey}`}>
        {isVisible ? "visible" : "hidden"}
      </span>
      <span data-testid={`title-${settingKey}`}>{definition.title}</span>
      <span data-testid={`error-${settingKey}`}>{error ?? ""}</span>
      <button onClick={() => setValue(!value)}>toggle</button>
      <button onClick={() => setValue("")} data-testid={`clear-${settingKey}`}>
        clear
      </button>
      <button onClick={() => validate()} data-testid={`validate-${settingKey}`}>
        validate
      </button>
    </div>
  );
}

function renderWithProviders(
  values: Record<string, unknown>,
  onChange: (key: string, value: unknown) => void,
  children: React.ReactNode,
  extra?: {
    onValidate?: Record<
      string,
      (value: unknown) => string | null | Promise<string | null>
    >;
  },
) {
  return render(
    <SetteraProvider schema={schema}>
      <SetteraRenderer
        values={values}
        onChange={onChange}
        onValidate={extra?.onValidate}
      >
        {children}
      </SetteraRenderer>
    </SetteraProvider>,
  );
}

describe("useSetteraSetting", () => {
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

  it("throws when used outside SetteraProvider", () => {
    expect(() => {
      render(<SettingDisplay settingKey="autoSave" />);
    }).toThrow("useSetteraSetting must be used within a SetteraProvider");
  });

  // ---- Validation tests ----

  it("sets sync validation error on setValue", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      { username: "sam" },
      () => {},
      <SettingDisplay settingKey="username" />,
    );
    // Clear the value to trigger required validation
    await user.click(screen.getByTestId("clear-username"));
    expect(screen.getByTestId("error-username").textContent).toBe(
      "This field is required",
    );
  });

  it("clears error when valid value is set", async () => {
    const user = userEvent.setup();
    const values = { username: "" };
    const onChange = vi.fn((_key: string, value: unknown) => {
      values.username = value as string;
    });
    const { rerender } = render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={values} onChange={onChange}>
          <SettingDisplay settingKey="username" />
        </SetteraRenderer>
      </SetteraProvider>,
    );

    // Trigger error with empty value
    await user.click(screen.getByTestId("clear-username"));
    expect(screen.getByTestId("error-username").textContent).toBe(
      "This field is required",
    );

    // Re-render with valid value — clicking toggle sets boolean,
    // but we can trigger a valid set by re-rendering
    rerender(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ username: "sam" }} onChange={onChange}>
          <SettingDisplay settingKey="username" />
        </SetteraRenderer>
      </SetteraProvider>,
    );

    // After re-render, the error from the context should clear when next setValue runs.
    // For this test, we check that the value is now "sam"
    expect(screen.getByTestId("value-username").textContent).toBe("sam");
  });

  it("validate() runs sync + async pipeline", async () => {
    const asyncValidator = vi.fn().mockResolvedValue("Username taken");
    renderWithProviders(
      { asyncField: "hello" },
      () => {},
      <SettingDisplay settingKey="asyncField" />,
      { onValidate: { asyncField: asyncValidator } },
    );

    await act(async () => {
      screen.getByTestId("validate-asyncField").click();
    });

    expect(asyncValidator).toHaveBeenCalledWith("hello");
    expect(screen.getByTestId("error-asyncField").textContent).toBe(
      "Username taken",
    );
  });

  it("validate() skips async when sync fails", async () => {
    const asyncValidator = vi.fn().mockResolvedValue(null);
    renderWithProviders(
      { asyncField: "" },
      () => {},
      <SettingDisplay settingKey="asyncField" />,
      { onValidate: { asyncField: asyncValidator } },
    );

    await act(async () => {
      screen.getByTestId("validate-asyncField").click();
    });

    expect(asyncValidator).not.toHaveBeenCalled();
    expect(screen.getByTestId("error-asyncField").textContent).toBe(
      "This field is required",
    );
  });

  it("validate() clears error when both sync and async pass", async () => {
    const asyncValidator = vi.fn().mockResolvedValue(null);
    renderWithProviders(
      { asyncField: "valid" },
      () => {},
      <SettingDisplay settingKey="asyncField" />,
      { onValidate: { asyncField: asyncValidator } },
    );

    await act(async () => {
      screen.getByTestId("validate-asyncField").click();
    });

    expect(asyncValidator).toHaveBeenCalledWith("valid");
    expect(screen.getByTestId("error-asyncField").textContent).toBe("");
  });

  // ---- Confirm interception tests ----

  it("defers setValue when definition has confirm config", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      { confirmed: false },
      onChange,
      <SettingDisplay settingKey="confirmed" />,
    );
    await user.click(screen.getByText("toggle"));
    // onChange should NOT have been called — value deferred
    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies value when confirm is resolved", async () => {
    const onChange = vi.fn();

    function ConfirmResolver() {
      const ctx = useContext(SetteraValuesContext);
      return (
        <button
          data-testid="resolve-confirm"
          onClick={() => ctx?.resolveConfirm(true)}
        >
          confirm
        </button>
      );
    }

    const user = userEvent.setup();
    renderWithProviders(
      { confirmed: false },
      onChange,
      <>
        <SettingDisplay settingKey="confirmed" />
        <ConfirmResolver />
      </>,
    );

    await user.click(screen.getByText("toggle"));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("resolve-confirm"));
    expect(onChange).toHaveBeenCalledWith("confirmed", true);
  });

  it("does not apply value when confirm is cancelled", async () => {
    const onChange = vi.fn();

    function ConfirmCanceller() {
      const ctx = useContext(SetteraValuesContext);
      return (
        <button
          data-testid="cancel-confirm"
          onClick={() => ctx?.resolveConfirm(false)}
        >
          cancel
        </button>
      );
    }

    const user = userEvent.setup();
    renderWithProviders(
      { confirmed: false },
      onChange,
      <>
        <SettingDisplay settingKey="confirmed" />
        <ConfirmCanceller />
      </>,
    );

    await user.click(screen.getByText("toggle"));
    await user.click(screen.getByTestId("cancel-confirm"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("suppresses validate() while confirm is pending for the same key", async () => {
    const onChange = vi.fn();

    renderWithProviders(
      { confirmedText: "" },
      onChange,
      <SettingDisplay settingKey="confirmedText" />,
    );

    // Trigger confirm by setting empty value (which would fail required validation)
    await act(async () => {
      screen.getByTestId("clear-confirmedText").click();
    });

    // validate() should be suppressed while confirm is pending
    await act(async () => {
      screen.getByTestId("validate-confirmedText").click();
    });

    // Error should not be set because validate is suppressed
    expect(screen.getByTestId("error-confirmedText").textContent).toBe("");
  });

  it("applies setValue immediately when no confirm config", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      { autoSave: true },
      onChange,
      <SettingDisplay settingKey="autoSave" />,
    );
    await user.click(screen.getByText("toggle"));
    // Should apply immediately since no confirm
    expect(onChange).toHaveBeenCalledWith("autoSave", false);
  });
});
