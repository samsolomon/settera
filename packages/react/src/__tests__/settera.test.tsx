import React, { useSyncExternalStore } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settera } from "../settera.js";
import { SetteraProvider } from "../provider.js";
import { SetteraRenderer } from "../renderer.js";
import { SetteraValuesContext } from "../context.js";
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
              key: "toggle",
              title: "Toggle",
              type: "boolean",
              default: true,
            },
            {
              key: "name",
              title: "Name",
              type: "text",
              validation: { required: true },
            },
            {
              key: "dependent",
              title: "Dependent",
              type: "text",
              visibleWhen: { setting: "toggle", equals: true },
            },
          ],
        },
      ],
    },
    {
      key: "advanced",
      title: "Advanced",
      sections: [
        {
          key: "extra",
          title: "Extra",
          settings: [
            { key: "debug", title: "Debug", type: "boolean" },
          ],
        },
      ],
    },
  ],
};

// ---- Test helpers ----

function SettingDisplay({ settingKey }: { settingKey: string }) {
  const { value, setValue, error, isVisible } = useSetteraSetting(settingKey);
  return (
    <div data-testid={`setting-${settingKey}`}>
      <span data-testid={`value-${settingKey}`}>{String(value)}</span>
      <span data-testid={`visible-${settingKey}`}>
        {isVisible ? "visible" : "hidden"}
      </span>
      <span data-testid={`error-${settingKey}`}>{error ?? ""}</span>
      <button
        onClick={() => setValue(!value)}
        data-testid={`toggle-${settingKey}`}
      >
        toggle
      </button>
      <button
        onClick={() => setValue("")}
        data-testid={`clear-${settingKey}`}
      >
        clear
      </button>
    </div>
  );
}

// ---- Unified Settera tests ----

describe("Settera (unified)", () => {
  it("provides schema and values in a single wrapper", () => {
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={() => {}}>
        <SettingDisplay settingKey="toggle" />
      </Settera>,
    );
    expect(screen.getByTestId("value-toggle").textContent).toBe("false");
  });

  it("falls back to defaults from schema", () => {
    render(
      <Settera schema={schema} values={{}} onChange={() => {}}>
        <SettingDisplay settingKey="toggle" />
      </Settera>,
    );
    expect(screen.getByTestId("value-toggle").textContent).toBe("true");
  });

  it("calls onChange when setValue is invoked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Settera schema={schema} values={{ toggle: true }} onChange={onChange}>
        <SettingDisplay settingKey="toggle" />
      </Settera>,
    );
    await user.click(screen.getByTestId("toggle-toggle"));
    expect(onChange).toHaveBeenCalledWith("toggle", false);
  });

  it("evaluates visibility from values", () => {
    render(
      <Settera schema={schema} values={{ toggle: true }} onChange={() => {}}>
        <SettingDisplay settingKey="dependent" />
      </Settera>,
    );
    expect(screen.getByTestId("visible-dependent").textContent).toBe("visible");
  });

  it("evaluates visibility — hidden", () => {
    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={() => {}}>
        <SettingDisplay settingKey="dependent" />
      </Settera>,
    );
    expect(screen.getByTestId("visible-dependent").textContent).toBe("hidden");
  });

  it("runs sync validation on setValue", async () => {
    const user = userEvent.setup();
    render(
      <Settera schema={schema} values={{ name: "sam" }} onChange={() => {}}>
        <SettingDisplay settingKey="name" />
      </Settera>,
    );
    await user.click(screen.getByTestId("clear-name"));
    expect(screen.getByTestId("error-name").textContent).toBe(
      "This field is required",
    );
  });
});

// ---- Async save tracking in unified component ----

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

describe("Settera — async save tracking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("transitions saving → saved → idle for async onChange", async () => {
    let resolveSave!: () => void;
    const onChange = vi.fn(
      () => new Promise<void>((r) => (resolveSave = r)),
    );

    render(
      <Settera schema={schema} values={{ toggle: false }} onChange={onChange}>
        <SaveStatusConsumer />
      </Settera>,
    );

    act(() => screen.getByText("save").click());
    expect(screen.getByTestId("save-status").textContent).toBe("saving");

    await act(async () => resolveSave());
    expect(screen.getByTestId("save-status").textContent).toBe("saved");

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByTestId("save-status").textContent).toBe("idle");
  });
});

// ---- Backward compat: nested Provider + Renderer still works ----

describe("Backward compat — Provider + Renderer", () => {
  it("nested Provider + Renderer still works", () => {
    render(
      <SetteraProvider schema={schema}>
        <SetteraRenderer values={{ toggle: false }} onChange={() => {}}>
          <SettingDisplay settingKey="toggle" />
        </SetteraRenderer>
      </SetteraProvider>,
    );
    expect(screen.getByTestId("value-toggle").textContent).toBe("false");
  });
});
