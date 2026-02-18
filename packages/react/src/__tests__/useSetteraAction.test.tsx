import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "../settera.js";
import { useSetteraAction } from "../hooks/useSetteraAction.js";
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
    useSetteraAction(settingKey);
  return (
    <div data-testid={`action-${settingKey}`}>
      <span data-testid={`title-${settingKey}`}>{definition.title}</span>
      <span data-testid={`visible-${settingKey}`}>
        {isVisible ? "visible" : "hidden"}
      </span>
      <span data-testid={`loading-${settingKey}`}>
        {isLoading ? "loading" : "idle"}
      </span>
      <button onClick={onAction} data-testid={`trigger-${settingKey}`}>
        Go
      </button>
    </div>
  );
}

function renderAction(
  settingKey: string,
  onAction?: Record<string, (payload?: unknown) => void | Promise<void>>,
  values: Record<string, unknown> = {},
) {
  return render(
    <Settera schema={schema} values={values} onChange={() => {}} onAction={onAction}>
      <ActionDisplay settingKey={settingKey} />
    </Settera>,
  );
}

describe("useSetteraAction", () => {
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

  it("forwards payload to handler", () => {
    const payload = { foo: "bar" };
    const handler = vi.fn();

    function PayloadTrigger() {
      const { onAction } = useSetteraAction("resetAction");
      return (
        <button
          data-testid="payload-trigger"
          onClick={() => onAction(payload)}
        >
          Trigger
        </button>
      );
    }

    render(
      <Settera
        schema={schema}
        values={{}}
        onChange={() => {}}
        onAction={{ resetAction: handler }}
      >
        <PayloadTrigger />
      </Settera>,
    );

    screen.getByTestId("payload-trigger").click();
    expect(handler).toHaveBeenCalledWith(payload);
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

  it("no-ops when no handler is registered for the key", async () => {
    const user = userEvent.setup();
    renderAction("resetAction");
    // Should not throw — onAction is always defined, but no-ops internally
    await user.click(screen.getByTestId("trigger-resetAction"));
    expect(screen.getByTestId("loading-resetAction").textContent).toBe("idle");
  });

  it("throws when used outside Settera", () => {
    expect(() => {
      render(<ActionDisplay settingKey="resetAction" />);
    }).toThrow("useSetteraAction must be used within a Settera component");
  });

  it("throws when used with a non-action setting key", () => {
    expect(() => {
      renderAction("toggle");
    }).toThrow(
      'Setting "toggle" is not an action. Use useSetteraSetting instead of useSetteraAction.',
    );
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
      '[settera] Action "resetAction" failed:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("shares loading state across multiple component instances", async () => {
    let resolve: () => void;
    const handler = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );

    render(
      <Settera
        schema={schema}
        values={{}}
        onChange={() => {}}
        onAction={{ resetAction: handler }}
      >
        <ActionDisplay settingKey="resetAction" />
        <div data-testid="second-instance">
          <ActionDisplay settingKey="resetAction" />
        </div>
      </Settera>,
    );

    const triggers = screen.getAllByTestId("trigger-resetAction");
    const loadingStates = screen.getAllByTestId("loading-resetAction");

    expect(loadingStates[0].textContent).toBe("idle");
    expect(loadingStates[1].textContent).toBe("idle");

    // Start the async action from the first instance
    await act(async () => {
      triggers[0].click();
    });

    // Both instances should show loading
    expect(loadingStates[0].textContent).toBe("loading");
    expect(loadingStates[1].textContent).toBe("loading");

    // Resolve the promise
    await act(async () => {
      resolve!();
    });

    expect(loadingStates[0].textContent).toBe("idle");
    expect(loadingStates[1].textContent).toBe("idle");
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
