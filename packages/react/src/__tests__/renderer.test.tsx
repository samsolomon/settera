import React, { useSyncExternalStore } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetteraProvider } from "../provider.js";
import { SetteraRenderer } from "../renderer.js";
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
          settings: [{ key: "toggle", title: "Toggle", type: "boolean" }],
        },
      ],
    },
  ],
};

function ValuesConsumer() {
  const store = React.useContext(SetteraValuesContext);
  if (!store) return <div>no values context</div>;
  const values = useSyncExternalStore(
    store.subscribe,
    () => store.getState().values,
  );
  return (
    <div>
      <span data-testid="toggle-value">{String(values.toggle)}</span>
      <button onClick={() => store.setValue("toggle", true)}>set-true</button>
    </div>
  );
}

describe("SetteraRenderer", () => {
  it("provides values context to children", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={() => {}}>
          <ValuesConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("toggle-value").textContent).toBe("false");
  });

  it("calls onChange when setValue is invoked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={onChange}>
          <ValuesConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    await user.click(screen.getByText("set-true"));
    expect(onChange).toHaveBeenCalledWith("toggle", true);
  });

  it("renders children", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{}} onChange={() => {}}>
          <span data-testid="child">content</span>
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("child").textContent).toBe("content");
  });

  it("provides onAction and onValidate to context", () => {
    const onAction = { clearCache: vi.fn() };
    const onValidate = {
      apiKey: () => null,
    };

    function ActionConsumer() {
      const store = React.useContext(SetteraValuesContext);
      return (
        <div>
          <span data-testid="has-action">
            {store?.getOnAction()?.clearCache ? "yes" : "no"}
          </span>
          <span data-testid="has-validate">
            {store?.getOnValidate()?.apiKey ? "yes" : "no"}
          </span>
        </div>
      );
    }

    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer
          values={{}}
          onChange={() => {}}
          onAction={onAction}
          onValidate={onValidate}
        >
          <ActionConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("has-action").textContent).toBe("yes");
    expect(screen.getByTestId("has-validate").textContent).toBe("yes");
  });
});

// ---- Async save tracking ----

function SaveStatusConsumer() {
  const store = React.useContext(SetteraValuesContext);
  if (!store) return <div>no context</div>;
  const saveStatus = useSyncExternalStore(
    store.subscribe,
    () => store.getState().saveStatus,
  );
  return (
    <div>
      <span data-testid="save-status">
        {saveStatus["toggle"] ?? "idle"}
      </span>
      <button onClick={() => store.setValue("toggle", true)}>save</button>
    </div>
  );
}

describe("async save tracking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps status idle for sync onChange", () => {
    const onChange = vi.fn();
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={onChange}>
          <SaveStatusConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    act(() => screen.getByText("save").click());
    expect(screen.getByTestId("save-status").textContent).toBe("idle");
  });

  it("transitions saving → saved → idle for async onChange", async () => {
    let resolveSave!: () => void;
    const onChange = vi.fn(
      () => new Promise<void>((r) => (resolveSave = r)),
    );

    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={onChange}>
          <SaveStatusConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );

    act(() => screen.getByText("save").click());
    expect(screen.getByTestId("save-status").textContent).toBe("saving");

    await act(async () => resolveSave());
    expect(screen.getByTestId("save-status").textContent).toBe("saved");

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId("save-status").textContent).toBe("idle");
  });

  it("transitions to error on rejection", async () => {
    let rejectSave!: (err: Error) => void;
    const onChange = vi.fn(
      () => new Promise<void>((_r, rej) => (rejectSave = rej)),
    );

    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={onChange}>
          <SaveStatusConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );

    act(() => screen.getByText("save").click());
    expect(screen.getByTestId("save-status").textContent).toBe("saving");

    await act(async () => rejectSave(new Error("fail")));
    expect(screen.getByTestId("save-status").textContent).toBe("error");
  });

  it("only latest save wins (race condition)", async () => {
    const resolvers: Array<() => void> = [];
    const onChange = vi.fn(
      () => new Promise<void>((r) => resolvers.push(r)),
    );

    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={onChange}>
          <SaveStatusConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );

    // First save
    act(() => screen.getByText("save").click());
    // Second save
    act(() => screen.getByText("save").click());
    expect(resolvers).toHaveLength(2);

    // Resolve first save — should be ignored since second is newer
    await act(async () => resolvers[0]());
    expect(screen.getByTestId("save-status").textContent).toBe("saving");

    // Resolve second save — this one takes effect
    await act(async () => resolvers[1]());
    expect(screen.getByTestId("save-status").textContent).toBe("saved");
  });

  it("void onChange still works (backward compatible)", () => {
    const onChange = vi.fn(() => undefined);
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={onChange}>
          <SaveStatusConsumer />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    act(() => screen.getByText("save").click());
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByTestId("save-status").textContent).toBe("idle");
  });
});
