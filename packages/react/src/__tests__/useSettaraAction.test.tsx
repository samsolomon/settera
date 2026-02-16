import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettaraProvider } from "../provider.js";
import { SettaraRenderer } from "../renderer.js";
import { useSettaraAction } from "../hooks/useSettaraAction.js";
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
              title: "Toggle",
              type: "boolean",
              default: false,
            },
            {
              key: "resetAction",
              title: "Reset Data",
              type: "action",
              buttonLabel: "Reset",
              actionType: "callback",
            },
            {
              key: "hiddenAction",
              title: "Hidden Action",
              type: "action",
              buttonLabel: "Hidden",
              actionType: "callback",
              visibleWhen: { setting: "toggle", equals: true },
            },
          ],
        },
      ],
    },
  ],
};

function ActionDisplay({ settingKey }: { settingKey: string }) {
  const { definition, isVisible, onAction, isLoading } =
    useSettaraAction(settingKey);
  return (
    <div data-testid={`action-${settingKey}`}>
      <span data-testid={`title-${settingKey}`}>{definition.title}</span>
      <span data-testid={`visible-${settingKey}`}>
        {isVisible ? "visible" : "hidden"}
      </span>
      <span data-testid={`loading-${settingKey}`}>
        {isLoading ? "loading" : "idle"}
      </span>
      <span data-testid={`hasHandler-${settingKey}`}>
        {onAction ? "yes" : "no"}
      </span>
      {onAction && (
        <button onClick={onAction} data-testid={`trigger-${settingKey}`}>
          Go
        </button>
      )}
    </div>
  );
}

function renderAction(
  settingKey: string,
  onAction?: Record<string, () => void | Promise<void>>,
  values: Record<string, unknown> = {},
) {
  return render(
    <SettaraProvider schema={schema}>
      <SettaraRenderer values={values} onChange={() => {}} onAction={onAction}>
        <ActionDisplay settingKey={settingKey} />
      </SettaraRenderer>
    </SettaraProvider>,
  );
}

describe("useSettaraAction", () => {
  it("returns definition with correct title", () => {
    renderAction("resetAction");
    expect(screen.getByTestId("title-resetAction").textContent).toBe(
      "Reset Data",
    );
  });

  it("evaluates visibility correctly", () => {
    renderAction("hiddenAction", undefined, { toggle: false });
    expect(screen.getByTestId("visible-hiddenAction").textContent).toBe(
      "hidden",
    );
  });

  it("evaluates visibility when condition met", () => {
    renderAction("hiddenAction", undefined, { toggle: true });
    expect(screen.getByTestId("visible-hiddenAction").textContent).toBe(
      "visible",
    );
  });

  it("calls sync handler on click", async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    renderAction("resetAction", { resetAction: handler });
    await user.click(screen.getByTestId("trigger-resetAction"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("tracks loading state for async handler", async () => {
    let resolve: () => void;
    const handler = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    renderAction("resetAction", { resetAction: handler });

    expect(screen.getByTestId("loading-resetAction").textContent).toBe("idle");

    // Start the async action
    await act(async () => {
      screen.getByTestId("trigger-resetAction").click();
    });

    expect(screen.getByTestId("loading-resetAction").textContent).toBe(
      "loading",
    );

    // Resolve the promise
    await act(async () => {
      resolve!();
    });

    expect(screen.getByTestId("loading-resetAction").textContent).toBe("idle");
  });

  it("returns undefined onAction when no handler provided", () => {
    renderAction("resetAction");
    expect(screen.getByTestId("hasHandler-resetAction").textContent).toBe("no");
  });

  it("throws when used outside SettaraProvider", () => {
    expect(() => {
      render(<ActionDisplay settingKey="resetAction" />);
    }).toThrow("useSettaraAction must be used within a SettaraProvider");
  });

  it("recovers loading state when async handler rejects", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = vi.fn().mockRejectedValue(new Error("boom"));
    renderAction("resetAction", { resetAction: handler });

    expect(screen.getByTestId("loading-resetAction").textContent).toBe("idle");

    await act(async () => {
      screen.getByTestId("trigger-resetAction").click();
      // Flush the microtask queue so the .catch/.finally run
      await new Promise((r) => setTimeout(r, 0));
    });

    // After rejection, loading should reset to idle
    expect(screen.getByTestId("loading-resetAction").textContent).toBe("idle");
    expect(consoleSpy).toHaveBeenCalledWith(
      '[settara] Action "resetAction" failed:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("prevents duplicate calls while async handler is in-flight", async () => {
    let resolve: () => void;
    const handler = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    renderAction("resetAction", { resetAction: handler });

    // Start async action
    await act(async () => {
      screen.getByTestId("trigger-resetAction").click();
    });

    // Try to trigger again while in-flight
    await act(async () => {
      screen.getByTestId("trigger-resetAction").click();
    });

    // Handler should only have been called once
    expect(handler).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve!();
    });
  });
});
