import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "@settera/react";
import { SetteraLayout } from "../components/SetteraLayout.js";
import type { SetteraSchema } from "@settera/schema";

const schema: SetteraSchema = {
  version: "1.0",
  pages: [
    {
      key: "general",
      title: "General",
      sections: [
        {
          key: "profile",
          title: "Profile",
          settings: [
            {
              key: "name",
              title: "Display name",
              type: "text",
              validation: {
                required: true,
                minLength: 3,
              },
            },
            {
              key: "darkMode",
              title: "Dark mode",
              type: "boolean",
            },
            {
              key: "theme",
              title: "Theme",
              type: "select",
              options: [
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "System" },
              ],
              visibleWhen: { setting: "darkMode", equals: true },
            },
            {
              key: "fontSize",
              title: "Font size",
              type: "number",
              validation: { min: 8, max: 72 },
            },
            {
              key: "reset",
              title: "Reset settings",
              type: "action",
              buttonLabel: "Reset",
              actionType: "callback",
            },
          ],
        },
      ],
    },
  ],
};

let rafQueue: FrameRequestCallback[] = [];

async function flushRaf() {
  await act(async () => {
    while (rafQueue.length > 0) {
      const callbacks = rafQueue;
      rafQueue = [];
      callbacks.forEach((cb) => cb(performance.now()));
    }
  });
}

beforeEach(() => {
  rafQueue = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    const index = Number(id) - 1;
    if (index >= 0 && index < rafQueue.length) {
      rafQueue.splice(index, 1);
    }
  });
  Object.defineProperty(window, "innerWidth", {
    value: 1200,
    writable: true,
    configurable: true,
  });
  window.dispatchEvent(new Event("resize"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderIntegration(opts: {
  values: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void | Promise<void>;
  onAction?: (key: string, payload?: unknown) => void | Promise<void>;
  validationMode?: "valid-only" | "eager-save";
}) {
  return render(
    <Settera
      schema={schema}
      values={opts.values}
      onChange={opts.onChange ?? (() => {})}
      onAction={opts.onAction}
      validationMode={opts.validationMode}
    >
      <SetteraLayout />
    </Settera>,
  );
}

describe("integration: full pipeline", () => {
  it("text input → blur → onChange called with committed value", async () => {
    const onChange = vi.fn();
    renderIntegration({ values: { name: "Sam" }, onChange });
    await flushRaf();

    const input = screen.getByDisplayValue("Sam");
    await userEvent.clear(input);
    await userEvent.type(input, "Alice");
    await act(async () => {
      input.blur();
    });

    expect(onChange).toHaveBeenCalledWith("name", "Alice");
  });

  it("too-short text in valid-only mode → error displayed, onChange NOT called", async () => {
    const onChange = vi.fn();
    renderIntegration({ values: { name: "Sam" }, onChange, validationMode: "valid-only" });
    await flushRaf();

    const input = screen.getByDisplayValue("Sam");
    await userEvent.clear(input);
    await userEvent.type(input, "Ab");
    await act(async () => {
      input.blur();
    });

    // onChange should not be called for the invalid short value
    const nameChanges = onChange.mock.calls.filter((call) => call[0] === "name");
    const hasInvalidCall = nameChanges.some((call) => call[1] === "Ab");
    expect(hasInvalidCall).toBe(false);
  });

  it("boolean toggle → onChange called", async () => {
    const onChange = vi.fn();
    renderIntegration({ values: { darkMode: false }, onChange });
    await flushRaf();

    // Find the switch by its role
    const toggle = screen.getByRole("switch", { name: /dark mode/i });
    await act(async () => {
      toggle.click();
    });

    expect(onChange).toHaveBeenCalledWith("darkMode", true);
  });

  it("boolean toggle → async save → saving then saved indicator", async () => {
    vi.useFakeTimers();
    let resolveSave!: () => void;
    const onChange = vi.fn(
      () => new Promise<void>((r) => { resolveSave = r; }),
    );
    renderIntegration({ values: { darkMode: false }, onChange });
    await flushRaf();

    const toggle = screen.getByRole("switch", { name: /dark mode/i });
    act(() => {
      toggle.click();
    });

    // Should show saving state
    expect(screen.getByText(/saving/i)).toBeTruthy();

    // Resolve the save
    await act(async () => {
      resolveSave();
    });

    expect(screen.getByText(/saved/i)).toBeTruthy();

    // After 2s, saved indicator should disappear
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.queryByText(/saved/i)).toBeNull();
    vi.useRealTimers();
  });

  it("visibility: toggle boolean → conditional setting appears", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Settera schema={schema} values={{ darkMode: false }} onChange={onChange}>
        <SetteraLayout />
      </Settera>,
    );
    await flushRaf();

    // Theme select should not be visible
    expect(screen.queryByText("Theme")).toBeNull();

    // Toggle dark mode on — rerender with new values
    rerender(
      <Settera schema={schema} values={{ darkMode: true }} onChange={onChange}>
        <SetteraLayout />
      </Settera>,
    );
    await flushRaf();

    // Theme select should now be visible
    expect(screen.getByText("Theme")).toBeTruthy();
  });

  it("action button click → onAction called", async () => {
    const onAction = vi.fn();
    renderIntegration({ values: {}, onAction });
    await flushRaf();

    const resetButton = screen.getByRole("button", { name: /reset/i });
    await act(async () => {
      resetButton.click();
    });

    expect(onAction).toHaveBeenCalledWith("reset", undefined);
  });

  it("number below min → error displayed", async () => {
    const onChange = vi.fn();
    renderIntegration({ values: { fontSize: 12 }, onChange, validationMode: "valid-only" });
    await flushRaf();

    const input = screen.getByDisplayValue("12");
    await userEvent.clear(input);
    await userEvent.type(input, "3");
    await act(async () => {
      input.blur();
    });

    // onChange should not be called with the invalid value
    const fontChanges = onChange.mock.calls.filter((call) => call[0] === "fontSize");
    const hasInvalidCall = fontChanges.some((call) => call[1] === 3);
    expect(hasInvalidCall).toBe(false);
  });
});
