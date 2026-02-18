import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Settera } from "../settera.js";
import { useSetteraConfirm } from "../hooks/useSetteraConfirm.js";
import { useSetteraSetting } from "../hooks/useSetteraSetting.js";
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
              key: "confirmed",
              title: "Confirmed",
              type: "boolean",
              default: false,
              dangerous: true,
              confirm: {
                title: "Are you sure?",
                message: "This is dangerous.",
                confirmLabel: "Yes",
                cancelLabel: "No",
              },
            },
            {
              key: "confirmedB",
              title: "Confirmed B",
              type: "boolean",
              default: false,
              confirm: {
                title: "Confirm B",
                message: "Confirm second.",
              },
            },
            {
              key: "normal",
              title: "Normal",
              type: "boolean",
              default: false,
            },
            {
              key: "destructive",
              title: "Destructive",
              type: "boolean",
              default: false,
              dangerous: true,
              confirm: {
                title: "Type DELETE to confirm",
                message: "This action is irreversible.",
                requireText: "DELETE",
              },
            },
          ],
        },
      ],
    },
  ],
};

function ConfirmConsumer() {
  const { pendingConfirm, resolveConfirm } = useSetteraConfirm();
  return (
    <div>
      <span data-testid="pending-key">{pendingConfirm?.key ?? "none"}</span>
      <span data-testid="pending-title">
        {pendingConfirm?.config.title ?? ""}
      </span>
      <span data-testid="pending-message">
        {pendingConfirm?.config.message ?? ""}
      </span>
      <span data-testid="pending-dangerous">
        {pendingConfirm ? String(pendingConfirm.dangerous) : ""}
      </span>
      <span data-testid="pending-confirm-label">
        {pendingConfirm?.config.confirmLabel ?? ""}
      </span>
      <span data-testid="pending-cancel-label">
        {pendingConfirm?.config.cancelLabel ?? ""}
      </span>
      <span data-testid="pending-require-text">
        {pendingConfirm?.config.requireText ?? ""}
      </span>
      <button
        data-testid="resolve-true"
        onClick={() => resolveConfirm(true)}
      >
        confirm
      </button>
      <button
        data-testid="resolve-false"
        onClick={() => resolveConfirm(false)}
      >
        cancel
      </button>
      <button
        data-testid="resolve-with-text"
        onClick={() => resolveConfirm(true, "DELETE")}
      >
        confirm-with-text
      </button>
      <button
        data-testid="resolve-wrong-text"
        onClick={() => resolveConfirm(true, "wrong")}
      >
        confirm-wrong-text
      </button>
    </div>
  );
}

function SettingTrigger({ settingKey }: { settingKey: string }) {
  const { setValue } = useSetteraSetting(settingKey);
  return (
    <button data-testid={`trigger-${settingKey}`} onClick={() => setValue(true)}>
      trigger {settingKey}
    </button>
  );
}

function renderWithConfirm(
  onChange: (key: string, value: unknown) => void = () => {},
) {
  return render(
    <Settera schema={schema} values={{}} onChange={onChange}>
      <ConfirmConsumer />
      <SettingTrigger settingKey="confirmed" />
      <SettingTrigger settingKey="confirmedB" />
      <SettingTrigger settingKey="normal" />
      <SettingTrigger settingKey="destructive" />
    </Settera>,
  );
}

describe("useSetteraConfirm", () => {
  it("returns null pendingConfirm initially", () => {
    renderWithConfirm();
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
  });

  it("shows pending confirm when a confirmed setting is changed", () => {
    renderWithConfirm();
    act(() => screen.getByTestId("trigger-confirmed").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("confirmed");
    expect(screen.getByTestId("pending-title").textContent).toBe(
      "Are you sure?",
    );
    expect(screen.getByTestId("pending-message").textContent).toBe(
      "This is dangerous.",
    );
  });

  it("exposes dangerous flag from the setting definition", () => {
    renderWithConfirm();
    act(() => screen.getByTestId("trigger-confirmed").click());
    expect(screen.getByTestId("pending-dangerous").textContent).toBe("true");
  });

  it("exposes custom confirm/cancel labels", () => {
    renderWithConfirm();
    act(() => screen.getByTestId("trigger-confirmed").click());
    expect(screen.getByTestId("pending-confirm-label").textContent).toBe("Yes");
    expect(screen.getByTestId("pending-cancel-label").textContent).toBe("No");
  });

  it("calls onChange when resolved with true", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);
    act(() => screen.getByTestId("trigger-confirmed").click());
    expect(onChange).not.toHaveBeenCalled();

    act(() => screen.getByTestId("resolve-true").click());
    expect(onChange).toHaveBeenCalledWith("confirmed", true);
  });

  it("clears pendingConfirm after resolving true", () => {
    renderWithConfirm();
    act(() => screen.getByTestId("trigger-confirmed").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("confirmed");

    act(() => screen.getByTestId("resolve-true").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
  });

  it("does not call onChange when resolved with false (cancel)", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);
    act(() => screen.getByTestId("trigger-confirmed").click());
    act(() => screen.getByTestId("resolve-false").click());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clears pendingConfirm after cancelling", () => {
    renderWithConfirm();
    act(() => screen.getByTestId("trigger-confirmed").click());
    act(() => screen.getByTestId("resolve-false").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
  });

  it("cancels previous confirm when a new one is requested", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);

    // Trigger first confirm
    act(() => screen.getByTestId("trigger-confirmed").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("confirmed");

    // Trigger second confirm — replaces the first
    act(() => screen.getByTestId("trigger-confirmedB").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("confirmedB");

    // Resolve the second one — only confirmedB should apply
    act(() => screen.getByTestId("resolve-true").click());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("confirmedB", true);
  });

  it("does not show confirm for normal (non-confirmed) settings", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);
    act(() => screen.getByTestId("trigger-normal").click());

    // No confirm shown — value applied immediately
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
    expect(onChange).toHaveBeenCalledWith("normal", true);
  });

  it("resolveConfirm is a no-op when no confirm is pending", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);

    // Resolve without any pending confirm — should not throw or call onChange
    act(() => screen.getByTestId("resolve-true").click());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
  });

  it("throws when used outside Settera", () => {
    function Bare() {
      useSetteraConfirm();
      return null;
    }
    expect(() => {
      render(<Bare />);
    }).toThrow("useSetteraConfirm must be used within a Settera component");
  });

  // ---- requireText enforcement ----

  it("resolves normally when no requireText is set", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);
    act(() => screen.getByTestId("trigger-confirmed").click());
    // confirmed has no requireText — resolve with true (no text) should work
    act(() => screen.getByTestId("resolve-true").click());
    expect(onChange).toHaveBeenCalledWith("confirmed", true);
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
  });

  it("exposes requireText from confirm config", () => {
    renderWithConfirm();
    act(() => screen.getByTestId("trigger-destructive").click());
    expect(screen.getByTestId("pending-require-text").textContent).toBe(
      "DELETE",
    );
  });

  it("resolves when text matches requireText", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);
    act(() => screen.getByTestId("trigger-destructive").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("destructive");

    act(() => screen.getByTestId("resolve-with-text").click());
    expect(onChange).toHaveBeenCalledWith("destructive", true);
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
  });

  it("stays pending when text does not match requireText", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);
    act(() => screen.getByTestId("trigger-destructive").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("destructive");

    act(() => screen.getByTestId("resolve-wrong-text").click());
    // Should still be pending — wrong text
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("pending-key").textContent).toBe("destructive");
  });

  it("stays pending when text is missing but requireText is set", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);
    act(() => screen.getByTestId("trigger-destructive").click());

    // resolve(true) with no text — should not resolve when requireText exists
    act(() => screen.getByTestId("resolve-true").click());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("pending-key").textContent).toBe("destructive");
  });

  it("cancel always works regardless of requireText", () => {
    const onChange = vi.fn();
    renderWithConfirm(onChange);
    act(() => screen.getByTestId("trigger-destructive").click());
    expect(screen.getByTestId("pending-key").textContent).toBe("destructive");

    act(() => screen.getByTestId("resolve-false").click());
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("pending-key").textContent).toBe("none");
  });
});
